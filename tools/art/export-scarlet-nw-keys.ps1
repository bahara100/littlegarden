$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletFullWalk.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$folder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-nw-v1'
$original=New-Object Drawing.Bitmap (Join-Path $folder 'source-draft.png')
$edit=New-Object Drawing.Bitmap (Join-Path $folder 'source-contact-edit.png')
if($original.Size -ne $edit.Size){throw 'Source size mismatch'}
# Retain the original three cells; adopt only the corrected opposite contact pose.
for($y=$original.Height/2;$y -lt $original.Height;$y++){for($x=0;$x -lt $original.Width/2;$x++){$original.SetPixel($x,$y,$edit.GetPixel($x,$y))}}
$source=Join-Path $folder 'source-composite.png'
$original.Save($source,[Drawing.Imaging.ImageFormat]::Png)
$original.Dispose();$edit.Dispose()
$palette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$colors=[Drawing.Color[]]@($palette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
# Original passing cells are opposite phases: plain right foot passes second, black left fourth.
[ScarletFullWalk]::Export($source,$source,$folder,$colors,'nw',$true,[int[]]@(0,3,2,1))
Copy-Item -LiteralPath (Join-Path $folder 'source-keys-ordered.png') -Destination (Join-Path $folder 'source-keys.png')
$sheet=New-Object Drawing.Bitmap (Join-Path $folder 'walk.png')
$preview=New-Object Drawing.Bitmap 768,768
for($n=0;$n -lt 4;$n++){for($y=0;$y -lt 384;$y++){for($x=0;$x -lt 384;$x++){
  $preview.SetPixel(($n%2)*384+$x,[Math]::Floor($n/2)*384+$y,$sheet.GetPixel($n*96+[Math]::Floor($x/4),[Math]::Floor($y/4)))
}}}
$preview.Save((Join-Path $folder 'walk-preview-2x2.png'),[Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose();$preview.Dispose()
Get-Content -LiteralPath (Join-Path $folder 'walk.json')
