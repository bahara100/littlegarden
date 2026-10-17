$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Collections.Generic;
// V14 evens out the NW stride. Measured against the body ground point (48,88) and the in-game walk speed
// (one step ≈ 12×6 sprite px along the NW diagonal), V13 cel 4 repeated cel 3's leg spread, cel 1's step was
// short, cel 3's long, and the white foot slid 7 px between cels 3 and 4. Each fix moves one lower leg and
// reconnects it with that leg's own stocking rows; every leg keeps its V13 costume.
public static class ScarletNwStride {
 static readonly Color Clear=Color.FromArgb(0,0,0,0);
 public delegate bool Mask(int x,int y);
 // Moves rows [from..to] of a leg by (dx, n) and fills the n new rows with `fill(k)` rows, sheared toward dx.
 // Pixels of `front` (the leg nearer the viewer) are never painted over.
 static void MoveLeg(Bitmap src,Bitmap dst,Mask leg,int from,int to,int dx,int n,Func<int,int,Color> fill,int fillX0,int fillX1,Mask front) {
  for(int y=from;y<=to;y++)for(int x=0;x<96;x++)if(leg(x,y))dst.SetPixel(x,y,Clear);
  Action<int,int,Color> put=(x,y,c)=>{if(c.A==0||x<0||y<0||x>95||y>95)return;if(front!=null&&front(x,y)&&src.GetPixel(x,y).A!=0)return;dst.SetPixel(x,y,c);};
  for(int k=0;k<n;k++){int off=(int)Math.Round(dx*(k+1.0)/(n+1));for(int x=fillX0;x<=fillX1;x++)put(x+off,from+k,fill(k,x));}
  for(int y=from;y<=to;y++)for(int x=0;x<96;x++)if(leg(x,y))put(x+dx,y+n,src.GetPixel(x,y));
 }
 public static void Save(string previous,string output) {
  var cels=new Bitmap[4];for(int n=0;n<4;n++)using(var b=new Bitmap(Path.Combine(previous,"frame-"+(n+1)+".png")))cels[n]=new Bitmap(b);
  var outs=new Bitmap[4];for(int n=0;n<4;n++)outs[n]=new Bitmap(cels[n]);
  // Cel 1: the white right leg trails further back (down-right) so the step matches cel 3's.
  MoveLeg(cels[0],outs[0],(x,y)=>y>=74&&y<=86&&x>=48&&x<=62,74,86,3,2,
   (k,x)=>cels[0].GetPixel(x,72),46,53,(x,y)=>x<=46);
  // Cel 3: the forward white right foot comes back toward the body (shorter, centred stride). The rear
  // black-ribbon left leg is nearer the viewer and stays on top where the two now overlap.
  MoveLeg(cels[2],outs[2],(x,y)=>y>=66&&y<=76&&x>=33&&x<=44,66,76,5,4,
   (k,x)=>cels[2].GetPixel(x,65),38,43,(x,y)=>y>=64&&x>=45&&x<=56);
  // Cel 4: the black-ribbon left leg becomes a true passing leg: the foot drops from the forward contact
  // spot to just under the body, raised 5 px off the ground. Its new shin rows come from the same leg in cel 1.
  MoveLeg(cels[3],outs[3],(x,y)=>y>=64&&y<=74&&x>=35&&x<=44,64,74,4,7,
   (k,x)=>cels[0].GetPixel(x+3,70+k),37,43,null);
  using(var sheet=new Bitmap(384,96))using(var preview=new Bitmap(768,768))using(var contact=new Bitmap(1536,384)) {
   for(int n=0;n<4;n++) {
    var frame=outs[n];int changed=0,bottom=-1;var colors=new HashSet<int>();
    for(int y=0;y<96;y++)for(int x=0;x<96;x++) {
     Color c=frame.GetPixel(x,y);
     if(c.A!=0){if(c.A!=255)throw new Exception("Invalid alpha");colors.Add(c.ToArgb());bottom=y;}
     if(c.ToArgb()!=cels[n].GetPixel(x,y).ToArgb()){if(y<64)throw new Exception("Upper body changed in cel "+(n+1));changed++;}
     sheet.SetPixel(n*96+x,y,c);
     for(int yy=0;yy<4;yy++)for(int xx=0;xx<4;xx++){preview.SetPixel((n%2*96+x)*4+xx,(n/2*96+y)*4+yy,c);contact.SetPixel((n*96+x)*4+xx,y*4+yy,c);}
    }
    if(colors.Count>32)throw new Exception("Palette exceeded");
    frame.Save(Path.Combine(output,"frame-"+(n+1)+".png"),ImageFormat.Png);
    Console.WriteLine("Frame "+(n+1)+": changes="+changed+", bottom="+bottom+", colors="+colors.Count);
   }
   sheet.Save(Path.Combine(output,"walk.png"),ImageFormat.Png);preview.Save(Path.Combine(output,"walk-preview-2x2.png"),ImageFormat.Png);contact.Save(Path.Combine(output,"walk-contact-4x.png"),ImageFormat.Png);
  }
 }
}
'@
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$previous=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v13'
$folder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v14'
New-Item -ItemType Directory -Force $folder|Out-Null
[ScarletNwStride]::Save($previous,$folder)
& (Join-Path $PSScriptRoot 'pack-scarlet-fullwalk-gif.ps1') -Source 'apps/client/public/sprites/scarlet/fullframe-nw-v14/walk.png' -Output 'apps/client/public/sprites/scarlet/fullframe-nw-v14/walk-preview.gif' -Frames 4 -Fps 6
$metadata=Get-Content -LiteralPath (Join-Path $previous 'walk.json') -Raw|ConvertFrom-Json
$metadata.version=14;$metadata.replacedRows=@(64,95);$metadata.replacedFrames=@(1,3,4)
foreach($frame in $metadata.frames){
  $path=Join-Path $folder "frame-$($frame.number).png"
  $frame.pngSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  $image=New-Object Drawing.Bitmap $path
  $top=96;$bottom=-1;$usedColors=New-Object 'System.Collections.Generic.HashSet[int]'
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){$pixel=$image.GetPixel($x,$y);if($pixel.A -gt 0){$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);[void]$usedColors.Add($pixel.ToArgb())}}}
  $image.Dispose();$frame.top=$top;$frame.bottom=$bottom;$frame.colors=$usedColors.Count
}
$metadata|ConvertTo-Json -Depth 8|Set-Content -Encoding UTF8 (Join-Path $folder 'walk.json')
