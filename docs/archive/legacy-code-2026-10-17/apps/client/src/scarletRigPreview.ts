import { RIG_PARTS, RIG_SAMPLE_COUNT, type RigPart } from './scarletRig';
import { drawRig, loadRigImages, type RigImages, type RigOptions } from './scarletRigRenderer';
const main = document.querySelector<HTMLCanvasElement>('#rig-preview')!, c = main.getContext('2d')!;
const play = document.querySelector<HTMLButtonElement>('#play')!, step = document.querySelector<HTMLButtonElement>('#step')!;
const status = document.querySelector('#status')!, phase = document.querySelector('#phase')!;
const labels = ['왼발 앞으로', '오른발 이동 · 왼발 지지', '오른발 앞으로', '왼발 이동 · 오른발 지지'];
const names: Record<RigPart,string> = {body:'머리·몸통·옷',leftArm:'왼 팔·소매',rightArm:'오른 팔·소매',leftThigh:'왼 허벅지',leftShin:'왼 종아리 · 검은 끈',leftBoot:'왼 부츠',rightThigh:'오른 허벅지',rightShin:'오른 종아리 · 흰색',rightBoot:'오른 부츠'};
let images: RigImages | undefined, clock = 0, last = performance.now(), fps = 6, paused = matchMedia('(prefers-reduced-motion: reduce)').matches, disposed = false, raf = 0;
const options: RigOptions = { body:true,left:true,right:true,joints:false,standing:false,motion:true };
const cells: HTMLCanvasElement[] = [], buttons: HTMLButtonElement[] = [];
const current = () => Math.floor(clock * fps) % 4;
function render() {
  if (!images) return; const n = current(); drawRig(c, images, clock*fps, options);
  phase.textContent = options.standing ? '기본 자세 · 같은 부품' : `${n+1} / 4 · ${labels[n]}`;
  play.textContent = paused ? '다시 재생' : '일시 정지'; play.setAttribute('aria-pressed',String(!paused));
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(!options.standing && i===n)));
}
function timeline() { if (images) cells.forEach((cell,i)=>drawRig(cell.getContext('2d')!,images!,i,options)); }
function tick(now:number) { if(disposed)return;const dt=Math.min(.1,(now-last)/1000);last=now;if(!paused&&!options.standing&&!document.hidden)clock+=dt;render();raf=requestAnimationFrame(tick); }
play.onclick=()=>{paused=!paused;render();};step.onclick=()=>{paused=true;options.standing=false;document.querySelector<HTMLInputElement>('#standing')!.checked=false;clock=(Math.floor(clock*fps)+1.01)/fps;render();};
document.querySelector<HTMLSelectElement>('#fps')!.onchange=e=>{const n=current();fps=Number((e.target as HTMLSelectElement).value);clock=(n+.01)/fps;render();};
for(const key of ['body','left','right','joints','standing','motion'] as const)document.querySelector<HTMLInputElement>(`#${key}`)!.onchange=e=>{options[key]=(e.target as HTMLInputElement).checked;timeline();render();};
void loadRigImages().then(loaded=>{
  if(disposed)return;images=loaded;
  labels.forEach((label,i)=>{
    const button=document.createElement('button'),canvas=document.createElement('canvas');canvas.width=canvas.height=96;const caption=document.createElement('span');caption.textContent=`${i+1}. ${label}`;button.append(canvas,caption);
    button.onclick=()=>{paused=true;options.standing=false;document.querySelector<HTMLInputElement>('#standing')!.checked=false;clock=(i+.01)/fps;render();};
    cells.push(canvas);buttons.push(button);document.querySelector('#rig-frames')!.append(button);
  });
  (Object.keys(RIG_PARTS) as RigPart[]).forEach(id=>{const fig=document.createElement('figure'),img=new Image(),caption=document.createElement('figcaption');img.src=loaded[id].src;img.alt=names[id];caption.textContent=names[id];fig.append(img,caption);document.querySelector('#rig-parts')!.append(fig);});
  const sheet=document.createElement('canvas');sheet.width=96*RIG_SAMPLE_COUNT;sheet.height=96;const sc=sheet.getContext('2d')!,sample=document.createElement('canvas');sample.width=sample.height=96;
  for(let i=0;i<RIG_SAMPLE_COUNT;i++){drawRig(sample.getContext('2d')!,loaded,i/2);sc.drawImage(sample,i*96,0);}
  const download=document.querySelector<HTMLAnchorElement>('#rig-export')!;download.href=sheet.toDataURL('image/png');download.hidden=false;
  play.disabled=step.disabled=false;status.textContent='고정 부품 9개 · 골반·상체·팔 연동을 불러왔어요. 상체 연동을 끄면 이전 방식과 비교할 수 있어요.';timeline();render();raf=requestAnimationFrame(tick);
}).catch(error=>{status.textContent='부품을 불러오지 못했어요. 새로고침해 주세요.';console.error(error);});
function dispose(){disposed=true;cancelAnimationFrame(raf);}window.addEventListener('pagehide',dispose,{once:true});if(import.meta.hot)import.meta.hot.dispose(dispose);
