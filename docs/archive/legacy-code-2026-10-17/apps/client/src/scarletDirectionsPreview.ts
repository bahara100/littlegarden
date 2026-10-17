import { SCARLET_DIRECTIONS } from './scarletDirections';
const root = document.querySelector('#directions')!, status = document.querySelector('#status')!;
let loaded = 0, failed = false;
for (const dir of SCARLET_DIRECTIONS) {
  const card = document.createElement('section'); card.className = 'card';
  const title = document.createElement('h2'); title.textContent = dir.label;
  const stage = document.createElement('div'); stage.className = 'sprite';
  const image = new Image(); image.alt = `홍련 ${dir.label} 기본 자세`;
  const url = `${import.meta.env.BASE_URL}sprites/scarlet/${dir.file}`;
  image.onload = () => { loaded++; if (!failed) status.textContent = loaded === 4 ? '네 방향을 모두 표시했어요. 발 위치와 머리 묶음을 비교해보세요.' : `${loaded}/4 방향을 불러왔어요.`; };
  image.onerror = () => { failed = true; status.textContent = '일부 그림을 불러오지 못했어요. 새로고침해 주세요.'; }; image.src = url; stage.append(image);
  const native = document.createElement('div'); native.className = 'native'; const small = image.cloneNode() as HTMLImageElement; small.alt = `${dir.label} 실제 크기`;
  const label = document.createElement('span'); label.textContent = '실제 크기'; native.append(small, label);
  const link = document.createElement('a'); link.href = url; link.download = dir.file; link.textContent = '96px PNG 받기 ↓';
  card.append(title, stage, native, link); root.append(card);
}
const button = document.querySelector<HTMLButtonElement>('#guides')!;
button.onclick = () => { const on = root.classList.toggle('guided'); button.setAttribute('aria-pressed', String(on)); };
