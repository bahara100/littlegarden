import { BODY_PIVOT, RIG_PARTS, RIG_SAMPLE_COUNT, rigBody, rigLeg, type Joint, type LegSide, type RigPart } from './scarletRig';
export type RigImages = Record<RigPart, HTMLImageElement>;
export type RigOptions = { body?: boolean; left?: boolean; right?: boolean; joints?: boolean; standing?: boolean; motion?: boolean };
const palette = ['332b43','51405d','745775','9b7b97','64577c','82709d','a392b9','c3b3d5','ded2e7','f0e9f1','685c69','a49696','d7c6bb','f1e2cc','fff3dc','b08069','d7a68b','efc5a3','ffdfba','ffecd1','765136','ab763c','d5a349','f2d075','692f47','9b3e52','c15b61','e18b83','302f3b','53515b','87818c','b5abb9'].map(hex=>[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)));
const colorCache = new Map<number, number[]>();
function snapPixels(c: CanvasRenderingContext2D) {
  const pixels=c.getImageData(0,0,96,96),data=pixels.data;
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]<160){data[i]=data[i+1]=data[i+2]=data[i+3]=0;continue;}
    const key=(data[i]<<16)|(data[i+1]<<8)|data[i+2];let color=colorCache.get(key);
    if(!color){let distance=Infinity;for(const candidate of palette){const d=(candidate[0]-data[i])**2+(candidate[1]-data[i+1])**2+(candidate[2]-data[i+2])**2;if(d<distance){distance=d;color=candidate;}}colorCache.set(key,color!);}
    data[i]=color![0];data[i+1]=color![1];data[i+2]=color![2];data[i+3]=255;
  }c.putImageData(pixels,0,0);
}
export async function loadRigImages(): Promise<RigImages> {
  const pairs = await Promise.all((Object.keys(RIG_PARTS) as RigPart[]).map(async id => {
    const folder=['body','leftArm','rightArm'].includes(id)?'rig-se-v2':'rig-se-v1';
    const image = new Image(); image.src = `${import.meta.env.BASE_URL}sprites/scarlet/${folder}/${id}.png`;
    await image.decode();
    if (image.naturalWidth !== RIG_PARTS[id].width || image.naturalHeight !== RIG_PARTS[id].height) throw new Error(`Wrong rig part size: ${id}`);
    return [id, image] as const;
  }));
  return Object.fromEntries(pairs) as RigImages;
}
function segment(c: CanvasRenderingContext2D, image: HTMLImageElement, start: Joint, end: Joint) {
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  c.save(); c.translate(start.x, start.y); c.rotate(Math.atan2(end.y - start.y, end.x - start.x) - Math.PI / 2);
  c.drawImage(image, -image.width / 2, -1, image.width, length + 2); c.restore();
}
export function drawRig(c: CanvasRenderingContext2D, images: RigImages, frame: number, options: RigOptions = {}) {
  c.clearRect(0, 0, 96, 96); c.imageSmoothingEnabled = false;
  const pose=rigBody(frame,options.standing,options.motion);
  const legs = (['left', 'right'] as LegSide[]).map(side => rigLeg(side, frame, options.standing,options.motion)).sort((a, b) => a.ankle.y - b.ankle.y);
  for (const leg of legs) {
    if (options[leg.side] === false) continue;
    segment(c, images[leg.parts.thigh], leg.hip, leg.knee);
    segment(c, images[leg.parts.shin], leg.knee, leg.ankle);
    // Boot orientation stays southeast; it never inherits calf rotation or mirrors.
    const boot = images[leg.parts.boot]; c.drawImage(boot, Math.round(leg.ankle.x - boot.width / 2), Math.round(leg.ankle.y - 1));
  }
  if (options.body !== false) {
    c.save();c.translate(BODY_PIVOT.x+pose.x,BODY_PIVOT.y+pose.y);c.rotate(pose.lean);c.translate(-BODY_PIVOT.x,-BODY_PIVOT.y);
    const arm=(id:'leftArm'|'rightArm',x:number,y:number,angle:number,pivotX:number)=>{c.save();c.translate(x,y);c.rotate(angle);c.drawImage(images[id],-pivotX,-2);c.restore();};
    arm('leftArm',58,45,-.28+pose.leftArm,9);
    c.drawImage(images.body,16,6);
    arm('rightArm',43,47,.40+pose.rightArm,2);
    c.restore();
  }
  snapPixels(c);
  if (options.joints) for (const leg of legs) {
    if (options[leg.side] === false) continue;
    c.strokeStyle = c.fillStyle = leg.side === 'left' ? '#d85c9b' : '#339acf'; c.lineWidth = .7;
    c.beginPath(); c.moveTo(leg.hip.x, leg.hip.y); c.lineTo(leg.knee.x, leg.knee.y); c.lineTo(leg.ankle.x, leg.ankle.y); c.stroke();
    for (const p of [leg.hip, leg.knee, leg.ankle]) { c.beginPath(); c.arc(p.x, p.y, 1.2, 0, Math.PI * 2); c.fill(); }
  }
}
export async function createRigFrames() {
  const images = await loadRigImages();
  const make = (frame: number, standing = false) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
    drawRig(canvas.getContext('2d')!, images, frame, { standing }); return canvas;
  };
  return { frames: Array.from({length:RIG_SAMPLE_COUNT},(_,n)=>make(n/2)), idle: make(0, true) };
}
