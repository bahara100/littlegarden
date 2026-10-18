$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletLowerBodyReplacement.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$previous=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v8'
$folder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v9'
$palette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$colors=[Drawing.Color[]]@($palette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$metadata=Get-Content -LiteralPath (Join-Path $previous 'walk.json') -Raw|ConvertFrom-Json
# Copy only generated leg regions; protect every pixel outside these polygons.
$masks=New-Object 'int[][]' 4
$masks[0]=[int[]]@(330,412,369,412,415,460,450,500,495,530,505,625,265,625,270,496,293,470,317,447)
$masks[1]=[int[]]@(240,405,304,411,323,455,395,480,414,609,198,609,210,488,232,460)
[ScarletLowerBodyReplacement]::Save((Join-Path $folder 'source-edit.png'),(Join-Path $previous 'source-keys.png'),$previous,$folder,$colors,$metadata.scale,[int[]]$metadata.sharedCrop,[int[]]@($metadata.frames|ForEach-Object{$_.translation[0]}),[int[]]@($metadata.frames|ForEach-Object{$_.translation[1]}),[int[]]@(0,1),0,$masks)
$metadata.version=9;$metadata.replacedRows=@(0,95);$metadata.replacedFrames=@(1,2)
foreach($frame in $metadata.frames){
  $path=Join-Path $folder "frame-$($frame.number).png"
  $frame.pngSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  $image=New-Object Drawing.Bitmap $path
  $top=96;$bottom=-1;$usedColors=New-Object 'System.Collections.Generic.HashSet[int]'
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){$pixel=$image.GetPixel($x,$y);if($pixel.A -gt 0){$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);[void]$usedColors.Add($pixel.ToArgb())}}}
  $image.Dispose();$frame.top=$top;$frame.bottom=$bottom;$frame.colors=$usedColors.Count
}
$metadata|ConvertTo-Json -Depth 8|Set-Content -Encoding UTF8 (Join-Path $folder 'walk.json')



