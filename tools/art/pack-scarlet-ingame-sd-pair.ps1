$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$folder=Join-Path $root 'docs/art/pixel/scarlet-ingame-sd-v1'
$se=New-Object Drawing.Bitmap (Join-Path $folder 'idle-se.png')
$ne=New-Object Drawing.Bitmap (Join-Path $folder 'idle-ne.png')
if($se.Width -ne 96 -or $se.Height -ne 96 -or $ne.Width -ne 96 -or $ne.Height -ne 96){throw 'Expected 96x96 original frames'}
$pair=New-Object Drawing.Bitmap 1152,576
for($y=0;$y -lt 576;$y++){for($x=0;$x -lt 1152;$x++){
 $source=if($x -lt 576){$se}else{$ne}
 $pair.SetPixel($x,$y,$source.GetPixel([int][Math]::Floor(($x%576)/6),[int][Math]::Floor($y/6)))
}}
$pair.Save((Join-Path $folder 'idle-pair-preview-6x.png'),[Drawing.Imaging.ImageFormat]::Png)
$pair.Dispose();$se.Dispose();$ne.Dispose()
$expected=(Get-Content -LiteralPath (Join-Path $folder 'approved-se.sha256') -Raw).Trim()
if((Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $folder 'idle-se.png')).Hash.ToLowerInvariant() -ne $expected){throw 'Approved SE frame changed'}
Write-Output 'Pair uses only the actual 96x96 PNGs at nearest 6x; approved SE hash unchanged.'
