$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$encoder=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'pack-scarlet-fullwalk-gif.ps1') -Raw
$encoderCode=[regex]::Match($encoder,"(?s)-TypeDefinition @'\r?\n(.*?)\r?\n'@").Groups[1].Value
if(-not $encoderCode){throw 'Existing GIF encoder source not found'}
$compileRefs=@((Get-ChildItem (Join-Path $PSHOME 'ref/*.dll')).FullName)+@([Drawing.Bitmap].Assembly.Location)+@((Get-ChildItem (Join-Path $PSHOME 'System.Private.Windows.*.dll')).FullName)
Add-Type -ReferencedAssemblies $compileRefs -TypeDefinition $encoderCode
$colors=[Drawing.Color[]]@((Get-Content (Join-Path $taskRoot 'docs/art/pixel/garden-body-walk-se-v2/palette.json') -Raw | ConvertFrom-Json)|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$sheetPath=Join-Path $taskRoot 'docs/art/pixel/garden-body-walk-se-v2/walk.png'
$gifPath=Join-Path $taskRoot 'docs/art/pixel/garden-body-walk-se-v2/walk-preview.gif'
[FullFrameGifPackage]::Save($sheetPath,$gifPath,$colors,4,6)
$gif=[Drawing.Image]::FromFile($gifPath)
try {
 $dimension=[Drawing.Imaging.FrameDimension]::new($gif.FrameDimensionsList[0])
 if($gif.GetFrameCount($dimension) -ne 4){throw 'GIF frame count mismatch'}
 'GIF: 4 frames, 6 FPS, 288x288, generated from actual walk.png.'
}finally{$gif.Dispose()}

