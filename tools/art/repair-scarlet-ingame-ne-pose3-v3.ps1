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
public static class ScarletNeOppositeContactRepair {
 public static void Run(string root,Color[] palette){
  string old=Path.Combine(root,"docs/art/pixel/scarlet-ingame-walk-ne-v2"),folder=Path.Combine(root,"docs/art/pixel/scarlet-ingame-walk-ne-v3");
  using(var edit=new Bitmap(Path.Combine(folder,"source-pose3-edit.png")))using(var original=new Bitmap(Path.Combine(old,"frame-3.png"))){
   int top=edit.Height,bottom=-1,left=edit.Width,right=-1;
   for(int y=0;y<edit.Height;y++)for(int x=0;x<edit.Width;x++)if(edit.GetPixel(x,y).A>=180){top=Math.Min(top,y);bottom=Math.Max(bottom,y);}
   for(int y=top;y<top+(bottom-top+1)*.42;y++)for(int x=0;x<edit.Width;x++)if(edit.GetPixel(x,y).A>=180){left=Math.Min(left,x);right=Math.Max(right,x);}
   int targetLeft=96,targetRight=-1;
   for(int y=0;y<45;y++)for(int x=0;x<96;x++)if(original.GetPixel(x,y).A>=180){targetLeft=Math.Min(targetLeft,x);targetRight=Math.Max(targetRight,x);}
   double scale=(double)(targetRight-targetLeft+1)/(right-left+1);
   using(var candidate=new Bitmap(96,96))using(var result=new Bitmap(original)){
    for(int y=0;y<96;y++)for(int x=0;x<96;x++){
     // Align the waist to the retained body, not only the hat, before adopting the new pose.
     int sx=(int)Math.Floor(left+(x-targetLeft+.5)/scale),sy=(int)Math.Floor(top+(y-14+.5)/scale);
     if(sx<0||sx>=edit.Width||sy<0||sy>=edit.Height)continue;
     Color c=edit.GetPixel(sx,sy);if(c.A<180)continue;
     Color best=palette[0];int distance=int.MaxValue;foreach(Color p in palette){int dr=c.R-p.R,dg=c.G-p.G,db=c.B-p.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}
     candidate.SetPixel(x,y,best);
    }
    candidate.Save(Path.Combine(folder,"pose3-candidate.png"),ImageFormat.Png);
    int changed=0;
    for(int y=64;y<96;y++)for(int x=33;x<=70;x++){if(x<=42&&y<=75)continue;Color c=candidate.GetPixel(x,y);if(result.GetPixel(x,y).ToArgb()!=c.ToArgb())changed++;result.SetPixel(x,y,c);}
    for(int y=0;y<64;y++)for(int x=0;x<96;x++)if(original.GetPixel(x,y).ToArgb()!=result.GetPixel(x,y).ToArgb())throw new Exception("Upper body changed");
    result.Save(Path.Combine(folder,"frame-3.png"),ImageFormat.Png);
    File.WriteAllText(Path.Combine(folder,"repair.json"),"{\"sourceVersion\":\"v2\",\"changedFrame\":3,\"mask\":[33,60,38,36],\"changedPixels\":"+changed+",\"upperBodyMismatches\":0,\"sourceHatBounds\":["+left+","+top+","+(right-left+1)+"],\"scale\":"+scale.ToString("R",System.Globalization.CultureInfo.InvariantCulture)+"}");
    Console.WriteLine("Frame 3 changed pixels: "+changed+"; upper-body mismatches: 0");
   }
  }
  foreach(int n in new[]{1,2,4})File.Copy(Path.Combine(old,"frame-"+n+".png"),Path.Combine(folder,"frame-"+n+".png"),true);
  using(var sheet=new Bitmap(384,96))using(var grid=new Bitmap(768,768))using(var comparison=new Bitmap(768,384)){
   for(int n=0;n<4;n++)using(var frame=new Bitmap(Path.Combine(folder,"frame-"+(n+1)+".png")))
    for(int y=0;y<96;y++)for(int x=0;x<96;x++){Color c=frame.GetPixel(x,y);sheet.SetPixel(n*96+x,y,c);for(int dy=0;dy<4;dy++)for(int dx=0;dx<4;dx++)grid.SetPixel((n%2*96+x)*4+dx,(n/2*96+y)*4+dy,c);}
   using(var before=new Bitmap(Path.Combine(old,"frame-3.png")))using(var after=new Bitmap(Path.Combine(folder,"frame-3.png")))
    for(int y=0;y<96;y++)for(int x=0;x<96;x++)for(int dy=0;dy<4;dy++)for(int dx=0;dx<4;dx++){comparison.SetPixel(x*4+dx,y*4+dy,before.GetPixel(x,y));comparison.SetPixel(384+x*4+dx,y*4+dy,after.GetPixel(x,y));}
   sheet.Save(Path.Combine(folder,"walk.png"),ImageFormat.Png);grid.Save(Path.Combine(folder,"walk-preview-2x2.png"),ImageFormat.Png);comparison.Save(Path.Combine(folder,"pose3-before-after.png"),ImageFormat.Png);
  }
  using(var pair=new Bitmap(768,384)){
   for(int column=0;column<2;column++)using(var f=new Bitmap(Path.Combine(folder,"frame-"+(column==0?1:3)+".png")))
    for(int y=0;y<96;y++)for(int x=0;x<96;x++)for(int dy=0;dy<4;dy++)for(int dx=0;dx<4;dx++)pair.SetPixel(column*384+x*4+dx,y*4+dy,f.GetPixel(x,y));
   pair.Save(Path.Combine(folder,"contacts-1-3.png"),ImageFormat.Png);
  }
 }
}
'@
[ScarletNeOppositeContactRepair]::Run($root,$palette)

