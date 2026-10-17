"""Reproducible RGBA facial texture for the v3 SD mesh (no reference-image baking)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math

S=3
im=Image.new('RGBA',(1024*S,768*S))
def scale(points): return [(int(x*S),int(y*S)) for x,y in points]
def cubic(a,b,c,d,n=32):
    return [((1-t)**3*a[0]+3*(1-t)**2*t*b[0]+3*(1-t)*t*t*c[0]+t**3*d[0],(1-t)**3*a[1]+3*(1-t)**2*t*b[1]+3*(1-t)*t*t*c[1]+t**3*d[1]) for t in [i/n for i in range(n+1)]]
def stroke(points,color,width): ImageDraw.Draw(im).line(scale(points),fill=color,width=int(width*S),joint='curve')
def ellipse(target,rect,color): ImageDraw.Draw(target).ellipse(tuple(int(x*S) for x in rect),fill=color)
for side in [-1,1]:
    cx,cy=512+side*202,352
    upper=cubic((-110,-6),(-66,-85),(61,-82),(112,-12))
    lower=cubic((112,-12),(82,77),(-63,82),(-110,-6))
    points=[(cx+x,cy+y) for x,y in upper+lower]
    mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon(scale(points),fill=255)
    eye=Image.new('RGBA',im.size,(255,249,247,255))
    iris=Image.new('RGBA',im.size)
    ellipse(iris,(cx-66,cy-82,cx+66,cy+84),'#c6954e')
    iris_mask=iris.getchannel('A')
    gradient=Image.new('RGBA',im.size)
    gd=ImageDraw.Draw(gradient)
    stops=[(0,(79,50,75)),(.45,(166,115,55)),(1,(255,213,118))]
    for y in range(int((cy-82)*S),int((cy+84)*S)):
        t=(y/S-(cy-82))/166
        a,b=(stops[0],stops[1]) if t<.45 else (stops[1],stops[2]);q=(t-a[0])/(b[0]-a[0]);color=tuple(int(a[1][i]*(1-q)+b[1][i]*q) for i in range(3))+(255,)
        gd.line((int((cx-67)*S),y,int((cx+67)*S),y),fill=color)
    eye.paste(gradient,(0,0),iris_mask)
    ellipse(eye,(cx-20,cy-45,cx+20,cy+38),'#453045')
    ellipse(eye,(cx-45,cy-51,cx-7,cy-23),'#fffdf8')
    ellipse(eye,(cx+20,cy+29,cx+37,cy+46),'#fffdf8')
    ellipse(eye,(cx-23,cy+51,cx+10,cy+62),'#ffe7a1')
    im.paste(eye,(0,0),mask)
    stroke([(cx+x,cy+y) for x,y in upper],'#4c3345',12)
    stroke([(cx+x,cy+y) for x,y in lower[5:-5]],'#b17d90',4)
    for i in range(3):
        outer=side*(107-i*13)
        stroke([(cx+outer,cy-12-i*9),(cx+outer+side*20,cy-36-i*14)],'#4c3345',6-i)
    brow=cubic((cx-72,cy-119),(cx-30,cy-139),(cx+28,cy-140),(cx+72,cy-119))
    stroke(brow,'#ad91aa',6)
    bounds=((cx-140)*S,(cy-155)*S,(cx+140)*S,(cy+100)*S)
    region=im.crop(bounds).resize((int(280*S*1.22),int(255*S*1.25)),Image.Resampling.LANCZOS)
    ImageDraw.Draw(im).rectangle(bounds,fill=(0,0,0,0))
    im.alpha_composite(region,(int(cx*S-region.width/2),int(cy*S-155*S*1.25)))
    blush=Image.new('RGBA',im.size)
    ellipse(blush,(cx+side*91-56,cy+90-22,cx+side*91+56,cy+90+22),(239,142,163,75))
    im=Image.alpha_composite(im,blush.filter(ImageFilter.GaussianBlur(13*S)))
stroke(cubic((478,522),(502,539),(531,537),(550,517)),'#b96c83',5)
ellipse(im,(505,450,519,457),(229,163,163,95))
im.resize((1024,768),Image.Resampling.LANCZOS).save(Path(__file__).with_name('scarlet-face.png'))
print('Painted scarlet-face.png')
