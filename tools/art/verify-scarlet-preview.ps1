param([string]$Folder='apps/client/public/sprites/scarlet/fullframe-ne-v4')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
public static class PreviewPixelAudit {
 public static int Compare(string sheetPath,string previewPath) {
  using(var sheet=new Bitmap(sheetPath))using(var preview=new Bitmap(previewPath)) {
   if(sheet.Width!=384||sheet.Height!=96||preview.Width!=768||preview.Height!=768)throw new Exception("Wrong dimensions");
   int mismatch=0;
   for(int n=0;n<4;n++)for(int y=0;y<384;y++)for(int x=0;x<384;x++) {
    var actual=sheet.GetPixel(n*96+x/4,y/4);
    var shown=preview.GetPixel(n%2*384+x,n/2*384+y);
    if(actual.ToArgb()!=shown.ToArgb())mismatch++;
   }
   return mismatch;
  }
 }
}
'@
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskFolder=Join-Path $taskRoot $Folder
$taskMismatch=[PreviewPixelAudit]::Compare((Join-Path $taskFolder 'walk.png'),(Join-Path $taskFolder 'walk-preview-2x2.png'))
if($taskMismatch -ne 0){throw "Preview mismatch: $taskMismatch"}
Write-Output "Actual playback/preview pixel mismatches: $taskMismatch"
