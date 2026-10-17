Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletFullWalk.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskPalette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$taskColors=[Drawing.Color[]]@($taskPalette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$taskFolder=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-sw-v2'
[ScarletFullWalk]::Export((Join-Path $taskFolder 'source-keys.png'),(Join-Path $taskFolder 'source-inbetweens.png'),$taskFolder,$taskColors,'sw',$false)
Get-Content -LiteralPath (Join-Path $taskFolder 'walk.json')
