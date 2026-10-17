param([Parameter(Mandatory=$true)][string]$Source,[Parameter(Mandatory=$true)][ValidateSet('sw','nw')][string]$Direction)
Add-Type -AssemblyName System.Drawing
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../apps/client/public/sprites/scarlet'))
$taskStem="scarlet-$Direction-walk-v2"
$taskSource=[System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $Source).Path)
try {
  $taskCellW=[int][Math]::Floor($taskSource.Width/2)
  for($i=0;$i -lt 2;$i++) {
    $n=1+$i*2
    $taskRect=New-Object System.Drawing.Rectangle ($i*$taskCellW),0,$taskCellW,$taskSource.Height
    $taskCell=$taskSource.Clone($taskRect,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $taskCellPath=Join-Path $taskRoot "$taskStem-frame-$n-source.png"
    try {$taskCell.Save($taskCellPath,[System.Drawing.Imaging.ImageFormat]::Png)}finally{$taskCell.Dispose()}
    & (Join-Path $PSScriptRoot 'export-scarlet-base.ps1') -Source $taskCellPath -Destination (Join-Path $taskRoot "$taskStem-frame-$n.png")
  }
} finally {$taskSource.Dispose()}
$taskSheet=New-Object System.Drawing.Bitmap 384,96
$taskPreview=New-Object System.Drawing.Bitmap 1536,384
$taskFrames=@()
try {
  for($n=0;$n -lt 4;$n++) {
    $taskFile=if($n -in @(1,3)){"$taskStem-frame-$n.png"}else{"scarlet-$Direction-walk-v1-frame-$n.png"}
    $taskImage=[System.Drawing.Bitmap]::FromFile((Join-Path $taskRoot $taskFile))
    try {
      if($taskImage.Width -ne 96 -or $taskImage.Height -ne 96){throw 'Frame must be 96x96'}
      $taskColors=New-Object 'System.Collections.Generic.HashSet[int]';$taskBottom=-1
      for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){
        $taskColor=$taskImage.GetPixel($x,$y)
        if($taskColor.A -notin @(0,255)){throw 'Alpha must be 0/255'}
        if($taskColor.A -gt 0){[void]$taskColors.Add($taskColor.ToArgb());$taskBottom=[Math]::Max($taskBottom,$y)}
        $taskSheet.SetPixel($n*96+$x,$y,$taskColor)
        for($dy=0;$dy -lt 4;$dy++){for($dx=0;$dx -lt 4;$dx++){$taskPreview.SetPixel(($n*96+$x)*4+$dx,$y*4+$dy,$taskColor)}}
      }}
      if($taskBottom -ne 87 -or $taskColors.Count -gt 32){throw 'Frame baseline/palette mismatch'}
      $taskFrames+=@{number=$n+1;image=$taskFile;x=$n*96;y=0;width=96;height=96;opaqueColors=$taskColors.Count}
    }finally{$taskImage.Dispose()}
  }
  $taskSheet.Save((Join-Path $taskRoot "$taskStem.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  $taskPreview.Save((Join-Path $taskRoot "$taskStem-4x.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  @{version=2;direction=$Direction;fps=6;anchor=@{x=48;y=88};changedFrames=@(2,4);frames=$taskFrames}|ConvertTo-Json -Depth 5|Set-Content -LiteralPath (Join-Path $taskRoot "$taskStem.json") -Encoding utf8
  $taskFrames|ConvertTo-Json -Depth 4
}finally{$taskSheet.Dispose();$taskPreview.Dispose()}
