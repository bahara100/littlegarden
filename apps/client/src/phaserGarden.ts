import * as Phaser from 'phaser';
import { LayoutEditor } from './editor';
import { CATALOG, EQUIPMENT_SCALE, cloneLayout, footprint, type ItemKind, type Layout, type PlacedItem, type Point } from './layout';
import { LifeSimulation, type Avatar, type AvatarId, type EquipmentId, type Seat } from './simulation';
import { depth, pixelEllipse, project, unproject } from './isometric';
import { friendSide, scarletDirection } from './scarletDirections';
import { SCARLET_SD, SCARLET_SD_DIRECTIONS, SCARLET_SD_SPEED, ScarletWalkCycle } from './scarletApproved';
import { loadPixelAtlas } from './pixelAtlas';
import type { Selection } from './pixelGarden';

type Callbacks = { select(id: Selection): void; zoom(value: number): void; error(): void; notice(message: string): void };

/** Logical pixels per ground unit. The camera scales this to the viewport, nearest-neighbour. */
const U = 18;
const FRIEND_SIT_LIFT = { bench: .45, swing: .5 } as const;
const PROP_WIDTH: Record<ItemKind, number> = { bench: 5.4 * EQUIPMENT_SCALE.bench, swing: 6.1 * EQUIPMENT_SCALE.swing, tree: 3.9, flower: 3, fence: 3, path: 1 };
/**
 * Swing layers from tools/art/split-swing-v1.py: rows are props cells 2 (seat faces down-right) and 3 (down-left),
 * columns [far frame, ropes + seat, top bar, near frame], 444 source pixels each. `pivots` are the rope tops on the bar
 * and `seat` the middle of the seat, in cell source pixels; `forward` is the seat's screen-x direction.
 */
const SWING_CELL = 444;
const SWING_RIG = {
  2: { row: 0, pivots: [[182, 140], [285, 101]], seat: [245, 292], forward: 1 },
  3: { row: 1, pivots: [[160, 97], [262, 135]], seat: [200, 292], forward: -1 },
} as const;
/** Largest rope angle, one back-and-forth in seconds, and pre-drawn poses on each side of hanging still. */
const SWING = { max: 18 * Math.PI / 180, period: 2.4, poses: 16, pad: 24 } as const;
type SwingCell = keyof typeof SWING_RIG;
type SwingView = { hang: Phaser.GameObjects.Image; bar: Phaser.GameObjects.Image; near: Phaser.GameObjects.Image };
const FLOOR = { w: 32 * U + 4, h: 16 * U + 16, ox: 16 * U + 2, oy: 8 * U + 2 };
const iso = (p: Point) => project(p, U);
const propIndex = (item: PlacedItem) => { const odd = item.turn % 2; return item.kind === 'bench' ? 1 - odd : item.kind === 'swing' ? 3 - odd : item.kind === 'tree' ? 4 : item.kind === 'flower' ? 5 : 6 + odd; };

/** One sheet cell on its own canvas, with the soft edge pixels (alpha < 180) cleared. */
function cutCell(image: CanvasImageSource, x: number, y: number, w: number, h: number) {
  const cell = document.createElement('canvas'); cell.width = Math.ceil(w); cell.height = Math.ceil(h);
  const c = cell.getContext('2d')!; c.drawImage(image, x, y, w, h, 0, 0, w, h);
  const px = c.getImageData(0, 0, cell.width, cell.height);
  for (let i = 3; i < px.data.length; i += 4) if (px.data[i] < 180) px.data[i] = 0;
  c.putImageData(px, 0, 0);
  return cell;
}
type CellFit = { left: number; top: number; sw: number; sh: number; dw: number; dh: number };
/** Opaque bounds of a cell, scaled so the longer side is 124 px. */
function fitCell(cell: HTMLCanvasElement): CellFit {
  const px = cell.getContext('2d')!.getImageData(0, 0, cell.width, cell.height).data;
  let left = cell.width, top = cell.height, right = 0, bottom = 0;
  for (let y = 0; y < cell.height; y++) for (let x = 0; x < cell.width; x++) if (px[(y * cell.width + x) * 4 + 3]) {
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const sw = right - left + 1, sh = bottom - top + 1, scale = 124 / Math.max(sw, sh);
  return { left, top, sw, sh, dw: Math.round(sw * scale), dh: Math.round(sh * scale) };
}
/** A 128×128 texture: the fitted cell bottom-centred, nearest-neighbour. */
function drawFit(cell: HTMLCanvasElement, f: CellFit) {
  const out = document.createElement('canvas'); out.width = out.height = 128;
  const oc = out.getContext('2d')!; oc.imageSmoothingEnabled = false;
  oc.drawImage(cell, f.left, f.top, f.sw, f.sh, (128 - f.dw) / 2, 128 - f.dh, f.dw, f.dh);
  return out;
}

function diamond(c: CanvasRenderingContext2D, p: Point, w: number, d: number, color: string, line?: string) {
  const pts = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z]) => iso({ x: p.x + x, z: p.z + z }));
  c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(Math.round(q.x + FLOOR.ox), Math.round(q.y + FLOOR.oy)) : c.moveTo(Math.round(q.x + FLOOR.ox), Math.round(q.y + FLOOR.oy))); c.closePath();
  c.fillStyle = color; c.fill(); if (line) { c.strokeStyle = line; c.lineWidth = 1; c.stroke(); }
}

