Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletFullWalk.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskPalette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$taskColors=[Drawing.Color[]]@($taskPalette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$taskFolder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-ne-v1'
$taskSource=Join-Path $taskFolder 'source-keys.png'
# Rotate complete cels into the canonical left-contact/right-pass/right-contact/left-pass cycle.
[ScarletFullWalk]::Export($taskSource,$taskSource,$taskFolder,$taskColors,'ne',$true,[int[]]@(2,3,0,1))
Get-Content -LiteralPath (Join-Path $taskFolder 'walk.json')
