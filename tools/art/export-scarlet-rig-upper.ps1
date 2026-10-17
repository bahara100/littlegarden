Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletRigCutout.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../apps/client/public/sprites/scarlet/rig-se-v2'))
$taskOld=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../apps/client/public/sprites/scarlet/rig-se-v1'))
$taskPalette=(Get-Content -LiteralPath (Join-Path $taskOld 'parts.json') -Raw|ConvertFrom-Json).palette
$taskColors=[Drawing.Color[]]@($taskPalette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$taskSource=[Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'upper-parts-source.png'))
# Measured cell boundaries: the generated armless torso occupies a wider first region.
$taskParts=@(@('body',0,.435,64,69),@('leftArm',.435,.255,12,22),@('rightArm',.69,.31,13,23))
$taskMetadata=@()
try{
 foreach($p in $taskParts){
  $x=[int][Math]::Floor($p[1]*$taskSource.Width);$w=[Math]::Min([int][Math]::Floor($p[2]*$taskSource.Width),$taskSource.Width-$x)
  $rect=New-Object Drawing.Rectangle $x,0,$w,$taskSource.Height
  $part=[ScarletRigCutout]::Export($taskSource,$rect,[int]$p[3],[int]$p[4],$taskColors)
  try{
   $part.Save((Join-Path $taskRoot ($p[0]+'.png')),[Drawing.Imaging.ImageFormat]::Png)
   $sum=0;$count=0
   for($y=0;$y -lt [Math]::Min(3,$part.Height);$y++){for($px=0;$px -lt $part.Width;$px++){if($part.GetPixel($px,$y).A -gt 0){$sum+=$px;$count++}}}
   $taskMetadata+=@{id=$p[0];width=$p[3];height=$p[4];sourceRect=@($x,0,$w,$taskSource.Height);topPivotX=[Math]::Round($sum/[Math]::Max(1,$count),1)}
  }finally{$part.Dispose()}
 }
 $taskLegHashes=@{};foreach($id in @('leftThigh','leftShin','leftBoot','rightThigh','rightShin','rightBoot')){$taskLegHashes[$id]=(Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $taskOld ($id+'.png'))).Hash}
 @{version=2;direction='se';parts=$taskMetadata;reusedLegFolder='rig-se-v1';legHashes=$taskLegHashes;palette=$taskPalette}|ConvertTo-Json -Depth 6|Set-Content -LiteralPath (Join-Path $taskRoot 'parts.json') -Encoding utf8
 $taskMetadata|ConvertTo-Json -Depth 4
}finally{$taskSource.Dispose()}
