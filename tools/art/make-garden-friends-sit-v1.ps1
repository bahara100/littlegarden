$ErrorActionPreference='Stop'
# Seated frames for the original garden friends Momo (cell 0) and Lulu (cell 4), made from their idle cells in
# garden-friends-v1.png at source resolution so the game's own 4x2 atlas downscale (loadPixelAtlas) treats
# them exactly like the idle frames. Seen from the front, a seated chibi's thighs hide under the skirt: the bare
# upper legs are removed and the socks + boots are raised to just below the hem and nudged forward (down-left).
# Output keeps the source layout (4x2 cells); only cells 0 and 4 are filled.
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$src=New-Object Drawing.Bitmap (Join-Path $root 'apps/client/public/sprites/garden/garden-friends-v1.png')
$out=New-Object Drawing.Bitmap $src.Width,$src.Height
$cw=$src.Width/4;$ch=$src.Height/2
# Source-pixel rows/columns inside a cell (96-px frame row y -> source row (y-3)*cell/90).
$legTop=372;$bootTop=380;$legX0=160;$legX1=285;$raise=24;$forward=10
foreach($cell in 0,4){
  $x0=[int][Math]::Floor($cell%4*$cw);$y0=[int][Math]::Floor([Math]::Floor($cell/4)*$ch)
  for($y=0;$y -lt [int]$ch;$y++){for($x=0;$x -lt [int]$cw;$x++){
    $inLegs=$y -ge $legTop -and $x -ge $legX0 -and $x -le $legX1
    if(-not $inLegs){ $out.SetPixel($x0+$x,$y0+$y,$src.GetPixel($x0+$x,$y0+$y)) }
  }}
  # Socks and boots, raised and moved forward; they are drawn over the skirt's lower edge where they overlap.
  for($y=$bootTop;$y -lt [int]$ch;$y++){for($x=$legX0;$x -le $legX1;$x++){
    $c=$src.GetPixel($x0+$x,$y0+$y); if($c.A -lt 180){continue}
    $ty=$y-$raise;$tx=$x-$forward; if($ty -lt 0 -or $tx -lt 0){continue}
    $under=$out.GetPixel($x0+$tx,$y0+$ty); if($under.A -ge 180 -and $ty -lt $legTop){continue}  # the skirt stays in front
    $out.SetPixel($x0+$tx,$y0+$ty,$c)
  }}
}
$path=Join-Path $root 'apps/client/public/sprites/garden/garden-friends-sit-v1.png'
$out.Save($path);$out.Dispose();$src.Dispose()
"saved $path"
