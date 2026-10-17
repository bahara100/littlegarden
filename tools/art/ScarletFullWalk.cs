using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.IO;
public static class ScarletFullWalk {
 public static void Export(string keys,string mids,string folder,Color[] palette,string direction="se",bool keysOnly=false,int[] cellOrder=null) {
  if(cellOrder!=null){if(!keysOnly||cellOrder.Length!=4||new HashSet<int>(cellOrder).Count!=4)throw new Exception("Expected four unique key cells");foreach(int cell in cellOrder)if(cell<0||cell>3)throw new Exception("Invalid key cell");}
  using(Bitmap key=new Bitmap(keys))using(Bitmap mid=new Bitmap(mids)) {
   if(key.Size!=mid.Size||key.Width%2!=0||key.Height%2!=0)throw new Exception("Source grids must have matching even dimensions");
   // Keep a full-resolution, canonical-order reference for later in-between drawing.
   // Only whole cells are repacked; their pixels are not redrawn or mirrored.
   if(cellOrder!=null)using(Bitmap ordered=new Bitmap(key.Width,key.Height)) {
    int ow=key.Width/2,oh=key.Height/2;
    for(int n=0;n<4;n++)for(int y=0;y<oh;y++)for(int x=0;x<ow;x++)ordered.SetPixel(n%2*ow+x,n/2*oh+y,key.GetPixel(cellOrder[n]%2*ow+x,cellOrder[n]/2*oh+y));
    ordered.Save(Path.Combine(folder,"source-keys-ordered.png"),ImageFormat.Png);
   }
   int count=keysOnly?4:8;
   int cw=key.Width/2,ch=key.Height/2,left=cw,top=ch,right=0,bottom=0;
   var masks=new List<bool[]>();var sources=new List<Bitmap>();var cells=new List<int>();
   for(int n=0;n<count;n++) {
    Bitmap input=keysOnly||n%2==0?key:mid;int cell=keysOnly?(cellOrder==null?n:cellOrder[n]):n/2,ox=cell%2*cw,oy=cell/2*ch;
    bool[] solid=new bool[cw*ch],seen=new bool[cw*ch];
    for(int y=0;y<ch;y++)for(int x=0;x<cw;x++)solid[y*cw+x]=input.GetPixel(ox+x,oy+y).A>=180;
    var largest=new List<int>();var q=new Queue<int>();
    for(int start=0;start<solid.Length;start++)if(solid[start]&&!seen[start]) {
     var component=new List<int>();q.Enqueue(start);seen[start]=true;
     while(q.Count>0){int i=q.Dequeue();component.Add(i);int x=i%cw,y=i/cw;
      for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){int nx=x+dx,ny=y+dy;if(nx<0||nx>=cw||ny<0||ny>=ch)continue;int j=ny*cw+nx;if(solid[j]&&!seen[j]){seen[j]=true;q.Enqueue(j);}}
     }if(component.Count>largest.Count)largest=component;
    }
    if(largest.Count<100)throw new Exception("Missing full body");var mask=new bool[cw*ch];
    foreach(int i in largest){mask[i]=true;int x=i%cw,y=i/cw;left=Math.Min(left,x);right=Math.Max(right,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y);}
    masks.Add(mask);sources.Add(input);cells.Add(cell);
   }
   int sw=right-left+1,sh=bottom-top+1;double scale=Math.Min(78.0/sw,82.0/sh);
   int dw=(int)Math.Round(sw*scale),dh=(int)Math.Round(sh*scale),px=(96-dw)/2,py=88-dh;
   using(Bitmap sheet=new Bitmap(count*96,96))using(Bitmap contact=new Bitmap(1536,keysOnly?384:768)) {
    var stats=new List<string>();var hashes=new HashSet<string>();
    for(int n=0;n<count;n++)using(Bitmap raw=new Bitmap(96,96))using(Bitmap frame=new Bitmap(96,96)) {
     int last=-1,hatLeft=96,hatRight=0;
     for(int y=0;y<dh;y++)for(int x=0;x<dw;x++) {
      int sx=Math.Min(right,left+(int)((x+.5)/scale)),sy=Math.Min(bottom,top+(int)((y+.5)/scale));if(!masks[n][sy*cw+sx])continue;
      Color c=sources[n].GetPixel(cells[n]%2*cw+sx,cells[n]/2*ch+sy),best=palette[0];int distance=int.MaxValue;
      foreach(Color p in palette){int dr=c.R-p.R,dg=c.G-p.G,db=c.B-p.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}
      raw.SetPixel(px+x,py+y,best);last=Math.Max(last,py+y);
      // Upper hat silhouette supplies horizontal registration, never an independent scale.
      if(py+y<py+dh*0.32){hatLeft=Math.Min(hatLeft,px+x);hatRight=Math.Max(hatRight,px+x);}
     }
     int dxReg=48-(int)Math.Round((hatLeft+hatRight)/2.0),dyReg=87-last,first=96;var colors=new HashSet<int>();var pixelBytes=new List<byte>();
     for(int y=0;y<96;y++)for(int x=0;x<96;x++) {
      Color c=raw.GetPixel(x,y);if(c.A==0)continue;int tx=x+dxReg,ty=y+dyReg;
      if(tx<0||tx>=96||ty<0||ty>=88)throw new Exception("Registration clips body");frame.SetPixel(tx,ty,c);colors.Add(c.ToArgb());first=Math.Min(first,ty);
     }
     if(colors.Count>32)throw new Exception("Palette contract failed");
     for(int y=0;y<96;y++)for(int x=0;x<96;x++){Color c=frame.GetPixel(x,y);pixelBytes.Add(c.R);pixelBytes.Add(c.G);pixelBytes.Add(c.B);pixelBytes.Add(c.A);sheet.SetPixel(n*96+x,y,c);for(int yy=0;yy<4;yy++)for(int xx=0;xx<4;xx++)contact.SetPixel((n%4*96+x)*4+xx,(n/4*96+y)*4+yy,c);}
     string hash;using(var sha=System.Security.Cryptography.SHA256.Create())hash=BitConverter.ToString(sha.ComputeHash(pixelBytes.ToArray())).Replace("-","").ToLowerInvariant();
     if(!hashes.Add(hash))throw new Exception("Duplicate full-body frame");frame.Save(Path.Combine(folder,"frame-"+(n+1)+".png"),ImageFormat.Png);
     stats.Add("{\"number\":"+(n+1)+",\"kind\":\""+(keysOnly||n%2==0?"key":"inbetween")+"\",\"sourceCell\":"+(cells[n]+1)+",\"x\":"+(n*96)+",\"y\":0,\"width\":96,\"height\":96,\"translation\":["+dxReg+","+dyReg+"],\"top\":"+first+",\"bottom\":87,\"colors\":"+colors.Count+",\"sha256\":\""+hash+"\"}");
    }
    sheet.Save(Path.Combine(folder,"walk.png"),ImageFormat.Png);contact.Save(Path.Combine(folder,"walk-contact-4x.png"),ImageFormat.Png);
    string json="{\"version\":"+(keysOnly?1:2)+",\"direction\":\""+direction+"\",\"frameCount\":"+count+",\"fps\":"+(keysOnly?6:12)+",\"anchor\":[48,88],\"sourceCell\":["+cw+","+ch+"],\"sharedCrop\":["+left+","+top+","+sw+","+sh+"],\"scale\":"+scale.ToString("R",System.Globalization.CultureInfo.InvariantCulture)+",\"frames\":["+String.Join(",",stats)+"]}";
    File.WriteAllText(Path.Combine(folder,"walk.json"),json);
   }
  }
 }
}
