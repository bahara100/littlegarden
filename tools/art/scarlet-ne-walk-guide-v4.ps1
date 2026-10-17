$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskFolder=Join-Path $taskRoot 'docs/art/pixel/scarlet-ingame-walk-ne-v4'
$taskPoses=@(
 @{name='1 LEFT CONTACT';left=@(44,73,47,77,48,82);right=@(54,74,51,82,50,90);leftArm=@(42,60,40,65,38,68);rightArm=@(57,62,60,64,62,66)},
 @{name='2 RIGHT PASSING';left=@(44,72,44,78,44,84);right=@(54,73,56,77,54,83);leftArm=@(42,59,41,63,40,67);rightArm=@(57,61,58,65,59,68)},
 @{name='3 RIGHT CONTACT';left=@(44,73,42,80,40,86);right=@(54,74,56,79,58,86);leftArm=@(42,60,43,62,44,65);rightArm=@(57,62,56,66,54,69)},
 @{name='4 LEFT PASSING';left=@(44,72,43,75,44,79);right=@(54,73,54,80,54,88);leftArm=@(42,59,41,63,40,67);rightArm=@(57,61,58,65,59,68)}
)
$taskImage=[Drawing.Bitmap]::new(1152,1152)
$taskG=[Drawing.Graphics]::FromImage($taskImage);$taskG.Clear([Drawing.Color]::White)
$taskFont=[Drawing.Font]::new('Arial',13)
$taskGray=[Drawing.Pen]::new([Drawing.Color]::LightGray,6)
$taskRed=[Drawing.Pen]::new([Drawing.Color]::Crimson,7)
$taskBlue=[Drawing.Pen]::new([Drawing.Color]::RoyalBlue,7)
for($taskN=0;$taskN -lt 4;$taskN++){
 $taskOx=($taskN%2)*576;$taskOy=[Math]::Floor($taskN/2)*576;$taskP=$taskPoses[$taskN];$taskBob=if($taskN%2 -eq 0){0}else{-1}
 $taskG.DrawString($taskP.name,$taskFont,[Drawing.Brushes]::Black,$taskOx+10,$taskOy+8)
 $taskG.DrawString('RED anatomical LEFT = banded gaiter',$taskFont,[Drawing.Brushes]::Black,$taskOx+10,$taskOy+31)
 $taskG.DrawString('BLUE anatomical RIGHT = smooth white',$taskFont,[Drawing.Brushes]::Black,$taskOx+10,$taskOy+53)
 $taskG.DrawString('Walk upper-right / same camera for ALL FOUR',$taskFont,[Drawing.Brushes]::Black,$taskOx+10,$taskOy+75)
 $taskG.DrawEllipse($taskGray,$taskOx+34*6,$taskOy+(29+$taskBob)*6,30*6,29*6)
 $taskG.DrawLine($taskGray,$taskOx+50*6,$taskOy+(58+$taskBob)*6,$taskOx+50*6,$taskOy+(72+$taskBob)*6)
 foreach($taskPart in @('left','right','leftArm','rightArm')){
  $taskV=$taskP[$taskPart];$taskPen=if($taskPart -like 'left*'){$taskRed}else{$taskBlue}
  $taskG.DrawLine($taskPen,$taskOx+$taskV[0]*6,$taskOy+$taskV[1]*6,$taskOx+$taskV[2]*6,$taskOy+$taskV[3]*6)
  $taskG.DrawLine($taskPen,$taskOx+$taskV[2]*6,$taskOy+$taskV[3]*6,$taskOx+$taskV[4]*6,$taskOy+$taskV[5]*6)
  if($taskPart -in @('left','right')){$taskG.DrawLine($taskPen,$taskOx+($taskV[4]-2)*6,$taskOy+($taskV[5]+1)*6,$taskOx+($taskV[4]+2)*6,$taskOy+($taskV[5]-1)*6)}
 }
}
$taskG.Dispose();$taskImage.Save((Join-Path $taskFolder 'pose-guide.png'),[Drawing.Imaging.ImageFormat]::Png);$taskImage.Dispose()
$taskPoses|ConvertTo-Json -Depth 6|Set-Content -Encoding UTF8 (Join-Path $taskFolder 'pose-plan.json')
$taskFont.Dispose();$taskGray.Dispose();$taskRed.Dispose();$taskBlue.Dispose()
