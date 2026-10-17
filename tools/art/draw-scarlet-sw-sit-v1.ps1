param([string]$Out)
# SW (front, facing down-left) seated poses for Scarlet: bench sit, swing sit, and the half-sit used while
# sitting down / standing up. The upper body is the SW idle frame; only the legs are new.
# Screen layout of the SW idle: the character's right leg (white stocking) is on screen-left, the left leg
# (black cross ribbon) on screen-right and nearer the viewer, so it is drawn last. The sword (right) and sleeve
# flap (left) hang down to leg height and stay with the body.
# Seen from the front, seated thighs point at the viewer and hide under the skirt, so each leg reads as
# a rounded knee right under the hem, a short shin and the shoe. The game draws seated frames at the seat's
# ground point (row 87) without the old 0.75-tile lift; the seat surface is ~18 px higher (row ~70), so the
# chibi feet dangle on the bench.
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$dir=Join-Path $root 'apps/client/public/sprites/scarlet'
$idle=New-Object Drawing.Bitmap (Join-Path $dir 'scarlet-sw-idle-four-v1.png')
function Hex($c){ '#{0:x2}{1:x2}{2:x2}' -f $c.R,$c.G,$c.B }
function IsLeg($x,$y){ ($y -ge 71 -and $y -le 76 -and $x -ge 36 -and $x -le 51) -or ($y -ge 77 -and $x -ge 34 -and $x -le 55 -and -not ($x -ge 54 -and $y -le 80)) }
function Block($x0,$x1,$y0,$y1){ $b=@{}; for($y=$y0;$y -le $y1;$y++){for($x=$x0;$x -le $x1;$x++){ if(-not (IsLeg $x $y)){continue}; $c=$idle.GetPixel($x,$y); if($c.A){$b["$($x-$x0),$($y-$y0)"]=Hex $c} }}; @{px=$b;w=$x1-$x0+1} }
$footR=Block 34 45 78 85   # white right foot: gold band + shoe (8 rows)
$footL=Block 44 55 79 87   # black-ribbon left foot (9 rows)
$pal=@{s='#302f3b';'9'='#f0e9f1';'8'='#ded2e7';v='#b5abb9'}
# Knee + shin rows, left-aligned strings; '.' is transparent. White stocking and the black X-ribbon stocking.
$kneeW=@('.s999s.','s99999s','s99998s'); $shinW=@('s9999s.','s9998s.')
$kneeB=@('.s9s9s.','s9sss9s','ss9s9ss'); $shinB=@('ss9sss.','s9s9ss.','sss9ss.')
function Rows($rows,$x0,$y0,$px){ for($i=0;$i -lt $rows.Count;$i++){ $r=$rows[$i]; for($j=0;$j -lt $r.Length;$j++){ $ch=[string]$r[$j]; if($ch -ne '.'){ $px["$($x0+$j),$($y0+$i)"]=$pal[$ch] } } } }
function PutBlock($blk,$cx,$top,$px){ foreach($k in $blk.px.Keys){ $p=$k.Split(','); $px["$([int]$p[0]-[Math]::Floor($blk.w/2)+$cx),$([int]$p[1]+$top)"]=$blk.px[$k] } }
# Leg: knee (3 rows) at kneeX/kneeY, shin rows sliding linearly to the ankle, then the foot block.
function Leg($knee,$shin,$foot,$kx,$ky,$ax,$ay,$px){
  Rows $knee ($kx-3) $ky $px
  $n=$ay-($ky+3); for($i=0;$i -lt $n;$i++){ $t=($i+1)/($n+1); $cx=[Math]::Round($kx+($ax-$kx)*$t); Rows @($shin[$i%$shin.Count]) ($cx-3) ($ky+3+$i) $px }
  PutBlock $foot $ax $ay $px
}
# kneeX,kneeY, ankleX,ankleY (top row of the foot block) for the right/white and left/black leg.
$poses=@(
 @{name='bench';drop=0;R=@(39,70,39,75);L=@(48,70,49,76)},   # feet dangle ~4 px above the ground
 @{name='swing';drop=0;R=@(37,71,35,75);L=@(46,71,45,76)},   # legs kicked forward on the swing
 @{name='half';drop=3;R=@(38,73,40,78);L=@(47,73,50,79)}     # crouching: feet planted where they stand
)
$body=New-Object Drawing.Bitmap (96*$poses.Count),96
$result=@()
for($f=0;$f -lt $poses.Count;$f++){
  $p=$poses[$f]
  for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){ $c=$idle.GetPixel($x,$y); if($c.A -and -not (IsLeg $x $y) -and $y+$p.drop -lt 96){ $body.SetPixel($f*96+$x,$y+$p.drop,$c) } }}
  $px=[ordered]@{}
  Leg $kneeW $shinW $footR $p.R[0] $p.R[1] $p.R[2] $p.R[3] $px
  Leg $kneeB $shinB $footL $p.L[0] $p.L[1] $p.L[2] $p.L[3] $px
  $draw=New-Object System.Collections.Generic.List[object]; foreach($k in $px.Keys){ $q=$k.Split(','); $draw.AddRange([object[]]@([int]$q[0],[int]$q[1],$px[$k])) }
  $result+=@{name=$p.name;draw=$draw}
}
$idle.Dispose()
if($Out){
  $body.Save((Join-Path $Out 'sit-body.png'))
  for($f=0;$f -lt $result.Count;$f++){ ($result[$f].draw|ConvertTo-Json -Compress)|Set-Content (Join-Path $Out "sit-legs-$f.json") }
}
$body.Dispose()
$result|%{ "$($_.name): legs=$($_.draw.Count/3)" }
