param([string]$Source='apps/client/public/sprites/scarlet/fullframe-se-v1/source.png')
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletSequence.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskPalette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$taskColors=[Drawing.Color[]]@($taskPalette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$taskFolder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-se-v1'
[ScarletSequence]::Export((Join-Path $taskRoot $Source),$taskFolder,$taskColors)
Get-Content -LiteralPath (Join-Path $taskFolder 'walk-keyframes.json')