/** Phaser presentation with the same public surface as PixelGarden; simulation, editor and saves are shared. */
export class PhaserGarden {
  readonly life = new LifeSimulation(Math.random, { character: SCARLET_SD_SPEED });
  readonly editor = new LayoutEditor();
  scarletModel: 'loading' | 'ready' | 'fallback' = 'loading';
  selectedAvatar: AvatarId = 'character';
  selection: Selection = 'character';
  zoom = 1;
  pan = { x: 0, y: 0 };
  grid = false;
  shadows = true;
  focus: AvatarId | null = null;
  private game: Phaser.Game;

  constructor(host: HTMLElement, readonly callbacks: Callbacks) {
    this.game = new Phaser.Game({
      type: Phaser.AUTO, parent: host, backgroundColor: '#eae9de', pixelArt: true, roundPixels: true,
      scale: { mode: Phaser.Scale.RESIZE, width: Math.max(160, host.clientWidth), height: Math.max(160, host.clientHeight) },
      scene: new GardenScene(this), banner: false,
    });
    this.game.canvas.setAttribute('aria-label', '도트 놀이터');
    this.reset();
    if (import.meta.env.DEV) Object.assign(window, { garden: this });
  }
  select(id: Selection) { this.selection = id; if (this.life.avatars.has(id as AvatarId)) this.selectedAvatar = id as AvatarId; this.callbacks.select(id); }
  commandUse(id: EquipmentId) { const error = this.life.use(this.selectedAvatar, id); this.callbacks.notice(error ?? '친구가 기구로 가요.'); }
  commandKind(kind: 'bench' | 'swing') {
    for (const seat of this.life.seats.filter(s => s.kind === kind && !this.life.reservations.has(s.id))) if (!this.life.use(this.selectedAvatar, seat.equipment)) { this.callbacks.notice('친구가 빈자리로 가요.'); return; }
    this.callbacks.notice('빈자리가 없거나 먼저 기구에서 내려와야 해요.');
  }
  leaveSeat() { this.life.leave(this.selectedAvatar); }
  resume() { this.life.resume(this.selectedAvatar); this.callbacks.notice('자유롭게 놀도록 했어요.'); }
  wave() { const error = this.life.wave(this.selectedAvatar); this.callbacks.notice(error ?? '반가워요! ♡'); }
  zoomBy(factor: number) { this.zoom = Math.max(.65, Math.min(5, this.zoom * factor)); this.callbacks.zoom(Math.round(this.zoom * 100)); }
  reset() { this.focus = null; this.pan = { x: 0, y: 0 }; this.zoom = 1; this.callbacks.zoom(100); }
  focusFriend() { this.focus = this.selectedAvatar; this.pan = { x: 0, y: 0 }; this.zoom = 3; this.callbacks.zoom(300); }
  setGrid(show: boolean) { this.grid = show; }
  setShadows(show: boolean) { this.shadows = show; }
  enterEdit() { this.reset(); this.editor.enter(); }
  cancelEdit() { this.editor.cancel(); this.select(this.selectedAvatar); }
  applyEdit() { const error = this.editor.apply(); if (error) return error; this.life.applyLayout(this.editor.committed.items); this.select(this.selectedAvatar); return null; }
  restoreLayout(layout: Layout) { this.editor.committed = cloneLayout(layout); this.editor.enter(); return this.applyEdit(); }
  beginPlacement(kind: ItemKind) { return this.editor.begin(kind); }
  moveItem() { if (this.editor.selected) this.editor.move(this.editor.selected); }
  rotateItem() { this.editor.rotate(); }
  placeItem() { return this.editor.place(); }
  cancelPlacement() { this.editor.cancelPlacement(); }
  storeItem() { return this.editor.store(); }
  restoreItem(id: string) { this.editor.restore(id); }
  positionItem(x: number, z: number) { this.editor.position(x, z); }
  dispose() { this.game.destroy(true); }
}

