using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.IO;
public static class ScarletHatReplacement {
 public static void Save(string edited,string oldSource,string previous,string output,Color[] palette,double scale,int[] crop,int[] dx,int[] dy) {
  const int capBottom=30;
  using(Bitmap input=new Bitmap(edited))using(Bitmap original=new Bitmap(oldSource)) {
   if(input.Size!=original.Size)throw new Exception("Source registration changed");
   int cw=input.Width/2,ch=input.Height/2,dw=(int)Math.Round(crop[2]*scale),dh=(int)Math.Round(crop[3]*scale),px=(96-dw)/2,py=88-dh;
   using(Bitmap combined=new Bitmap(input.Width,input.Height)) {
    for(int n=0;n<4;n++)for(int y=0;y<ch;y++)for(int x=0;x<cw;x++){
     int sx=n%2*cw+x,sy=n/2*ch+y;bool cap=py+(y-crop[1])*scale+dy[n]<=capBottom;
     combined.SetPixel(sx,sy,(cap?input:original).GetPixel(sx,sy));
    }
    combined.Save(Path.Combine(output,"source-keys.png"),ImageFormat.Png);
   }
   using(Bitmap sheet=new Bitmap(384,96))using(Bitmap preview=new Bitmap(768,768))using(Bitmap contact=new Bitmap(1536,384)) {
    for(int n=0;n<4;n++)using(Bitmap old=new Bitmap(Path.Combine(previous,"frame-"+(n+1)+".png")))using(Bitmap frame=new Bitmap(old)) {
     for(int y=0;y<=capBottom;y++)for(int x=0;x<96;x++) {
      int sx=crop[0]+(int)Math.Floor((x-px-dx[n]+.5)/scale),sy=crop[1]+(int)Math.Floor((y-py-dy[n]+.5)/scale);Color best=Color.FromArgb(0,0,0,0);
      if(sx>=0&&sx<cw&&sy>=0&&sy<ch){Color c=input.GetPixel(n%2*cw+sx,n/2*ch+sy);if(c.A>=180){int distance=int.MaxValue;foreach(Color p in palette){int dr=c.R-p.R,dg=c.G-p.G,db=c.B-p.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}}}
      frame.SetPixel(x,y,best);
     }
     int changedCap=0,changedBody=0;var colors=new HashSet<int>();
     for(int y=0;y<96;y++)for(int x=0;x<96;x++) {
      Color c=frame.GetPixel(x,y);if(c.A!=0){if(c.A!=255)throw new Exception("Invalid alpha");colors.Add(c.ToArgb());}
      bool different=c.ToArgb()!=old.GetPixel(x,y).ToArgb();if(different){if(y<=capBottom)changedCap++;else changedBody++;}
      sheet.SetPixel(n*96+x,y,c);for(int yy=0;yy<4;yy++)for(int xx=0;xx<4;xx++){preview.SetPixel((n%2*96+x)*4+xx,(n/2*96+y)*4+yy,c);contact.SetPixel((n*96+x)*4+xx,y*4+yy,c);}
     }
     if(changedCap==0||changedBody!=0||colors.Count>32)throw new Exception("Hat-only replacement contract failed");
     frame.Save(Path.Combine(output,"frame-"+(n+1)+".png"),ImageFormat.Png);
     System.Console.WriteLine("Frame "+(n+1)+": cap changes="+changedCap+", body changes="+changedBody+", colors="+colors.Count);
    }
    sheet.Save(Path.Combine(output,"walk.png"),ImageFormat.Png);preview.Save(Path.Combine(output,"walk-preview-2x2.png"),ImageFormat.Png);contact.Save(Path.Combine(output,"walk-contact-4x.png"),ImageFormat.Png);
   }
  }
 }
}
