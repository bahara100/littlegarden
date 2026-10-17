param([string]$Source='apps/client/public/sprites/scarlet/fullframe-se-v2/walk.png', [string]$Output='apps/client/public/sprites/scarlet/fullframe-se-v2/walk-preview.gif', [int]$Frames=8, [int]$Fps=12, [string]$Palette='tools/art/scarlet-palette.json')
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.IO;
using System.Text;
using System.Drawing;
using System.Collections.Generic;
public static class FullFrameGifPackage {
 public static void Save(string source,string output,Color[] palette,int frames,int fps) {
  using(Bitmap sheet=new Bitmap(source))using(BinaryWriter w=new BinaryWriter(File.Create(output))) {
   if(frames<1||fps<1||sheet.Width!=96*frames||sheet.Height!=96)throw new Exception("Sheet dimensions or playback settings invalid");
   int scale=3,size=96*scale;Dictionary<int,int> indices=new Dictionary<int,int>();
   for(int i=0;i<palette.Length;i++)indices[palette[i].ToArgb()]=i+1;
   w.Write(Encoding.ASCII.GetBytes("GIF89a"));w.Write((ushort)size);w.Write((ushort)size);w.Write((byte)245);w.Write((byte)0);w.Write((byte)0);
   for(int i=0;i<64;i++){Color c=i>0&&i<=palette.Length?palette[i-1]:Color.Black;w.Write(c.R);w.Write(c.G);w.Write(c.B);}
   w.Write(new byte[]{33,255,11});w.Write(Encoding.ASCII.GetBytes("NETSCAPE2.0"));w.Write(new byte[]{3,1,0,0,0});
   for(int frame=0;frame<frames;frame++) {
    int delay=(int)Math.Round((frame+1)*100.0/fps)-(int)Math.Round(frame*100.0/fps);
    w.Write(new byte[]{33,249,4,9});w.Write((ushort)delay);w.Write(new byte[]{0,0,44});
    w.Write((ushort)0);w.Write((ushort)0);w.Write((ushort)size);w.Write((ushort)size);w.Write((byte)0);w.Write((byte)6);
    List<byte> data=new List<byte>();int bits=0,acc=0,literals=0;
    Action<int> emit=code=>{acc|=code<<bits;bits+=7;while(bits>=8){data.Add((byte)(acc&255));acc>>=8;bits-=8;}};
    emit(64);
    // Literal-only LZW, reset before the dictionary grows to an 8-bit code width.
    // This packages rendered pixels without re-drawing or changing the character.
    for(int y=0;y<size;y++)for(int x=0;x<size;x++) {
     Color c=sheet.GetPixel(frame*96+x/scale,y/scale);int index=0;
     if(c.A!=0){if(c.A!=255||!indices.TryGetValue(c.ToArgb(),out index))throw new Exception("Unexpected palette/alpha");}
     emit(index);if(++literals==32){emit(64);literals=0;}
    }
    emit(65);if(bits>0)data.Add((byte)(acc&255));
    for(int i=0;i<data.Count;i+=255){int count=Math.Min(255,data.Count-i);w.Write((byte)count);w.Write(data.GetRange(i,count).ToArray());}w.Write((byte)0);
   }w.Write((byte)59);
  }
 }
}
'@
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
$taskParts=Get-Content -LiteralPath (Join-Path $taskRoot $Palette) -Raw|ConvertFrom-Json
$taskPalette=[Drawing.Color[]]@($taskParts|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
$taskOutput=Join-Path $taskRoot $Output
[FullFrameGifPackage]::Save((Join-Path $taskRoot $Source),$taskOutput,$taskPalette,$Frames,$Fps)
$taskGif=[Drawing.Image]::FromFile($taskOutput)
try{
 $taskDimension=New-Object Drawing.Imaging.FrameDimension ($taskGif.FrameDimensionsList[0])
 [pscustomobject]@{Width=$taskGif.Width;Height=$taskGif.Height;Frames=$taskGif.GetFrameCount($taskDimension);Path=$taskOutput}
 if($taskGif.GetFrameCount($taskDimension) -ne $Frames){throw 'Animated GIF frame count mismatch'}
 $sheet=New-Object Drawing.Bitmap (Join-Path $taskRoot $Source)
 try {
  $mismatches=0
  for($n=0;$n -lt $Frames;$n++){
   [void]$taskGif.SelectActiveFrame($taskDimension,$n)
   $decoded=New-Object Drawing.Bitmap $taskGif
   try{for($y=0;$y -lt 288;$y++){for($x=0;$x -lt 288;$x++){
    $expected=$sheet.GetPixel($n*96+[Math]::Floor($x/3),[Math]::Floor($y/3));$actual=$decoded.GetPixel($x,$y)
    if($actual.A -ne $expected.A -or ($expected.A -gt 0 -and $actual.ToArgb() -ne $expected.ToArgb())){$mismatches++}
   }}}finally{$decoded.Dispose()}
  }
  if($mismatches -ne 0){throw "GIF pixel mismatch: $mismatches"}
  Write-Output 'GIF / runtime sheet pixel mismatches: 0'
 }finally{$sheet.Dispose()}
}finally{$taskGif.Dispose()}