type AvatarView = { sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };

class GardenScene extends Phaser.Scene {
  private ready = false;
  private walkCycle = new ScarletWalkCycle();
  private propWidths: number[] = [];
  private props = new Map<string, Phaser.GameObjects.Image>();
  /** Per swing cell: width of the trimmed art in its 128 texture and the seat's depth below the rope tops there. */
  private swingArt = new Map<SwingCell, { width: number; seatDrop: number }>();
  private swingViews = new Map<string, SwingView>();
  /** Per swing item: swing phase (radians) and how hard it swings (0 = hanging still, 1 = full swing). */
  private swingMotion = new Map<string, { phase: number; amp: number }>();
  private ghost!: Phaser.GameObjects.Image;
  private avatars = new Map<AvatarId, AvatarView>();
  private ring!: Phaser.GameObjects.Image;
  private floor!: Phaser.Textures.CanvasTexture;
  private overlay!: Phaser.Textures.CanvasTexture;
  private floorKey = '';
  private overlayKey = '';
  /** Any drag past 6px pans the view; a press that stays put is a click. */
  private drag: { x: number; y: number; sx: number; sy: number; moved: boolean } | null = null;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');

  constructor(private g: PhaserGarden) { super('garden'); }

  preload() {
    const base = import.meta.env.BASE_URL;
    this.load.on('loaderror', () => this.fail(new Error('Pixel art load failed')));
    this.load.image('props', `${base}sprites/garden/playground-props-v1.png`);
    this.load.image('swing-parts', `${base}sprites/garden/playground-swing-v1.png`);
    for (const [source, art] of Object.entries(SCARLET_SD.sources)) {
      this.load.image(`idle-${source}`, `${base}${art.idle}`);
      this.load.spritesheet(`walk-${source}`, `${base}${art.walk}`, { frameWidth: SCARLET_SD.frameSize, frameHeight: SCARLET_SD.frameSize });
    }
  }
  /** Bench and swing art only has front views: turns 0 and 3 face down-left (SW), turns 1 and 2 down-right (SE). */
  private seatFacing(seat: Seat): 'sw' | 'se' {
    const turn = this.g.life.layout.find(i => i.id === seat.equipment)?.turn ?? 0;
    return turn === 0 || turn === 3 ? 'sw' : 'se';
  }

