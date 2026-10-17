param([Parameter(Mandatory=$true)][string]$Folder)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskFolder=Join-Path $taskRoot $Folder
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
public static class ScarletWalkPairs {
 public static void Run(string folder) {
  using(var sheet=new Bitmap(Path.Combine(folder,"walk.png"))){
   if(sheet.Width!=384||sheet.Height!=96)throw new Exception("Expected 4 full frames");
   for(int p=0;p<2;p++)using(var pair=new Bitmap(768,384)){
    for(int col=0;col<2;col++){int frame=p+col*2;for(int y=0;y<96;y++)for(int x=0;x<96;x++)for(int dy=0;dy<4;dy++)for(int dx=0;dx<4;dx++)pair.SetPixel(col*384+x*4+dx,y*4+dy,sheet.GetPixel(frame*96+x,y));}
    pair.Save(Path.Combine(folder,p==0?"contacts-1-3.png":"passes-2-4.png"),ImageFormat.Png);
   }
   using(var legs=new Bitmap(1408,256)){
    for(int n=0;n<4;n++)for(int y=0;y<32;y++)for(int x=0;x<44;x++)for(int dy=0;dy<8;dy++)for(int dx=0;dx<8;dx++)legs.SetPixel((n*44+x)*8+dx,y*8+dy,sheet.GetPixel(n*96+28+x,64+y));
    legs.Save(Path.Combine(folder,"legs-diagnostic.png"),ImageFormat.Png);
   }
  }
 }
}
'@
[ScarletWalkPairs]::Run($taskFolder)
