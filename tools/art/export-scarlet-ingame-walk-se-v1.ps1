param([ValidateSet('se','ne')][string]$Direction='se',[ValidatePattern('^v[0-9]+$')][string]$Version='v1',[string]$SourceName='source-keys.png')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$folder=Join-Path $root "docs/art/pixel/scarlet-ingame-walk-$Direction-$Version"
$hex=Get-Content -LiteralPath (Join-Path $root 'docs/art/pixel/scarlet-ingame-sd-v1/palette.json') -Raw|ConvertFrom-Json
$palette=[Drawing.Color[]]@($hex|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.IO;
public static class ScarletSdWalk {
 public static void Export(string folder,Color[] palette,string direction,string sourceName) {
  using(var source=new Bitmap(Path.Combine(folder,sourceName))) {
   if(source.Width%2!=0||source.Height%2!=0)throw new Exception("Expected equal 2x2 cells");
   int cw=source.Width/2,ch=source.Height/2,left=cw,top=ch,right=-1,bottom=-1;
   int[] celTop=new int[4];
   for(int n=0;n<4;n++){
    celTop[n]=ch;
    for(int y=0;y<ch;y++)for(int x=0;x<cw;x++)if(source.GetPixel(n%2*cw+x,n/2*ch+y).A>=180){left=Math.Min(left,x);right=Math.Max(right,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y);celTop[n]=Math.Min(celTop[n],y);}
   }
   if(right<left||bottom<top)throw new Exception("Missing artwork");
   int sw=right-left+1,sh=bottom-top+1;double scale=Math.Min(78.0/sw,82.0/sh);
   int dw=(int)Math.Round(sw*scale),dh=(int)Math.Round(sh*scale),px=(96-dw)/2,py=88-dh;
   using(var sheet=new Bitmap(384,96))using(var preview=new Bitmap(768,768))using(var contact=new Bitmap(1536,384))using(var onion=new Bitmap(768,768)){
    var frames=new List<Bitmap>();var records=new List<string>();var hashes=new HashSet<string>();
    for(int n=0;n<4;n++){
     var raw=new Bitmap(96,96);int first=96,hatLeft=96,hatRight=-1;
     for(int y=0;y<dh;y++)for(int x=0;x<dw;x++){
      int sx=Math.Min(right,left+(int)Math.Floor((x+.5)/scale)),sy=Math.Min(bottom,top+(int)Math.Floor((y+.5)/scale));
      Color c=source.GetPixel(n%2*cw+sx,n/2*ch+sy);if(c.A<180)continue;
      Color best=palette[0];int distance=int.MaxValue;
      foreach(Color p in palette){int dr=c.R-p.R,dg=c.G-p.G,db=c.B-p.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}
      raw.SetPixel(px+x,py+y,best);first=Math.Min(first,py+y);
      if(sy<celTop[n]+sh*.42){hatLeft=Math.Min(hatLeft,px+x);hatRight=Math.Max(hatRight,px+x);}
     }
     if(first==96||hatRight<hatLeft)throw new Exception("Empty cel");
     // Register the head; preserve foot-depth differences instead of normalizing each sole.
     int dx=48-(int)Math.Round((hatLeft+hatRight)/2.0),dy=(n%2==0?10:9)-first;
     var frame=new Bitmap(96,96);var colors=new HashSet<int>();int last=-1;
     for(int y=0;y<96;y++)for(int x=0;x<96;x++){
      Color c=raw.GetPixel(x,y);if(c.A==0)continue;int tx=x+dx,ty=y+dy;
      if(tx<0||tx>=96||ty<0||ty>=96)throw new Exception("Registration clips cel");
      frame.SetPixel(tx,ty,c);colors.Add(c.ToArgb());last=Math.Max(last,ty);
     }
     raw.Dispose();if(colors.Count>24)throw new Exception("Palette exceeded");
     frame.Save(Path.Combine(folder,"frame-"+(n+1)+".png"),ImageFormat.Png);
     string hash;using(var sha=System.Security.Cryptography.SHA256.Create())hash=BitConverter.ToString(sha.ComputeHash(File.ReadAllBytes(Path.Combine(folder,"frame-"+(n+1)+".png")))).Replace("-","").ToLowerInvariant();
     if(!hashes.Add(hash))throw new Exception("Duplicate pose");
     records.Add("{\"number\":"+(n+1)+",\"colors\":"+colors.Count+",\"hatTop\":"+(n%2==0?10:9)+",\"bottom\":"+last+",\"registration\":["+dx+","+dy+"],\"sha256\":\""+hash+"\"}");
     frames.Add(frame);
     Console.WriteLine("Frame "+(n+1)+": colors="+colors.Count+", head bob="+(n%2==0?1:0)+", bottom="+last);
    }
    for(int n=0;n<4;n++)for(int y=0;y<96;y++)for(int x=0;x<96;x++){
     Color c=frames[n].GetPixel(x,y);sheet.SetPixel(n*96+x,y,c);
     Color previous=frames[(n+3)%4].GetPixel(x,y);
     Color diagnostic=c.A!=0?c:previous.A!=0?Color.FromArgb(110,previous.R,previous.G,previous.B):Color.FromArgb(0,0,0,0);
     for(int yy=0;yy<4;yy++)for(int xx=0;xx<4;xx++){
      preview.SetPixel((n%2*96+x)*4+xx,(n/2*96+y)*4+yy,c);
      contact.SetPixel((n*96+x)*4+xx,y*4+yy,c);
      onion.SetPixel((n%2*96+x)*4+xx,(n/2*96+y)*4+yy,diagnostic);
     }
    }
    sheet.Save(Path.Combine(folder,"walk.png"),ImageFormat.Png);preview.Save(Path.Combine(folder,"walk-preview-2x2.png"),ImageFormat.Png);contact.Save(Path.Combine(folder,"walk-contact-4x.png"),ImageFormat.Png);onion.Save(Path.Combine(folder,"onion-diagnostic.png"),ImageFormat.Png);
    File.WriteAllText(Path.Combine(folder,"walk.json"),"{\"stage\":\"walk-review\",\"direction\":\"se\",\"frameCount\":4,\"fps\":6,\"frameSize\":[96,96],\"anchor\":[48,88],\"sharedCrop\":["+left+","+top+","+sw+","+sh+"],\"scale\":"+scale.ToString("R",System.Globalization.CultureInfo.InvariantCulture)+",\"runtimeConnected\":false,\"frames\":["+String.Join(",",records)+"]}");
    foreach(var f in frames)f.Dispose();
   }
  }
 }
}
'@
[ScarletSdWalk]::Export($folder,$palette,$Direction,$SourceName)
$metadata=Join-Path $folder 'walk.json'
$record=Get-Content -LiteralPath $metadata -Raw|ConvertFrom-Json
$record.direction=$Direction
$record|ConvertTo-Json -Depth 10|Set-Content -LiteralPath $metadata -Encoding UTF8