  async create() {
    if (this.g.scarletModel === 'fallback') return;
    try {
      this.input.mouse?.disableContextMenu();
      this.makeProps(); this.makeSwings(); this.makeShapes(); await this.makeFriends();
    } catch (error) { this.fail(error); return; }
    this.floor = this.textures.createCanvas('floor', FLOOR.w, FLOOR.h)!;
    this.overlay = this.textures.createCanvas('overlay', FLOOR.w, FLOOR.h)!;
    this.add.image(-FLOOR.ox, -FLOOR.oy, 'floor').setOrigin(0).setDepth(-1000);
    this.add.image(-FLOOR.ox, -FLOOR.oy, 'overlay').setOrigin(0).setDepth(9999);
    this.ghost = this.add.image(0, 0, 'prop0').setOrigin(.5, 1).setAlpha(.65).setVisible(false);
    for (const a of this.g.life.avatars.values()) {
      const scarlet = a.id === 'character', size = U * (scarlet ? SCARLET_SD.worldSize : 2.8);
      const sprite = this.add.sprite(0, 0, scarlet ? 'idle-se' : 'friends', scarlet ? undefined : a.id === 'peach' ? 0 : 4)
        .setOrigin(.5, scarlet ? SCARLET_SD.originY : .97).setDisplaySize(size, size).setInteractive({ pixelPerfect: true });
      sprite.setData('id', a.id);
      const shadow = this.add.image(0, 0, 'shadow');
      const label = this.add.text(0, 0, '', { fontFamily: 'sans-serif', fontSize: '8px', color: '#65556f', resolution: 6 }).setOrigin(.5, 1);
      this.avatars.set(a.id, { sprite, shadow, label });
    }
    this.ring = this.add.image(0, 0, 'ring');
    this.input.on('pointerdown', this.pointerDown, this);
    this.input.on('pointermove', this.pointerMove, this);
    this.input.on('pointerup', this.pointerUp, this);
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.g.zoomBy(Math.exp(-dy * .001)));
    this.ready = true;
    this.g.scarletModel = 'ready'; this.g.callbacks.notice('도트 놀이터에 오신 걸 환영해요. 바닥을 눌러 걸어보세요.');
  }
  private fail(error: unknown) {
    if (this.g.scarletModel === 'fallback') return;
    this.g.scarletModel = 'fallback'; this.g.callbacks.error(); console.error('Pixel art load failed', error);
  }

  /** Same per-cell alpha trim as the Canvas renderer: one 128×128 texture per prop pose. */
  private makeProps() {
    const image = this.textures.get('props').getSourceImage() as HTMLImageElement;
    const w = image.naturalWidth / 4, h = image.naturalHeight / 2;
    for (let n = 0; n < 8; n++) {
      const cell = cutCell(image, n % 4 * w, Math.floor(n / 4) * h, w, h), fit = fitCell(cell);
      this.textures.addCanvas(`prop${n}`, drawFit(cell, fit)); this.propWidths.push(fit.dw);
    }
  }
  /**
   * Swing art in four layers, trimmed and scaled exactly like the whole cell, plus the ropes + seat drawn in
   * 2 * poses + 1 swing angles. A rope swinging by θ toward the seat's front (a ground diagonal, U·(±1, ½) per
   * tile) moves a point d pixels below the rope tops by d·(±sin θ, ½ sin θ − (1 − cos θ)): an affine map
   * that keeps the rope tops on the bar.
   */
  private makeSwings() {
    const image = this.textures.get('swing-parts').getSourceImage() as HTMLImageElement, { pad, poses, max } = SWING;
    for (const [key, rig] of Object.entries(SWING_RIG)) {
      const cell = Number(key) as SwingCell, y = rig.row * SWING_CELL;
      const layers = [0, 1, 2, 3].map(col => cutCell(image, col * SWING_CELL, y, SWING_CELL, SWING_CELL));
      const whole = document.createElement('canvas'); whole.width = whole.height = SWING_CELL;
      for (const layer of layers) whole.getContext('2d')!.drawImage(layer, 0, 0);
      const fit = fitCell(whole), [back, hang, bar, near] = layers.map(layer => drawFit(layer, fit));
      this.textures.addCanvas(`swing${cell}-back`, back); this.textures.addCanvas(`swing${cell}-bar`, bar); this.textures.addCanvas(`swing${cell}-near`, near);
      // Cell source pixels → padded pose-frame pixels.
      const at = ([x, y]: readonly number[]) => ({ x: (x - fit.left) * fit.dw / fit.sw + (128 - fit.dw) / 2 + pad, y: (y - fit.top) * fit.dh / fit.sh + 128 - fit.dh + pad });
      const p1 = at(rig.pivots[0]), p2 = at(rig.pivots[1]), seat = at(rig.seat);
      const m = (p2.y - p1.y) / (p2.x - p1.x), y0 = p1.y - m * p1.x;
      this.swingArt.set(cell, { width: fit.dw, seatDrop: seat.y - y0 - m * seat.x });
      const size = 128 + pad * 2, sheet = document.createElement('canvas'); sheet.width = size * (poses * 2 + 1); sheet.height = size;
      const c = sheet.getContext('2d')!; c.imageSmoothingEnabled = false;
      for (let k = -poses; k <= poses; k++) {
        const t = max * k / poses, a = rig.forward * Math.sin(t), b = Math.sin(t) / 2 - (1 - Math.cos(t));
        c.setTransform(1 - a * m, -b * m, a, 1 + b, (k + poses) * size - a * y0, -b * y0);
        c.drawImage(hang, pad, pad);
      }
      const tex = this.textures.addCanvas(`swing${cell}-hang`, sheet)!;
      for (let i = 0; i <= poses * 2; i++) tex.add(i, 0, i * size, 0, size, size);
    }
  }
  private makeShapes() {
    const shape = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) => {
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; draw(canvas.getContext('2d')!, w, h); this.textures.addCanvas(key, canvas);
    };
    // A round foot shadow (2:1 like the floor) rather than a tile-shaped diamond, so it never reads as a grid cell.
    shape('shadow', Math.round(1.1 * U), Math.round(.55 * U), (c, w, h) => { c.fillStyle = '#8fa67a'; pixelEllipse(c, w / 2, h / 2, w / 2, h / 2); });
    shape('ring', Math.round(1.4 * U) + 2, Math.round(.64 * U) + 2, (c, w, h) => { c.strokeStyle = '#fff4bd'; c.lineWidth = 1; c.beginPath(); c.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2); c.stroke(); });
  }
  private async makeFriends() {
    // Down-right sheets and their left-right mirrors (tools/art/make-garden-friends-mirror-v1.py), same 4x2 cell order.
    const sheets = [['friends', 'garden-friends-v1'], ['friends-sw', 'garden-friends-sw-v1'], ['friends-sit', 'garden-friends-sit-v1'], ['friends-sit-sw', 'garden-friends-sit-sw-v1']];
    const atlases = await Promise.all(sheets.map(([, file]) => loadPixelAtlas(`sprites/garden/${file}.png`)));
    sheets.forEach(([key], n) => {
      const tex = this.textures.addCanvas(key, atlases[n])!;
      // Walk sheets fill all 8 cells; seated sheets only cells 0 (Momo) and 4 (Lulu).
      for (const i of key.startsWith('friends-sit') ? [0, 4] : [0, 1, 2, 3, 4, 5, 6, 7]) tex.add(i, 0, i % 4 * 96, Math.floor(i / 4) * 96, 96, 96);
    });
  }

  private get items() { const e = this.g.editor; return e.active ? e.draft.items.filter(i => i.id !== e.pending?.id) : this.g.life.layout; }

  /** Floor, paths and prop shadows, redrawn only when they change. */
  private drawFloor(items: PlacedItem[]) {
    const lines = this.g.grid || this.g.editor.active;
    const key = JSON.stringify([lines, this.g.shadows, items.map(i => [i.kind, i.x, i.z, i.turn])]);
    if (key === this.floorKey) return; this.floorKey = key;
    const c = this.floor.getContext(); c.clearRect(0, 0, FLOOR.w, FLOOR.h);
    const corners = [{ x: -8, z: -8 }, { x: 8, z: -8 }, { x: 8, z: 8 }, { x: -8, z: 8 }].map(p => { const q = iso(p); return { x: q.x + FLOOR.ox, y: q.y + FLOOR.oy }; });
    for (const [a, b, color] of [[corners[1], corners[2], '#81966d'], [corners[2], corners[3], '#9cac7c']] as const) {
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(b.x, b.y + 9); c.lineTo(a.x, a.y + 9); c.closePath(); c.fillStyle = color; c.fill(); c.strokeStyle = '#718666'; c.lineWidth = 1; c.stroke();
    }
    for (let x = -7.5; x < 8; x++) for (let z = -7.5; z < 8; z++) {
      const hash = Math.abs(Math.round(x * 11 + z * 23)) % 5;
      diamond(c, { x, z }, 1, 1, ['#bdcf98', '#b8ca92', '#b5c88c', '#c2d29d', '#bbce94'][hash], lines ? '#91ab7a' : undefined);
      if (hash === 2) { const p = iso({ x, z }), px = Math.round(p.x + FLOOR.ox), py = Math.round(p.y + FLOOR.oy); c.fillStyle = '#8fae77'; c.fillRect(px, py - 1, 1, 2); c.fillRect(px + 2, py, 2, 1); }
    }
    for (const item of items.filter(i => i.kind === 'path')) {
      const f = footprint(item); diamond(c, item, f.w, f.d, '#e0d1ac', '#c6b88f');
      const p = iso(item); c.fillStyle = '#eee3c7'; c.fillRect(Math.round(p.x + FLOOR.ox) - 2, Math.round(p.y + FLOOR.oy) - 1, 3, 1);
    }
    // The two fixed navigation obstacles: a picnic rug and a garden sign.
    diamond(c, { x: -3.5, z: 4.4 }, 2.1, 1.65, '#e8b8a7', '#a97e7e');
    for (let x = -4.4; x < -2.5; x += .4) for (let z = 3.7; z < 5.1; z += .4) diamond(c, { x, z }, .2, .2, '#f7e7d1');
    if (this.g.shadows) for (const item of items.filter(i => i.kind !== 'path')) diamond(c, item, Math.min(2.5, CATALOG[item.kind].w), .65, '#9baf80');
    const s = iso({ x: -.1, z: -6.2 }), sx = Math.round(s.x + FLOOR.ox), sy = Math.round(s.y + FLOOR.oy);
    c.fillStyle = '#766454'; c.fillRect(sx - 1, sy - 14, 2, 14); c.fillStyle = '#f8e8bd'; c.fillRect(sx - 9, sy - 20, 18, 9); c.fillStyle = '#b6b989'; c.fillRect(sx - 6, sy - 17, 10, 2);
    this.floor.refresh();
  }
  /** Editor footprints: the selected item and the piece being placed. */
  private drawOverlay() {
    const e = this.g.editor, pending = e.pending, selected = e.active && !pending ? e.draft.items.find(i => i.id === e.selected) : undefined;
    const error = pending ? !!e.error : false;
    const key = JSON.stringify([pending, selected, error]);
    if (key === this.overlayKey) return; this.overlayKey = key;
    const c = this.overlay.getContext(); c.clearRect(0, 0, FLOOR.w, FLOOR.h);
    if (pending?.kind === 'path') diamond(c, pending, 1, 1, error ? '#d07880' : '#fff4bc', '#66547b');
    else {
      c.globalAlpha = .45;
      for (const item of [pending, selected]) if (item) { const f = footprint(item); diamond(c, item, f.w, f.d, item === pending && error ? '#d07880' : '#fff4bc', '#66547b'); }
      c.globalAlpha = 1;
    }
    this.overlay.refresh();
  }
  private placeProp(image: Phaser.GameObjects.Image, item: PlacedItem) {
    const index = propIndex(item), size = PROP_WIDTH[item.kind] * U * 128 / this.propWidths[index], p = iso(item);
    image.setTexture(`prop${index}`).setPosition(p.x, p.y + U * .2).setDisplaySize(size, size).setFlipX(item.turn >= 2).setDepth(depth(item));
  }
  /** Current pose of a swing: its ropes + seat frame, and where its seat moved (world px; `ground` is the part along the floor). */
  private swingPose(item: PlacedItem) {
    const cell = propIndex(item) as SwingCell, art = this.swingArt.get(cell)!, motion = this.swingMotion.get(item.id);
    const k = motion ? Math.round(motion.amp * Math.sin(motion.phase) * SWING.poses) : 0, t = SWING.max * k / SWING.poses;
    const d = art.seatDrop * PROP_WIDTH.swing * U / art.width, forward = SWING_RIG[cell].forward * (item.turn >= 2 ? -1 : 1);
    return { frame: k + SWING.poses, x: forward * Math.sin(t) * d, y: (Math.sin(t) / 2 - (1 - Math.cos(t))) * d, ground: Math.sin(t) / 2 * d };
  }
  /**
   * Far frame behind the rider, ropes + seat just behind the rider, near frame in front of both. The bar is above
   * the rider at rest and swinging forward, but in front of them once the seat swings back under it.
   */
  private placeSwing(image: Phaser.GameObjects.Image, item: PlacedItem) {
    const cell = propIndex(item) as SwingCell, size = PROP_WIDTH.swing * U * 128 / this.swingArt.get(cell)!.width;
    const p = iso(item), x = p.x, y = p.y + U * .2, z = depth(item), flip = item.turn >= 2, framed = size * (128 + SWING.pad * 2) / 128;
    let view = this.swingViews.get(item.id);
    if (!view) {
      const part = (originY: number) => { const o = this.add.image(0, 0, 'prop0').setOrigin(.5, originY).setInteractive({ pixelPerfect: true }); o.setData('id', item.id); return o; };
      view = { hang: part((128 + SWING.pad) / (128 + SWING.pad * 2)), bar: part(1), near: part(1) };
      this.swingViews.set(item.id, view);
    }
    image.setTexture(`swing${cell}-back`).setPosition(x, y).setDisplaySize(size, size).setFlipX(flip).setDepth(z);
    const frame = this.swingPose(item).frame;
    view.hang.setTexture(`swing${cell}-hang`, frame).setPosition(x, y).setDisplaySize(framed, framed).setFlipX(flip).setDepth(z + .3);
    view.bar.setTexture(`swing${cell}-bar`).setPosition(x, y).setDisplaySize(size, size).setFlipX(flip).setDepth(z + (frame < SWING.poses ? .4 : .32));
    view.near.setTexture(`swing${cell}-near`).setPosition(x, y).setDisplaySize(size, size).setFlipX(flip).setDepth(z + .4);
  }
  /** A swing sways while someone swings on it and settles once they stop; reduced motion keeps every swing still. */
  private moveSwings(dt: number, still: boolean) {
    const riding = new Set([...this.g.life.avatars.values()].filter(a => a.phase === 'swinging').map(a => this.g.life.seatOf(a)?.equipment));
    const live = new Set<string>();
    for (const item of this.g.life.layout) {
      if (item.kind !== 'swing') continue;
      live.add(item.id);
      const m = this.swingMotion.get(item.id) ?? { phase: 0, amp: 0 };
      // Builds up over a second and a half, stops within about half a second while the rider gets off.
      m.amp = still ? 0 : riding.has(item.id) && !this.g.editor.active ? Math.min(1, m.amp + dt / 1.5) : Math.max(0, m.amp - dt / .6);
      m.phase = m.amp ? m.phase + dt * Math.PI * 2 / SWING.period : 0;
      this.swingMotion.set(item.id, m);
    }
    for (const id of this.swingMotion.keys()) if (!live.has(id)) this.swingMotion.delete(id);
  }
  private syncProps(items: PlacedItem[]) {
    const editing = this.g.editor.active, live = new Set<string>();
    for (const item of items) {
      if (item.kind === 'path') continue;
      live.add(item.id);
      let image = this.props.get(item.id);
      if (!image) { image = this.add.image(0, 0, 'prop0').setOrigin(.5, 1).setInteractive({ pixelPerfect: true }); image.setData('id', item.id); this.props.set(item.id, image); }
      if (item.kind === 'swing') this.placeSwing(image, item); else this.placeProp(image, item);
      // Outside the editor only seats are clickable, so trees and fences never swallow floor clicks.
      image.input!.enabled = editing || item.kind === 'bench' || item.kind === 'swing';
    }
    for (const [id, image] of this.props) if (!live.has(id)) { image.destroy(); this.props.delete(id); }
    for (const [id, view] of this.swingViews) if (!live.has(id)) { for (const o of Object.values(view)) o.destroy(); this.swingViews.delete(id); }
    const pending = this.g.editor.pending;
    this.ghost.setVisible(!!pending && pending.kind !== 'path');
    if (pending && pending.kind !== 'path') this.placeProp(this.ghost, pending);
  }
  private placeAvatar(a: Avatar, still: boolean) {
    const view = this.avatars.get(a.id)!, p = iso(a), seat = this.g.life.seatOf(a), editing = this.g.editor.active;
    for (const o of [view.sprite, view.shadow, view.label]) o.setVisible(!editing);
    view.sprite.input!.enabled = !editing;
    if (editing) return;
    const seated = seat && ['boarding', 'seated', 'swinging', 'leaving'].includes(a.phase) ? a.progress : 0;
    // Drawn seated poses bend the legs themselves, so they only need the seat height above the ground point.
    const facing = seat && seated ? this.seatFacing(seat) : null;
    const friendSit = a.id !== 'character' && !!facing && this.textures.exists('friends-sit');
    // While still standing at the start of sitting down (or end of getting up) the feet stay on the ground.
    // New SD sitting art is not made yet. Keep its new idle instead of changing costume to the old sit sheet.
    const drawnSit = friendSit;
    const standingOnSeat = drawnSit && (a.phase === 'boarding' || a.phase === 'leaving') && seated < .45;
    const lift = !drawnSit ? seated * .75 : standingOnSeat ? 0 : seated * FRIEND_SIT_LIFT[seat!.kind];
    // A rider is always drawn in front of the bench art and the swing seat, whichever end of it the seat is on,
    // and behind the swing's near frame (and its bar while swinging back). On a swing the rider moves with the seat.
    const equipment = seat && this.g.life.layout.find(i => i.id === seat.equipment);
    const z = seat && seated ? Math.max(depth(a), equipment ? depth(equipment) : depth(a)) + .35 : depth(a);
    const swing = seated && equipment?.kind === 'swing' ? this.swingPose(equipment) : { x: 0, y: 0, ground: 0 };
    const x = p.x + swing.x, base = p.y - lift * U + swing.y, moving = a.phase === 'walking' && !still;
    view.shadow.setPosition(x, p.y + swing.ground).setDepth(z - .01).setVisible(this.g.shadows);
    view.sprite.setPosition(x, base).setDepth(z);
    if (a.id === 'character') {
      const { source, flipX } = SCARLET_SD_DIRECTIONS[facing ?? scarletDirection(a.yaw)];
      if (moving) view.sprite.setTexture(`walk-${source}`, this.walkCycle.frame);
      else view.sprite.setTexture(`idle-${source}`);
      view.sprite.setFlipX(flipX).setDisplaySize(U * SCARLET_SD.worldSize, U * SCARLET_SD.worldSize);
    } else if (friendSit && !standingOnSeat) {
      // The seated frame is made from the down-right idle pose; a down-left seat uses its mirrored sheet.
      view.sprite.setTexture(facing === 'sw' ? 'friends-sit-sw' : 'friends-sit', a.id === 'peach' ? 0 : 4).setFlipX(false);
    } else {
      const sheet = friendSide(a.yaw) === 'sw' ? 'friends-sw' : 'friends';
      view.sprite.setTexture(sheet, (a.id === 'peach' ? 0 : 4) + (moving ? 1 + Math.floor(this.g.life.time * 7) % 3 : 0)).setFlipX(false);
    }
    view.label.setText(a.phase === 'waving' ? '♡' : seated ? seat?.kind === 'swing' ? '♪' : '···' : '')
      .setPosition(x, base - view.sprite.displayHeight * view.sprite.originY - 3).setDepth(z + .02);
    if (a.id === this.g.selectedAvatar) this.ring.setPosition(x, p.y + swing.ground).setDepth(z - .005);
  }
  private camera() {
    const cam = this.cameras.main, { width, height } = this.scale;
    cam.setZoom(Math.min(width / 35, height / 24) / U * this.g.zoom);
    const a = this.g.focus && this.g.life.avatars.get(this.g.focus), t = a ? iso(a) : { x: 0, y: 0 };
    cam.centerOn(t.x - this.g.pan.x / cam.zoom, t.y - (this.g.pan.y + height * .06) / cam.zoom);
  }

  update(_t: number, ms: number) {
    if (!this.ready || document.hidden) return;
    const dt = Math.min(.1, ms / 1000), still = this.reduced.matches, editing = this.g.editor.active;
    const character = this.g.life.avatars.get('character')!, before = { x: character.x, z: character.z };
    if (!editing) this.g.life.update(dt);
    this.moveSwings(dt, still);
    this.walkCycle.advance(Math.hypot(character.x - before.x, character.z - before.z), !editing && character.phase === 'walking');
    const items = this.items;
    this.drawFloor(items); this.drawOverlay(); this.syncProps(items);
    for (const a of this.g.life.avatars.values()) this.placeAvatar(a, still);
    this.ring.setVisible(!editing);
    this.camera();
  }

  private ground(p: Phaser.Input.Pointer) { const w = this.cameras.main.getWorldPoint(p.x, p.y); return unproject(w.x, w.y, U); }
  private pick(p: Phaser.Input.Pointer): string | undefined {
    const hit = (this.input.hitTestPointer(p) as Phaser.GameObjects.Image[]).filter(o => o.input?.enabled).sort((a, b) => b.depth - a.depth)[0];
    if (hit) return hit.getData('id');
    // Floor items remain selectable in the editor even though they are drawn on the floor texture.
    if (this.g.editor.active) {
      const q = this.ground(p);
      return [...this.g.editor.draft.items].reverse().find(i => { const f = footprint(i); return Math.abs(q.x - i.x) <= f.w / 2 && Math.abs(q.z - i.z) <= f.d / 2; })?.id;
    }
  }
  private pointerDown(p: Phaser.Input.Pointer) {
    if (p.button !== 0 && p.button !== 2) return;
    this.drag = { x: p.x, y: p.y, sx: this.g.pan.x, sy: this.g.pan.y, moved: false };
  }
  private pointerMove(p: Phaser.Input.Pointer) {
    const d = this.drag, canvas = this.game.canvas;
    if (d && p.isDown) {
      if (Math.hypot(p.x - d.x, p.y - d.y) > 6) d.moved = true;
      if (d.moved) { canvas.style.cursor = 'grabbing'; this.g.focus = null; this.g.pan = { x: d.sx + p.x - d.x, y: d.sy + p.y - d.y }; }
      return;
    }
    canvas.style.cursor = this.pick(p) ? 'pointer' : 'crosshair';
    const e = this.g.editor;
    if (e.active && e.pending) { const q = this.ground(p); e.followPointer(q.x, q.z); }
  }
  private pointerUp(p: Phaser.Input.Pointer) {
    const d = this.drag; this.drag = null;
    if (!d || d.moved || p.button === 2) return;
    const g = this.g, target = this.ground(p);
    if (g.editor.active) {
      if (g.editor.pending) { g.editor.position(target.x, target.z); g.callbacks.notice(g.editor.error ?? '위치를 고정했어요. «여기에 놓기»를 눌러주세요.'); }
      else { g.editor.selected = this.pick(p) ?? null; g.callbacks.notice(g.editor.selectedName); }
      return;
    }
    const id = this.pick(p);
    if (id) { g.select(id); if (!g.life.avatars.has(id as AvatarId)) g.commandUse(id); }
    else { const error = g.life.moveTo(g.selectedAvatar, target); g.callbacks.notice(error ?? `${g.life.avatars.get(g.selectedAvatar)!.name}에게 이동을 부탁했어요.`); }
  }
}
