using System;
using System.Drawing;
using System.Collections.Generic;
public static class ScarletRigCutout {
 public static Bitmap Export(Bitmap src,Rectangle rect,int width,int height,Color[] palette){
  int count=rect.Width*rect.Height;bool[] solid=new bool[count],seen=new bool[count];
  for(int y=0;y<rect.Height;y++)for(int x=0;x<rect.Width;x++)solid[y*rect.Width+x]=src.GetPixel(rect.X+x,rect.Y+y).A>=180;
  List<int> largest=new List<int>();Queue<int> queue=new Queue<int>();
  for(int start=0;start<count;start++)if(solid[start]&&!seen[start]){
   List<int> component=new List<int>();queue.Enqueue(start);seen[start]=true;
   while(queue.Count>0){int i=queue.Dequeue();component.Add(i);int x=i%rect.Width,y=i/rect.Width;
    for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){int nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=rect.Width||ny>=rect.Height)continue;int ni=ny*rect.Width+nx;if(solid[ni]&&!seen[ni]){seen[ni]=true;queue.Enqueue(ni);}}
   }if(component.Count>largest.Count)largest=component;
  }
  if(largest.Count<20)throw new Exception("Empty part");
  bool[] keep=new bool[count];int left=rect.Width,right=0,top=rect.Height,bottom=0;
  foreach(int i in largest){keep[i]=true;int x=i%rect.Width,y=i/rect.Width;left=Math.Min(left,x);right=Math.Max(right,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y);}
  Bitmap output=new Bitmap(width,height);
  for(int y=0;y<height;y++)for(int x=0;x<width;x++){
   int sx=Math.Min(right,left+(int)((x+.5)*(right-left+1)/width));int sy=Math.Min(bottom,top+(int)((y+.5)*(bottom-top+1)/height));
   if(!keep[sy*rect.Width+sx])continue;Color c=src.GetPixel(rect.X+sx,rect.Y+sy);Color best=palette[0];int distance=int.MaxValue;
   foreach(Color p in palette){int dr=p.R-c.R,dg=p.G-c.G,db=p.B-c.B,d=dr*dr+dg*dg+db*db;if(d<distance){distance=d;best=p;}}
   output.SetPixel(x,y,best);
  }
  // Reinforce the outer side contour lost during the tiny nearest-neighbour reduction.
  // Keep open joint ends on leg segments so overlapping pieces do not acquire dark caps.
  if(width<=10){bool[] edge=new bool[width*height];for(int y=0;y<height;y++)for(int x=0;x<width;x++){
   if(output.GetPixel(x,y).A==0)continue;
   edge[y*width+x]=x==0||x==width-1||output.GetPixel(x-1,y).A==0||output.GetPixel(x+1,y).A==0;
  }for(int y=0;y<height;y++)for(int x=0;x<width;x++)if(edge[y*width+x])output.SetPixel(x,y,palette[0]);}
  return output;
 }
}
