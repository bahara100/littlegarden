import * as Phaser from 'phaser';
import { LayoutEditor } from './editor';
import { PICNIC_RUG_ID, onPicnicRug } from './layout';
import { CATALOG, EQUIPMENT_SCALE, GARDEN, HALF, ZOOM, PROP_ART_BASE, SEAT_LIFT, SIGN, bridgeLift, cloneLayout, footprint, onFloor, type ItemKind, type Layout, type PlacedItem, type Point } from './layout';
import { PARK_PROPS, isParkProp, parkPropUrl, type ParkPropKind } from './parkProps';
import { naturalGroundDetails, naturalPaths, groundGrid } from './groundTexture';
import { loadGroundMaterials } from './groundMaterials';
import { makeSwingArt, SWING, swingPose as swingArtPose, swingSeatShift, type SwingCell, type SwingArt } from './swingArt';
import { SEESAW, seesawFrames, seesawFrame, seesawOffset } from './seesaw';
import { picnicTabletop, picnicGridArt } from './picnicTable';
import { benchFrontArt, benchSeatShift } from './benchArt';
import { paintPicnicRug } from './picnicRug';
import { fountainFrames, fountainFrame } from './fountainWater';
import { drinkingWaterFrames, drinkingWaterFrame } from './drinkingWater';
import { LifeSimulation, type Avatar, type AvatarId, type EquipmentId, type Seat } from './simulation';
import { CharacterBubbles } from './characterBubbles';
import { paintPond, type Point3 } from './pondArt';
import { loadPondArt, paintPondSprite, paintPondFish, pondBankArt } from './pondSprite';
import { waterBankArt, bridgeFrontArt } from './raisedWaterArt';
import { pondFishArt, pondFishFrame } from './pondFish';
import { project, unproject } from './isometric';
import { sceneOrder, walkerDepth } from './drawOrder';
import { scarletDirection } from './scarletDirections';
import { FRIEND_BODY, FRIEND_IDS, FRIEND_DIRECTIONS, FRIEND_SPEED, FriendWalkCycle, friendArt, friendTexture, type FriendId } from './friendBodyArt';
import { friendRearSitArt, friendRearSitTexture } from './friendSittingArt';
import { SCARLET2 as SCARLET_SD, SCARLET2_DIRECTIONS as SCARLET_SD_DIRECTIONS, SCARLET2_SPEED as SCARLET_SD_SPEED, Scarlet2WalkCycle as ScarletWalkCycle } from './scarlet2';
import { SCARLET2_SIT, scarlet2Sitting } from './scarlet2';
import { SNOW_WHITE, SNOW_WHITE_SIT } from './snowWhite';
import { loadPixelAtlas } from './pixelAtlas';
import type { Selection } from './pixelGarden';
import { DEFAULT_REGION, region, type RegionId } from './regions';
import { DEFAULT_SEASON, seasonGround, type SeasonId } from './seasons';

type Callbacks = { select(id: Selection): void; zoom(value: number): void; error(): void; notice(message: string): void; pet(id: AvatarId): void };
/** Two taps on the same friend within this many ms pat them. */
const DOUBLE_TAP_MS = 400;

/** Screen room the whole garden needs, in ground units across and down (a 2:1 diamond plus a little margin). */
export const FIT = { w: 2 * GARDEN + 3, h: GARDEN * 1.5 } as const;
/** Logical pixels per ground unit. The camera scales this to the viewport, nearest-neighbour. */
const U = 18;
const PROP_WIDTH = { bench: 5.4 * EQUIPMENT_SCALE.bench, swing: 6.1 * EQUIPMENT_SCALE.swing, tree: 3.9, flower: 3, fence: 3, path: 1, pond: 5 };
/**
 * Original four-part swing art plus the near rope extracted into a foreground pass.
 * Source coordinates, fitted art and all 33 moving poses are shared in swingArt.ts.
 */
type SwingView = { hang: Phaser.GameObjects.Image; rope: Phaser.GameObjects.Image; bar: Phaser.GameObjects.Image; near: Phaser.GameObjects.Image };
const FLOOR = { w: 2 * GARDEN * U + 4, h: GARDEN * U + 16, ox: GARDEN * U + 2, oy: GARDEN / 2 * U + 2 };
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

/** A polygon of ground points with height (tiles) on the floor texture: used for the pond's banks, water and stones. */
function floorPolygon(c: CanvasRenderingContext2D, pts: Point3[], color: string, line?: string) {
  c.beginPath();
  pts.forEach((p, i) => { const q = iso(p), x = Math.round(q.x + FLOOR.ox), y = Math.round(q.y + FLOOR.oy - p.h * U); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
  c.closePath(); c.fillStyle = color; c.fill(); if (line) { c.strokeStyle = line; c.lineWidth = 1; c.stroke(); }
}
function diamond(c: CanvasRenderingContext2D, p: Point, w: number, d: number, color: string, line?: string) {
  const pts = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z]) => iso({ x: p.x + x, z: p.z + z }));
  c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(Math.round(q.x + FLOOR.ox), Math.round(q.y + FLOOR.oy)) : c.moveTo(Math.round(q.x + FLOOR.ox), Math.round(q.y + FLOOR.oy))); c.closePath();
  c.fillStyle = color; c.fill(); if (line) { c.strokeStyle = line; c.lineWidth = 1; c.stroke(); }
}

