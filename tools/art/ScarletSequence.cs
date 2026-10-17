using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.IO;
public static class ScarletSequence {
 public static void Export(string source,string folder,Color[] palette) {
  using(Bitmap input=new Bitmap(source)) {
   int cw=input.Width/2,ch=input.Height/2;var masks=new List<bool[]>();
   int left=cw,top=ch,right=0,bottom=0;
   for(int n=0;n<4;n++) {
    bool[] solid=new bool[cw*ch],seen=new bool[cw*ch];int ox=(n%2)*cw,oy=(n/2)*ch;
    for(int y=0;y<ch;y++)for(int x=0;x<cw;x++)solid[y*cw+x]=input.GetPixel(ox+x,oy+y).A>=180;
    List<int> largest=new List<int>();Queue<int> q=new Queue<int>();
    for(int start=0;start<solid.Length;start++)if(solid[start]&&!seen[start]){
     List<int> component=new List<int>();q.Enqueue(start);seen[start]=true;
     while(q.Count>0){int i=q.Dequeue();component.Add(i);int x=i%cw,y=i/cw;
      for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){int nx=x+dx,ny=y+dy;if(nx<0||nx>=cw||ny<0||ny>=ch)continue;int ni=ny*cw+nx;if(solid[ni]&&!seen[ni]){seen[ni]=true;q.Enqueue(ni);}}
     }if(component.Count>largest.Count)largest=component;
    }
    if(largest.Count<100)throw new Exception("Missing complete frame");bool[] mask=new bool[cw*ch];
    foreach(int i in largest){mask[i]=true;int x=i%cw,y=i/cw;left=Math.Min(left,x);right=Math.Max(right,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y);}masks.Add(mask);
   }
   int sw=right-left+1,sh=bottom-top+1;double scale=Math.Min(78.0/sw,82.0/sh);
   int dw=(int)Math.Round(sw*scale),dh=(int)Math.Round(sh*scale),px=(96-dw)/2,py=88-dh;
   using(Bitmap sheet=new Bitmap(384,96))using(Bitmap large=new Bitmap(1536,384)){
    List<string> stats=new List<string>();
    for(int n=0;n<4;n++)using(Bitmap frame=new Bitmap(96,96)){
     var colors=new HashSet<int>();int last=-1,first=96;
     for(int y=0;y<dh;y++)for(int x=0;x<dw;x++){
      int sx=Math.Min(right,left+(int)((x+.5)/scale)),sy=Math.Min(bottom,top+(int)((y+.5)/scale));
      if(!masks[n][sy*cw+sx])continue;
      Color c=input.GetPixel((n%2)*cw+sx,(n/2)*ch+sy),best=palette[0];int distance=int.MaxValue;
      foreach(Color p in palette){int dr=c.R-p.R,dg=c.G-p.G,db=c.B-p.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}
      frame.SetPixel(px+x,py+y,best);colors.Add(best.ToArgb());first=Math.Min(first,py+y);last=Math.Max(last,py+y);
     }
     if(colors.Count>32||last>87||first<0)throw new Exception("Frame contract failed");
     frame.Save(Path.Combine(folder,"frame-"+(n+1)+".png"),ImageFormat.Png);
     for(int y=0;y<96;y++)for(int x=0;x<96;x++){Color c=frame.GetPixel(x,y);sheet.SetPixel(n*96+x,y,c);for(int yy=0;yy<4;yy++)for(int xx=0;xx<4;xx++)large.SetPixel((n*96+x)*4+xx,y*4+yy,c);}
     stats.Add("{\"number\":"+(n+1)+",\"x\":"+(n*96)+",\"y\":0,\"width\":96,\"height\":96,\"colors\":"+colors.Count+",\"top\":"+first+",\"bottom\":"+last+"}");
    }
    sheet.Save(Path.Combine(folder,"walk-keyframes.png"),ImageFormat.Png);large.Save(Path.Combine(folder,"walk-keyframes-4x.png"),ImageFormat.Png);
    string json="{\"version\":1,\"direction\":\"se\",\"width\":96,\"height\":96,\"anchor\":[48,88],\"sourceCell\":["+cw+","+ch+"],\"sharedCrop\":["+left+","+top+","+sw+","+sh+"],\"scale\":"+scale.ToString("R",System.Globalization.CultureInfo.InvariantCulture)+",\"destination\":["+px+","+py+","+dw+","+dh+"],\"frames\":["+String.Join(",",stats)+"]}";
    File.WriteAllText(Path.Combine(folder,"walk-keyframes.json"),json);
   }
  }
 }
}
