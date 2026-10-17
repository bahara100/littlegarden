Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletFullWalk.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskPalette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$taskColors=[Drawing.Color[]]@($taskPalette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$taskFolder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-ne-v2'
$taskSource=Join-Path $taskFolder 'source-keys-grounded.png'
# Corrected anatomy is already in canonical row-major order. Do not reuse the old cell rotation.
[ScarletFullWalk]::Export($taskSource,$taskSource,$taskFolder,$taskColors,'ne',$true)
Get-Content -LiteralPath (Join-Path $taskFolder 'walk.json')
