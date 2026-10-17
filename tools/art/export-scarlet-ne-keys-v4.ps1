Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'ScarletFrameReplacement.cs') -Raw)
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskPalette=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scarlet-palette.json') -Raw|ConvertFrom-Json
$taskColors=[Drawing.Color[]]@($taskPalette|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$taskPrevious=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-ne-v2'
$taskOutput=Join-Path $taskRoot 'apps/client/public/sprites/scarlet/fullframe-ne-v4'
$taskMeta=Get-Content -LiteralPath (Join-Path $taskPrevious 'walk.json') -Raw|ConvertFrom-Json
$taskCrop=$taskMeta.sharedCrop
$taskFirst=[ScarletFrameReplacement]::Save((Join-Path $taskOutput 'source-pose-edit.png'),(Join-Path $taskPrevious 'source-keys-grounded.png'),$taskPrevious,$taskOutput,$taskColors,[double]$taskMeta.scale,$taskCrop[0],$taskCrop[1],$taskCrop[2],$taskCrop[3])|ConvertFrom-Json
$taskMeta.version=4
$taskMeta.frames[0]=$taskFirst
$taskMeta|ConvertTo-Json -Depth 8|Set-Content -LiteralPath (Join-Path $taskOutput 'walk.json') -Encoding utf8
foreach($taskN in 2..4){
 $taskOldHash=(Get-FileHash -LiteralPath (Join-Path $taskPrevious "frame-$taskN.png")).Hash
 $taskNewHash=(Get-FileHash -LiteralPath (Join-Path $taskOutput "frame-$taskN.png")).Hash
 if($taskOldHash -ne $taskNewHash){throw "Frame $taskN changed"}
}
Write-Output 'Frame 1 replaced; frames 2, 3, 4 are byte-identical to corrected V2.'

