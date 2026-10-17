param([ValidateSet('se','ne')][string]$Direction='se')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$folder=Join-Path $root 'docs/art/pixel/scarlet-ingame-sd-v1'
$hex=Get-Content -LiteralPath (Join-Path $folder 'palette.json') -Raw|ConvertFrom-Json
$palette=[Drawing.Color[]]@($hex|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.IO;
public static class ScarletSdStill {
 public static void Export(string folder,Color[] palette,string direction) {
  string sourceName=direction=="se"?"source-ai.png":"source-ai-ne.png";
  using(var source=new Bitmap(Path.Combine(folder,sourceName))) {
   int left=source.Width,top=source.Height,right=-1,bottom=-1;
   for(int y=0;y<source.Height;y++)for(int x=0;x<source.Width;x++)if(source.GetPixel(x,y).A>=180){left=Math.Min(left,x);top=Math.Min(top,y);right=Math.Max(right,x);bottom=Math.Max(bottom,y);}
   if(right<left||bottom<top)throw new Exception("Missing opaque character");
   int sw=right-left+1,sh=bottom-top+1;
   double scale=Math.Min(78.0/sw,82.0/sh);
   int dw=(int)Math.Round(sw*scale),dh=(int)Math.Round(sh*scale),ox=(96-dw)/2,oy=88-dh;
   using(var frame=new Bitmap(96,96))using(var preview=new Bitmap(576,576)) {
    for(int y=0;y<dh;y++)for(int x=0;x<dw;x++) {
     int sx=Math.Min(right,left+(int)Math.Floor((x+.5)/scale)),sy=Math.Min(bottom,top+(int)Math.Floor((y+.5)/scale));
     Color c=source.GetPixel(sx,sy);if(c.A<180)continue;
     Color best=palette[0];int distance=int.MaxValue;
     foreach(Color p in palette){int dr=c.R-p.R,dg=c.G-p.G,db=c.B-p.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}
     frame.SetPixel(ox+x,oy+y,best);
    }
    var used=new HashSet<int>();int visible=0,last=-1;
    for(int y=0;y<96;y++)for(int x=0;x<96;x++) {
     Color c=frame.GetPixel(x,y);if(c.A!=0){if(c.A!=255)throw new Exception("Partial alpha");used.Add(c.ToArgb());visible++;last=Math.Max(last,y);}
     for(int dy=0;dy<6;dy++)for(int dx=0;dx<6;dx++)preview.SetPixel(x*6+dx,y*6+dy,c);
    }
    if(used.Count>24||visible==0)throw new Exception("Palette or sprite failure");
    frame.Save(Path.Combine(folder,"idle-"+direction+".png"),ImageFormat.Png);
    preview.Save(Path.Combine(folder,"idle-"+direction+"-preview-6x.png"),ImageFormat.Png);
    int mismatches=0;
    for(int y=0;y<576;y++)for(int x=0;x<576;x++)if(preview.GetPixel(x,y).ToArgb()!=frame.GetPixel(x/6,y/6).ToArgb())mismatches++;
    if(mismatches!=0)throw new Exception("Preview mismatch");
    File.WriteAllText(Path.Combine(folder,direction=="se"?"export.json":"export-"+direction+".json"),"{\"stage\":\"single-frame-pixel-draft\",\"direction\":\""+direction+"\",\"frameCount\":1,\"size\":[96,96],\"colors\":"+used.Count+",\"visiblePixels\":"+visible+",\"lastRow\":"+last+",\"sourceCrop\":["+left+","+top+","+sw+","+sh+"],\"scale\":"+scale.ToString("R",System.Globalization.CultureInfo.InvariantCulture)+",\"anchor\":[48,88],\"previewPixelMismatches\":"+mismatches+",\"runtimeConnected\":false}");
    Console.WriteLine("96x96, colors="+used.Count+", alpha=0/255, bottom="+last+", preview mismatches="+mismatches);
   }
  }
 }
}
'@
[ScarletSdStill]::Export($folder,$palette,$Direction)
