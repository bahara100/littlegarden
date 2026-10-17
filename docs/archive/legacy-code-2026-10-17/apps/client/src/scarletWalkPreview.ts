import { SCARLET_WALK_SHEETS, walkFrame, WALK_FPS } from './scarletWalk';
import { SCARLET_DIRECTIONS, type ScarletDirection } from './scarletDirections';
const canvas = document.querySelector<HTMLCanvasElement>('#walk-preview')!, ctx = canvas.getContext('2d')!;
const play = document.querySelector<HTMLButtonElement>('#play')!, next = document.querySelector<HTMLButtonElement>('#next-frame')!;
const idleToggle = document.querySelector<HTMLButtonElement>('#show-idle')!, guidesToggle = document.querySelector<HTMLButtonElement>('#show-guides')!;
const transitionToggle = document.querySelector<HTMLButtonElement>('#loop-transition')!;
const phase = document.querySelector('#phase')!, status = document.querySelector('#status')!;
const labels = ['왼발 앞으로', '교차 · 오른발 이동', '오른발 앞으로', '교차 · 왼발 이동'];
const sheets = new Map<ScarletDirection, HTMLImageElement>(), idles = new Map<ScarletDirection, HTMLImageElement>();
const buttons: HTMLButtonElement[] = [];
const direction = document.querySelector<HTMLSelectElement>('#direction')!;
const requestedDirection = new URLSearchParams(location.search).get('direction');
let selected: ScarletDirection = SCARLET_DIRECTIONS.find(d => d.id === requestedDirection)?.id ?? 'se';
direction.value = selected;
let time = 0, last = performance.now(), fps = WALK_FPS, frame = 0, showIdle = false, guides = false, ready = false, disposed = false;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let transitionOnly = false;
function currentFrame() { return transitionOnly ? [2, 3, 0][Math.floor(Math.max(0, time) * fps) % 3] : walkFrame(time, fps); }
function draw(target: CanvasRenderingContext2D, n: number, compare = false, id = selected) {
  target.clearRect(0, 0, 96, 96); target.imageSmoothingEnabled = false;
  if (!ready) return;
  if (compare) target.drawImage(idles.get(id)!, 0, 0);
  else target.drawImage(sheets.get(id)!, n * 96, 0, 96, 96, 0, 0, 96, 96);
  if (guides) { target.fillStyle = '#699978'; target.fillRect(0, 88, 96, 1); target.fillStyle = '#b397c4'; target.fillRect(48, 0, 1, 96); }
}
function updateControls() {
  play.textContent = paused ? '다시 재생' : '일시 정지'; play.setAttribute('aria-pressed', String(!paused));
  idleToggle.setAttribute('aria-pressed', String(showIdle));
  transitionToggle.setAttribute('aria-pressed', String(transitionOnly));
  render();
}
function render() {
  const n = currentFrame(); draw(ctx, n, showIdle);
  draw(document.querySelector<HTMLCanvasElement>('#passing-2')!.getContext('2d')!, 1);
  draw(document.querySelector<HTMLCanvasElement>('#passing-4')!.getContext('2d')!, 3);
  SCARLET_DIRECTIONS.forEach(d => draw(document.querySelector<HTMLCanvasElement>(`#overview-${d.id}`)!.getContext('2d')!, n, showIdle, d.id));
  const text = showIdle ? '기본 자세 · 비교' : `${n + 1} / 4 · ${labels[n]}`; if (phase.textContent !== text) phase.textContent = text;
  buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(!showIdle && n === i)));
}
function tick(now: number) {
  if (disposed) return;
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (!paused && !showIdle && !document.hidden) time += dt;
  render();
  frame = requestAnimationFrame(tick);
}
play.onclick = () => { showIdle = false; paused = !paused; updateControls(); };
next.onclick = () => { showIdle = false; paused = true; time = (Math.floor(time * fps) + 1.01) / fps; updateControls(); };
transitionToggle.onclick = () => { transitionOnly = !transitionOnly; time = 0; showIdle = false; paused = false; updateControls(); };
idleToggle.onclick = () => { showIdle = !showIdle; updateControls(); };
guidesToggle.onclick = () => { guides = !guides; guidesToggle.setAttribute('aria-pressed', String(guides)); buttons.forEach((button, i) => draw(button.querySelector('canvas')!.getContext('2d')!, i)); };
document.querySelector<HTMLSelectElement>('#fps')!.onchange = e => { const step = Math.floor(time * fps); fps = Number((e.target as HTMLSelectElement).value); time = (step + .01) / fps; };
direction.onchange = () => {
  selected = direction.value as ScarletDirection;
  canvas.setAttribute('aria-label', `홍련 ${SCARLET_DIRECTIONS.find(d => d.id === selected)!.label} 걷기`);
  document.querySelector<HTMLAnchorElement>('#download-sheet')!.href = `${import.meta.env.BASE_URL}${SCARLET_WALK_SHEETS[selected]}`;
  buttons.forEach((button, i) => draw(button.querySelector('canvas')!.getContext('2d')!, i));
  render();
};
void Promise.all(SCARLET_DIRECTIONS.map(async d => {
  const sheet = new Image(), idle = new Image();
  sheet.src = `${import.meta.env.BASE_URL}${SCARLET_WALK_SHEETS[d.id]}`;
  idle.src = `${import.meta.env.BASE_URL}sprites/scarlet/${d.file}`;
  await Promise.all([sheet.decode(), idle.decode()]);
  if (sheet.naturalWidth !== 384 || sheet.naturalHeight !== 96) throw new Error('Wrong walk sheet size');
  sheets.set(d.id, sheet); idles.set(d.id, idle);
})).then(() => {
  if (disposed) return;
  ready = true; [play, next, idleToggle, transitionToggle].forEach(b => b.disabled = false);
  labels.forEach((label, i) => {
    const button = document.createElement('button'), cell = document.createElement('canvas'); cell.width = cell.height = 96;
    const caption = document.createElement('span'); caption.textContent = `${i + 1}. ${label}`; button.append(cell, caption);
    button.onclick = () => { paused = true; showIdle = false; transitionOnly = false; time = (i + .01) / fps; updateControls(); };
    draw(cell.getContext('2d')!, i); buttons.push(button); document.querySelector('#frames')!.append(button);
  });
  direction.disabled = false;
  direction.onchange!(new Event('change'));
  status.textContent = '네 방향 · 총 16컷을 불러왔어요. 방향을 골라 한 컷씩 살펴볼 수 있어요.'; updateControls(); frame = requestAnimationFrame(tick);
}).catch(() => { status.textContent = '걷기 시트를 불러오지 못했어요. 새로고침해 주세요.'; });
function dispose() { disposed = true; cancelAnimationFrame(frame); }
window.addEventListener('pagehide', dispose, { once: true }); if (import.meta.hot) import.meta.hot.dispose(dispose);
