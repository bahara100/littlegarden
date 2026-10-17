$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$folder=Join-Path $root 'docs/art/pixel/scarlet-ingame-walk-se-v1'
$poses=@(
 @{bob=1;left=@(54,73,57,80,59,88);right=@(46,74,44,79,42,84);rightArm=@(44,60,44,65,45,69);leftArm=@(56,61,57,65,56,68)},
 @{bob=0;left=@(54,72,54,79,55,86);right=@(46,73,44,76,45,80);rightArm=@(44,59,42,64,41,69);leftArm=@(56,60,58,65,59,69)},
 @{bob=1;left=@(54,73,52,78,51,84);right=@(46,74,48,80,50,88);rightArm=@(44,60,40,65,38,69);leftArm=@(56,61,58,66,61,71)},
 @{bob=0;left=@(54,72,53,76,54,80);right=@(46,73,46,79,46,86);rightArm=@(44,59,42,64,41,69);leftArm=@(56,60,58,65,59,69)}
)
$img=New-Object Drawing.Bitmap 1152,1152
$g=[Drawing.Graphics]::FromImage($img);$g.Clear([Drawing.Color]::White)
$font=New-Object Drawing.Font 'Arial',13
$red=New-Object Drawing.Pen ([Drawing.Color]::Crimson),6
$blue=New-Object Drawing.Pen ([Drawing.Color]::RoyalBlue),6
$gray=New-Object Drawing.Pen ([Drawing.Color]::LightGray),5
for($n=0;$n -lt 4;$n++){
 $ox=($n%2)*576;$oy=[Math]::Floor($n/2)*576;$p=$poses[$n]
 $g.DrawString("Frame $($n+1): SE down-right",$font,[Drawing.Brushes]::Black,$ox+10,$oy+10)
 $g.DrawString('RED left = gaiter / BLUE right = sleek white',$font,[Drawing.Brushes]::Black,$ox+10,$oy+32)
 $g.DrawEllipse($gray,$ox+34*6,$oy+(28+$p.bob)*6,30*6,30*6)
 $g.DrawLine($gray,$ox+50*6,$oy+(58+$p.bob)*6,$ox+50*6,$oy+(72+$p.bob)*6)
 foreach($part in @('right','left','rightArm','leftArm')){
  $v=$p[$part];$pen=if($part -like 'left*'){$red}else{$blue}
  $g.DrawLine($pen,$ox+$v[0]*6,$oy+$v[1]*6,$ox+$v[2]*6,$oy+$v[3]*6)
  $g.DrawLine($pen,$ox+$v[2]*6,$oy+$v[3]*6,$ox+$v[4]*6,$oy+$v[5]*6)
  if($part -in @('left','right')){$g.DrawLine($pen,$ox+$v[4]*6-6,$oy+$v[5]*6,$ox+$v[4]*6+12,$oy+$v[5]*6+6)}
 }
}
$g.Dispose();$img.Save((Join-Path $folder 'pose-guide.png'),[Drawing.Imaging.ImageFormat]::Png);$img.Dispose();$font.Dispose();$red.Dispose();$blue.Dispose();$gray.Dispose()
$poses|ConvertTo-Json -Depth 5|Set-Content -Encoding UTF8 (Join-Path $folder 'pose-plan.json')
