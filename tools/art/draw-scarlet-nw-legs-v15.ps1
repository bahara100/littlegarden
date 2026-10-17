param([int[]]$Frames=@(1,2,3),[string]$Out)
# Builds the V15 NW leg layer. Every foot is placed from one stride model instead of being nudged per cel:
# body ground point (48,88); one step = 3 depth units of (2,1) px each side of the body (≈12×6 px stride at
# 1.45 tiles/s and 6 FPS); left lane offset +0.6·(-2,1), right lane -1.8·(-2,1). A planted foot therefore moves
# exactly (+6,+3) px per cel. Costume rules: the character's left leg is the black cross-ribbon stocking,
# the right leg the white stocking; shoes and gold ankle bands are shared. The nearer left leg is drawn last.
# Output per frame: pixels to clear on the V14 body layer (old legs) and pixels for the legs layer.
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$dir=Join-Path $root 'apps/client/public/sprites/scarlet'
function Hex($c){ '#{0:x2}{1:x2}{2:x2}' -f $c.R,$c.G,$c.B }
$v14=@{};for($n=1;$n -le 4;$n++){ $v14[$n]=New-Object Drawing.Bitmap (Join-Path $dir "fullframe-nw-v14/frame-$n.png") }
$v13f4=New-Object Drawing.Bitmap (Join-Path $dir 'fullframe-nw-v13/frame-4.png')
# Textures: the black cross-ribbon rows come from the left leg of cel 1, the white rows from the cel 4 support leg.
$black=@();foreach($y in 70..76){ $black+=,@(0..6|%{ $c=$v14[1].GetPixel(40+$_,$y); if($c.A){Hex $c}else{'#302f3b'} }) }
$white=@();foreach($y in 66..75){ $white+=,@(0..6|%{ $c=$v13f4.GetPixel(47+$_,$y); if($c.A){Hex $c}else{'#302f3b'} }) }
# Planted foot (ankle band + shoe) from the cel 4 support foot: rows 76..86, centred on its band.
$planted=@{};$px=@();for($y=76;$y -le 86;$y++){for($x=45;$x -le 58;$x++){$c=$v13f4.GetPixel($x,$y);if($c.A){$planted["$x,$y"]=Hex $c;if($y -eq 76){$px+=$x}}}}
$plantedCx=[Math]::Round((($px|Measure-Object -Average).Average));$plantedTop=76;$plantedBottom=86
# Lifted foot showing its sole (the V15 cel 4 passing foot): band + shoe, bottom row = sole edge.
$pal=@{s='#302f3b';'9'='#f0e9f1';m='#d5a349';n='#f2d075';l='#ab763c';t='#53515b'}
$liftedRows=@(@(0,-3,'smmnnms'),@(1,-3,'slmmmls'),@(2,-4,'ss9999ss'),@(3,-4,'s999999s'),@(4,-4,'ssssssss'),@(5,-4,'stttttts'),@(6,-3,'ssssss'))
function Foot($kind,$cx,$bottom,$px){
  if($kind -eq 'planted'){ foreach($k in $planted.Keys){ $p=$k.Split(',');$x=[int]$p[0]-$plantedCx+$cx;$y=[int]$p[1]-$plantedBottom+$bottom;$px["$x,$y"]=$planted[$k] }; return $bottom-($plantedBottom-$plantedTop) }
  $top=$bottom-6; foreach($r in $liftedRows){ for($i=0;$i -lt $r[2].Length;$i++){ $px["$($cx+$r[1]+$i),$($top+$r[0])"]=$pal[[string]$r[2][$i]] } }; return $top
}
function Leg($tex,$hipX,$ankleX,$ankleTop,$px){
  $top=64; for($y=$top;$y -lt $ankleTop;$y++){ $t=($y-$top)/[Math]::Max(1,$ankleTop-$top); $cx=[Math]::Round($hipX+($ankleX-$hipX)*$t); $row=$tex[($y-$top)%$tex.Count]; for($i=0;$i -lt 7;$i++){ $px["$($cx-3+$i),$y"]=$row[$i] } }
}
# Stride model -> sprite px. a: depth (+ = behind the body), b: lane, lifted: px above the ground.
# Lanes ±1.8 keep the feet roughly under the two hips (x 41 / 50); the ground row is 87, the V14 support-foot row.
function P($a,$b,$lift){ $x=48+2*$a-2*$b; $y=87+$a+$b-$lift; @([Math]::Round($x),[Math]::Round($y)) }
$L=1.8;$R=-1.8;$hipL=41;$hipR=50
$plan=@{
 # cel 1: black left foot forward (heel strike), white right foot behind, heel up (sole shows).
 1=@(@{leg='R';tex=$white;foot='lifted';p=(P 3 $R 0)},@{leg='L';tex=$black;foot='planted';p=(P -3 $L 0)});
 # cel 2: black left leg supports under the body, white right foot passes 4 px off the ground.
 2=@(@{leg='R';tex=$white;foot='lifted';p=(P 0 $R 4)},@{leg='L';tex=$black;foot='planted';p=(P 0 $L 0)});
 # cel 3: white right foot forward, black left foot behind with its heel up; the legs cross on screen.
 # Here the legs cross mid-shin; the forward white leg is drawn over the trailing one so it stays readable.
 3=@(@{leg='L';tex=$black;foot='lifted';p=(P 3 $L 0)},@{leg='R';tex=$white;foot='planted';p=(P -3 $R 0)})
}
# Old legs to clear: rows 69 and below, keeping the sword (left) and hair (right) that hang that low.
$keep=@{1={param($x,$y) ($y -le 72 -and $x -le 37) -or ($y -le 71 -and $x -ge 55)};2={param($x,$y) ($y -le 71 -and $x -le 39) -or ($y -le 70 -and $x -ge 60)};3={param($x,$y) ($y -le 67 -and $x -le 38) -or ($y -le 70 -and $x -ge 60)}}
$result=@{}
foreach($n in $Frames){
  $erase=New-Object System.Collections.Generic.List[object]
  for($y=69;$y -le 95;$y++){for($x=30;$x -le 66;$x++){ if($v14[$n].GetPixel($x,$y).A -and -not (& $keep[$n] $x $y)){ $erase.AddRange([object[]]@($x,$y,0,0,0,0)) } }}
  $px=[ordered]@{}
  foreach($l in $plan[$n]){ $cx=$l.p[0];$bottom=$l.p[1]; $ankleTop=Foot $l.foot $cx $bottom $px; Leg $l.tex ($(if($l.leg -eq 'L'){$hipL}else{$hipR})) $cx $ankleTop $px; Foot $l.foot $cx $bottom $px | Out-Null }
  $draw=New-Object System.Collections.Generic.List[object]; foreach($k in $px.Keys){ $p=$k.Split(','); $draw.AddRange([object[]]@([int]$p[0],[int]$p[1],$px[$k])) }
  $result["$n"]=@{erase=$erase;draw=$draw;feet=($plan[$n]|%{ "$($_.leg)$($_.foot)@$($_.p -join ',')" })}
}
foreach($b in $v14.Values){$b.Dispose()};$v13f4.Dispose()
if($Out){ foreach($n in $Frames){ ($result["$n"].erase|ConvertTo-Json -Compress)|Set-Content (Join-Path $Out "erase-f$n.json"); ($result["$n"].draw|ConvertTo-Json -Compress)|Set-Content (Join-Path $Out "legs-f$n.json") } }
foreach($n in $Frames){ "cel $n feet: $($result["$n"].feet -join '  ')  erase=$($result["$n"].erase.Count/6) draw=$($result["$n"].draw.Count/3)" }