/** Phaser presentation with the same public surface as PixelGarden; simulation, editor and saves are shared. */
export class PhaserGarden {
  readonly life = new LifeSimulation(Math.random, { character: SCARLET_SD_SPEED, peach: FRIEND_SPEED, lilac: FRIEND_SPEED, snow: SCARLET_SD_SPEED });
  readonly editor = new LayoutEditor();
  scarletModel: 'loading' | 'ready' | 'fallback' = 'loading';
  selectedAvatar: AvatarId = 'character';
  selection: Selection = 'character';
  zoom = 1;
  pan = { x: 0, y: 0 };
  /** Which region's ground colours are drawn (regions.ts). */
  region: RegionId = DEFAULT_REGION;
  season: SeasonId = DEFAULT_SEASON;
  /** The ground colours for the current region and season. */
  get groundTheme() { return seasonGround(region(this.region).ground, this.season); }
  focus: AvatarId | null = null;
  private game: Phaser.Game;
  readonly bubbles: CharacterBubbles;

  constructor(host: HTMLElement, readonly callbacks: Callbacks) {
    this.bubbles = new CharacterBubbles(host);
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
  commandKind(kind: Seat['kind']) {
    for (const seat of this.life.seats.filter(s => s.kind === kind && !this.life.reservations.has(s.id))) if (!this.life.use(this.selectedAvatar, seat.equipment)) { this.callbacks.notice('친구가 빈자리로 가요.'); return; }
    this.callbacks.notice('빈자리가 없거나 먼저 기구에서 내려와야 해요.');
  }
  leaveSeat() { this.life.leave(this.selectedAvatar); }
  resume() { this.life.resume(this.selectedAvatar); this.callbacks.notice('자유롭게 놀도록 했어요.'); }
  wave() { const error = this.life.wave(this.selectedAvatar); this.callbacks.notice(error ?? '반가워요! ♡'); }
  zoomBy(factor: number) { this.zoom = Math.max(ZOOM.min, Math.min(ZOOM.max, this.zoom * factor)); this.callbacks.zoom(Math.round(this.zoom * 100)); }
  reset() { this.focus = null; this.pan = { x: 0, y: 0 }; this.zoom = 1; this.callbacks.zoom(100); }
  focusFriend() { this.focus = this.selectedAvatar; this.pan = { x: 0, y: 0 }; this.zoom = ZOOM.friend; this.callbacks.zoom(Math.round(ZOOM.friend * 100)); }
  setRegion(id: RegionId) { this.region = id; }
  setSeason(id: SeasonId) { this.season = id; }
  /** Decorating starts on the whole map (no friend close-up, centred) at the zoom the player chose. */
  enterEdit() { this.focus = null; this.pan = { x: 0, y: 0 }; this.editor.enter(); }
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
  dispose() { this.game.destroy(true); this.bubbles.dispose(); }
}

type AvatarView = { sprite: Phaser.GameObjects.Sprite };

class GardenScene extends Phaser.Scene {
  private ready = false;
  private walkCycle = new ScarletWalkCycle();
  private snowWalkCycle = new ScarletWalkCycle();
  private friendCycles = { peach: new FriendWalkCycle(), lilac: new FriendWalkCycle() };
  private propWidths: number[] = [];
  private parkWidths = new Map<ParkPropKind, number>();
  private props = new Map<string, Phaser.GameObjects.Image>();
  /** Per swing cell: width of the trimmed art in its 128 texture and the seat's depth below the rope tops there. */
  private swingArt = new Map<SwingCell, SwingArt>();
  private swingViews = new Map<string, SwingView>();
  private picnicTops = new Map<string, Phaser.GameObjects.Image>();
  private benchFronts = new Map<string, Phaser.GameObjects.Image>();
  private pondFishViews = new Map<string, Phaser.GameObjects.Image>();
  private raisedWaterViews = new Map<string, Phaser.GameObjects.Image>();
  private fishFrame = -1;
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
  /** Two fingers down: the distance between them and the zoom when they landed. */
  private pinch: { distance: number; zoom: number } | null = null;
  private lastTap: { id: string; at: number } | null = null;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');

  constructor(private g: PhaserGarden) { super('garden'); }

