param([string]$Folder='docs/art/pixel/scarlet-restart-two-directions-v1')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$folder=if([IO.Path]::IsPathRooted($Folder)){$Folder}else{Join-Path $root $Folder}
$se=New-Object Drawing.Bitmap (Join-Path $folder 'draft-se.png')
$ne=New-Object Drawing.Bitmap (Join-Path $folder 'draft-ne.png')
$height=[Math]::Max($se.Height,$ne.Height)
$sheet=New-Object Drawing.Bitmap ($se.Width+$ne.Width),$height
$g=[Drawing.Graphics]::FromImage($sheet)
$g.DrawImageUnscaled($se,0,0)
$g.DrawImageUnscaled($ne,$se.Width,0)
$g.Dispose()
$sheet.Save((Join-Path $folder 'draft-pair.png'),[Drawing.Imaging.ImageFormat]::Png)
$records=@()
foreach($name in @('se','ne')){
 $path=Join-Path $folder "draft-$name.png"
 $image=if($name -eq 'se'){$se}else{$ne}
 $transparent=0;$visible=0
 for($y=0;$y -lt $image.Height;$y++){
  for($x=0;$x -lt $image.Width;$x++){
   if($image.GetPixel($x,$y).A -eq 0){$transparent++}else{$visible++}
  }
 }
 if($transparent -eq 0 -or $visible -eq 0){throw "Missing artwork or transparency: $name"}
 $records+=@{direction=$name;file="draft-$name.png";width=$image.Width;height=$image.Height;transparentPixels=$transparent;sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()}
}
@{stage='ai-standing-draft';originalDirections=@('se','ne');mirror=@{sw='se';nw='ne'};mirroredAsymmetryAllowed=$true;runtimeConnected=$false;framesPerWalk=4;walkFps=6;drafts=$records}|ConvertTo-Json -Depth 6|Set-Content -Encoding UTF8 (Join-Path $folder 'manifest.json')
$sheet.Dispose();$se.Dispose();$ne.Dispose()
$records|ForEach-Object{Write-Output "$($_.direction): $($_.width)x$($_.height), transparent=$($_.transparentPixels)"}
