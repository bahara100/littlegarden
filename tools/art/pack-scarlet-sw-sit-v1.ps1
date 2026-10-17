$ErrorActionPreference='Stop'
# Packs the SW seated cels exported from Pixelorama (sit-sw-v1/scarlet-sw-sit-v1.pxo: "SW idle body" over
# "sit legs") into sit.png = [bench, swing, half] (288x96) plus a 4x preview, and checks palette, binary alpha
# and that the upper body is the SW idle frame (dropped by 3 px in the half-sit).
Add-Type -AssemblyName System.Drawing
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$dir=Join-Path $taskRoot 'apps/client/public/sprites/scarlet'
$folder=Join-Path $dir 'sit-sw-v1'
$palette=(Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json)|%{[Drawing.ColorTranslator]::FromHtml($_).ToArgb()}
$idle=New-Object Drawing.Bitmap (Join-Path $dir 'scarlet-sw-idle-four-v1.png')
$cels=@(@{name='bench';drop=0},@{name='swing';drop=0},@{name='half';drop=3})
$sheet=New-Object Drawing.Bitmap (96*$cels.Count),96;$preview=New-Object Drawing.Bitmap (96*4*$cels.Count),(96*4)
$info=@()
for($n=0;$n -lt $cels.Count;$n++){
  $c=$cels[$n];$frame=New-Object Drawing.Bitmap (Join-Path $folder "frame-$($c.name).png")
  $colors=New-Object 'System.Collections.Generic.HashSet[int]';$top=96;$bottom=-1
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){
    $p=$frame.GetPixel($x,$y)
    if($p.A -ne 0){ if($p.A -ne 255){throw "Partial alpha in $($c.name)"}; if($palette -notcontains $p.ToArgb()){throw "Off-palette colour in $($c.name)"}; [void]$colors.Add($p.ToArgb()); $top=[Math]::Min($top,$y);$bottom=$y }
    # Upper body (hat, face, torso, arms) must be the idle frame, moved down by the cel's drop.
    if($y -lt 66+$c.drop -and $y -ge $c.drop -and $p.ToArgb() -ne $idle.GetPixel($x,$y-$c.drop).ToArgb()){throw "Upper body differs from the SW idle in $($c.name) at $x,$y"}
    $sheet.SetPixel($n*96+$x,$y,$p)
    for($yy=0;$yy -lt 4;$yy++){for($xx=0;$xx -lt 4;$xx++){$preview.SetPixel(($n*96+$x)*4+$xx,$y*4+$yy,$p)}}
  }}
  if($colors.Count -gt 32){throw "Palette exceeded in $($c.name)"}
  $info+=[ordered]@{name=$c.name;index=$n;drop=$c.drop;top=$top;bottom=$bottom;colors=$colors.Count;pngSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $folder "frame-$($c.name).png")).Hash.ToLowerInvariant()}
  $frame.Dispose()
}
$idle.Dispose()
$sheet.Save((Join-Path $folder 'sit.png'));$preview.Save((Join-Path $folder 'sit-preview.png'));$sheet.Dispose();$preview.Dispose()
[ordered]@{version=1;direction='sw';frameSize=96;groundRow=87;seatRow=70;frames=$info}|ConvertTo-Json -Depth 5|Set-Content -Encoding UTF8 (Join-Path $folder 'sit.json')
$info|%{ "$($_.name): y$($_.top)..$($_.bottom), $($_.colors) colours" }
