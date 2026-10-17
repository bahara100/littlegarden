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
public static class ScarletNeV4Final {
 public static void Run(string root,Color[] palette){
  string folder=Path.Combine(root,"docs/art/pixel/scarlet-ingame-walk-ne-v4");
  string originalPath=Path.Combine(folder,"frame-1-base.png");if(!File.Exists(originalPath))File.Copy(Path.Combine(folder,"frame-1.png"),originalPath);
  using(var edit=new Bitmap(Path.Combine(folder,"source-cross-contact1.png")))using(var original=new Bitmap(originalPath)){
   int top=edit.Height,bottom=-1,left=edit.Width,right=-1;
   for(int y=0;y<edit.Height;y++)for(int x=0;x<edit.Width;x++)if(edit.GetPixel(x,y).A>=180){top=Math.Min(top,y);bottom=Math.Max(bottom,y);}
   for(int y=top;y<top+(bottom-top+1)*.42;y++)for(int x=0;x<edit.Width;x++)if(edit.GetPixel(x,y).A>=180){left=Math.Min(left,x);right=Math.Max(right,x);}
   int targetLeft=96,targetRight=-1;
   for(int y=0;y<45;y++)for(int x=0;x<96;x++)if(original.GetPixel(x,y).A>=180){targetLeft=Math.Min(targetLeft,x);targetRight=Math.Max(targetRight,x);}
   double scale=(double)(targetRight-targetLeft+1)/(right-left+1);
   using(var candidate=new Bitmap(96,96))using(var result=new Bitmap(original)){
    for(int y=0;y<96;y++)for(int x=0;x<96;x++){
     int sx=(int)Math.Floor(left+(x-targetLeft+.5)/scale),sy=(int)Math.Floor(top+(y-10+.5)/scale);
     if(sx<0||sx>=edit.Width||sy<0||sy>=edit.Height)continue;Color c=edit.GetPixel(sx,sy);if(c.A<180)continue;
     Color best=palette[0];int distance=int.MaxValue;foreach(Color p in palette){int dr=c.R-p.R,dg=c.G-p.G,db=c.B-p.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}
     candidate.SetPixel(x,y,best);
    }
    candidate.Save(Path.Combine(folder,"contact1-candidate.png"),ImageFormat.Png);
    int changed=0;
    for(int y=73;y<96;y++)for(int x=33;x<=70;x++){Color c=candidate.GetPixel(x,y);if(result.GetPixel(x,y).ToArgb()!=c.ToArgb())changed++;result.SetPixel(x,y,c);}
    for(int y=0;y<73;y++)for(int x=0;x<96;x++)if(original.GetPixel(x,y).ToArgb()!=result.GetPixel(x,y).ToArgb())throw new Exception("Upper body changed");
    result.Save(Path.Combine(folder,"frame-1.png"),ImageFormat.Png);
    File.WriteAllText(Path.Combine(folder,"contact1-composite.json"),"{\"mask\":[33,73,38,23],\"changedPixels\":"+changed+",\"upperBodyMismatches\":0,\"sourceHatBounds\":["+left+","+top+","+(right-left+1)+"],\"scale\":"+scale.ToString("R",System.Globalization.CultureInfo.InvariantCulture)+"}");
    Console.WriteLine("Contact 1 lower body changed pixels: "+changed);
   }
  }
  using(var sheet=new Bitmap(384,96))using(var grid=new Bitmap(768,768))using(var onion=new Bitmap(768,768))using(var contact=new Bitmap(1536,384)){
   var frames=new Bitmap[4];for(int n=0;n<4;n++)frames[n]=new Bitmap(Path.Combine(folder,"frame-"+(n+1)+".png"));
   for(int n=0;n<4;n++)for(int y=0;y<96;y++)for(int x=0;x<96;x++){
    Color c=frames[n].GetPixel(x,y),prev=frames[(n+3)%4].GetPixel(x,y);sheet.SetPixel(n*96+x,y,c);
    Color diagnostic=c.A!=0?c:prev.A!=0?Color.FromArgb(110,prev.R,prev.G,prev.B):Color.FromArgb(0,0,0,0);
    for(int dy=0;dy<4;dy++)for(int dx=0;dx<4;dx++){grid.SetPixel((n%2*96+x)*4+dx,(n/2*96+y)*4+dy,c);onion.SetPixel((n%2*96+x)*4+dx,(n/2*96+y)*4+dy,diagnostic);contact.SetPixel((n*96+x)*4+dx,y*4+dy,c);}
   }
   sheet.Save(Path.Combine(folder,"walk.png"),ImageFormat.Png);grid.Save(Path.Combine(folder,"walk-preview-2x2.png"),ImageFormat.Png);grid.Save(Path.Combine(folder,"source-keys.png"),ImageFormat.Png);onion.Save(Path.Combine(folder,"onion-diagnostic.png"),ImageFormat.Png);contact.Save(Path.Combine(folder,"walk-contact-4x.png"),ImageFormat.Png);
   foreach(var f in frames)f.Dispose();
  }
 }
}
'@
[ScarletNeV4Final]::Run($root,$palette)
