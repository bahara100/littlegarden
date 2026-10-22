import { paintSwingFrame, type SwingFit } from './swingFrames';
import { EQUIPMENT_SCALE } from './layout';

export const SWING_CELL = 444;
export const SWING_RIG = {
  2: { row: 0, pivots: [[182,140],[285,101]], seat: [245,292], forward: 1 },
  3: { row: 1, pivots: [[160,97],[262,135]], seat: [200,292], forward: -1 },
} as const;
export type SwingCell = keyof typeof SWING_RIG;
export const SWING = { max: 18 * Math.PI / 180, period: 2.4, poses: 16, pad: 24 } as const;
export type SwingMotion = { phase: number; amp: number };
export type SwingArt = { width: number; seatDrop: number; forward: number; back: HTMLCanvasElement; bar: HTMLCanvasElement; near: HTMLCanvasElement; hang: HTMLCanvasElement[]; ropes: HTMLCanvasElement[] };
const canvas = (size: number) => { const c = document.createElement('canvas'); c.width = c.height = size; return c; };

/** Copy just the near rope out of the existing hanging art; leave wood and the far rope behind the rider. */
function nearRope(source: HTMLCanvasElement, cell: SwingCell) {
  const out = canvas(SWING_CELL), c = out.getContext('2d')!; c.drawImage(source,0,0);
  const px = c.getImageData(0,0,SWING_CELL,SWING_CELL), p = px.data;
  const poly = cell === 2 ? [[162,136],[202,128],[202,250],[212,300],[200,312],[170,312],[156,304],[164,250]]
    : [[248,130],[278,132],[278,250],[292,300],[280,314],[232,314],[238,280],[250,250]];
  for(let y=0;y<SWING_CELL;y++)for(let x=0;x<SWING_CELL;x++){
    let inside=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const [ax,ay]=poly[i],[bx,by]=poly[j];
      if((ay>y+.5)!==(by>y+.5)&&x+.5<(bx-ax)*(y+.5-ay)/(by-ay)+ax)inside=!inside;
    }
    const i=(y*SWING_CELL+x)*4,wood=p[i]-p[i+2]>70&&p[i]>120;
    if(!inside||wood)p[i+3]=0;
  }
  c.putImageData(px,0,0);return out;
}

/** Shared original-source sampling for Phaser and Canvas, including the foreground rope in all 33 poses. */
export function makeSwingArt(image: CanvasImageSource): Map<SwingCell,SwingArt> {
  const result=new Map<SwingCell,SwingArt>();
  for(const key of [2,3] as const){
    const rig=SWING_RIG[key];
    const layers=[0,1,2,3].map(col=>{
      const c=canvas(SWING_CELL),ctx=c.getContext('2d')!;
      ctx.drawImage(image,col*SWING_CELL,rig.row*SWING_CELL,SWING_CELL,SWING_CELL,0,0,SWING_CELL,SWING_CELL);
      const px=ctx.getImageData(0,0,SWING_CELL,SWING_CELL);
      for(let i=3;i<px.data.length;i+=4)if(px.data[i]<180)px.data[i]=0;
      ctx.putImageData(px,0,0);return c;
    });
    const whole=canvas(SWING_CELL),wc=whole.getContext('2d')!;layers.forEach(l=>wc.drawImage(l,0,0));
    const p=wc.getImageData(0,0,SWING_CELL,SWING_CELL).data;
    let left=SWING_CELL,top=SWING_CELL,right=0,bottom=0;
    for(let y=0;y<SWING_CELL;y++)for(let x=0;x<SWING_CELL;x++)if(p[(y*SWING_CELL+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
    const sw=right-left+1,sh=bottom-top+1,scale=124/Math.max(sw,sh);
    const fit:SwingFit={left,top,sw,sh,dw:Math.round(sw*scale),dh:Math.round(sh*scale)};
    const fitted=(source:HTMLCanvasElement)=>{const out=canvas(128),ctx=out.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.drawImage(source,left,top,sw,sh,(128-fit.dw)/2,128-fit.dh,fit.dw,fit.dh);return out};
    const [back,hang,bar,near]=layers.map(fitted),rope=nearRope(layers[1],key),ropeRest=fitted(rope);
    const at=([x,y]:readonly number[])=>({x:(x-left)*fit.dw/sw+(128-fit.dw)/2+SWING.pad,y:(y-top)*fit.dh/sh+128-fit.dh+SWING.pad});
    const a=at(rig.pivots[0]),b=at(rig.pivots[1]),seat=at(rig.seat),m=(b.y-a.y)/(b.x-a.x),intercept=a.y-m*a.x;
    const frames=(source:HTMLCanvasElement,rest:HTMLCanvasElement)=>Array.from({length:SWING.poses*2+1},(_,i)=>{
      const out=canvas(128+SWING.pad*2);paintSwingFrame(out.getContext('2d')!,source,fit,rest,SWING.pad,SWING.max*(i-SWING.poses)/SWING.poses,rig.forward,m,intercept);return out;
    });
    result.set(key,{width:fit.dw,seatDrop:seat.y-intercept-m*seat.x,forward:rig.forward,back,bar,near,hang:frames(layers[1],hang),ropes:frames(rope,ropeRest)});
  }
  return result;
}
export function swingSeatShift(turn: number, progress: number) {
  return (turn===0||turn===3?-1:1)*.16*Math.max(0,Math.min(1,progress));
}
export function swingPose(art: Pick<SwingArt,'width'|'seatDrop'|'forward'>, turn: number, motion: SwingMotion | undefined, unit: number) {
  const k=motion?Math.round(motion.amp*Math.sin(motion.phase)*SWING.poses):0,t=SWING.max*k/SWING.poses;
  const d=art.seatDrop*6.1*EQUIPMENT_SCALE.swing*unit/art.width,forward=art.forward*(turn>=2?-1:1);
  return {frame:k+SWING.poses,x:forward*Math.sin(t)*d,y:(Math.sin(t)/2-(1-Math.cos(t)))*d,ground:Math.sin(t)/2*d};
}
