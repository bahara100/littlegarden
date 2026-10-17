using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.IO;
public static class ScarletFrameReplacement {
 public static string Save(string edited,string previousSource,string previousFolder,string output,Color[] palette,double scale,int left,int top,int sw,int sh) {
  using(Bitmap input=new Bitmap(edited))using(Bitmap old=new Bitmap(previousSource)) {
   if(input.Size!=old.Size||input.Width%2!=0||input.Height%2!=0)throw new Exception("Matching 2x2 source grids required");
   int cw=input.Width/2,ch=input.Height/2;
   using(Bitmap source=new Bitmap(input.Width,input.Height)) {
    for(int n=0;n<4;n++)for(int y=0;y<ch;y++)for(int x=0;x<cw;x++){int sx=n%2*cw+x,sy=n/2*ch+y;source.SetPixel(sx,sy,(n==0?input:old).GetPixel(sx,sy));}
    source.Save(Path.Combine(output,"source-keys.png"),ImageFormat.Png);
   }
   // Use the previous sequence's single scale and sampling origin; do not fit this cel to its bounds.
   int dw=(int)Math.Round(sw*scale),dh=(int)Math.Round(sh*scale),px=(96-dw)/2,py=88-dh;
   using(Bitmap raw=new Bitmap(96,96))using(Bitmap frame=new Bitmap(96,96)) {
    int last=-1,hatLeft=96,hatRight=0;
    for(int y=0;y<96;y++)for(int x=0;x<96;x++) {
     int sx=left+(int)Math.Floor((x-px+.5)/scale),sy=top+(int)Math.Floor((y-py+.5)/scale);
     if(sx<0||sx>=cw||sy<0||sy>=ch)continue;Color c=input.GetPixel(sx,sy);if(c.A<180)continue;
     Color best=palette[0];int distance=int.MaxValue;
     foreach(Color p in palette){int dr=c.R-p.R,dg=c.G-p.G,db=c.B-p.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}
     raw.SetPixel(x,y,best);last=Math.Max(last,y);if(y<py+dh*.32){hatLeft=Math.Min(hatLeft,x);hatRight=Math.Max(hatRight,x);}
    }
    int dx=48-(int)Math.Round((hatLeft+hatRight)/2.0),dy=87-last,first=96;var colors=new HashSet<int>();
    for(int y=0;y<96;y++)for(int x=0;x<96;x++){Color c=raw.GetPixel(x,y);if(c.A==0)continue;int tx=x+dx,ty=y+dy;if(tx<0||tx>=96||ty<0||ty>=88)throw new Exception("Cel clipped");frame.SetPixel(tx,ty,c);colors.Add(c.ToArgb());first=Math.Min(first,ty);}
    if(colors.Count>32||first==96)throw new Exception("Frame contract failed");frame.Save(Path.Combine(output,"frame-1.png"),ImageFormat.Png);
    for(int n=2;n<=4;n++)File.Copy(Path.Combine(previousFolder,"frame-"+n+".png"),Path.Combine(output,"frame-"+n+".png"),true);
    using(Bitmap sheet=new Bitmap(384,96))using(Bitmap contact=new Bitmap(1536,384))using(Bitmap preview=new Bitmap(768,768)) {
     for(int n=0;n<4;n++)using(Bitmap cell=new Bitmap(Path.Combine(output,"frame-"+(n+1)+".png")))for(int y=0;y<96;y++)for(int x=0;x<96;x++){Color c=cell.GetPixel(x,y);sheet.SetPixel(n*96+x,y,c);for(int yy=0;yy<4;yy++)for(int xx=0;xx<4;xx++){contact.SetPixel((n*96+x)*4+xx,y*4+yy,c);preview.SetPixel((n%2*96+x)*4+xx,(n/2*96+y)*4+yy,c);}}
     sheet.Save(Path.Combine(output,"walk.png"),ImageFormat.Png);contact.Save(Path.Combine(output,"walk-contact-4x.png"),ImageFormat.Png);preview.Save(Path.Combine(output,"walk-preview-2x2.png"),ImageFormat.Png);
    }
    return "{\"number\":1,\"kind\":\"key\",\"sourceCell\":1,\"x\":0,\"y\":0,\"width\":96,\"height\":96,\"translation\":["+dx+","+dy+"],\"top\":"+first+",\"bottom\":87,\"colors\":"+colors.Count+"}";
   }
  }
 }
}
