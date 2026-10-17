param([ValidateSet('v1','v2')][string]$Revision = 'v1')
Add-Type -AssemblyName System.Drawing
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../apps/client/public/sprites/scarlet'))
$taskFiles = @('scarlet-se-idle-base-v3.png','scarlet-sw-idle-four-v1.png',"scarlet-nw-idle-four-$Revision.png","scarlet-ne-idle-four-$Revision.png")
$taskDirections = @('se','sw','nw','ne')
$taskSheet = New-Object System.Drawing.Bitmap 384,96
$taskLarge = New-Object System.Drawing.Bitmap 1536,384
$taskFrames = @()
try {
  for ($n=0; $n -lt 4; $n++) {
    $taskImage=[System.Drawing.Bitmap]::FromFile((Join-Path $taskRoot $taskFiles[$n]))
    try {
      if($taskImage.Width -ne 96 -or $taskImage.Height -ne 96){throw "Wrong frame size: $($taskFiles[$n])"}
      $taskColors = New-Object 'System.Collections.Generic.HashSet[int]'
      $taskBottom=-1
      for($y=0;$y -lt 96;$y++){for($x=0;$x -lt 96;$x++){
        $taskColor=$taskImage.GetPixel($x,$y)
        if($taskColor.A -ne 0 -and $taskColor.A -ne 255){throw 'Non-binary alpha found'}
        if($taskColor.A -gt 0){[void]$taskColors.Add($taskColor.ToArgb());$taskBottom=[Math]::Max($taskBottom,$y)}
        $taskSheet.SetPixel($n*96+$x,$y,$taskColor)
        for($dy=0;$dy -lt 4;$dy++){for($dx=0;$dx -lt 4;$dx++){$taskLarge.SetPixel(($n*96+$x)*4+$dx,$y*4+$dy,$taskColor)}}
      }}
      if($taskColors.Count -gt 32 -or $taskBottom -ne 87){throw "Palette/baseline mismatch: $($taskFiles[$n])"}
      $taskFrames += @{ direction=$taskDirections[$n]; image=$taskFiles[$n]; x=$n*96; y=0; width=96; height=96; opaqueColors=$taskColors.Count }
    } finally {$taskImage.Dispose()}
  }
  $taskSheet.Save((Join-Path $taskRoot "scarlet-four-idle-$Revision.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  $taskLarge.Save((Join-Path $taskRoot "scarlet-four-idle-$Revision-4x.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  @{version=[int]$Revision.Substring(1); sheet="scarlet-four-idle-$Revision.png"; anchor=@{x=48;y=88}; pose='standing'; frames=$taskFrames} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $taskRoot "scarlet-four-idle-$Revision.json") -Encoding utf8
  $taskFrames | ConvertTo-Json -Depth 4
} finally {$taskSheet.Dispose();$taskLarge.Dispose()}