  preload() {
    const base = import.meta.env.BASE_URL;
    this.load.on('loaderror', () => this.fail(new Error('Pixel art load failed')));
    this.load.image('props', `${base}sprites/garden/playground-props-v1.png`);
    for (const kind of Object.keys(PARK_PROPS) as ParkPropKind[]) this.load.image(`park-${kind}`, `${base}${parkPropUrl(kind)}`);
    this.load.image('swing-parts', `${base}sprites/garden/playground-swing-v1.png`);
    for (const [source, art] of Object.entries(SCARLET_SD.sources)) {
      this.load.image(`idle-${source}`, `${base}${art.idle}`);
      this.load.image(`sit-${source}`, `${base}${art.sit}`);
      this.load.spritesheet(`walk-${source}`, `${base}${art.walk}`, { frameWidth: SCARLET_SD.frameSize, frameHeight: SCARLET_SD.frameSize });
    }
    for (const [source, art] of Object.entries(SNOW_WHITE.sources)) {
      this.load.image(`snow-idle-${source}`, `${base}${art.idle}`);
      this.load.image(`snow-sit-${source}`, `${base}${art.sit}`);
      this.load.spritesheet(`snow-walk-${source}`, `${base}${art.walk}`, { frameWidth: SNOW_WHITE.frameSize, frameHeight: SNOW_WHITE.frameSize });
    }
    for (const id of FRIEND_IDS) this.load.image(friendRearSitTexture(id), `${base}${friendRearSitArt(id)}`);
    for (const id of FRIEND_IDS) for (const source of ['se', 'ne'] as const) {
      const art = friendArt(id, source);
      this.load.image(friendTexture(id, 'idle', source), `${base}${art.idle}`);
      this.load.spritesheet(friendTexture(id, 'walk', source), `${base}${art.walk}`, { frameWidth: 96, frameHeight: 96 });
    }
  }
  /** Bench and swing art only has front views: turns 0 and 3 face down-left (SW), turns 1 and 2 down-right (SE). */
  private seatFacing(seat: Seat): 'sw' | 'se' | 'nw' | 'ne' {
    const turn = this.g.life.layout.find(i => i.id === seat.equipment)?.turn ?? 0;
    if (seat.kind === 'seesaw' || seat.kind === 'picnicTable' || seat.kind === 'picnicRug') return scarletDirection(seat.yaw);
    return turn === 0 || turn === 3 ? 'sw' : 'se';
  }

