param([ValidateSet('sw','nw','ne')][string]$Direction='nw')
Add-Type -AssemblyName System.Drawing
$taskImage=New-Object Drawing.Bitmap 1280,1280
$taskG=[Drawing.Graphics]::FromImage($taskImage)
$taskG.Clear([Drawing.Color]::White)
$taskFont=New-Object Drawing.Font 'Arial',18
$taskBody=New-Object Drawing.SolidBrush ([Drawing.ColorTranslator]::FromHtml('#dddddd'))
$taskLeft=New-Object Drawing.Pen ([Drawing.Color]::Black),16
$taskRight=New-Object Drawing.Pen ([Drawing.Color]::RoyalBlue),16
$taskToes=New-Object Drawing.Pen ([Drawing.Color]::DarkGreen),7
$taskRear=$Direction -ne 'sw';$taskMirror=$Direction -eq 'ne'
$taskPoses=if($taskRear){@(@(@(-22,48),@(22,60)),@(@(-10,54),@(10,42)),@(@(2,60),@(-2,48)),@(@(-10,42),@(10,54)))}else{@(@(@(-6,60),@(6,43)),@(@(10,54),@(-10,42)),@(@(22,43),@(-22,60)),@(@(10,42),@(-10,54)))}
try{
 for($n=0;$n -lt 4;$n++){
  $cx=320+($n%2)*640;$cy=300+[int][Math]::Floor($n/2)*640
  $taskG.DrawString(('Frame '+($n+1)),$taskFont,[Drawing.Brushes]::Black,($cx-80),($cy-200))
  $taskG.FillEllipse($taskBody,($cx-65),($cy-160),130,100);$taskG.FillRectangle($taskBody,($cx-38),($cy-62),76,66)
  for($leg=1;$leg -ge 0;$leg--){
   $hipX=if($leg -eq 0){if($taskRear){-10}else{10}}else{if($taskRear){10}else{-10}}
   $hipY=if($leg -eq 0){0}else{-5}
   $ankleX=$taskPoses[$n][$leg][0];$ankleY=$taskPoses[$n][$leg][1];$kneeX=($hipX+$ankleX)/2-2
   $toeX=-32;$toeY=if($taskRear){-16}else{16}
   if($taskMirror){$hipX=-$hipX;$ankleX=-$ankleX;$kneeX=-$kneeX;$toeX=32}
   $pen=if($leg -eq 0){$taskLeft}else{$taskRight}
   $taskG.DrawLine($pen,($cx+$hipX*2),($cy+$hipY*2),($cx+$kneeX*2),($cy+50))
   $taskG.DrawLine($pen,($cx+$kneeX*2),($cy+50),($cx+$ankleX*2),($cy+$ankleY*2))
   $taskG.DrawLine($taskToes,($cx+$ankleX*2),($cy+$ankleY*2),($cx+$ankleX*2+$toeX),($cy+$ankleY*2+$toeY))
  }
  $taskG.DrawString('BLACK = left / BLUE = right',$taskFont,[Drawing.Brushes]::Black,($cx-195),($cy+190))
  $taskG.DrawString(('GREEN toes = '+$Direction),$taskFont,[Drawing.Brushes]::DarkGreen,($cx-120),($cy+225))
 }
 $taskPath=Join-Path $PSScriptRoot "../../docs/art/pixel/scarlet-$Direction-leg-tracks-guide.png"
 $taskImage.Save([IO.Path]::GetFullPath($taskPath),[Drawing.Imaging.ImageFormat]::Png)
}finally{$taskG.Dispose();$taskImage.Dispose();$taskFont.Dispose();$taskBody.Dispose();$taskLeft.Dispose();$taskRight.Dispose();$taskToes.Dispose()}
