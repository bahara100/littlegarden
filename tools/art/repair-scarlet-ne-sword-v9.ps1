$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../'))
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class ScarletNeSwordV9 {
 public static void Run(string root){
  string folder=Path.Combine(root,"docs/art/pixel/scarlet-ingame-walk-ne-v9"),old=Path.Combine(root,"docs/art/pixel/scarlet-ingame-walk-ne-v8");
  foreach(int n in new[]{1,2,3})File.Copy(Path.Combine(old,"frame-"+n+".png"),Path.Combine(folder,"frame-"+n+".png"),true);
  var edits=new List<string>();int[] rowStart={36,35,33,31,29,27,25,24,23,23};int[] rowEnd={40,40,38,36,35,34,33,32,30,29};
  using(var original=new Bitmap(Path.Combine(old,"frame-4.png")))using(var reference=new Bitmap(Path.Combine(old,"frame-2.png")))using(var result=new Bitmap(original)){
   for(int y=70;y<=79;y++)for(int x=rowStart[y-70];x<=rowEnd[y-70];x++){
    Color a=original.GetPixel(x,y),b=reference.GetPixel(x-2,y);if(a.ToArgb()==b.ToArgb())continue;
    result.SetPixel(x,y,b);edits.Add("{\"x\":"+x+",\"y\":"+y+",\"from\":\""+a.ToArgb().ToString("X8")+"\",\"to\":\""+b.ToArgb().ToString("X8")+"\"}");
   }
   result.Save(Path.Combine(folder,"frame-4.png"),ImageFormat.Png);
   using(var comparison=new Bitmap(768,384))using(var crop=new Bitmap(696,228))using(var big=new Bitmap(576,576)){
    for(int y=0;y<96;y++)for(int x=0;x<96;x++){
     for(int dy=0;dy<4;dy++)for(int dx=0;dx<4;dx++){comparison.SetPixel(x*4+dx,y*4+dy,original.GetPixel(x,y));comparison.SetPixel(384+x*4+dx,y*4+dy,result.GetPixel(x,y));}
     for(int dy=0;dy<6;dy++)for(int dx=0;dx<6;dx++)big.SetPixel(x*6+dx,y*6+dy,result.GetPixel(x,y));
    }
    for(int y=0;y<19;y++)for(int x=0;x<29;x++)for(int dy=0;dy<12;dy++)for(int dx=0;dx<12;dx++){crop.SetPixel(x*12+dx,y*12+dy,original.GetPixel(x+20,y+63));crop.SetPixel(348+x*12+dx,y*12+dy,result.GetPixel(x+20,y+63));}
    comparison.Save(Path.Combine(folder,"pose4-before-after.png"),ImageFormat.Png);crop.Save(Path.Combine(folder,"sword-before-after.png"),ImageFormat.Png);big.Save(Path.Combine(folder,"pose4-preview-6x.png"),ImageFormat.Png);
   }
  }
  File.WriteAllText(Path.Combine(folder,"repair.json"),"{\"frame\":4,\"sourceVersion\":\"v8\",\"reference\":\"v8/frame-2.png\",\"referenceOffset\":[2,0],\"method\":\"restore-existing-sword-pixels\",\"changedPixels\":"+edits.Count+",\"edits\":["+String.Join(",",edits)+"]}");
  Console.WriteLine("Restored sword pixels: "+edits.Count);
  var frames=new Bitmap[4];var records=new List<string>();
  for(int n=0;n<4;n++){
   string path=Path.Combine(folder,"frame-"+(n+1)+".png");frames[n]=new Bitmap(path);var colors=new HashSet<int>();int first=96,bottom=-1;
   for(int y=0;y<96;y++)for(int x=0;x<96;x++){var c=frames[n].GetPixel(x,y);if(c.A!=0){colors.Add(c.ToArgb());first=Math.Min(first,y);bottom=y;}}
   if(colors.Count>24)throw new Exception("Palette exceeded");string hash;using(var sha=System.Security.Cryptography.SHA256.Create())hash=BitConverter.ToString(sha.ComputeHash(File.ReadAllBytes(path))).Replace("-","").ToLowerInvariant();
   records.Add("{\"number\":"+(n+1)+",\"colors\":"+colors.Count+",\"hatTop\":"+first+",\"bottom\":"+bottom+",\"sha256\":\""+hash+"\"}");
  }
  using(var sheet=new Bitmap(384,96))using(var grid=new Bitmap(768,768))using(var onion=new Bitmap(768,768))using(var contact=new Bitmap(1536,384)){
   for(int n=0;n<4;n++)for(int y=0;y<96;y++)for(int x=0;x<96;x++){
    Color c=frames[n].GetPixel(x,y),prev=frames[(n+3)%4].GetPixel(x,y);sheet.SetPixel(n*96+x,y,c);Color diagnostic=c.A!=0?c:prev.A!=0?Color.FromArgb(110,prev.R,prev.G,prev.B):Color.FromArgb(0,0,0,0);
    for(int dy=0;dy<4;dy++)for(int dx=0;dx<4;dx++){grid.SetPixel((n%2*96+x)*4+dx,(n/2*96+y)*4+dy,c);onion.SetPixel((n%2*96+x)*4+dx,(n/2*96+y)*4+dy,diagnostic);contact.SetPixel((n*96+x)*4+dx,y*4+dy,c);}
   }
   sheet.Save(Path.Combine(folder,"walk.png"),ImageFormat.Png);grid.Save(Path.Combine(folder,"walk-preview-2x2.png"),ImageFormat.Png);grid.Save(Path.Combine(folder,"source-keys.png"),ImageFormat.Png);onion.Save(Path.Combine(folder,"onion-diagnostic.png"),ImageFormat.Png);contact.Save(Path.Combine(folder,"walk-contact-4x.png"),ImageFormat.Png);
  }
  foreach(var f in frames)f.Dispose();
  File.WriteAllText(Path.Combine(folder,"walk.json"),"{\"stage\":\"walk-review\",\"direction\":\"ne\",\"frameCount\":4,\"fps\":6,\"frameSize\":[96,96],\"anchor\":[48,88],\"runtimeConnected\":false,\"sourceVersion\":\"v8\",\"frames\":["+String.Join(",",records)+"]}");
 }
}
'@
[ScarletNeSwordV9]::Run($root)

