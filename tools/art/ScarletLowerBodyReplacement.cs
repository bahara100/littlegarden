using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Collections.Generic;
public static class ScarletLowerBodyReplacement {
 static bool Inside(int[] polygon,int x,int y) {
  if(polygon==null)return true;
  bool inside=false;int count=polygon.Length/2;
  for(int i=0,j=count-1;i<count;j=i++) {
   int xi=polygon[2*i],yi=polygon[2*i+1],xj=polygon[2*j],yj=polygon[2*j+1];
   if((yi>y)!=(yj>y)&&x<(double)(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
 }
 public static void Save(string editPath,string previousSource,string previousFolder,string output,Color[] palette,double scale,int[] crop,int[] dx,int[] dy,int[] editedCells=null,int firstChangedRow=50,int[][] sourceMasks=null) {
  var selected=editedCells==null?new HashSet<int>(new int[]{0,1,2,3}):new HashSet<int>(editedCells);
  using(var input=new Bitmap(editPath))using(var previous=new Bitmap(previousSource)) {
   if(input.Size!=previous.Size)throw new Exception("Source grids must match");
   int cw=input.Width/2,ch=input.Height/2,dw=(int)Math.Round(crop[2]*scale),dh=(int)Math.Round(crop[3]*scale),px=(96-dw)/2,py=88-dh;
   using(var reference=new Bitmap(input.Width,input.Height)) {
    for(int n=0;n<4;n++)for(int y=0;y<ch;y++)for(int x=0;x<cw;x++) {
     bool changed=selected.Contains(n)&&py+(y-crop[1])*scale+dy[n]>=firstChangedRow&&Inside(sourceMasks==null?null:sourceMasks[n],x,y);
     reference.SetPixel(n%2*cw+x,n/2*ch+y,(changed?input:previous).GetPixel(n%2*cw+x,n/2*ch+y));
    }
    reference.Save(Path.Combine(output,"source-keys.png"),ImageFormat.Png);
   }
   using(var sheet=new Bitmap(384,96))using(var preview=new Bitmap(768,768))using(var contact=new Bitmap(1536,384)) {
    for(int n=0;n<4;n++)using(var old=new Bitmap(Path.Combine(previousFolder,"frame-"+(n+1)+".png")))using(var frame=new Bitmap(old)) {
     if(selected.Contains(n))for(int y=firstChangedRow;y<96;y++)for(int x=0;x<96;x++) {
      int sx=crop[0]+(int)Math.Floor((x-px-dx[n]+.5)/scale),sy=crop[1]+(int)Math.Floor((y-py-dy[n]+.5)/scale);
      if(!Inside(sourceMasks==null?null:sourceMasks[n],sx,sy))continue;
      Color best=Color.FromArgb(0,0,0,0);
      if(sx>=0&&sx<cw&&sy>=0&&sy<ch){Color c=input.GetPixel(n%2*cw+sx,n/2*ch+sy);if(c.A>=180){int distance=int.MaxValue;foreach(Color p in palette){int dr=c.R-p.R,dg=c.G-p.G,db=c.B-p.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}}}
      frame.SetPixel(x,y,best);
     }
     int changed=0;var colors=new HashSet<int>();
     for(int y=0;y<96;y++)for(int x=0;x<96;x++) {
      Color c=frame.GetPixel(x,y);if(c.A!=0){if(c.A!=255)throw new Exception("Invalid alpha");colors.Add(c.ToArgb());}
      if(c.ToArgb()!=old.GetPixel(x,y).ToArgb()){if(y<firstChangedRow)throw new Exception("Upper body changed");changed++;}
      sheet.SetPixel(n*96+x,y,c);
      for(int yy=0;yy<4;yy++)for(int xx=0;xx<4;xx++){preview.SetPixel((n%2*96+x)*4+xx,(n/2*96+y)*4+yy,c);contact.SetPixel((n*96+x)*4+xx,y*4+yy,c);}
     }
     if(colors.Count>32)throw new Exception("Palette exceeded");
     if(selected.Contains(n))frame.Save(Path.Combine(output,"frame-"+(n+1)+".png"),ImageFormat.Png);
     else File.Copy(Path.Combine(previousFolder,"frame-"+(n+1)+".png"),Path.Combine(output,"frame-"+(n+1)+".png"),true);
     Console.WriteLine("Frame "+(n+1)+": upper changes=0, lower changes="+changed+", colors="+colors.Count);
    }
    sheet.Save(Path.Combine(output,"walk.png"),ImageFormat.Png);preview.Save(Path.Combine(output,"walk-preview-2x2.png"),ImageFormat.Png);contact.Save(Path.Combine(output,"walk-contact-4x.png"),ImageFormat.Png);
   }
  }
 }
}
