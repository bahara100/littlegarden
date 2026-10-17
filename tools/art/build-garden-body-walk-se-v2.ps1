$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$folder=Join-Path $taskRoot 'docs/art/pixel/garden-body-walk-se-v2'
$compileRefs=@((Get-ChildItem (Join-Path $PSHOME 'ref/*.dll')).FullName)+@([Drawing.Bitmap].Assembly.Location)+@((Get-ChildItem (Join-Path $PSHOME 'System.Private.Windows.*.dll')).FullName)
Add-Type -ReferencedAssemblies $compileRefs -TypeDefinition @'
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Linq;
public static class GardenWholeWalkV2 {
 class Pose {public Bitmap source;public Rectangle cell;public int l,t,r,b,headWidth;public double headX,scale;}
 static Bitmap New(){return new Bitmap(96,96);}
 static void Inspect(Pose p){p.l=p.cell.Width;p.t=p.cell.Height;p.r=p.b=-1;
  for(int y=0;y<p.cell.Height;y++)for(int x=0;x<p.cell.Width;x++)if(p.source.GetPixel(p.cell.X+x,p.cell.Y+y).A>=180){p.l=Math.Min(p.l,x);p.r=Math.Max(p.r,x);p.t=Math.Min(p.t,y);p.b=Math.Max(p.b,y);}
  if(p.b<0)throw new Exception("Empty source");
  int best=0;double center=0;for(int y=p.t;y<p.t+(p.b-p.t)*.52;y++){int lo=p.cell.Width,hi=-1;for(int x=p.l;x<=p.r;x++)if(p.source.GetPixel(p.cell.X+x,p.cell.Y+y).A>=180){lo=Math.Min(lo,x);hi=Math.Max(hi,x);}if(hi-lo+1>best){best=hi-lo+1;center=(lo+hi)/2.0;}}
  p.headWidth=best;p.headX=center;
 }
 static Bitmap Convert(Pose p,int n){var frame=New();int bob=n%2==1?-1:0;for(int y=0;y<96;y++)for(int x=0;x<96;x++){
  int sx=(int)Math.Floor(p.headX+(x-48+.5)/p.scale),sy=(int)Math.Floor(p.b+(y-(90+bob)+.5)/p.scale);
  if(sx<0||sy<0||sx>=p.cell.Width||sy>=p.cell.Height)continue;Color c=p.source.GetPixel(p.cell.X+sx,p.cell.Y+sy);if(c.A>=180)frame.SetPixel(x,y,Color.FromArgb(255,c.R,c.G,c.B));
 }return frame;}
 static int Range(List<Color> box,int channel){return box.Max(c=>channel==0?c.R:channel==1?c.G:c.B)-box.Min(c=>channel==0?c.R:channel==1?c.G:c.B);}
 static Color[] Palette(List<Bitmap> frames){var samples=new List<Color>();foreach(var f in frames)for(int y=0;y<96;y++)for(int x=0;x<96;x++){Color c=f.GetPixel(x,y);if(c.A>0)samples.Add(c);}
  var boxes=new List<List<Color>>{samples};while(boxes.Count<32){int which=-1,axis=0;double score=-1;for(int i=0;i<boxes.Count;i++){if(boxes[i].Count<2)continue;for(int k=0;k<3;k++){double s=Range(boxes[i],k)*Math.Sqrt(boxes[i].Count);if(s>score){score=s;which=i;axis=k;}}}if(which<0)break;
   var sorted=boxes[which].OrderBy(c=>axis==0?c.R:axis==1?c.G:c.B).ToList();int mid=sorted.Count/2;boxes[which]=sorted.Take(mid).ToList();boxes.Add(sorted.Skip(mid).ToList());
  }
  return boxes.Select(box=>Color.FromArgb(255,(int)box.Average(c=>c.R),(int)box.Average(c=>c.G),(int)box.Average(c=>c.B))).Distinct().ToArray();
 }
 static Color Snap(Color c,Color[] pal){Color best=pal[0];int score=int.MaxValue;foreach(Color p in pal){int r=c.R-p.R,g=c.G-p.G,b=c.B-p.B,d=r*r+g*g+b*b;if(d<score){score=d;best=p;}}return best;}
 static bool HeadToFeetConnected(Bitmap f){
  var seen=new bool[96,96];var queue=new Queue<Point>();bool seeded=false,torso=false,feet=false;
  for(int y=0;y<45&&!seeded;y++)for(int x=0;x<96&&!seeded;x++)if(f.GetPixel(x,y).A>0){queue.Enqueue(new Point(x,y));seen[x,y]=true;seeded=true;}
  while(queue.Count>0){Point p=queue.Dequeue();if(p.Y>=60&&p.Y<=75)torso=true;if(p.Y>=84)feet=true;for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){int x=p.X+dx,y=p.Y+dy;if(x<0||x>=96||y<0||y>=96||seen[x,y]||f.GetPixel(x,y).A==0)continue;seen[x,y]=true;queue.Enqueue(new Point(x,y));}}
  return torso&&feet;
 }
 static void Save(Bitmap b,string folder,string name){b.Save(Path.Combine(folder,name+".png"),ImageFormat.Png);}
 static Bitmap Big(Bitmap b,int scale){var result=new Bitmap(b.Width*scale,b.Height*scale);for(int y=0;y<result.Height;y++)for(int x=0;x<result.Width;x++)result.SetPixel(x,y,b.GetPixel(x/scale,y/scale));return result;}
 public static void Build(string root,string folder){
  using(var first=new Bitmap(Path.Combine(root,"docs/art/pixel/garden-body-walk-se-v1/source-cycle-candidate.png")))
  using(var opposite=new Bitmap(Path.Combine(root,"docs/art/pixel/garden-body-walk-se-v1/source-opposite-candidate.png")))
  using(var third=new Bitmap(Path.Combine(folder,"source-pose3.png")))
  using(var sheet=new Bitmap(384,96))using(var bodySheet=new Bitmap(384,96))using(var headSheet=new Bitmap(384,96))using(var grid=new Bitmap(192,192)){
   var poses=new[]{new Pose{source=first,cell=new Rectangle(0,0,first.Width/2,first.Height/2)},new Pose{source=first,cell=new Rectangle(first.Width/2,0,first.Width/2,first.Height/2)},new Pose{source=third,cell=new Rectangle(0,0,third.Width,third.Height)},new Pose{source=opposite,cell=new Rectangle(opposite.Width/2,0,opposite.Width/2,opposite.Height)}};
   foreach(var p in poses)Inspect(p);double pairScale=48.0/((poses[0].headWidth+poses[1].headWidth)/2.0);poses[0].scale=poses[1].scale=pairScale;poses[2].scale=48.0/poses[2].headWidth;poses[3].scale=48.0/poses[3].headWidth;
   var frames=poses.Select((p,n)=>Convert(p,n)).ToList();Color[] pal=Palette(frames);var info=new List<string>();
   for(int n=0;n<4;n++)using(var head=New())using(var body=New()){
    var f=frames[n];int top=96,bottom=-1;var colors=new HashSet<int>();
    for(int y=0;y<96;y++)for(int x=0;x<96;x++){Color c=f.GetPixel(x,y);if(c.A>0){c=Snap(c,pal);f.SetPixel(x,y,c);colors.Add(c.ToArgb());top=Math.Min(top,y);bottom=Math.Max(bottom,y);}(y<=53?head:body).SetPixel(x,y,c);sheet.SetPixel(n*96+x,y,c);bodySheet.SetPixel(n*96+x,y,body.GetPixel(x,y));headSheet.SetPixel(n*96+x,y,head.GetPixel(x,y));grid.SetPixel(n%2*96+x,n/2*96+y,c);}
    if(top<1||bottom>92||colors.Count>32)throw new Exception("Frame bounds or palette invalid");if(!HeadToFeetConnected(f))throw new Exception("Disconnected head/neck/body in frame "+(n+1));Save(f,folder,"frame-"+(n+1));Save(head,folder,"head-"+(n+1));Save(body,folder,"body-"+(n+1));
    info.Add("{\"number\":"+(n+1)+",\"scale\":"+poses[n].scale.ToString("R",System.Globalization.CultureInfo.InvariantCulture)+",\"headWidthSource\":"+poses[n].headWidth+",\"top\":"+top+",\"bottom\":"+bottom+",\"colors\":"+colors.Count+"}");
   }
   int mismatch=0;for(int n=0;n<4;n++)for(int y=0;y<96;y++)for(int x=0;x<96;x++)if(sheet.GetPixel(n*96+x,y)!=grid.GetPixel(n%2*96+x,n/2*96+y))mismatch++;
   if(mismatch>0)throw new Exception("Preview mismatch");Save(sheet,folder,"walk");Save(bodySheet,folder,"body-walk");Save(headSheet,folder,"head-walk");using(var big=Big(grid,4))Save(big,folder,"walk-preview-2x2");using(var big=Big(sheet,4))Save(big,folder,"walk-contact-4x");
   File.WriteAllText(Path.Combine(folder,"palette.json"),"["+string.Join(",",pal.Select(c=>"\"#"+c.R.ToString("x2")+c.G.ToString("x2")+c.B.ToString("x2")+"\""))+"]");
   File.WriteAllText(Path.Combine(folder,"walk.json"),"{\"version\":2,\"stage\":\"full-body-source-restored-awaiting-user-review\",\"frameCount\":4,\"fps\":6,\"frameSize\":[96,96],\"headSpliced\":false,\"proceduralLimbs\":false,\"headToFeetConnected\":true,\"previewMismatch\":"+mismatch+",\"frames\":["+string.Join(",",info)+"],\"runtimeConnected\":false}");
   foreach(var f in frames)f.Dispose();Console.WriteLine("V2: whole-body source preserved; 4 frames; shared "+pal.Length+" colors; sheet/preview mismatch "+mismatch);
  }
 }
}
'@
[GardenWholeWalkV2]::Build($taskRoot,$folder)