  async create() {
    if (this.g.scarletModel === 'fallback') return;
    try {
      this.input.mouse?.disableContextMenu();
      await Promise.all([loadGroundMaterials(), loadPondArt()]);
      this.textures.addCanvas('pond-fish', pondFishArt(0, true)!);
      this.textures.addCanvas('pond-banks', pondBankArt()!);
      this.makeProps(); this.makeSwings(); this.makeShapes(); await this.makeFriends();
    } catch (error) { this.fail(error); return; }
    this.floor = this.textures.createCanvas('floor', FLOOR.w, FLOOR.h)!;
    this.overlay = this.textures.createCanvas('overlay', FLOOR.w, FLOOR.h)!;
    this.add.image(-FLOOR.ox, -FLOOR.oy, 'floor').setOrigin(0).setDepth(-1000);
    this.add.image(-FLOOR.ox, -FLOOR.oy, 'overlay').setOrigin(0).setDepth(9999);
    this.ghost = this.add.image(0, 0, 'prop0').setOrigin(.5, 1).setAlpha(.65).setVisible(false);
    for (const a of this.g.life.avatars.values()) {
      const tall = a.id === 'character' || a.id === 'snow', size = U * (tall ? SCARLET_SD.worldSize : 2.8);
      const sprite = this.add.sprite(0, 0, a.id === 'character' ? 'idle-se' : a.id === 'snow' ? 'snow-idle-se' : friendTexture(a.id as FriendId, 'idle', 'se'))
        .setOrigin(.5, tall ? SCARLET_SD.originY : FRIEND_BODY.originY).setDisplaySize(size, size).setInteractive({ pixelPerfect: true });
      sprite.setData('id', a.id);
      this.avatars.set(a.id, { sprite });
    }
    this.ring = this.add.image(0, 0, 'ring');
    this.input.addPointer(1);  // a second touch, for pinch zoom
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
      const fitted = drawFit(cell, fit);
      this.textures.addCanvas(`prop${n}`, fitted); this.propWidths.push(fit.dw);
      if (n < 2) this.textures.addCanvas(`bench-front-${n}`, benchFrontArt(fitted, n as 0 | 1));
    }
    for (const kind of Object.keys(PARK_PROPS) as ParkPropKind[]) {
      const source = this.textures.get(`park-${kind}`).getSourceImage() as HTMLImageElement;
      const cell = cutCell(source, 0, 0, source.naturalWidth, source.naturalHeight), fit = fitCell(cell);
      const fitted = drawFit(cell, fit);
      this.textures.addCanvas(`park-fit-${kind}`, kind === 'picnicTable' ? picnicGridArt(fitted) : fitted); this.parkWidths.set(kind, fit.dw);
      if (kind === 'seesaw') seesawFrames(cell).forEach((frame, i) => this.textures.addCanvas(`seesaw-${i}`, frame));
      if (kind === 'picnicTable') this.textures.addCanvas('picnic-tabletop', picnicGridArt(picnicTabletop(fitted)));
      if (kind === 'fountain') fountainFrames(cell).forEach((frame, i) => this.textures.addCanvas(`fountain-${i}`, drawFit(frame, fit)));
      if (kind === 'drinkingFountain') drinkingWaterFrames(cell).forEach((frame, i) => this.textures.addCanvas(`drinking-water-${i}`, drawFit(frame, fit)));
      if (kind === 'stream') this.textures.addCanvas('stream-banks', waterBankArt(fitted));
      if (kind === 'bridge') this.textures.addCanvas('bridge-front', bridgeFrontArt(fitted));
    }
  }
  /** Raster water is drawn with the ground, before every upright prop and character. */
  private paintStream(c: CanvasRenderingContext2D, item: PlacedItem) {
    const p = iso(item), size = PARK_PROPS.stream.width * U * 128 / this.parkWidths.get('stream')!;
    c.save(); c.imageSmoothingEnabled = false;
    c.translate(Math.round(p.x + FLOOR.ox), Math.round(p.y + FLOOR.oy));
    if (item.turn % 2) c.scale(-1, 1);
    c.drawImage(this.textures.get('park-fit-stream').getSourceImage() as HTMLCanvasElement,
      -size / 2, -size + U * PROP_ART_BASE.stream, size, size);
    c.restore();
  }
  /**
   * Swing art in four layers, trimmed and scaled exactly like the whole cell, plus the ropes + seat drawn in
   * 2 * poses + 1 swing angles. A rope swinging by θ toward the seat's front (a ground diagonal, U·(±1, ½) per
   * tile) moves a point d pixels below the rope tops by d·(±sin θ, ½ sin θ − (1 − cos θ)): an affine map
   * that keeps the rope tops on the bar.
   */
  private makeSwings() {
    this.swingArt = makeSwingArt(this.textures.get('swing-parts').getSourceImage() as HTMLImageElement);
    for (const [cell, art] of this.swingArt) {
      for (const kind of ['back','bar','near'] as const) this.textures.addCanvas(`swing${cell}-${kind}`, art[kind]);
      for (const [name,frames] of [['hang',art.hang],['rope',art.ropes]] as const) {
        const size=128+SWING.pad*2,sheet=document.createElement('canvas');sheet.width=size*frames.length;sheet.height=size;
        const c=sheet.getContext('2d')!;frames.forEach((frame,i)=>c.drawImage(frame,i*size,0));
        const tex=this.textures.addCanvas(`swing${cell}-${name}`,sheet)!;
        frames.forEach((_,i)=>tex.add(i,0,i*size,0,size,size));
      }
    }
  }
  private makeShapes() {
    const shape = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) => {
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; draw(canvas.getContext('2d')!, w, h); this.textures.addCanvas(key, canvas);
    };
    shape('ring', Math.round(1.4 * U) + 2, Math.round(.64 * U) + 2, (c, w, h) => { c.strokeStyle = '#fff4bd'; c.lineWidth = 1; c.beginPath(); c.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2); c.stroke(); });
  }
  private async makeFriends() {
    // Keep the existing seated artwork while shared-body walking is evaluated.
    const sheets = [['friends-sit', 'garden-friends-sit-v1'], ['friends-sit-sw', 'garden-friends-sit-sw-v1']];
    const atlases = await Promise.all(sheets.map(([, file]) => loadPixelAtlas(`sprites/garden/${file}.png`)));
    sheets.forEach(([key], n) => {
      const tex = this.textures.addCanvas(key, atlases[n])!;
      for (const i of [0, 4]) tex.add(i, 0, i % 4 * 96, Math.floor(i / 4) * 96, 96, 96);
    });
  }

  private get items() { const e = this.g.editor; return e.active ? e.draft.items.filter(i => i.id !== e.pending?.id) : this.g.life.layout; }

  /** Floor and paths, redrawn only when they change. */
  private drawFloor(items: PlacedItem[]) {
    const lines = this.g.editor.active;
    const key = JSON.stringify([this.g.region, this.g.season, lines, items.map(i => [i.kind, i.x, i.z, i.turn])]), g = this.g.groundTheme;
    if (key === this.floorKey) return; this.floorKey = key;
    const c = this.floor.getContext(); c.clearRect(0, 0, FLOOR.w, FLOOR.h);
    const corners = [{ x: -HALF, z: -HALF }, { x: HALF, z: -HALF }, { x: HALF, z: HALF }, { x: -HALF, z: HALF }].map(p => { const q = iso(p); return { x: q.x + FLOOR.ox, y: q.y + FLOOR.oy }; });
    for (const [a, b, color] of [[corners[1], corners[2], g.edges[0]], [corners[2], corners[3], g.edges[1]]] as const) {
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(b.x, b.y + 9); c.lineTo(a.x, a.y + 9); c.closePath(); c.fillStyle = color; c.fill(); c.strokeStyle = g.edgeLine; c.lineWidth = 1; c.stroke();
    }
    diamond(c, { x: 0, z: 0 }, GARDEN, GARDEN, g.tiles[0]);
    const groundScreen = (p: Point) => { const q = iso(p); return { x: q.x + FLOOR.ox, y: q.y + FLOOR.oy }; };
    naturalGroundDetails(c, g, groundScreen, items, U, this.g.region === 'garden');
    naturalPaths(c, g, groundScreen, items, U, this.g.region === 'garden');
    if (lines) groundGrid(c, g, groundScreen);
    for (const item of items.filter(i => i.kind === 'pond')) this.paintLake(c, item);
    for (const item of items.filter(i => i.kind === 'stream')) this.paintStream(c, item);
    // The two fixed navigation obstacles: a picnic rug and a garden sign.
    paintPicnicRug(c, groundScreen, U);
    const s = iso(SIGN), sx = Math.round(s.x + FLOOR.ox), sy = Math.round(s.y + FLOOR.oy);
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
      // A pond being placed shows itself (faded) under the footprint highlight.
      if (pending?.kind === 'pond') { c.globalAlpha = .75; this.paintLake(c, pending); paintPondFish(c, pending, p => { const q = iso(p); return { x: q.x + FLOOR.ox, y: q.y + FLOOR.oy }; }, U, 0, true); }
      if (pending?.kind === 'stream') { c.globalAlpha = .75; this.paintStream(c, pending); }
      c.globalAlpha = .45;
      for (const item of [pending, selected]) if (item) { const f = footprint(item); diamond(c, item, f.w, f.d, item === pending && error ? '#d07880' : '#fff4bc', '#66547b'); }
      c.globalAlpha = 1;
    }
    this.overlay.refresh();
  }
  private paintLake(c: CanvasRenderingContext2D, item: PlacedItem) {
    const screen = (p: Point) => { const q = iso(p); return { x: q.x + FLOOR.ox, y: q.y + FLOOR.oy }; };
    if (!paintPondSprite(c, item, screen, U)) paintPond(item, (pts, color, line) => floorPolygon(c, pts, color, line));
  }
  private syncPondFish(items: PlacedItem[]) {
    const ponds = items.filter(i => i.kind === 'pond'), live = new Set(ponds.map(i => i.id));
    for (const [id, view] of this.pondFishViews) if (!live.has(id)) { view.destroy(); this.pondFishViews.delete(id); }
    if (!ponds.length) return;
    const still = this.reduced.matches || this.g.editor.active, frame = pondFishFrame(this.time.now / 1000, still);
    if (frame !== this.fishFrame) {
      pondFishArt(this.time.now / 1000, still);
      (this.textures.get('pond-fish') as Phaser.Textures.CanvasTexture).refresh(); this.fishFrame = frame;
    }
    for (const item of ponds) {
      let view = this.pondFishViews.get(item.id);
      if (!view) { view = this.add.image(0, 0, 'pond-fish').setOrigin(.5, 90 / 160).setDepth(-999); this.pondFishViews.set(item.id, view); }
      const f = footprint(item), scale = (f.w + f.d) * U / 240, p = iso(item);
      view.setPosition(Math.round(p.x), Math.round(p.y)).setDisplaySize(Math.round(256 * scale), Math.round(160 * scale)).setFlipX(!!(item.turn % 2));
    }
  }
  private placeProp(image: Phaser.GameObjects.Image, item: PlacedItem) {
    if (isParkProp(item.kind)) {
      const size = PARK_PROPS[item.kind].width * U * 128 / this.parkWidths.get(item.kind)!, p = iso(item);
      image.setTexture(`park-fit-${item.kind}`).setPosition(p.x, p.y + U * PROP_ART_BASE[item.kind])
        .setDisplaySize(size, size).setFlipX(item.turn % 2 === 1).setDepth(this.rank(item.id));
      if (item.kind === 'fountain' && image !== this.ghost) image.setTexture(`fountain-${fountainFrame(this.time.now / 1000, this.reduced.matches || this.g.editor.active)}`);
      if (item.kind === 'drinkingFountain' && image !== this.ghost) image.setTexture(`drinking-water-${drinkingWaterFrame(this.time.now / 1000, this.reduced.matches || this.g.editor.active)}`);
      if (item.kind === 'picnicTable' && image !== this.ghost) {
        let top = this.picnicTops.get(item.id);
        if (!top) { top = this.add.image(0, 0, 'picnic-tabletop').setOrigin(.5, 1).setInteractive({ pixelPerfect: true }); top.setData('id', item.id); this.picnicTops.set(item.id, top); }
        top.setPosition(p.x, p.y + U * PROP_ART_BASE.picnicTable).setDisplaySize(size, size).setFlipX(item.turn % 2 === 1).setDepth(this.rank(item.id) + .2);
      }
      if (item.kind === 'seesaw') image.setTexture(`seesaw-${SEESAW.poses + seesawFrame(this.g.life.seesawTilt(item.id), this.reduced.matches || this.g.editor.active)}`)
        .setOrigin(.5, (128 + SEESAW.pad) / (128 + SEESAW.pad * 2)).setDisplaySize(size * (128 + SEESAW.pad * 2) / 128, size * (128 + SEESAW.pad * 2) / 128);
      return;
    }
    const index = propIndex(item), size = PROP_WIDTH[item.kind] * U * 128 / this.propWidths[index], p = iso(item);
    image.setTexture(`prop${index}`).setPosition(p.x, p.y + U * PROP_ART_BASE[item.kind]).setDisplaySize(size, size).setFlipX(item.turn >= 2).setDepth(this.rank(item.id));
    if (item.kind === 'bench' && image !== this.ghost) {
      let front = this.benchFronts.get(item.id);
      if (!front) { front = this.add.image(0, 0, `bench-front-${index}`).setOrigin(.5, 1).setInteractive({ pixelPerfect: true }); front.setData('id', item.id); this.benchFronts.set(item.id, front); }
      front.setTexture(`bench-front-${index}`).setPosition(p.x, p.y + U * PROP_ART_BASE.bench).setDisplaySize(size, size).setFlipX(item.turn >= 2).setDepth(this.rank(item.id) + .4);
    }
  }
  /** Current pose of a swing: its ropes + seat frame, and where its seat moved (world px; `ground` is the part along the floor). */
  private swingPose(item: PlacedItem) {
    const cell = propIndex(item) as SwingCell, art = this.swingArt.get(cell)!, motion = this.swingMotion.get(item.id);
    return swingArtPose(art,item.turn,motion,U);
  }
  /**
   * Far frame behind the rider, ropes + seat just behind the rider, near frame in front of both. The bar is above
   * the rider at rest and swinging forward, but in front of them once the seat swings back under it.
   */
  private placeSwing(image: Phaser.GameObjects.Image, item: PlacedItem) {
    const cell = propIndex(item) as SwingCell, size = PROP_WIDTH.swing * U * 128 / this.swingArt.get(cell)!.width;
    const p = iso(item), x = p.x, y = p.y + U * PROP_ART_BASE.swing, z = this.rank(item.id), flip = item.turn >= 2, framed = size * (128 + SWING.pad * 2) / 128;
    let view = this.swingViews.get(item.id);
    if (!view) {
      const part = (originY: number) => { const o = this.add.image(0, 0, 'prop0').setOrigin(.5, originY).setInteractive({ pixelPerfect: true }); o.setData('id', item.id); return o; };
      view = { hang: part((128 + SWING.pad) / (128 + SWING.pad * 2)), rope: part((128 + SWING.pad) / (128 + SWING.pad * 2)), bar: part(1), near: part(1) };
      this.swingViews.set(item.id, view);
    }
    image.setTexture(`swing${cell}-back`).setPosition(x, y).setDisplaySize(size, size).setFlipX(flip).setDepth(z);
    const frame = this.swingPose(item).frame;
    view.hang.setTexture(`swing${cell}-hang`, frame).setPosition(x, y).setDisplaySize(framed, framed).setFlipX(flip).setDepth(z + .3);
    view.rope.setTexture(`swing${cell}-rope`, frame).setPosition(x, y).setDisplaySize(framed, framed).setFlipX(flip).setDepth(z + .38);
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
      if (onFloor(item.kind)) continue;
      live.add(item.id);
      let image = this.props.get(item.id);
      if (!image) { image = this.add.image(0, 0, 'prop0').setOrigin(.5, 1).setInteractive({ pixelPerfect: true }); image.setData('id', item.id); this.props.set(item.id, image); }
      if (item.kind === 'swing') this.placeSwing(image, item); else this.placeProp(image, item);
      // Outside the editor only seats (and fountains, to watch) are clickable, so trees and fences never swallow floor clicks.
      image.input!.enabled = editing || ['bench', 'swing', 'seesaw', 'picnicTable', 'fountain'].includes(item.kind);
    }
    for (const [id, image] of this.props) if (!live.has(id)) { image.destroy(); this.props.delete(id); }
    for (const [id, view] of this.swingViews) if (!live.has(id)) { for (const o of Object.values(view)) o.destroy(); this.swingViews.delete(id); }
    for (const [id, top] of this.picnicTops) if (!live.has(id)) { top.destroy(); this.picnicTops.delete(id); }
    for (const [id, front] of this.benchFronts) if (!items.some(i => i.id === id && i.kind === 'bench')) { front.destroy(); this.benchFronts.delete(id); }
    const pending = this.g.editor.pending;
    this.ghost.setVisible(!!pending && !onFloor(pending.kind));
    if (pending && !onFloor(pending.kind)) this.placeProp(this.ghost, pending);
  }
  private syncRaisedWater(items: PlacedItem[]) {
    const live = new Set<string>();
    for (const item of items) {
      if (!['pond', 'stream', 'bridge'].includes(item.kind)) continue;
      live.add(item.id);
      let view = this.raisedWaterViews.get(item.id);
      const texture = item.kind === 'pond' ? 'pond-banks' : item.kind === 'stream' ? 'stream-banks' : 'bridge-front';
      if (!view) { view = this.add.image(0, 0, texture).setInteractive({ pixelPerfect: true }); view.setData('id', item.id); this.raisedWaterViews.set(item.id, view); }
      const p = iso(item);
      if (item.kind === 'pond') {
        const f = footprint(item), scale = (f.w + f.d) * U / 240;
        view.setTexture(texture).setOrigin(.5, 90 / 160).setPosition(Math.round(p.x), Math.round(p.y)).setDisplaySize(Math.round(256 * scale), Math.round(160 * scale));
      } else {
        const kind = item.kind as 'stream' | 'bridge', size = PARK_PROPS[kind].width * U * 128 / this.parkWidths.get(kind)!;
        view.setTexture(texture).setOrigin(.5, 1).setPosition(p.x, p.y + U * PROP_ART_BASE[kind]).setDisplaySize(size, size);
      }
      view.setFlipX(!!(item.turn % 2)).setDepth(this.rank(item.id) + (item.kind === 'bridge' ? .2 : 0));
      view.input!.enabled = this.g.editor.active;
    }
    for (const [id, view] of this.raisedWaterViews) if (!live.has(id)) { view.destroy(); this.raisedWaterViews.delete(id); }
  }
  /** Draw ranks for this frame (drawOrder.ts): props by id, walking friends as `avatar:<id>`; seated friends follow their seat. */
  private order = new Map<string, number>();
  private rank(id: string) { return this.order.get(id) ?? 0; }
  private sortScene(items: PlacedItem[]) {
    const pending = this.g.editor.pending, editing = this.g.editor.active;
    const walkers = editing ? [] : [...this.g.life.avatars.values()].filter(a => !this.g.life.riding(a) || this.g.life.seatOf(a)?.kind === 'picnicRug').map(a => ({ id: `avatar:${a.id}`, x: a.x, z: a.z }));
    this.order = sceneOrder(pending ? [...items, pending] : items, walkers);
  }
  private placeAvatar(a: Avatar, still: boolean) {
    const view = this.avatars.get(a.id)!, p = iso(a), seat = this.g.life.seatOf(a), editing = this.g.editor.active;
    view.sprite.setVisible(!editing);
    view.sprite.input!.enabled = !editing;
    if (editing) return;
    const seated = seat && ['boarding', 'seated', 'swinging', 'leaving'].includes(a.phase) ? a.progress : 0;
    // Drawn seated poses bend the legs themselves, so they only need the seat height above the ground point.
    const facing = seat && seated ? this.seatFacing(seat) : null;
    // Scarlet2 and Snow White share the 128px canvas, the walking speed and the chair sitting rules.
    const tall = a.id === 'character' || a.id === 'snow';
    const friendSit = !tall && !!facing && this.textures.exists('friends-sit');
    // While still standing at the start of sitting down (or end of getting up) the feet stay on the ground.
    const scarletSit = tall && scarlet2Sitting(seat?.kind, seated, a.phase);
    const drawnSit = friendSit || scarletSit;
    const chairTransition = tall && !!seat && seat.kind !== 'picnicRug';
    const standingOnSeat = (drawnSit || chairTransition) && (a.phase === 'boarding' || a.phase === 'leaving') && seated < .45;
    const lift = standingOnSeat ? 0 : !drawnSit ? seated * SEAT_LIFT.standing[seat?.kind ?? 'bench'] : seated * SEAT_LIFT.drawn[seat!.kind];
    // A rider is in front of the bench's wood and behind its separate near iron arm,
    // and behind the swing's near frame (and its bar while swinging back). On a swing the rider moves with the seat.
    const equipment = seat && this.g.life.layout.find(i => i.id === seat.equipment);
    const z = seat && seated && seat.kind !== 'picnicRug' ? this.rank(seat.equipment) + (seat.kind === 'picnicTable' && seat.bench === 'far' ? .12 : .35) : walkerDepth({ ...a, id: `avatar:${a.id}` }, this.items, this.order);
    const swing = seated && equipment?.kind === 'swing' ? this.swingPose(equipment) : { x: 0, y: 0, ground: 0 };
    const seesaw = seat?.kind === 'seesaw' && seated ? seesawOffset(seat.side!, seesawFrame(this.g.life.seesawTilt(seat.equipment), still)) * U * seated : 0;
    const bench = seat?.kind === 'bench' ? benchSeatShift(equipment?.turn ?? 0, seated) * U : 0;
    const swingSeat = seat?.kind === 'swing' ? swingSeatShift(equipment?.turn ?? 0, seated) * U : 0;
    const sitOrigin = a.id === 'snow' ? SNOW_WHITE_SIT.originY : SCARLET2_SIT.originY;
    const x = p.x + swing.x + bench + swingSeat, base = p.y - (lift + bridgeLift(a, this.g.life.layout)) * U + swing.y + seesaw, moving = a.phase === 'walking' && !still;
    view.sprite.setPosition(x, base).setDepth(z);
    if (tall) {
      const { source, flipX } = SCARLET_SD_DIRECTIONS[facing ?? scarletDirection(a.yaw)], art = a.id === 'snow' ? 'snow-' : '';
      if (scarletSit) view.sprite.setTexture(`${art}sit-${source}`);
      else if (moving) view.sprite.setTexture(`${art}walk-${source}`, (a.id === 'snow' ? this.snowWalkCycle : this.walkCycle).frame);
      else view.sprite.setTexture(`${art}idle-${source}`);
      view.sprite.setFlipX(flipX).setOrigin(.5, scarletSit ? sitOrigin : SCARLET_SD.originY).setDisplaySize(U * SCARLET_SD.worldSize, U * SCARLET_SD.worldSize);
    } else if (friendSit && !standingOnSeat) {
      if (facing === 'ne' || facing === 'nw') view.sprite.setTexture(friendRearSitTexture(a.id as FriendId)).setFlipX(facing === 'nw');
      else view.sprite.setTexture(facing === 'sw' ? 'friends-sit-sw' : 'friends-sit', a.id === 'peach' ? 0 : 4).setFlipX(false);
      view.sprite.setOrigin(.5, .97).setDisplaySize(U * FRIEND_BODY.worldSize, U * FRIEND_BODY.worldSize);
    } else {
      const { source, flipX } = FRIEND_DIRECTIONS[facing ?? scarletDirection(a.yaw)];
      const id = a.id as FriendId;
      view.sprite.setTexture(friendTexture(id, moving ? 'walk' : 'idle', source), moving ? this.friendCycles[id].frame : undefined)
        .setFlipX(flipX).setOrigin(.5, FRIEND_BODY.originY).setDisplaySize(U * FRIEND_BODY.worldSize, U * FRIEND_BODY.worldSize);
    }
    const cam = this.cameras.main;
    const head = base - view.sprite.displayHeight * view.sprite.originY;
    this.g.bubbles.update(a, this.g.life.time,
      (x - cam.scrollX - cam.width / 2) * cam.zoom + cam.width / 2,
      (head - cam.scrollY - cam.height / 2) * cam.zoom + cam.height / 2,
      seated ? seat?.kind : undefined);
    if (a.id === this.g.selectedAvatar) this.ring.setPosition(x, p.y + swing.ground).setDepth(z - .005);
  }
  private camera() {
    const cam = this.cameras.main, { width, height } = this.scale;
    cam.setBackgroundColor(this.g.groundTheme.background);
    cam.setZoom(Math.min(width / FIT.w, height / FIT.h) / U * this.g.zoom);
    const a = this.g.focus && this.g.life.avatars.get(this.g.focus), t = a ? iso(a) : { x: 0, y: 0 };
    cam.centerOn(t.x - this.g.pan.x / cam.zoom, t.y - (this.g.pan.y + height * .06) / cam.zoom);
  }

  update(_t: number, ms: number) {
    if (!this.ready || document.hidden) return;
    const dt = Math.min(.1, ms / 1000), still = this.reduced.matches, editing = this.g.editor.active;
    const character = this.g.life.avatars.get('character')!, before = { x: character.x, z: character.z };
    const snow = this.g.life.avatars.get('snow')!, snowBefore = { x: snow.x, z: snow.z };
    const previousFriends = FRIEND_IDS.map(id => { const a = this.g.life.avatars.get(id)!; return { id, x: a.x, z: a.z }; });
    if (!editing) this.g.life.update(dt);
    this.moveSwings(dt, still);
    this.walkCycle.advance(Math.hypot(character.x - before.x, character.z - before.z), !editing && character.phase === 'walking');
    this.snowWalkCycle.advance(Math.hypot(snow.x - snowBefore.x, snow.z - snowBefore.z), !editing && snow.phase === 'walking');
    for (const before of previousFriends) {
      const a = this.g.life.avatars.get(before.id)!;
      this.friendCycles[before.id].advance(Math.hypot(a.x - before.x, a.z - before.z), !editing && a.phase === 'walking');
    }
    const items = this.items;
    this.sortScene(items);
    this.drawFloor(items); this.drawOverlay(); this.syncProps(items); this.syncPondFish(items); this.syncRaisedWater(items);
    this.camera();
    this.g.bubbles.begin(this.scale.width, this.scale.height, editing, U * this.cameras.main.zoom);
    for (const a of this.g.life.avatars.values()) this.placeAvatar(a, still);
    this.ring.setVisible(!editing);
  }

  private ground(p: Phaser.Input.Pointer) { const w = this.cameras.main.getWorldPoint(p.x, p.y); return unproject(w.x, w.y, U); }
  private pick(p: Phaser.Input.Pointer): string | undefined {
    const hit = (this.input.hitTestPointer(p) as Phaser.GameObjects.Image[]).filter(o => o.input?.enabled).sort((a, b) => b.depth - a.depth)[0];
    if (hit) return hit.getData('id');
    if (!this.g.editor.active && onPicnicRug(this.ground(p))) return PICNIC_RUG_ID;
    // Floor items remain selectable in the editor even though they are drawn on the floor texture.
    if (this.g.editor.active) {
      const q = this.ground(p);
      return [...this.g.editor.draft.items].reverse().find(i => { const f = footprint(i); return Math.abs(q.x - i.x) <= f.w / 2 && Math.abs(q.z - i.z) <= f.d / 2; })?.id;
    }
  }
  private pointerDown(p: Phaser.Input.Pointer) {
    if (p.button !== 0 && p.button !== 2) return;
    if (this.drag) { this.drag.moved = true; return; }  // a second finger: pinch, never a click
    this.drag = { x: p.x, y: p.y, sx: this.g.pan.x, sy: this.g.pan.y, moved: false };
  }
  private pointerMove(p: Phaser.Input.Pointer) {
    const d = this.drag, canvas = this.game.canvas;
    const one = this.input.pointer1, two = this.input.pointer2;
    if (one?.isDown && two?.isDown) {
      const distance = Math.hypot(one.x - two.x, one.y - two.y);
      if (!this.pinch) this.pinch = { distance, zoom: this.g.zoom };
      else if (this.pinch.distance > 0) this.g.zoomBy(this.pinch.zoom * distance / this.pinch.distance / this.g.zoom);
      return;
    }
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
    if (this.pinch) { if (!this.input.pointer1?.isDown && !this.input.pointer2?.isDown) { this.pinch = null; this.drag = null; } return; }
    const d = this.drag; this.drag = null;
    if (!d || d.moved || p.button === 2) return;
    const g = this.g, target = this.ground(p);
    if (g.editor.active) {
      if (g.editor.pending) { g.editor.position(target.x, target.z); g.callbacks.notice(g.editor.error ?? '위치를 고정했어요. «여기에 놓기»를 눌러주세요.'); }
      else { g.editor.selected = this.pick(p) ?? null; g.callbacks.notice(g.editor.selectedName); }
      return;
    }
    const id = this.pick(p);
    if (id && g.life.avatars.has(id as AvatarId)) {
      const now = performance.now(), again = this.lastTap?.id === id && now - this.lastTap.at < DOUBLE_TAP_MS;
      this.lastTap = again ? null : { id, at: now };
      g.select(id); if (again) g.callbacks.pet(id as AvatarId);
    } else if (id) { g.select(id); g.commandUse(id); }
    else { const error = g.life.moveTo(g.selectedAvatar, target); g.callbacks.notice(error ?? `${g.life.avatars.get(g.selectedAvatar)!.name}에게 이동을 부탁했어요.`); }
  }
}
