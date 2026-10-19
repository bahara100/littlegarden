import { footprint, type PlacedItem, type Point } from './layout';
import { preparePondFish, pondFishArt } from './pondFish';

let image: HTMLImageElement | undefined;
let loading: Promise<void> | undefined;
/** A single shared sprite, loaded before either renderer draws its cached ground. */
export function loadPondArt() {
  return loading ??= (async () => {
    const source = new Image(); source.src = `${import.meta.env.BASE_URL}sprites/garden/pond-v2/pond.png`;
    await source.decode(); image = source; preparePondFish(source);
  })();
}

export function paintPondSprite(c: CanvasRenderingContext2D, item: PlacedItem, screen: (p: Point) => { x: number; y: number }, unit: number) {
  if (!image) return false;
  paintPondLayer(c, image, item, screen, unit); return true;
}
function paintPondLayer(c: CanvasRenderingContext2D, source: CanvasImageSource, item: PlacedItem, screen: (p: Point) => { x: number; y: number }, unit: number) {
  const p = screen(item), f = footprint(item), scale = (f.w + f.d) * unit / 240;
  c.save(); c.imageSmoothingEnabled = false;
  c.translate(Math.round(p.x), Math.round(p.y));
  if (item.turn % 2) c.scale(-1, 1);
  // Ground contact is below the image centre because the far stones rise above the water.
  c.drawImage(source, Math.round(-128 * scale), Math.round(-90 * scale), Math.round(256 * scale), Math.round(160 * scale));
  c.restore();
}
export function paintPondFish(c: CanvasRenderingContext2D, item: PlacedItem, screen: (p: Point) => { x: number; y: number }, unit: number, seconds: number, still = false) {
  const fish = pondFishArt(seconds, still); if (fish) paintPondLayer(c, fish, item, screen, unit);
}
