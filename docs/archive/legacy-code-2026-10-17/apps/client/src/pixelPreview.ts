import {loadPixelAtlas,pixelFrame} from './pixelAtlas';
const canvas=document.querySelector<HTMLCanvasElement>('#pixel')!,ctx=canvas.getContext('2d')!;
let walking=false,paused=false,time=0,last=performance.now(),frame=0,disposed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const idle=document.querySelector<HTMLButtonElement>('#idle')!,walk=document.querySelector<HTMLButtonElement>('#walk')!,pause=document.querySelector<HTMLButtonElement>('#pause')!;
idle.onclick=()=>{walking=false;time=0;idle.setAttribute('aria-pressed','true');walk.setAttribute('aria-pressed','false');};
walk.onclick=()=>{walking=true;time=0;idle.setAttribute('aria-pressed','false');walk.setAttribute('aria-pressed','true');};
pause.onclick=()=>{paused=!paused;pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'다시 재생':'일시 정지';};
document.querySelector<HTMLSelectElement>('#scale')!.onchange=e=>{const size=96*Number((e.target as HTMLSelectElement).value);canvas.style.width=canvas.style.height=`${size}px`;};
void loadPixelAtlas().then(atlas=>{
  if(disposed)return;[idle,walk,pause].forEach(b=>b.disabled=false);document.querySelector('#message')!.textContent='준비됐어요. 대기와 걷기를 바꿔보세요.';
  function tick(now:number){if(disposed)return;const dt=Math.min(.1,(now-last)/1000);last=now;if(!paused&&!document.hidden)time+=dt;
    const i=pixelFrame(walking,time,reduced.matches);ctx.clearRect(0,0,96,96);ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,(i%4)*96,Math.floor(i/4)*96,96,96,0,0,96,96);frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
}).catch(()=>{document.querySelector('#message')!.textContent='도트 시트를 불러오지 못했어요. 새로고침해 주세요.';});
function dispose(){disposed=true;cancelAnimationFrame(frame);}window.addEventListener('pagehide',dispose,{once:true});if(import.meta.hot)import.meta.hot.dispose(dispose);

