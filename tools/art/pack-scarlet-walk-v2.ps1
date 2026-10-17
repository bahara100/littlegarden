Add-Type -AssemblyName System.Drawing
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../apps/client/public/sprites/scarlet'))
$taskFiles=@('scarlet-se-walk-v1-frame-0.png','scarlet-se-walk-v1-frame-1.png','scarlet-se-walk-v1-frame-2.png','scarlet-se-walk-v2-frame-3.png')
$taskSheet=New-Object System.Drawing.Bitmap 384,96
$taskPreview=New-Object System.Drawing.Bitmap 1536,384
$taskFrames=@()
try {
  for($n=0;$n -lt 4;$n++){
    $taskImage=[System.Drawing.Bitmap]::FromFile((Join-Path $taskRoot $taskFiles[$n]))
    try{
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
      $taskFrames+=@{number=$n+1;image=$taskFiles[$n];x=$n*96;y=0;width=96;height=96;opaqueColors=$taskColors.Count}
    }finally{$taskImage.Dispose()}
  }
  $taskSheet.Save((Join-Path $taskRoot 'scarlet-se-walk-v2.png'),[System.Drawing.Imaging.ImageFormat]::Png)
  $taskPreview.Save((Join-Path $taskRoot 'scarlet-se-walk-v2-4x.png'),[System.Drawing.Imaging.ImageFormat]::Png)
  @{version=2;direction='se';fps=6;anchor=@{x=48;y=88};changedFrames=@(4);frames=$taskFrames}|ConvertTo-Json -Depth 5|Set-Content -LiteralPath (Join-Path $taskRoot 'scarlet-se-walk-v2.json') -Encoding utf8
  $taskFrames|ConvertTo-Json -Depth 4
}finally{$taskSheet.Dispose();$taskPreview.Dispose()}
