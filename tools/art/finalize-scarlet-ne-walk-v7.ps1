param([int]$Pose4ShiftY=0)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$hex=Get-Content (Join-Path $root 'docs/art/pixel/scarlet-ingame-sd-v1/palette.json') -Raw|ConvertFrom-Json
$palette=[Drawing.Color[]]@($hex|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Globalization;
public static class ScarletNeV7Final {
 static int RestoreSword(Bitmap result,string old,string folder){
  int count=0;
  using(var reference=new Bitmap(Path.Combine(old,"frame-2.png")))using(var weapon=new Bitmap(96,96))using(var mask=new System.Drawing.Drawing2D.GraphicsPath()){
   mask.AddPolygon(new Point[]{new Point(20,77),new Point(21,75),new Point(35,67),new Point(40,66),new Point(43,68),new Point(39,71),new Point(24,81),new Point(20,80)});
   for(int y=64;y<=82;y++)for(int x=18;x<=44;x++){
    if(!mask.IsVisible(x+.5f,y+.5f))continue;Color c=reference.GetPixel(x,y);
    if(c.A==0||c.R>c.G+15&&c.G>c.B)continue;
    int tx=x+2,ty=y;if(result.GetPixel(tx,ty).A!=0)continue;
    result.SetPixel(tx,ty,c);weapon.SetPixel(tx,ty,c);count++;
   }
   weapon.Save(Path.Combine(folder,"sword-restored-pixels.png"),ImageFormat.Png);
  }
  File.WriteAllText(Path.Combine(folder,"sword-restore.json"),"{\"source\":\"v6/frame-2.png\",\"offset\":[2,0],\"mode\":\"existing-pixels-behind-opaque-character\",\"restoredPixels\":"+count+"}");
  return count;
 }
 public static void Run(string root,Color[] palette,int shift4){
  string folder=Path.Combine(root,"docs/art/pixel/scarlet-ingame-walk-ne-v7"),old=Path.Combine(root,"docs/art/pixel/scarlet-ingame-walk-ne-v6");
  var repairs=new List<string>();
  for(int n=1;n<=4;n++){
   string output=Path.Combine(folder,"frame-"+n+".png");
   if(n<=3){File.Copy(Path.Combine(old,"frame-"+n+".png"),output,true);continue;}
   using(var edit=new Bitmap(Path.Combine(folder,"source-pose"+n+"-edit.png")))using(var original=new Bitmap(Path.Combine(old,"frame-"+n+".png"))){
    int top=edit.Height,bottom=-1,left=edit.Width,right=-1;
    for(int y=0;y<edit.Height;y++)for(int x=0;x<edit.Width;x++)if(edit.GetPixel(x,y).A>=180){top=Math.Min(top,y);bottom=Math.Max(bottom,y);}
    for(int y=top;y<top+(bottom-top+1)*.42;y++)for(int x=0;x<edit.Width;x++)if(edit.GetPixel(x,y).A>=180){left=Math.Min(left,x);right=Math.Max(right,x);}
    int targetLeft=96,targetRight=-1,first=96;
    for(int y=0;y<45;y++)for(int x=0;x<96;x++)if(original.GetPixel(x,y).A>=180){targetLeft=Math.Min(targetLeft,x);targetRight=Math.Max(targetRight,x);first=Math.Min(first,y);}
    double scale=(double)(targetRight-targetLeft+1)/(right-left+1);int shift=shift4;
    using(var candidate=new Bitmap(96,96))using(var result=new Bitmap(original)){
     for(int y=0;y<96;y++)for(int x=0;x<96;x++){
      int sx=(int)Math.Floor(left+(x-targetLeft+.5)/scale),sy=(int)Math.Floor(top+(y-first-shift+.5)/scale);
      if(sx<0||sx>=edit.Width||sy<0||sy>=edit.Height)continue;Color c=edit.GetPixel(sx,sy);if(c.A<180)continue;
      Color best=palette[0];int distance=int.MaxValue;foreach(Color p in palette){int dr=c.R-p.R,dg=c.G-p.G,db=c.B-p.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}
      candidate.SetPixel(x,y,best);
     }
     candidate.Save(Path.Combine(folder,"pose"+n+"-candidate.png"),ImageFormat.Png);int changed=0;
     for(int y=73;y<96;y++)for(int x=33;x<=49;x++){Color c=candidate.GetPixel(x,y);if(result.GetPixel(x,y).ToArgb()!=c.ToArgb())changed++;result.SetPixel(x,y,c);}
     for(int y=0;y<73;y++)for(int x=0;x<96;x++)if(original.GetPixel(x,y).ToArgb()!=result.GetPixel(x,y).ToArgb())throw new Exception("Upper body changed");
     int swordPixels=RestoreSword(result,old,folder);
     result.Save(output,ImageFormat.Png);Console.WriteLine("Pose "+n+" folded-leg changes: "+changed+"; existing sword pixels restored: "+swordPixels);
     repairs.Add("{\"frame\":"+n+",\"mask\":[33,73,17,23],\"changedPixels\":"+changed+",\"upperBodyMismatches\":0,\"shiftY\":"+shift+",\"scale\":"+scale.ToString("R",CultureInfo.InvariantCulture)+"}");
    }
   }
  }
  File.WriteAllText(Path.Combine(folder,"repair.json"),"{\"sourceVersion\":\"v6\",\"repairs\":["+String.Join(",",repairs)+"]}");
  var frames=new Bitmap[4];var records=new List<string>();var hashes=new HashSet<string>();
  for(int n=0;n<4;n++){
   string p=Path.Combine(folder,"frame-"+(n+1)+".png");frames[n]=new Bitmap(p);var colors=new HashSet<int>();int bottom=-1,first=96;
   for(int y=0;y<96;y++)for(int x=0;x<96;x++){var c=frames[n].GetPixel(x,y);if(c.A!=0){colors.Add(c.ToArgb());first=Math.Min(first,y);bottom=y;}}
   if(colors.Count>24)throw new Exception("Palette exceeded");string hash;using(var sha=System.Security.Cryptography.SHA256.Create())hash=BitConverter.ToString(sha.ComputeHash(File.ReadAllBytes(p))).Replace("-","").ToLowerInvariant();if(!hashes.Add(hash))throw new Exception("Duplicate frame");
   records.Add("{\"number\":"+(n+1)+",\"colors\":"+colors.Count+",\"hatTop\":"+first+",\"bottom\":"+bottom+",\"sha256\":\""+hash+"\"}");
  }
  using(var sheet=new Bitmap(384,96))using(var grid=new Bitmap(768,768))using(var onion=new Bitmap(768,768))using(var contact=new Bitmap(1536,384))using(var compare=new Bitmap(768,768)){
   for(int n=0;n<4;n++)for(int y=0;y<96;y++)for(int x=0;x<96;x++){
    Color c=frames[n].GetPixel(x,y),prev=frames[(n+3)%4].GetPixel(x,y);sheet.SetPixel(n*96+x,y,c);
    Color diagnostic=c.A!=0?c:prev.A!=0?Color.FromArgb(110,prev.R,prev.G,prev.B):Color.FromArgb(0,0,0,0);
    for(int dy=0;dy<4;dy++)for(int dx=0;dx<4;dx++){grid.SetPixel((n%2*96+x)*4+dx,(n/2*96+y)*4+dy,c);onion.SetPixel((n%2*96+x)*4+dx,(n/2*96+y)*4+dy,diagnostic);contact.SetPixel((n*96+x)*4+dx,y*4+dy,c);}
   }
   for(int row=0;row<2;row++)using(var before=new Bitmap(Path.Combine(old,"frame-"+(row+3)+".png")))for(int y=0;y<96;y++)for(int x=0;x<96;x++)for(int dy=0;dy<4;dy++)for(int dx=0;dx<4;dx++){compare.SetPixel(x*4+dx,(row*96+y)*4+dy,before.GetPixel(x,y));compare.SetPixel(384+x*4+dx,(row*96+y)*4+dy,frames[row+2].GetPixel(x,y));}
   sheet.Save(Path.Combine(folder,"walk.png"),ImageFormat.Png);grid.Save(Path.Combine(folder,"walk-preview-2x2.png"),ImageFormat.Png);grid.Save(Path.Combine(folder,"source-keys.png"),ImageFormat.Png);onion.Save(Path.Combine(folder,"onion-diagnostic.png"),ImageFormat.Png);contact.Save(Path.Combine(folder,"walk-contact-4x.png"),ImageFormat.Png);compare.Save(Path.Combine(folder,"poses3-4-before-after.png"),ImageFormat.Png);
  }
  foreach(var f in frames)f.Dispose();
  File.WriteAllText(Path.Combine(folder,"walk.json"),"{\"stage\":\"walk-review\",\"direction\":\"ne\",\"frameCount\":4,\"fps\":6,\"frameSize\":[96,96],\"anchor\":[48,88],\"runtimeConnected\":false,\"sourceVersion\":\"v6\",\"frames\":["+String.Join(",",records)+"]}");
 }
}
'@
[ScarletNeV7Final]::Run($root,$palette,$Pose4ShiftY)


