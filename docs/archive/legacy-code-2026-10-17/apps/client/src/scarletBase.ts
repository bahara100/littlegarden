const canvas = document.querySelector<HTMLCanvasElement>('#base-frame')!, ctx = canvas.getContext('2d')!;
const toggle = document.querySelector<HTMLButtonElement>('#guides')!, status = document.querySelector('#status')!;
const image = new Image();
let guides = false;
function draw() {
  ctx.clearRect(0, 0, 96, 96); ctx.imageSmoothingEnabled = false;
  if (image.complete && image.naturalWidth) ctx.drawImage(image, 0, 0);
  if (guides) {
    ctx.fillStyle = '#5d936e'; ctx.fillRect(0, 88, 96, 1);
    ctx.fillStyle = '#ae7cb7'; ctx.fillRect(48, 0, 1, 96);
    ctx.strokeStyle = '#ae7cb7'; ctx.strokeRect(6.5, 6.5, 83, 82);
  }
}
toggle.onclick = () => { guides = !guides; toggle.setAttribute('aria-pressed', String(guides)); draw(); };
image.onload = () => { draw(); status.textContent = '96×96 기준 도트를 표시했어요.'; };
image.onerror = () => { status.textContent = '도트를 불러오지 못했어요. 새로고침해 주세요.'; };
image.src = `${import.meta.env.BASE_URL}sprites/scarlet/scarlet-se-idle-base-v3.png`;


