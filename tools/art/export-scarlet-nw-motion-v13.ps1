param([int]$Bob=1)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Collections.Generic;
public static class ScarletNwMotion {
 static readonly Color Clear=Color.FromArgb(0,0,0,0);
 // Passing cels 2 and 4 rise by `bob` px. The whole cel moves up except the support leg below row S, whose
 // rows S..S+bob-1 are repeated so the planted shoe keeps its ground contact (support leg straightens).
 // Cel 2 supports on the black-ribbon left leg, cel 4 on the white right leg (same legs as V12).
 static readonly int[] BandX0={0,37,0,45},BandX1={0,50,0,58},BandS={0,76,0,72};
 // The visible left sleeve swings opposite the legs: back (toward the viewer, down-right) at cel 1 where the
 // left leg leads, forward (up-left) at cel 3 where the white right leg leads, near the side when passing.
 // Sleeve box only (x 24..35): the neck skin and gold shoulder strap above and to its right stay on the torso.
 static readonly int[] ArmDx={3,0,-2,1},ArmDy={1,0,-2,1},ArmTop={49,50,50,48},ArmBottom={56,58,58,56};
 static bool InArm(int n,int x,int y,int lift) {
  int yy=y+lift;
  return x>=24&&x<=35&&yy>=ArmTop[n]&&yy<=ArmBottom[n];
 }
 public static void Save(string previous,string output,int bob) {
  using(var sheet=new Bitmap(384,96))using(var preview=new Bitmap(768,768))using(var contact=new Bitmap(1536,384)) {
   for(int n=0;n<4;n++)using(var old=new Bitmap(Path.Combine(previous,"frame-"+(n+1)+".png")))using(var stage=new Bitmap(96,96))using(var frame=new Bitmap(96,96)) {
    int lift=(n==1||n==3)?bob:0;
    for(int y=0;y<96;y++)for(int x=0;x<96;x++) {
     Color c=y+lift<96?old.GetPixel(x,y+lift):Clear;
     if(lift>0&&x>=BandX0[n]&&x<=BandX1[n]&&y>=BandS[n])c=old.GetPixel(x,y);
     stage.SetPixel(x,y,c);
    }
    // The sleeve moves as one rigid piece so its outline survives. Swinging back it overlaps the torso (it is
    // nearer the viewer); swinging forward the armpit gap it leaves is closed with the adjacent torso colour.
    for(int y=0;y<96;y++)for(int x=0;x<96;x++) {
     Color c=stage.GetPixel(x,y);
     int sx=x-ArmDx[n],sy=y-ArmDy[n];
     if(sx>=0&&sy>=0&&sx<96&&sy<96&&InArm(n,sx,sy,lift)&&stage.GetPixel(sx,sy).A!=0)c=stage.GetPixel(sx,sy);
     else if(InArm(n,x,y,lift)) {
      c=Clear;
      if(x>=33)for(int k=x+1;k<=x+4&&k<96;k++){Color t=stage.GetPixel(k,y);if(t.A!=0&&!InArm(n,k,y,lift)){c=t;break;}}
     }
     frame.SetPixel(x,y,c);
    }
    int changed=0,bottom=-1;var colors=new HashSet<int>();
    for(int y=0;y<96;y++)for(int x=0;x<96;x++) {
     Color c=frame.GetPixel(x,y);
     if(c.A!=0){if(c.A!=255)throw new Exception("Invalid alpha");colors.Add(c.ToArgb());bottom=y;}
     if(c.ToArgb()!=old.GetPixel(x,y).ToArgb())changed++;
     sheet.SetPixel(n*96+x,y,c);
     for(int yy=0;yy<4;yy++)for(int xx=0;xx<4;xx++){preview.SetPixel((n%2*96+x)*4+xx,(n/2*96+y)*4+yy,c);contact.SetPixel((n*96+x)*4+xx,y*4+yy,c);}
    }
    if(colors.Count>32)throw new Exception("Palette exceeded");
    using(var o=new Bitmap(Path.Combine(previous,"frame-"+(n+1)+".png"))){int ob=-1;for(int y=0;y<96;y++)for(int x=0;x<96;x++)if(o.GetPixel(x,y).A!=0)ob=y;if(ob!=bottom)throw new Exception("Ground contact moved in cel "+(n+1));}
    frame.Save(Path.Combine(output,"frame-"+(n+1)+".png"),ImageFormat.Png);
    Console.WriteLine("Frame "+(n+1)+": lift="+lift+", arm=("+ArmDx[n]+","+ArmDy[n]+"), changes="+changed+", bottom="+bottom+", colors="+colors.Count);
   }
   sheet.Save(Path.Combine(output,"walk.png"),ImageFormat.Png);preview.Save(Path.Combine(output,"walk-preview-2x2.png"),ImageFormat.Png);contact.Save(Path.Combine(output,"walk-contact-4x.png"),ImageFormat.Png);
  }
 }
}
'@
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$previous=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v12'
$folder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v13'
New-Item -ItemType Directory -Force $folder|Out-Null
[ScarletNwMotion]::Save($previous,$folder,$Bob)
& (Join-Path $PSScriptRoot 'pack-scarlet-fullwalk-gif.ps1') -Source 'apps/client/public/sprites/scarlet/fullframe-nw-v13/walk.png' -Output 'apps/client/public/sprites/scarlet/fullframe-nw-v13/walk-preview.gif' -Frames 4 -Fps 6
$metadata=Get-Content -LiteralPath (Join-Path $previous 'walk.json') -Raw|ConvertFrom-Json
$metadata.version=13;$metadata.replacedRows=@(0,95);$metadata.replacedFrames=@(1,2,3,4)
foreach($frame in $metadata.frames){
  $path=Join-Path $folder "frame-$($frame.number).png"
  $frame.pngSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  $image=New-Object Drawing.Bitmap $path
  $top=96;$bottom=-1;$usedColors=New-Object 'System.Collections.Generic.HashSet[int]'
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){$pixel=$image.GetPixel($x,$y);if($pixel.A -gt 0){$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);[void]$usedColors.Add($pixel.ToArgb())}}}
  $image.Dispose();$frame.top=$top;$frame.bottom=$bottom;$frame.colors=$usedColors.Count
}
$metadata|ConvertTo-Json -Depth 8|Set-Content -Encoding UTF8 (Join-Path $folder 'walk.json')
