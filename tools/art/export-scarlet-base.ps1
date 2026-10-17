param(
  [Parameter(Mandatory=$true)][string]$Source,
  [Parameter(Mandatory=$true)][string]$Destination
)
# Asset export only: fit a generated reference to the agreed 96px frame contract.
# Keep this palette fixed when exporting future directions and motions.
Add-Type -AssemblyName System.Drawing
$paletteHex = @(
  '#332b43','#51405d','#745775','#9b7b97',
  '#64577c','#82709d','#a392b9','#c3b3d5','#ded2e7','#f0e9f1',
  '#685c69','#a49696','#d7c6bb','#f1e2cc','#fff3dc',
  '#b08069','#d7a68b','#efc5a3','#ffdfba','#ffecd1',
  '#765136','#ab763c','#d5a349','#f2d075',
  '#692f47','#9b3e52','#c15b61','#e18b83',
  '#302f3b','#53515b','#87818c','#b5abb9'
)
$palette = @($paletteHex | ForEach-Object { [System.Drawing.ColorTranslator]::FromHtml($_) })
$sourceImage = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $Source).Path)
$output = New-Object System.Drawing.Bitmap 96,96
$preview = New-Object System.Drawing.Bitmap 384,384
try {
  $left=$sourceImage.Width; $right=0; $top=$sourceImage.Height; $bottom=0
  for ($y=0; $y -lt $sourceImage.Height; $y++) {
    for ($x=0; $x -lt $sourceImage.Width; $x++) {
      if ($sourceImage.GetPixel($x,$y).A -ge 180) {
        $left=[Math]::Min($left,$x); $right=[Math]::Max($right,$x)
        $top=[Math]::Min($top,$y); $bottom=[Math]::Max($bottom,$y)
      }
    }
  }
  if ($right -lt $left -or $bottom -lt $top) { throw 'No opaque character pixels found.' }
  $width=$right-$left+1; $height=$bottom-$top+1
  $scale=[Math]::Min(78.0/$width,82.0/$height)
  $dw=[int][Math]::Round($width*$scale); $dh=[int][Math]::Round($height*$scale)
  $ox=[int][Math]::Floor((96-$dw)/2); $oy=88-$dh
  for ($y=0; $y -lt $dh; $y++) {
    for ($x=0; $x -lt $dw; $x++) {
      $sx=[Math]::Min($right,$left+[int][Math]::Floor(($x+.5)/$scale))
      $sy=[Math]::Min($bottom,$top+[int][Math]::Floor(($y+.5)/$scale))
      $sample=$sourceImage.GetPixel($sx,$sy)
      if ($sample.A -lt 180) { continue }
      $best=$palette[0]; $distance=[double]::PositiveInfinity
      foreach ($color in $palette) {
        $dr=[int]$sample.R-[int]$color.R; $dg=[int]$sample.G-[int]$color.G; $db=[int]$sample.B-[int]$color.B
        $delta=$dr*$dr+$dg*$dg+$db*$db
        if ($delta -lt $distance) { $distance=$delta; $best=$color }
      }
      $output.SetPixel($ox+$x,$oy+$y,$best)
    }
  }
  $output.Save([IO.Path]::GetFullPath($Destination),[System.Drawing.Imaging.ImageFormat]::Png)
  # Explicit 4x nearest-neighbour export without interpolation or new colors.
  for ($y=0; $y -lt 96; $y++) { for ($x=0; $x -lt 96; $x++) {
    $color=$output.GetPixel($x,$y)
    for ($dy=0; $dy -lt 4; $dy++) { for ($dx=0; $dx -lt 4; $dx++) { $preview.SetPixel($x*4+$dx,$y*4+$dy,$color) } }
  } }
  $previewPath=[IO.Path]::Combine([IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($Destination)),[IO.Path]::GetFileNameWithoutExtension($Destination)+'-4x.png')
  $preview.Save($previewPath,[System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "Exported 96x96 RGBA, <=32 opaque colors, baseline y=88: $Destination"
} finally { $sourceImage.Dispose(); $output.Dispose(); $preview.Dispose() }
