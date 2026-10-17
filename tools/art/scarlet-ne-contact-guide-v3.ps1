$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskOut=Join-Path $taskRoot 'docs/art/pixel/scarlet-ingame-walk-ne-v3/contact-guide.png'
$taskImage=[Drawing.Bitmap]::new(1152,576)
$taskG=[Drawing.Graphics]::FromImage($taskImage)
$taskG.Clear([Drawing.Color]::White)
$taskFont=[Drawing.Font]::new('Arial',15)
$taskGray=[Drawing.Pen]::new([Drawing.Color]::LightGray,6)
$taskLeftPen=[Drawing.Pen]::new([Drawing.Color]::Crimson,9)
$taskRightPen=[Drawing.Pen]::new([Drawing.Color]::RoyalBlue,9)
$taskFeet=@(
 @{left=@(45,73,45,77,44,82);right=@(54,73,57,81,59,88)},
 @{left=@(45,73,42,81,39,89);right=@(54,73,58,76,62,80)}
)
for($taskN=0;$taskN -lt 2;$taskN++){
 $taskOx=$taskN*576;$taskP=$taskFeet[$taskN]
 $taskG.DrawString($(if($taskN -eq 0){'POSE 1 (reference)'}else{'POSE 3 (opposite contact target)'}),$taskFont,[Drawing.Brushes]::Black,$taskOx+12,8)
 $taskG.DrawString('RED LEFT gaiter / BLUE RIGHT smooth white',$taskFont,[Drawing.Brushes]::Black,$taskOx+12,35)
 $taskG.DrawString('Walking NE: upper-right. Not a horizontal mirror.',$taskFont,[Drawing.Brushes]::Black,$taskOx+12,62)
 $taskG.DrawEllipse($taskGray,$taskOx+34*6,29*6,30*6,29*6)
 $taskG.DrawLine($taskGray,$taskOx+50*6,58*6,$taskOx+50*6,72*6)
 foreach($taskLeg in @('left','right')){
  $taskV=$taskP[$taskLeg];$taskPen=if($taskLeg -eq 'left'){$taskLeftPen}else{$taskRightPen}
  $taskG.DrawLine($taskPen,$taskOx+$taskV[0]*6,$taskV[1]*6,$taskOx+$taskV[2]*6,$taskV[3]*6)
  $taskG.DrawLine($taskPen,$taskOx+$taskV[2]*6,$taskV[3]*6,$taskOx+$taskV[4]*6,$taskV[5]*6)
  $taskG.DrawLine($taskPen,$taskOx+($taskV[4]-2)*6,($taskV[5]+1)*6,$taskOx+($taskV[4]+3)*6,($taskV[5]-1)*6)
 }
}
$taskG.Dispose();$taskImage.Save($taskOut,[Drawing.Imaging.ImageFormat]::Png);$taskImage.Dispose()
$taskFont.Dispose();$taskGray.Dispose();$taskLeftPen.Dispose();$taskRightPen.Dispose()
