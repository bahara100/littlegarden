$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletLowerBodyReplacement.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$previous=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v7'
$folder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v8'
$grid=New-Object Drawing.Bitmap (Join-Path $folder 'source-pose-edit.png')
$pose3=New-Object Drawing.Bitmap (Join-Path $folder 'source-pose3-edit.png')
if($grid.Size -ne $pose3.Size){throw 'Source grids must match'}
$cw=[int]($grid.Width/2);$ch=[int]($grid.Height/2)
for($y=0;$y -lt $ch;$y++){for($x=0;$x -lt $cw;$x++){$grid.SetPixel($x,$ch+$y,$pose3.GetPixel($x,$ch+$y))}}
$grid.Save((Join-Path $folder 'source-edit.png'),[Drawing.Imaging.ImageFormat]::Png)
$grid.Dispose();$pose3.Dispose()
$palette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$colors=[Drawing.Color[]]@($palette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$metadata=Get-Content -LiteralPath (Join-Path $previous 'walk.json') -Raw|ConvertFrom-Json
# Keep frame 1; rebuild 2/3/4 from fixed anatomical chains, including crossing in frame 3.
[ScarletLowerBodyReplacement]::Save((Join-Path $folder 'source-edit.png'),(Join-Path $previous 'source-keys.png'),$previous,$folder,$colors,$metadata.scale,[int[]]$metadata.sharedCrop,[int[]]@($metadata.frames|ForEach-Object{$_.translation[0]}),[int[]]@($metadata.frames|ForEach-Object{$_.translation[1]}),[int[]]@(1,2,3),0)
$metadata.version=8;$metadata.replacedRows=@(0,95);$metadata.replacedFrames=@(2,3,4)
foreach($frame in $metadata.frames){
  $path=Join-Path $folder "frame-$($frame.number).png"
  $frame.pngSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  $image=New-Object Drawing.Bitmap $path
  $top=96;$bottom=-1;$usedColors=New-Object 'System.Collections.Generic.HashSet[int]'
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){$pixel=$image.GetPixel($x,$y);if($pixel.A -gt 0){$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);[void]$usedColors.Add($pixel.ToArgb())}}}
  $image.Dispose();$frame.top=$top;$frame.bottom=$bottom;$frame.colors=$usedColors.Count
}
$metadata|ConvertTo-Json -Depth 8|Set-Content -Encoding UTF8 (Join-Path $folder 'walk.json')



