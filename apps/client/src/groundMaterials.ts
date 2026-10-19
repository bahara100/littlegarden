import { GARDEN, HALF, type Point } from './layout';
import type { GroundTheme } from './regions';

type Material = 'grass' | 'path';
type Screen = (p: Point) => { x: number; y: number };
let source: Record<Material, HTMLCanvasElement> | undefined;
let loading: Promise<void> | undefined;
const grades = new WeakMap<GroundTheme, Record<Material, HTMLCanvasElement>>();
const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

/** Shared, small, authored materials; the game waits for these before showing the map. */
export function loadGroundMaterials() {
  return loading ??= Promise.all((['grass', 'path'] as const).map(async kind => {
    const image = new Image(); image.src = `${import.meta.env.BASE_URL}sprites/garden/ground-materials-v1/${kind}.png`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    canvas.getContext('2d')!.drawImage(image, 0, 0); return [kind, canvas] as const;
  })).then(entries => { source = Object.fromEntries(entries) as Record<Material, HTMLCanvasElement>; });
}

function materials(theme: GroundTheme) {
  if (!source) return undefined;
  let look = grades.get(theme); if (look) return look;
  look = {} as Record<Material, HTMLCanvasElement>;
  for (const kind of ['grass', 'path'] as const) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const c = canvas.getContext('2d')!; c.drawImage(source[kind], 0, 0);
    const pixels = c.getImageData(0, 0, 256, 256), mean = [0, 0, 0];
    for (let i = 0; i < pixels.data.length; i += 4) for (let n = 0; n < 3; n++) mean[n] += pixels.data[i + n] / (256 * 256);
    const spring = rgb(kind === 'grass' ? '#bdcf98' : '#e0d1ac'), target = rgb(kind === 'grass' ? theme.tiles[0] : theme.path[0]);
    const delta = spring.map((v, n) => (v - mean[n]) * (kind === 'grass' ? .35 : .8) + target[n] - v);
    for (let i = 0; i < pixels.data.length; i += 4) for (let n = 0; n < 3; n++) pixels.data[i + n] += delta[n];
    c.putImageData(pixels, 0, 0); look[kind] = canvas;
  }
  grades.set(theme, look); return look;
}

/** A world-anchored material, projected once onto the floor. Clip shapes never restart the texture at tile edges. */
export function paintGroundMaterial(c: CanvasRenderingContext2D, kind: Material, theme: GroundTheme, screen: Screen, unit: number, clips?: Point[][]) {
  const look = materials(theme); if (!look) return false;
  c.save(); c.imageSmoothingEnabled = false;
  if (clips) {
    c.beginPath();
    for (const points of clips) { points.forEach((p, i) => { const q = screen(p); if (i) c.lineTo(Math.round(q.x), Math.round(q.y)); else c.moveTo(Math.round(q.x), Math.round(q.y)); }); c.closePath(); }
    c.clip();
  }
  const origin = screen({ x: 0, z: 0 }), pixelsPerTile = 16;
  c.transform(unit / pixelsPerTile, unit / (pixelsPerTile * 2), -unit / pixelsPerTile, unit / (pixelsPerTile * 2), origin.x, origin.y);
  c.fillStyle = c.createPattern(look[kind], 'repeat')!;
  c.fillRect(-HALF * pixelsPerTile, -HALF * pixelsPerTile, GARDEN * pixelsPerTile, GARDEN * pixelsPerTile);
  c.restore(); return true;
}
