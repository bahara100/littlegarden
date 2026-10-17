$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletLowerBodyReplacement.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$previous=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v1'
$folder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v2'
$palette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$colors=[Drawing.Color[]]@($palette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$metadata=Get-Content -LiteralPath (Join-Path $previous 'walk.json') -Raw|ConvertFrom-Json
[ScarletLowerBodyReplacement]::Save((Join-Path $folder 'source-leg-edit.png'),(Join-Path $previous 'source-keys.png'),$previous,$folder,$colors,$metadata.scale,[int[]]$metadata.sharedCrop,[int[]]@($metadata.frames|ForEach-Object{$_.translation[0]}),[int[]]@($metadata.frames|ForEach-Object{$_.translation[1]}))
$metadata.version=2
$metadata|Add-Member -NotePropertyName replacedRows -NotePropertyValue @(50,95)
foreach($frame in $metadata.frames){
  $frame|Add-Member -NotePropertyName pngSha256 -NotePropertyValue (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $folder "frame-$($frame.number).png")).Hash.ToLowerInvariant()
  $frame.PSObject.Properties.Remove('sha256')
  $image=New-Object Drawing.Bitmap (Join-Path $folder "frame-$($frame.number).png")
  $top=96;$bottom=-1;$usedColors=New-Object 'System.Collections.Generic.HashSet[int]'
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){$pixel=$image.GetPixel($x,$y);if($pixel.A -gt 0){$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);[void]$usedColors.Add($pixel.ToArgb())}}}
  $image.Dispose();$frame.top=$top;$frame.bottom=$bottom;$frame.colors=$usedColors.Count;$frame.sourceCell=$frame.number
}
$metadata|ConvertTo-Json -Depth 8|Set-Content -Encoding UTF8 (Join-Path $folder 'walk.json')
