/** A 4×2 sprite sheet redrawn into 96×96 cells (3 px margin), nearest-neighbour. */
export async function loadPixelAtlas(path: string) {
  const img = new Image(); img.src = `${import.meta.env.BASE_URL}${path}`; await img.decode();
  const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 192;
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  const w = img.naturalWidth / 4, h = img.naturalHeight / 2;
  for (let i = 0; i < 8; i++) ctx.drawImage(img, i % 4 * w, Math.floor(i / 4) * h, w, h, i % 4 * 96 + 3, Math.floor(i / 4) * 96 + 3, 90, 90);
  return canvas;
}
