$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletHatReplacement.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskPalette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$taskColors=[Drawing.Color[]]@($taskPalette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$taskPrevious=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-ne-v4'
$taskOutput=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-ne-v5'
$taskMeta=Get-Content -LiteralPath (Join-Path $taskPrevious 'walk.json') -Raw|ConvertFrom-Json
$taskDx=[int[]]@($taskMeta.frames|ForEach-Object{$_.translation[0]})
$taskDy=[int[]]@($taskMeta.frames|ForEach-Object{$_.translation[1]})
[ScarletHatReplacement]::Save((Join-Path $taskOutput 'source-horn-edit.png'),(Join-Path $taskPrevious 'source-keys.png'),$taskPrevious,$taskOutput,$taskColors,[double]$taskMeta.scale,[int[]]$taskMeta.sharedCrop,$taskDx,$taskDy)
$taskMeta.version=5
foreach($taskFrame in $taskMeta.frames){
 $taskFrame.PSObject.Properties.Remove('sha256')
 $taskBitmap=[Drawing.Bitmap]::FromFile((Join-Path $taskOutput "frame-$($taskFrame.number).png"))
 try {
  $taskTop=96
  for($taskY=0;$taskY -lt 96;$taskY++){for($taskX=0;$taskX -lt 96;$taskX++){if($taskBitmap.GetPixel($taskX,$taskY).A -ne 0){$taskTop=$taskY;break}};if($taskTop -lt 96){break}}
  $taskFrame.top=$taskTop
 }finally{$taskBitmap.Dispose()}
 $taskFrame|Add-Member -NotePropertyName pngSha256 -NotePropertyValue ((Get-FileHash -LiteralPath (Join-Path $taskOutput "frame-$($taskFrame.number).png")).Hash.ToLowerInvariant())
}
$taskMeta|Add-Member -NotePropertyName capRows -NotePropertyValue @(0,30)
$taskMeta|ConvertTo-Json -Depth 8|Set-Content -LiteralPath (Join-Path $taskOutput 'walk.json') -Encoding utf8
