$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Collections.Generic;
public static class ScarletGroundContact {
 // Cel 3 only: the rear black-ribbon left leg (x 44..58, below the merged thighs) is lengthened so its shoe
 // reaches the shared ground line. Row 71 is the plain vertical stocking just above the gold ankle strap; it is
 // repeated five times and the strap and shoe (rows 72..81) move down to 77..86 unchanged. The forward white
 // right leg, hips, sword and everything above y 72 stay untouched.
 public static void Save(string previous,string output) {
  const int X0=44,X1=58,PLAIN=71,LOWER0=72,LOWER1=81,SHIFT=5;
  using(var sheet=new Bitmap(384,96))using(var preview=new Bitmap(768,768))using(var contact=new Bitmap(1536,384)) {
   for(int n=0;n<4;n++)using(var old=new Bitmap(Path.Combine(previous,"frame-"+(n+1)+".png")))using(var frame=new Bitmap(old)) {
    if(n==2) {
     for(int y=LOWER0;y<=LOWER1+SHIFT;y++)for(int x=X0;x<=X1;x++)frame.SetPixel(x,y,Color.FromArgb(0,0,0,0));
     for(int i=0;i<SHIFT;i++)for(int x=X0;x<=X1;x++)frame.SetPixel(x,LOWER0+i,old.GetPixel(x,PLAIN));
     for(int y=LOWER0;y<=LOWER1;y++)for(int x=X0;x<=X1;x++)frame.SetPixel(x,y+SHIFT,old.GetPixel(x,y));
    }
    int changed=0,bottom=-1;var colors=new HashSet<int>();
    for(int y=0;y<96;y++)for(int x=0;x<96;x++) {
     Color c=frame.GetPixel(x,y);
     if(c.A!=0){if(c.A!=255)throw new Exception("Invalid alpha");colors.Add(c.ToArgb());bottom=y;}
     if(c.ToArgb()!=old.GetPixel(x,y).ToArgb()){if(n!=2||y<LOWER0||x<X0||x>X1)throw new Exception("Change outside the rear leg band");changed++;}
     sheet.SetPixel(n*96+x,y,c);
     for(int yy=0;yy<4;yy++)for(int xx=0;xx<4;xx++){preview.SetPixel((n%2*96+x)*4+xx,(n/2*96+y)*4+yy,c);contact.SetPixel((n*96+x)*4+xx,y*4+yy,c);}
    }
    if(colors.Count>32)throw new Exception("Palette exceeded");
    if(n==2)frame.Save(Path.Combine(output,"frame-3.png"),ImageFormat.Png);
    else File.Copy(Path.Combine(previous,"frame-"+(n+1)+".png"),Path.Combine(output,"frame-"+(n+1)+".png"),true);
    Console.WriteLine("Frame "+(n+1)+": changes="+changed+", bottom="+bottom+", colors="+colors.Count);
   }
   sheet.Save(Path.Combine(output,"walk.png"),ImageFormat.Png);preview.Save(Path.Combine(output,"walk-preview-2x2.png"),ImageFormat.Png);contact.Save(Path.Combine(output,"walk-contact-4x.png"),ImageFormat.Png);
  }
 }
}
'@
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$previous=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v11'
$folder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v12'
New-Item -ItemType Directory -Force $folder|Out-Null
[ScarletGroundContact]::Save($previous,$folder)
& (Join-Path $PSScriptRoot 'pack-scarlet-fullwalk-gif.ps1') -Source 'apps/client/public/sprites/scarlet/fullframe-nw-v12/walk.png' -Output 'apps/client/public/sprites/scarlet/fullframe-nw-v12/walk-preview.gif' -Frames 4 -Fps 6
$metadata=Get-Content -LiteralPath (Join-Path $previous 'walk.json') -Raw|ConvertFrom-Json
$metadata.version=12;$metadata.replacedRows=@(72,86);$metadata.replacedFrames=@(3)
foreach($frame in $metadata.frames){
  $path=Join-Path $folder "frame-$($frame.number).png"
  $frame.pngSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  $image=New-Object Drawing.Bitmap $path
  $top=96;$bottom=-1;$usedColors=New-Object 'System.Collections.Generic.HashSet[int]'
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){$pixel=$image.GetPixel($x,$y);if($pixel.A -gt 0){$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);[void]$usedColors.Add($pixel.ToArgb())}}}
  $image.Dispose();$frame.top=$top;$frame.bottom=$bottom;$frame.colors=$usedColors.Count
}
$metadata|ConvertTo-Json -Depth 8|Set-Content -Encoding UTF8 (Join-Path $folder 'walk.json')
