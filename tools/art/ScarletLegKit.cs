using System;
using System.Drawing;
using System.Collections.Generic;
// One drawing rule for every NW leg so all four cels share a construction: a stocking tube with a 1px outline,
// a two-row gold ankle band and a black shoe. The character's own right leg is a plain white stocking; the left
// leg carries the black cross ribbon. Colours are the existing Scarlet palette entries only.
public static class ScarletLegKit {
 public static readonly Color Ink=ColorTranslator.FromHtml("#302f3b"),Ink2=ColorTranslator.FromHtml("#53515b"),
  White=ColorTranslator.FromHtml("#f0e9f1"),Shade=ColorTranslator.FromHtml("#ded2e7"),Shade2=ColorTranslator.FromHtml("#b5abb9"),
  GoldHi=ColorTranslator.FromHtml("#f2d075"),Gold=ColorTranslator.FromHtml("#d5a349"),GoldLo=ColorTranslator.FromHtml("#ab763c"),
  Sole=ColorTranslator.FromHtml("#d7c6bb");
 public enum Shoe { Planted, HeelUp }
 public class Leg { public bool Ribbon; public int TopX,TopY,AnkleX,AnkleY; public Shoe Shoe; }
 static void Put(Color?[,] c,int x,int y,Color v){if(x>=0&&y>=0&&x<96&&y<96)c[x,y]=v;}
 public static void Draw(Color?[,] canvas,Leg leg) {
  // Shaft: interior 6px (x-2..+3), right edge shaded, outline both sides. The ribbon is a sparse X lacing:
  // two 1px diagonals crossing every 6 rows, leaving white diamonds between them.
  for(int y=leg.TopY;y<=leg.AnkleY;y++) {
   double t=leg.AnkleY==leg.TopY?1:(double)(y-leg.TopY)/(leg.AnkleY-leg.TopY);
   int cx=(int)Math.Round(leg.TopX+(leg.AnkleX-leg.TopX)*t);
   Put(canvas,cx-3,y,Ink);Put(canvas,cx+4,y,Ink);
   for(int dx=-2;dx<=3;dx++) {
    Color v=dx==3?Shade2:dx==2?Shade:White;
    if(leg.Ribbon){int r=y-leg.AnkleY,a=((dx+r)%6+6)%6,b=((dx-r)%6+6)%6;if(a==0||b==0)v=Ink;}
    Put(canvas,cx+dx,y,v);
   }
  }
  int ax=leg.AnkleX,ay=leg.AnkleY;
  // Ankle band (8px, matching the shaft), highlight on the lit left side.
  Color[] b1={Ink,GoldHi,GoldHi,Gold,Gold,Gold,GoldLo,Ink},b2={Ink,Gold,Gold,Gold,Gold,GoldLo,GoldLo,Ink};
  for(int i=0;i<8;i++){Put(canvas,ax-3+i,ay+1,b1[i]);Put(canvas,ax-3+i,ay+2,b2[i]);}
  int sy=ay+3;
  // Shoe spans x-5..+6 at its widest; the white top is the opening seen from behind.
  if(leg.Shoe==Shoe.Planted) {
   for(int dx=-3;dx<=4;dx++)Put(canvas,ax+dx,sy,dx==-3||dx==4?Ink:White);
   for(int dx=-4;dx<=5;dx++)Put(canvas,ax+dx,sy+1,dx<=-3||dx>=4?Ink:White);
   for(int r=2;r<=4;r++)for(int dx=-5;dx<=6;dx++)Put(canvas,ax+dx,sy+r,Ink);
   Put(canvas,ax-4,sy+2,Ink2);Put(canvas,ax-3,sy+2,Ink2);
   for(int dx=-4;dx<=5;dx++)Put(canvas,ax+dx,sy+5,Ink);
  } else {
   // Heel lifted toward the viewer: the light sole shows under the shoe.
   for(int dx=-3;dx<=4;dx++)Put(canvas,ax+dx,sy,dx==-3||dx==4?Ink:White);
   for(int r=1;r<=2;r++)for(int dx=-4;dx<=5;dx++)Put(canvas,ax+dx,sy+r,Ink);
   Put(canvas,ax-3,sy+1,Ink2);
   for(int dx=-3;dx<=4;dx++)Put(canvas,ax+dx,sy+3,dx==-3||dx==4?Ink:Sole);
   for(int dx=-2;dx<=3;dx++)Put(canvas,ax+dx,sy+4,Ink);
  }
 }
}
