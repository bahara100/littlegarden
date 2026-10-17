$ErrorActionPreference='Stop'
# Packs the four V15 cels exported from Pixelorama (scarlet-nw-v15.pxo: "V14 body" over "legs v15") into the
# runtime sheet and previews, and checks them: palette, binary alpha, and the V14 upper body (y0..63) unchanged.
Add-Type -AssemblyName System.Drawing
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$dir=Join-Path $taskRoot 'apps/client/public/sprites/scarlet'
$folder=Join-Path $dir 'fullframe-nw-v15'
$palette=(Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json)|%{[Drawing.ColorTranslator]::FromHtml($_).ToArgb()}
$sheet=New-Object Drawing.Bitmap 384,96;$preview=New-Object Drawing.Bitmap 768,768;$contact=New-Object Drawing.Bitmap 1536,384
for($n=0;$n -lt 4;$n++){
  $frame=New-Object Drawing.Bitmap (Join-Path $folder "frame-$($n+1).png");$v14=New-Object Drawing.Bitmap (Join-Path $dir "fullframe-nw-v14/frame-$($n+1).png")
  if($frame.Width -ne 96 -or $frame.Height -ne 96){throw "Cel $($n+1) is not 96x96"}
  $colors=New-Object 'System.Collections.Generic.HashSet[int]'
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){
    $c=$frame.GetPixel($x,$y)
    if($c.A -ne 0){ if($c.A -ne 255){throw "Partial alpha in cel $($n+1)"}; if($palette -notcontains $c.ToArgb()){throw "Off-palette colour in cel $($n+1)"}; [void]$colors.Add($c.ToArgb()) }
    if($y -lt 64 -and $c.ToArgb() -ne $v14.GetPixel($x,$y).ToArgb()){throw "Upper body changed in cel $($n+1)"}
    $sheet.SetPixel($n*96+$x,$y,$c)
    for($yy=0;$yy -lt 4;$yy++){for($xx=0;$xx -lt 4;$xx++){$preview.SetPixel(($n%2*96+$x)*4+$xx,([Math]::Floor($n/2)*96+$y)*4+$yy,$c);$contact.SetPixel(($n*96+$x)*4+$xx,$y*4+$yy,$c)}}
  }}
  if($colors.Count -gt 32){throw "Palette exceeded in cel $($n+1)"}
  $frame.Dispose();$v14.Dispose()
}
$sheet.Save((Join-Path $folder 'walk.png'));$preview.Save((Join-Path $folder 'walk-preview-2x2.png'));$contact.Save((Join-Path $folder 'walk-contact-4x.png'))
$sheet.Dispose();$preview.Dispose();$contact.Dispose()
& (Join-Path $PSScriptRoot 'pack-scarlet-fullwalk-gif.ps1') -Source 'apps/client/public/sprites/scarlet/fullframe-nw-v15/walk.png' -Output 'apps/client/public/sprites/scarlet/fullframe-nw-v15/walk-preview.gif' -Frames 4 -Fps 6
$metadata=Get-Content -LiteralPath (Join-Path $dir 'fullframe-nw-v14/walk.json') -Raw|ConvertFrom-Json
$metadata.version=15;$metadata.replacedRows=@(64,95);$metadata.replacedFrames=@(1,2,3,4)
foreach($f in $metadata.frames){
  $path=Join-Path $folder "frame-$($f.number).png"
  $f.pngSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  $image=New-Object Drawing.Bitmap $path;$top=96;$bottom=-1;$used=New-Object 'System.Collections.Generic.HashSet[int]'
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){$p=$image.GetPixel($x,$y);if($p.A -gt 0){$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);[void]$used.Add($p.ToArgb())}}}
  $image.Dispose();$f.top=$top;$f.bottom=$bottom;$f.colors=$used.Count
}
$metadata|ConvertTo-Json -Depth 8|Set-Content -Encoding UTF8 (Join-Path $folder 'walk.json')
"V15 packed: $((1..4|%{ $m=$metadata.frames[$_-1]; "cel $_ y$($m.top)..$($m.bottom)" }) -join ', ')"
