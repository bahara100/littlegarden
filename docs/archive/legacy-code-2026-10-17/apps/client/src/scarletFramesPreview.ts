import { FULL_FRAME_LABELS, FULL_WALK_SE, FULL_WALK_SW, FULL_KEYS_NE, FULL_KEYS_NW, FULL_WALK_FPS, FRAME_SIZE, fullFrameIndex } from './scarletFullFrames';
const canvas=document.querySelector<HTMLCanvasElement>('#frame-preview')!,ctx=canvas.getContext('2d')!;
const play=document.querySelector<HTMLButtonElement>('#play')!,next=document.querySelector<HTMLButtonElement>('#next')!;
const phase=document.querySelector('#phase')!,status=document.querySelector('#status')!;
const sequences=[
 {path:FULL_WALK_SE,labels:FULL_FRAME_LABELS,fps:FULL_WALK_FPS,direction:'↘ 앞오른쪽',map:'frames-four-v1'},
 {path:FULL_WALK_SW,labels:FULL_FRAME_LABELS,fps:FULL_WALK_FPS,direction:'↙ 앞왼쪽',map:'frames-four-v1'},
 {path:FULL_KEYS_NE,labels:FULL_FRAME_LABELS,fps:FULL_WALK_FPS,direction:'↗ 뒤오른쪽',map:'frames-four-v1'},
 {path:FULL_KEYS_NW,labels:FULL_FRAME_LABELS,fps:FULL_WALK_FPS,direction:'↖ 뒤왼쪽',map:'frames-four-v1'},
];
const images=sequences.map(()=>new Image()),reference=new Image(),buttons:HTMLButtonElement[]=[];
const initialDirection=new URLSearchParams(location.search).get('direction');
let ready=false,clock=0,last=performance.now(),rate=1,mode=initialDirection==='nw'?3:initialDirection==='ne'?2:initialDirection==='sw'?1:0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,onion=false,guides=false,legDetail=false,disposed=false,raf=0,lastKey='';
const labels=()=>sequences[mode].labels;
const fps=()=>rate*sequences[mode].fps;
const index=()=>fullFrameIndex(clock,fps(),labels().length);
function draw(c:CanvasRenderingContext2D,n:number,ghost=false){
 c.clearRect(0,0,96,96);c.imageSmoothingEnabled=false;if(!ready)return;
 const cell=(i:number)=>legDetail?c.drawImage(images[mode],i*FRAME_SIZE+24,56,48,40,0,8,96,80):c.drawImage(images[mode],i*FRAME_SIZE,0,96,96,0,0,96,96);
 if(ghost){c.globalAlpha=.25;cell((n+labels().length-1)%labels().length);c.globalAlpha=1;}cell(n);
 if(guides){c.fillStyle='#6d9978';c.fillRect(0,legDetail?72:88,96,1);c.fillStyle='#b397c4';c.fillRect(48,0,1,96);}
}
function render(){
 if(!ready)return;const n=index(),key=[mode,n,onion,guides,legDetail,paused].join(':');if(key===lastKey)return;lastKey=key;
 draw(ctx,n,onion);phase.textContent=`${n+1} / ${labels().length} · ${labels()[n]}`;
 play.textContent=paused?'다시 재생':'일시 정지';play.setAttribute('aria-pressed',String(!paused));
 buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===n)));
}
function timeline(){buttons.forEach((button,i)=>draw(button.querySelector('canvas')!.getContext('2d')!,i));}
function rebuild(){
 buttons.length=0;document.querySelector('#keyframes')!.replaceChildren();
 labels().forEach((label,i)=>{const button=document.createElement('button'),cell=document.createElement('canvas'),caption=document.createElement('span');cell.width=cell.height=96;caption.textContent=`${i+1}. ${label}`;button.append(cell,caption);button.onclick=()=>{paused=true;clock=(i+.01)/fps();render();};buttons.push(button);document.querySelector('#keyframes')!.append(button);});
 const sequence=sequences[mode];
 document.querySelector('#sequence-title')!.textContent='1 → 2 → 3 → 4 → 1';
 document.querySelector('#direction-note')!.textContent=`${sequence.direction} · 전신 4프레임 · 6 FPS`;
 document.querySelector('#phase-note')!.textContent='1번은 왼발 접지, 2번은 오른발 이동, 3번은 오른발 접지, 4번은 왼발 이동입니다.';
 document.querySelector('#connection-note')!.textContent='네 방향 모두 4프레임입니다. 4→1 연결과 반대 팔 스윙, 발 접지를 확인해 주세요. 검은 끈은 캐릭터 자신의 왼다리이며, 흰 스타킹은 오른다리입니다.';
 document.querySelector<HTMLAnchorElement>('#sheet-download')!.href=`${import.meta.env.BASE_URL}${sequence.path}`;
 const preview=document.querySelector<HTMLAnchorElement>('#preview-download')!;preview.hidden=false;preview.href=`${import.meta.env.BASE_URL}${sequence.path.replace('walk.png','walk-preview-2x2.png')}`;
 document.querySelector<HTMLAnchorElement>('#map-link')!.href=`./?scarlet=${sequence.map}`;
 status.textContent=`${sequence.direction} · 전신 4프레임을 불러왔어요.`;
 timeline();render();
}
function tick(now:number){if(disposed)return;const dt=Math.min(.1,(now-last)/1000);last=now;if(!paused&&!document.hidden)clock+=dt;render();raf=requestAnimationFrame(tick);}
play.onclick=()=>{paused=!paused;render();};next.onclick=()=>{paused=true;clock=(Math.floor(clock*fps())+1.01)/fps();render();};
document.querySelector<HTMLSelectElement>('#fps')!.onchange=e=>{const n=index();rate=Number((e.target as HTMLSelectElement).value);clock=(n+.01)/fps();render();};
document.querySelector<HTMLSelectElement>('#sequence')!.onchange=e=>{const progress=index()/labels().length;mode=Number((e.target as HTMLSelectElement).value);clock=(Math.floor(progress*labels().length)+.01)/fps();rebuild();};
document.querySelector<HTMLInputElement>('#onion')!.onchange=e=>{onion=(e.target as HTMLInputElement).checked;render();};
document.querySelector<HTMLInputElement>('#guides')!.onchange=e=>{guides=(e.target as HTMLInputElement).checked;timeline();render();};
document.querySelector<HTMLInputElement>('#leg-detail')!.onchange=e=>{legDetail=(e.target as HTMLInputElement).checked;canvas.setAttribute('aria-label',legDetail?'홍련 다리 영역 확대 · 같은 프레임을 잘라 표시':'홍련 전신 도트 걷기 초안');timeline();render();};
images.forEach((image,i)=>{image.src=`${import.meta.env.BASE_URL}${sequences[i].path}`;});reference.src=`${import.meta.env.BASE_URL}sprites/scarlet/scarlet-se-idle-base-v3.png`;
void Promise.all([...images.map(image=>image.decode()),reference.decode()]).then(()=>{
 if(disposed)return;if(images.some((image,i)=>image.naturalWidth!==FRAME_SIZE*sequences[i].labels.length||image.naturalHeight!==FRAME_SIZE)||reference.naturalWidth!==96||reference.naturalHeight!==96)throw new Error('Wrong full-frame image dimensions');ready=true;
 const rc=document.querySelector<HTMLCanvasElement>('#frame-reference')!.getContext('2d')!;rc.imageSmoothingEnabled=false;rc.drawImage(reference,0,0);
 play.disabled=next.disabled=false;document.querySelector<HTMLSelectElement>('#sequence')!.value=String(mode);document.querySelector<HTMLSelectElement>('#sequence')!.disabled=false;rebuild();raf=requestAnimationFrame(tick);
}).catch(error=>{status.textContent='전신 프레임을 불러오지 못했어요. 새로고침해 주세요.';console.error(error);});
function dispose(){disposed=true;cancelAnimationFrame(raf);}window.addEventListener('pagehide',dispose,{once:true});if(import.meta.hot)import.meta.hot.dispose(dispose);
