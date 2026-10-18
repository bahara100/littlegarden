Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletRigCutout.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../apps/client/public/sprites/scarlet/rig-se-v1'))
$taskSource=[Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'parts-source.png'))
$taskPalette=@('#332b43','#51405d','#745775','#9b7b97','#64577c','#82709d','#a392b9','#c3b3d5','#ded2e7','#f0e9f1','#685c69','#a49696','#d7c6bb','#f1e2cc','#fff3dc','#b08069','#d7a68b','#efc5a3','#ffdfba','#ffecd1','#765136','#ab763c','#d5a349','#f2d075','#692f47','#9b3e52','#c15b61','#e18b83','#302f3b','#53515b','#87818c','#b5abb9')
$taskColors=[Drawing.Color[]]@($taskPalette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
# Measured packing: generated atlas has a taller first row; do not assume equal cell heights.
$taskParts=@(@('body',0,0,.287,.59,64,69),@('leftThigh',.287,0,.213,.59,7,10),@('leftShin',.5,0,.25,.59,6,11),@('leftBoot',.75,0,.25,.59,10,7),@('rightThigh',0,.59,.287,.41,7,10),@('rightShin',.287,.59,.213,.41,6,11),@('rightBoot',.5,.59,.25,.41,10,7))
$taskMetadata=@()
try{
 foreach($p in $taskParts){
  $x=[int][Math]::Floor($p[1]*$taskSource.Width);$y=[int][Math]::Floor($p[2]*$taskSource.Height)
  $w=[Math]::Min([int][Math]::Floor($p[3]*$taskSource.Width),$taskSource.Width-$x);$h=[Math]::Min([int][Math]::Floor($p[4]*$taskSource.Height),$taskSource.Height-$y)
  $rect=New-Object Drawing.Rectangle $x,$y,$w,$h
  $part=[ScarletRigCutout]::Export($taskSource,$rect,[int]$p[5],[int]$p[6],$taskColors)
  try{$part.Save((Join-Path $taskRoot ($p[0]+'.png')),[Drawing.Imaging.ImageFormat]::Png)}finally{$part.Dispose()}
  $taskMetadata+=@{id=$p[0];width=$p[5];height=$p[6];sourceRect=@($x,$y,$w,$h)}
 }
 @{version=1;direction='se';frame=@{width=96;height=96;anchor=@(48,88)};parts=$taskMetadata;palette=$taskPalette;bindings=@{left=@('leftThigh','leftShin','leftBoot');right=@('rightThigh','rightShin','rightBoot')}}|ConvertTo-Json -Depth 6|Set-Content -LiteralPath (Join-Path $taskRoot 'parts.json') -Encoding utf8
 $taskMetadata|ConvertTo-Json -Depth 4
}finally{$taskSource.Dispose()}

