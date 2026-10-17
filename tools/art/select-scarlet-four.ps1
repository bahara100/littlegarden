$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
foreach ($direction in @('se','sw')) {
  $source = Join-Path $PSScriptRoot "../../apps/client/public/sprites/scarlet/fullframe-$direction-v2"
  $target = Join-Path $PSScriptRoot "../../apps/client/public/sprites/scarlet/fullframe-$direction-v3"
  New-Item -ItemType Directory -Force $target | Out-Null
  $sheet = New-Object System.Drawing.Bitmap 384,96
  $preview = New-Object System.Drawing.Bitmap 768,768
  $contact = New-Object System.Drawing.Bitmap 1536,384
  $sourceSheet = [System.Drawing.Bitmap]::FromFile((Join-Path $source 'walk.png'))
  $keys = @(1,3,5,7)
  for ($i=0; $i -lt 4; $i++) {
    Copy-Item -LiteralPath (Join-Path $source "frame-$($keys[$i]).png") -Destination (Join-Path $target "frame-$($i+1).png")
    $frame = [System.Drawing.Bitmap]::FromFile((Join-Path $target "frame-$($i+1).png"))
    for ($y=0; $y -lt 96; $y++) { for ($x=0; $x -lt 96; $x++) {
      $pixel = $frame.GetPixel($x,$y)
      if ($pixel.ToArgb() -ne $sourceSheet.GetPixel(($keys[$i]-1)*96+$x,$y).ToArgb()) { throw 'Source cell mismatch' }
      $sheet.SetPixel($i*96+$x,$y,$pixel)
      for ($dy=0; $dy -lt 4; $dy++) { for ($dx=0; $dx -lt 4; $dx++) {
        $preview.SetPixel(($i%2)*384+$x*4+$dx,[Math]::Floor($i/2)*384+$y*4+$dy,$pixel)
        $contact.SetPixel($i*384+$x*4+$dx,$y*4+$dy,$pixel)
      }}
    }}
    $frame.Dispose()
  }
  $sheet.Save((Join-Path $target 'walk.png'),[System.Drawing.Imaging.ImageFormat]::Png)
  $preview.Save((Join-Path $target 'walk-preview-2x2.png'),[System.Drawing.Imaging.ImageFormat]::Png)
  $contact.Save((Join-Path $target 'walk-contact-4x.png'),[System.Drawing.Imaging.ImageFormat]::Png)
  @{direction=$direction;version=3;frameCount=4;fps=6;frameSize=96;source="../fullframe-$direction-v2/walk.png";sourceFrames=$keys;note='Approved key poses preserved pixel-for-pixel; four frames are the final playback target.'} | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $target 'walk.json')
  $sourceSheet.Dispose(); $sheet.Dispose(); $preview.Dispose(); $contact.Dispose()
  Write-Output "$direction : four cells match source frames 1,3,5,7 exactly"
}
