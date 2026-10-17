$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletLowerBodyReplacement.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$previous=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v3'
$folder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v4'
$grid=New-Object Drawing.Bitmap (Join-Path $previous 'source-keys.png')
$single=New-Object Drawing.Bitmap (Join-Path $folder 'source-pose4-edit.png')
$cw=[int]($grid.Width/2);$ch=[int]($grid.Height/2)
# Normalize the entire source canvas to its original cell, never fit the character bounds.
for($y=0;$y -lt $ch;$y++){for($x=0;$x -lt $cw;$x++){
  $sx=[Math]::Min($single.Width-1,[int][Math]::Floor(($x+.5)*$single.Width/$cw))
  $sy=[Math]::Min($single.Height-1,[int][Math]::Floor(($y+.5)*$single.Height/$ch))
  $grid.SetPixel($cw+$x,$ch+$y,$single.GetPixel($sx,$sy))
}}
$edit=Join-Path $folder 'source-normalized-edit.png'
$grid.Save($edit,[Drawing.Imaging.ImageFormat]::Png);$grid.Dispose();$single.Dispose()
$palette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$colors=[Drawing.Color[]]@($palette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$metadata=Get-Content -LiteralPath (Join-Path $previous 'walk.json') -Raw|ConvertFrom-Json
[ScarletLowerBodyReplacement]::Save($edit,(Join-Path $previous 'source-keys.png'),$previous,$folder,$colors,$metadata.scale,[int[]]$metadata.sharedCrop,[int[]]@($metadata.frames|ForEach-Object{$_.translation[0]}),[int[]]@($metadata.frames|ForEach-Object{$_.translation[1]}),[int[]]@(3),50)
$metadata.version=4;$metadata.replacedRows=@(50,95);$metadata.replacedFrames=@(4)
foreach($frame in $metadata.frames){
  $path=Join-Path $folder "frame-$($frame.number).png"
  $frame.pngSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  if($frame.number -ne 4 -and $frame.pngSha256 -ne (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $previous "frame-$($frame.number).png")).Hash.ToLowerInvariant()){throw 'Locked frame changed'}
  $image=New-Object Drawing.Bitmap $path
  $top=96;$bottom=-1;$usedColors=New-Object 'System.Collections.Generic.HashSet[int]'
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){$pixel=$image.GetPixel($x,$y);if($pixel.A -gt 0){$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);[void]$usedColors.Add($pixel.ToArgb())}}}
  $image.Dispose();$frame.top=$top;$frame.bottom=$bottom;$frame.colors=$usedColors.Count
}
$metadata|ConvertTo-Json -Depth 8|Set-Content -Encoding UTF8 (Join-Path $folder 'walk.json')
