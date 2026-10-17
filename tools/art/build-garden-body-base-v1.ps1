$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$folder = Join-Path $taskRoot 'docs/art/pixel/garden-body-base-v1'
$compileReferences = if ($PSVersionTable.PSEdition -eq 'Core') { @((Get-ChildItem (Join-Path $PSHOME 'ref/*.dll')).FullName) + @([Drawing.Bitmap].Assembly.Location) + @((Get-ChildItem (Join-Path $PSHOME 'System.Private.Windows.*.dll')).FullName) } else { @('System.Drawing') }
Add-Type -ReferencedAssemblies $compileReferences -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Collections.Generic;
public static class GardenBaseV1 {
 static Color[] pal;
 static Color Snap(Color c) {
  if(c.A<180)return Color.Transparent;
  Color best=pal[0]; int score=int.MaxValue;
  foreach(Color p in pal){int r=c.R-p.R,g=c.G-p.G,b=c.B-p.B,d=r*r+g*g+b*b;if(d<score){best=p;score=d;}}
  return best;
 }
 static Bitmap Blank(){return new Bitmap(96,96,PixelFormat.Format32bppArgb);}
 static void Save(Bitmap b,string folder,string name){b.Save(Path.Combine(folder,name+".png"),ImageFormat.Png);}
 static void Over(Bitmap dst,Bitmap layer){for(int y=0;y<96;y++)for(int x=0;x<96;x++){Color c=layer.GetPixel(x,y);if(c.A>0)dst.SetPixel(x,y,c);}}
 static Bitmap Enlarged(Bitmap src,int scale){var dst=new Bitmap(src.Width*scale,src.Height*scale);for(int y=0;y<dst.Height;y++)for(int x=0;x<dst.Width;x++)dst.SetPixel(x,y,src.GetPixel(x/scale,y/scale));return dst;}
 public static void Build(string folder, Color[] palette){
  pal=palette;
  using(var src=new Bitmap(Path.Combine(folder,"source-base-ai.png")))
  using(var full=Blank())using(var head=Blank())using(var body=Blank()){
   int l=src.Width,t=src.Height,r=0,b=0;
   for(int y=0;y<src.Height;y++)for(int x=0;x<src.Width;x++)if(src.GetPixel(x,y).A>=180){l=Math.Min(l,x);t=Math.Min(t,y);r=Math.Max(r,x);b=Math.Max(b,y);}
   double s=86.0/(b-t+1); int w=(int)Math.Round((r-l+1)*s),ox=(96-w)/2;
   for(int y=0;y<86;y++)for(int x=0;x<w;x++){
    Color c=Snap(src.GetPixel(Math.Min(r,l+(int)Math.Floor((x+.5)/s)),Math.Min(b,t+(int)Math.Floor((y+.5)/s))));
    full.SetPixel(ox+x,5+y,c); (y+5<=53?head:body).SetPixel(ox+x,5+y,c);
   }
   Save(full,folder,"base-idle-se");Save(head,folder,"base-head");Save(body,folder,"base-body");
   using(var big=Enlarged(full,6))Save(big,folder,"base-preview-6x");
   using(var proof=new Bitmap(96*5,96)){
    using(var gr=Graphics.FromImage(proof))gr.Clear(ColorTranslator.FromHtml("#e6deeb"));
    for(int y=0;y<96;y++)for(int x=0;x<96;x++)if(full.GetPixel(x,y).A>0)proof.SetPixel(x+192,y,full.GetPixel(x,y));
    int col=0;
    foreach(string who in new[]{"momo","lulu"}){
     using(var reference=new Bitmap(Path.Combine(folder,"reference-"+who+".png")))
     using(var hair=Blank())using(var outfit=Blank())using(var dressed=Blank()){
      for(int y=0;y<96;y++)for(int x=0;x<96;x++){
       // Preserve the favourite source appearance. Only the new common base is palette-limited here.
       Color c=reference.GetPixel(x,y);
       // Head includes face/hair; outfit is the source dress + sleeves/hands, not redrawn animation.
       if(y<=54)hair.SetPixel(x,y,c);else if(y<=78)outfit.SetPixel(x,y,c);
       if(c.A>0)proof.SetPixel(x+col*96,y,reference.GetPixel(x,y));
      }
      Over(dressed,body);Over(dressed,outfit);Over(dressed,hair);
      Save(hair,folder,who+"-head");Save(outfit,folder,who+"-outfit");Save(dressed,folder,who+"-base-composite");
      for(int y=0;y<96;y++)for(int x=0;x<96;x++)if(dressed.GetPixel(x,y).A>0)proof.SetPixel(x+(col+3)*96,y,dressed.GetPixel(x,y));
      col++;
     }
    }
    using(var big=Enlarged(proof,4))Save(big,folder,"comparison-preview-4x");
    using(var trio=proof.Clone(new Rectangle(192,0,288,96),PixelFormat.Format32bppArgb))
    using(var big=Enlarged(trio,4))Save(big,folder,"tryon-preview-4x");
   }
   int visible=0;var used=new HashSet<int>();
   for(int y=0;y<96;y++)for(int x=0;x<96;x++){Color c=full.GetPixel(x,y);if(c.A>0){visible++;used.Add(c.ToArgb());if(c.A!=255)throw new Exception("Partial alpha");}}
   if(used.Count>32||visible<500)throw new Exception("Invalid base");
   Console.WriteLine("Base: 96x96, one SE idle, "+used.Count+" colors, "+visible+" visible pixels. Shared body reused in both composites.");
  }
 }
}
'@
$paletteHex = @('#39223b','#50334c','#765263','#ac7981','#d5a1a0','#f6c4aa','#ffddbf','#fff0d8',
 '#514a60','#777188','#9994a5','#c1bdc9','#dedbe3','#f2edf1','#8c5260','#bc7e6c',
 '#e9a681','#ffc6a0','#76618f','#a58dc0','#c6add9','#e1c9ef','#aeb68c','#d4d9ae',
 '#342b36','#be934b','#edc671','#f7e5a6','#cf7781','#7e614e','#e6c9a1','#ffffff')
$palette = [Drawing.Color[]]@($paletteHex | ForEach-Object { [Drawing.ColorTranslator]::FromHtml($_) })
[GardenBaseV1]::Build($folder,$palette)
$paletteHex | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $folder 'palette.json') -Encoding utf8
