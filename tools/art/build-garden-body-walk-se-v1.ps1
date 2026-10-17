$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$folder=Join-Path $taskRoot 'docs/art/pixel/garden-body-walk-se-v1'
$baseFolder=Join-Path $taskRoot 'docs/art/pixel/garden-body-base-v1'
$refs=@((Get-ChildItem (Join-Path $PSHOME 'ref/*.dll')).FullName)+@([Drawing.Bitmap].Assembly.Location)+@((Get-ChildItem (Join-Path $PSHOME 'System.Private.Windows.*.dll')).FullName)
Add-Type -ReferencedAssemblies $refs -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Collections.Generic;
public static class GardenWalkBase {
 static Color C(string h){return ColorTranslator.FromHtml(h);}
 static Color[] palette;
 static Bitmap New(){return new Bitmap(96,96);}
 static Color Snap(Color c){if(c.A<180)return Color.Transparent;int d=int.MaxValue;Color best=palette[0];foreach(Color p in palette){int r=p.R-c.R,g=p.G-c.G,b=p.B-c.B,k=r*r+g*g+b*b;if(k<d){d=k;best=p;}}return best;}
 static void Save(Bitmap b,string folder,string name){b.Save(Path.Combine(folder,name+".png"),ImageFormat.Png);}
 static void Over(Bitmap b,Bitmap a,int dx=0,int dy=0){for(int y=0;y<a.Height;y++)for(int x=0;x<a.Width;x++){int xx=x+dx,yy=y+dy;if(xx<0||xx>=b.Width||yy<0||yy>=b.Height)continue;Color c=a.GetPixel(x,y);if(c.A>0)b.SetPixel(xx,yy,c);}}
 static double Gap(double x,double y,double ax,double ay,double bx,double by,double ra,double rb){double vx=bx-ax,vy=by-ay;double f=Math.Max(0,Math.Min(1,((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy+.0001)));return Math.Sqrt(Math.Pow(x-ax-f*vx,2)+Math.Pow(y-ay-f*vy,2))-(ra+(rb-ra)*f);}
 static void Limb(Bitmap b,double[] p,double r0,double r1,double r2,bool far){
  bool[,] mask=new bool[96,96];
  for(int y=52;y<94;y++)for(int x=30;x<74;x++)mask[x,y]=Math.Min(Gap(x,y,p[0],p[1],p[2],p[3],r0,r1),Gap(x,y,p[2],p[3],p[4],p[5],r1,r2))<=0;
  for(int y=52;y<94;y++)for(int x=30;x<74;x++)if(mask[x,y]){
   bool edge=!mask[x-1,y]||!mask[x+1,y]||!mask[x,y-1]||!mask[x,y+1];
   Color c=edge?C(far?"#765263":"#50334c"):x<p[2]-1?C("#f6c4aa"):C("#ffddbf");
   if(!edge&&!far&&x>p[2]+1)c=C("#fff0d8");b.SetPixel(x,y,c);
  }
 }
 static void Sleeve(Bitmap b,double x,double y,double ex,double ey){for(int yy=53;yy<65;yy++)for(int xx=37;xx<70;xx++){double d=Gap(xx,yy,x,y,ex,ey,3.1,3);if(d<=0)b.SetPixel(xx,yy,d>-.9?C("#777188"):xx<x?C("#9994a5"):C("#c1bdc9"));}}
 static Bitmap Arm(int side,int n,int shift,int bob){
  var b=New();double sx=(side==0?45:60)+shift,sy=58+bob;double[][] wrists={new double[]{48,65,64,68},new double[]{44,66,62,66},new double[]{40,68,59,65},new double[]{43,66,61,66}};
  double wx=wrists[n][side*2],wy=wrists[n][side*2+1]+bob,ex=sx+(side==0?-3:3),ey=63+bob;
  Limb(b,new double[]{sx,sy,ex,ey,wx,wy},2.8,2.7,2.6,false);Sleeve(b,sx,sy,sx+(ex-sx)*.4,sy+2);
  return b;
 }
 static Bitmap Boot(Bitmap idle,int footX,int footY,bool far){var b=New();for(int y=0;y<7;y++)for(int x=0;x<12;x++){Color c=idle.GetPixel(51+x,83+y);if(c.A==0)continue;if(far){if(c.ToArgb()==C("#c1bdc9").ToArgb())c=C("#9994a5");else if(c.ToArgb()==C("#9994a5").ToArgb())c=C("#777188");}b.SetPixel(footX-6+x,footY-6+y,c);}return b;}
 static Bitmap Enlarge(Bitmap b,int k){var o=new Bitmap(b.Width*k,b.Height*k);for(int y=0;y<o.Height;y++)for(int x=0;x<o.Width;x++)o.SetPixel(x,y,b.GetPixel(x/k,y/k));return o;}
 public static void Build(string folder,string baseFolder,Color[] colors){palette=colors;
  using(var raw=new Bitmap(Path.Combine(folder,"source-cycle-candidate.png")))
  using(var head=new Bitmap(Path.Combine(baseFolder,"base-head.png")))
  using(var idle=new Bitmap(Path.Combine(baseFolder,"base-idle-se.png")))
  using(var torso=New())using(var sheet=new Bitmap(384,96))using(var bodies=new Bitmap(384,96))using(var heads=new Bitmap(384,96))using(var grid=new Bitmap(192,192)){
   // The first generated pose supplies only the unoccluded central romper. New limbs are drawn in source pixels.
   double scale=.16;double sourceX=raw.Width*.5*.605,sourceY=raw.Height*.5*.55;
   for(int y=54;y<=74;y++)for(int x=43;x<=61;x++){
    int edgeL=y<58?47:y<62?44: y<68?46:44, edgeR=y<58?57:y<62?60: y<68?59:61;if(x<edgeL||x>edgeR)continue;
    int sx=(int)Math.Round(sourceX+(x-52)/scale),sy=(int)Math.Round(sourceY+(y-54)/scale);Color c=Snap(raw.GetPixel(sx,sy));
    if(c.A==0||y>56&&c.R>c.G+20)c=C(x<48?"#9994a5":"#c1bdc9");
    torso.SetPixel(x,y,c);
   }
   // Restore a one-pixel contour after cropping, with two separate shorts openings.
   for(int x=43;x<=61;x++)if(x<46||x>59||x==51||x==52||x==53)torso.SetPixel(x,74,Color.Transparent);
   torso.SetPixel(52,72,C("#777188"));torso.SetPixel(52,73,C("#765263"));
   for(int y=57;y<=74;y++)for(int x=43;x<=61;x++)if(torso.GetPixel(x,y).A>0&&(torso.GetPixel(x-1,y).A==0||torso.GetPixel(x+1,y).A==0||torso.GetPixel(x,y+1).A==0))torso.SetPixel(x,y,C("#765263"));
   // One anatomical track per leg. Foot soles move back by (4,2) during stance in a camera following the body.
   double[][] right={new double[]{47,73,48,79,49,81},new double[]{47,72,51,76,53,77},new double[]{48,73,52,80,57,85},new double[]{48,72,50,79,53,83}};
   double[][] left={new double[]{55,73,58,80,60,85},new double[]{55,72,55,79,56,83},new double[]{56,73,54,79,52,81},new double[]{56,72,59,76,56,77}};
   int[,] soles={{49,86,60,90},{53,82,56,88},{57,90,52,86},{53,88,56,82}};
   var allFrames=new List<Bitmap>();var stats=new List<string>();
   for(int n=0;n<4;n++){
    int shift=n>=2?1:0,bob=n%2==1?-1:0;
    using(var r=New())using(var l=New())using(var torsoLayer=New())using(var headLayer=New())
    using(var ar=Arm(0,n,shift,bob))using(var al=Arm(1,n,shift,bob))using(var body=New()){
     Limb(r,right[n],4,3.4,3,false);Limb(l,left[n],4,3.4,3,false);
     using(var shoe=Boot(idle,soles[n,0],soles[n,1],n<2))Over(r,shoe);
     using(var shoe=Boot(idle,soles[n,2],soles[n,3],n>=2))Over(l,shoe);
     Over(torsoLayer,torso,shift,bob);Over(headLayer,head,shift,bob);
     // Back arm → far leg → near leg → romper → counter-swinging front arm → head.
     bool leftLeads=n<2;Over(body,leftLeads?al:ar);Over(body,leftLeads?r:l);Over(body,leftLeads?l:r);Over(body,torsoLayer);Over(body,leftLeads?ar:al);
     var full=New();Over(full,body);Over(full,headLayer);allFrames.Add(full);
     Save(body,folder,"body-"+(n+1));Save(headLayer,folder,"head-"+(n+1));Save(r,folder,"right-leg-"+(n+1));Save(l,folder,"left-leg-"+(n+1));Save(ar,folder,"right-arm-"+(n+1));Save(al,folder,"left-arm-"+(n+1));Save(torsoLayer,folder,"torso-"+(n+1));Save(full,folder,"frame-"+(n+1));
     Over(sheet,full,n*96,0);Over(bodies,body,n*96,0);Over(heads,headLayer,n*96,0);Over(grid,full,(n%2)*96,(n/2)*96);
     var used=new HashSet<int>();for(int yy=0;yy<96;yy++)for(int xx=0;xx<96;xx++){Color c=full.GetPixel(xx,yy);if(c.A>0){if(c.A!=255)throw new Exception("Partial alpha");used.Add(c.ToArgb());}}if(used.Count>32)throw new Exception("Palette overflow");
     stats.Add("{\"number\":"+(n+1)+",\"headOffset\":["+shift+","+bob+"],\"rightSole\":["+soles[n,0]+","+soles[n,1]+"],\"leftSole\":["+soles[n,2]+","+soles[n,3]+"],\"colors\":"+used.Count+"}");
    }
   }
   int contacts=0,passing=0,upper=0;for(int y=54;y<96;y++)for(int x=0;x<96;x++){if(allFrames[0].GetPixel(x,y)!=allFrames[2].GetPixel(x,y)){contacts++;if(y<74)upper++;}if(allFrames[1].GetPixel(x,y)!=allFrames[3].GetPixel(x,y))passing++;}
   if(contacts<70||passing<70||upper<20)throw new Exception("Duplicated motion poses");
   int previewMismatch=0;for(int n=0;n<4;n++)for(int y=0;y<96;y++)for(int x=0;x<96;x++)if(sheet.GetPixel(n*96+x,y)!=grid.GetPixel(n%2*96+x,n/2*96+y))previewMismatch++;
   if(previewMismatch!=0)throw new Exception("Sheet/preview mismatch");
   Save(sheet,folder,"walk");Save(bodies,folder,"body-walk");Save(heads,folder,"head-walk");using(var big=Enlarge(grid,4))Save(big,folder,"walk-preview-2x2");using(var big=Enlarge(sheet,4))Save(big,folder,"walk-contact-4x");
   File.WriteAllText(Path.Combine(folder,"build.json"),"{\"stage\":\"body-walk-draft-awaiting-user-review\",\"size\":[96,96],\"frameCount\":4,\"fps\":6,\"anchor\":[48,91],\"frames\":["+string.Join(",",stats)+"],\"contactDifferentPixels\":"+contacts+",\"passingDifferentPixels\":"+passing+",\"upperBodyDifferentPixels\":"+upper+",\"runtimeConnected\":false,\"sourceCandidateLegsUsed\":false}");
   foreach(var f in allFrames)f.Dispose();Console.WriteLine("4 full frames packed; opposite contact diff="+contacts+", passing diff="+passing+", upper body diff="+upper);
  }
 }
}
'@
$colors=[Drawing.Color[]]@((Get-Content -LiteralPath (Join-Path $baseFolder 'palette.json') -Raw | ConvertFrom-Json)|ForEach-Object{[Drawing.ColorTranslator]::FromHtml($_)})
[GardenWalkBase]::Build($folder,$baseFolder,$colors)
