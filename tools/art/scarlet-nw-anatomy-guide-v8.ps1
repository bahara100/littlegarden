$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$folder=Join-Path $root 'apps/client/public/sprites/scarlet/fullframe-nw-v8'
# Analytical pose diagram only; it is not rendered into the final sprite.
# Fixed hips: L near/sword side, R far/opposite side. Each limb follows NW stride.
$poses=@(
 @{L=@(330,438,310,485,298,539);R=@(368,429,398,503,425,579)},
 @{L=@(330,438,325,496,322,557);R=@(368,429,351,486,372,539)},
 @{L=@(330,438,358,507,390,581);R=@(368,429,343,478,325,541)},
 @{L=@(330,438,309,490,341,533);R=@(368,429,359,494,351,557)}
)
$img=New-Object Drawing.Bitmap 1254,1254
$g=[Drawing.Graphics]::FromImage($img)
$g.Clear([Drawing.Color]::White)
$font=New-Object Drawing.Font 'Arial',18
$left=New-Object Drawing.Pen ([Drawing.Color]::Crimson),7
$right=New-Object Drawing.Pen ([Drawing.Color]::RoyalBlue),7
$hip=New-Object Drawing.Pen ([Drawing.Color]::Gray),3
$label=New-Object Drawing.Font 'Arial',12
for($i=0;$i -lt 4;$i++){
 $ox=($i%2)*627;$oy=[Math]::Floor($i/2)*627
 $g.DrawString("Frame $($i+1) - facing NW",$font,[Drawing.Brushes]::Black,$ox+130,$oy+340)
 $g.DrawString('RED = own LEFT / black ribbons',$label,[Drawing.Brushes]::Crimson,$ox+130,$oy+375)
 $g.DrawString('BLUE = own RIGHT / plain white',$label,[Drawing.Brushes]::RoyalBlue,$ox+130,$oy+400)
 $g.DrawLine($hip,$ox+330,$oy+438,$ox+368,$oy+429)
 foreach($side in @('R','L')){
  $p=$poses[$i][$side];$pen=if($side -eq 'L'){$left}else{$right}
  $g.DrawLine($pen,$ox+$p[0],$oy+$p[1],$ox+$p[2],$oy+$p[3])
  $g.DrawLine($pen,$ox+$p[2],$oy+$p[3],$ox+$p[4],$oy+$p[5])
  $g.DrawLine($pen,$ox+$p[4],$oy+$p[5],$ox+$p[4]-15,$oy+$p[5]+8)
  for($j=0;$j -lt 6;$j+=2){$g.DrawEllipse($pen,$ox+$p[$j]-5,$oy+$p[$j+1]-5,10,10)}
 }
}
$img.Save((Join-Path $folder 'anatomy-guide.png'),[Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$img.Dispose();$font.Dispose();$label.Dispose();$left.Dispose();$right.Dispose();$hip.Dispose()
$poses|ConvertTo-Json -Depth 4|Set-Content -Encoding UTF8 (Join-Path $folder 'anatomy-plan.json')
