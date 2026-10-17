import { LayoutEditor } from './editor';
import { CATALOG, EQUIPMENT_SCALE, PICNIC, PROP_ART_BASE, SEAT_LIFT, swingSeatShift, SIGN, cloneLayout, footprint, type ItemKind, type Layout, type PlacedItem, type Point } from './layout';
import { LifeSimulation, type AvatarId, type EquipmentId, type Avatar } from './simulation';
import { loadPixelAtlas } from './pixelAtlas';
import { depth, project, unproject } from './isometric';
import { friendSide, scarletDirection } from './scarletDirections';
import { SCARLET_SD, SCARLET_SD_DIRECTIONS, SCARLET_SD_SPEED, ScarletWalkCycle } from './scarletApproved';

export type Selection = AvatarId | EquipmentId;
type Callbacks = { select(id: Selection): void; zoom(value: number): void; error(): void; notice(message: string): void };
type Sprite = { image: HTMLCanvasElement; width: number; height: number };
type Hit = { id: string; x: number; y: number; w: number; h: number; image?: HTMLCanvasElement; frame?: number };

/** Canvas-only presentation. Navigation, editor validation and saves stay renderer independent. */
export class PixelGarden {
  readonly life = new LifeSimulation(Math.random, { character: SCARLET_SD_SPEED });
  readonly editor = new LayoutEditor();
  scarletModel: 'loading' | 'ready' | 'fallback' = 'loading';
  selectedAvatar: AvatarId = 'character';
  selection: Selection = 'character';
  private canvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private resizeObserver: ResizeObserver;
  private walkCycle = new ScarletWalkCycle();
  private approvedArt = new Map<'se' | 'ne', { idle: HTMLImageElement; walk: HTMLImageElement }>();
  private friendsAtlas?: { se: HTMLCanvasElement; sw: HTMLCanvasElement };
  private props: Sprite[] = [];
  private hits: Hit[] = [];
  private zoom = 1;
  private pan = { x: 0, y: 0 };
  private grid = false;
  private frame = 0;
  private last = performance.now();
  private disposed = false;
  private focus: AvatarId | null = null;
  private drag: { x: number; y: number; sx: number; sy: number; moved: boolean; id: number } | null = null;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');

  constructor(private host: HTMLElement, private callbacks: Callbacks) {
    const ctx = this.canvas.getContext('2d'); if (!ctx) throw new Error('Canvas 2D unavailable'); this.ctx = ctx;
    this.canvas.setAttribute('aria-label', '도트 놀이터');
    host.append(this.canvas);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(host);
    this.canvas.addEventListener('pointerdown', this.pointerDown);
    this.canvas.addEventListener('pointermove', this.pointerMove);
    this.canvas.addEventListener('pointerup', this.pointerUp);
    this.canvas.addEventListener('pointercancel', this.pointerCancel);
    this.canvas.addEventListener('wheel', this.wheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this.contextMenu);
    this.resize(); this.reset(); this.animate();
    void this.loadArt();
  }
  private async loadArt() {
    try {
      const [friends, friendsSw, image, approved] = await Promise.all([
        loadPixelAtlas('sprites/garden/garden-friends-v1.png'), loadPixelAtlas('sprites/garden/garden-friends-sw-v1.png'), this.loadImage('sprites/garden/playground-props-v2.png'),
        Promise.all((['se', 'ne'] as const).map(async source => {
          const art = SCARLET_SD.sources[source];
          const [idle, walk] = await Promise.all([this.loadImage(art.idle), this.loadImage(art.walk)]);
          return [source, { idle, walk }] as const;
        })),
      ]);
      if (this.disposed) return;
      approved.forEach(([source, art]) => this.approvedArt.set(source, art));
      this.friendsAtlas = { se: friends, sw: friendsSw };
      // Trim each independent cell, retaining alpha for both drawing and selection.
      const w = image.naturalWidth / 4, h = image.naturalHeight / 2;
      for (let n = 0; n < 8; n++) {
        const cell = document.createElement('canvas'); cell.width = Math.ceil(w); cell.height = Math.ceil(h);
        const c = cell.getContext('2d')!; c.drawImage(image, n % 4 * w, Math.floor(n / 4) * h, w, h, 0, 0, w, h);
        const pixels = c.getImageData(0, 0, cell.width, cell.height);
        let left = cell.width, top = cell.height, right = 0, bottom = 0;
        for (let y = 0; y < cell.height; y++) for (let x = 0; x < cell.width; x++) {
          const i = (y * cell.width + x) * 4;
          if (pixels.data[i + 3] < 180) pixels.data[i + 3] = 0;
          else { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
        }
        c.putImageData(pixels, 0, 0);
        const trimmed = document.createElement('canvas'); trimmed.width = 128; trimmed.height = 128;
        const tc = trimmed.getContext('2d')!; tc.imageSmoothingEnabled = false;
        const sw = right - left + 1, sh = bottom - top + 1, scale = 124 / Math.max(sw, sh);
        const dw = Math.round(sw * scale), dh = Math.round(sh * scale);
        tc.drawImage(cell, left, top, sw, sh, (128 - dw) / 2, 128 - dh, dw, dh);
        this.props.push({ image: trimmed, width: dw, height: dh });
      }
      this.scarletModel = 'ready'; this.callbacks.notice('도트 놀이터에 오신 걸 환영해요. 바닥을 눌러 걸어보세요.');
    } catch (error) { this.scarletModel = 'fallback'; this.callbacks.error(); console.error('Pixel art load failed', error); }
  }
  private async loadImage(path: string) { const image = new Image(); image.src = `${import.meta.env.BASE_URL}${path}`; await image.decode(); return image; }
  private resize() {
    // A logical pixel is two screen pixels; nearest-neighbour CSS preserves crisp edges.
    this.canvas.width = Math.max(160, Math.round(this.host.clientWidth / 2));
    this.canvas.height = Math.max(160, Math.round(this.host.clientHeight / 2));
    this.ctx.imageSmoothingEnabled = false;
  }
  private get unit() { return Math.min(this.canvas.width / 35, this.canvas.height / 24) * this.zoom; }
  private get origin() {
    const a = this.focus && this.life.avatars.get(this.focus);
    const p = a ? project(a, this.unit) : { x: 0, y: 0 };
    return { x: this.canvas.width / 2 + this.pan.x - p.x, y: this.canvas.height * .56 + this.pan.y - p.y };
  }
  private screen(p: Point) { const q = project(p, this.unit), o = this.origin; return { x: Math.round(q.x + o.x), y: Math.round(q.y + o.y) }; }
  private ground(x: number, y: number) { const o = this.origin; return unproject(x - o.x, y - o.y, this.unit); }
  private polygon(points: { x: number; y: number }[], color: string, outline?: string) {
    const c = this.ctx; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(Math.round(p.x), Math.round(p.y)) : c.moveTo(Math.round(p.x), Math.round(p.y))); c.closePath();
    c.fillStyle = color; c.fill(); if (outline) { c.strokeStyle = outline; c.lineWidth = 1; c.stroke(); }
  }
  private tile(p: Point, w: number, d: number, color: string, line?: string) {
    const points = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z]) => this.screen({ x: p.x + x, z: p.z + z }));
    this.polygon(points, color, line);
  }
  private drawGround(items: PlacedItem[]) {
    const c = this.ctx;
    const corners = [{ x: -8, z: -8 }, { x: 8, z: -8 }, { x: 8, z: 8 }, { x: -8, z: 8 }].map(p => this.screen(p));
    for (const [a, b, color] of [[corners[1], corners[2], '#81966d'], [corners[2], corners[3], '#9cac7c']] as const)
      this.polygon([a, b, { x: b.x, y: b.y + 9 }, { x: a.x, y: a.y + 9 }], color, '#718666');
    for (let x = -7.5; x < 8; x++) for (let z = -7.5; z < 8; z++) {
      const hash = Math.abs(Math.round(x * 11 + z * 23)) % 5;
      this.tile({ x, z }, 1, 1, ['#bdcf98', '#b8ca92', '#b5c88c', '#c2d29d', '#bbce94'][hash], this.grid || this.editor.active ? '#91ab7a' : undefined);
      if (hash === 2) { const p = this.screen({ x, z }); c.fillStyle = '#8fae77'; c.fillRect(p.x, p.y - 1, 1, 2); c.fillRect(p.x + 2, p.y, 2, 1); }
    }
    for (const item of items.filter(i => i.kind === 'path')) {
      const f = footprint(item); this.tile(item, f.w, f.d, '#e0d1ac', '#c6b88f');
      const p = this.screen(item); c.fillStyle = '#eee3c7'; c.fillRect(p.x - 2, p.y - 1, 3, 1);
    }
    // Match the two fixed navigation obstacles: a picnic rug and a garden sign.
    this.tile(PICNIC, PICNIC.w, PICNIC.d, '#e8b8a7', '#a97e7e');
    for (let x = PICNIC.x - PICNIC.w / 2 + .2; x < PICNIC.x + PICNIC.w / 2; x += .4) for (let z = PICNIC.z - PICNIC.d / 2 + .2; z < PICNIC.z + PICNIC.d / 2; z += .4) this.tile({ x, z }, .2, .2, '#f7e7d1');
    const sign = this.screen(SIGN);
    c.fillStyle = '#766454'; c.fillRect(sign.x - 1, sign.y - 14, 2, 14); c.fillStyle = '#f8e8bd'; c.fillRect(sign.x - 9, sign.y - 20, 18, 9); c.fillStyle = '#b6b989'; c.fillRect(sign.x - 6, sign.y - 17, 10, 2);
  }
  private drawItem(item: PlacedItem, ghost = false) {
    const c = this.ctx, p = this.screen(item), unit = this.unit;
    const odd = item.turn % 2;
    const index = item.kind === 'bench' ? 1 - odd : item.kind === 'swing' ? 3 - odd : item.kind === 'tree' ? 4 : item.kind === 'flower' ? 5 : 6 + odd;
    const art = this.props[index]; if (!art) return;
    const width = ({ bench: 5.4 * EQUIPMENT_SCALE.bench, swing: 6.1 * EQUIPMENT_SCALE.swing, tree: 3.9, flower: 3, fence: 3, path: 1 })[item.kind] * unit;
    const size = Math.round(width * 128 / art.width), x = Math.round(p.x - size / 2 - (item.kind === 'swing' ? swingSeatShift(item) * (item.turn >= 2 ? -1 : 1) * unit : 0)), y = Math.round(p.y - size + unit * PROP_ART_BASE[item.kind]);
    if (ghost) c.globalAlpha = .65;
    // x is before the turn ≥ 2 mirror about p.x below, which flips the swing's seat shift by itself.
    c.save();
    if (item.turn >= 2) { c.translate(p.x * 2, 0); c.scale(-1, 1); }
    c.drawImage(art.image, x, y, size, size); c.restore(); c.globalAlpha = 1;
    if (!ghost) this.hits.push({ id: item.id, x, y, w: size, h: size, image: art.image, frame: item.turn >= 2 ? -1 : undefined });
    if (ghost || (this.editor.active && this.editor.selected === item.id)) {
      const f = footprint(item); c.globalAlpha = .45; this.tile(item, f.w, f.d, ghost && this.editor.error ? '#d07880' : '#fff4bc', '#66547b'); c.globalAlpha = 1;
    }
  }
  private drawAvatar(a: Avatar) {
    const c = this.ctx, p = this.screen(a), u = this.unit, seat = this.life.seatOf(a);
    const seated = seat && ['boarding', 'seated', 'swinging', 'leaving'].includes(a.phase) ? a.progress : 0;
    const moving = a.phase === 'walking', still = this.reduced.matches;
    const sway = a.phase === 'swinging' && !still ? Math.sin(this.life.time * 2) * u * .16 : 0;
    const base = p.y - seated * u * SEAT_LIFT.standing[seat?.kind ?? 'bench'] + sway;
    if (this.selectedAvatar === a.id) { c.strokeStyle = '#fff4bd'; c.lineWidth = 1; c.beginPath(); c.ellipse(p.x, p.y, u * .7, u * .32, 0, 0, Math.PI * 2); c.stroke(); }
    const size = Math.round(u * (a.id === 'character' ? SCARLET_SD.worldSize : 2.8)), x = Math.round(p.x - size / 2), y = Math.round(base - size * (a.id === 'character' ? SCARLET_SD.originY : .97));
    if (a.id === 'character' && this.approvedArt.size) {
      const { source, flipX } = SCARLET_SD_DIRECTIONS[scarletDirection(a.yaw)];
      const art = this.approvedArt.get(source)!;
      c.save(); c.translate(x + (flipX ? size : 0), y); c.scale(flipX ? -1 : 1, 1);
      if (moving && !still) c.drawImage(art.walk, this.walkCycle.frame * 96, 0, 96, 96, 0, 0, size, size);
      else c.drawImage(art.idle, 0, 0, size, size);
      c.restore();
    } else if (this.friendsAtlas && a.id !== 'character') {
      const frame = (a.id === 'peach' ? 0 : 4) + (moving && !still ? 1 + Math.floor(this.life.time * 7) % 3 : 0);
      c.drawImage(this.friendsAtlas[friendSide(a.yaw)], frame % 4 * 96, Math.floor(frame / 4) * 96, 96, 96, x, y, size, size);
    } else {
      // Original placeholder friends, drawn on the same logical pixel grid.
      c.save(); c.translate(p.x, Math.round(base));
      const scale = Math.max(1, Math.round(u / 10)); c.scale(scale, scale);
      const peach = a.id === 'peach', bob = moving && !still ? Math.floor(Math.sin(this.life.time * 12) * 1.2) : 0;
      c.translate(0, bob);
      const rect = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
      rect(-5, -28, 11, 3, '#58465e'); rect(-8, -25, 16, 13, '#58465e'); rect(-7, -25, 14, 11, peach ? '#b27d68' : '#a496bd');
      rect(-5, -21, 12, 9, '#ffe2bf'); rect(-6, -24, 11, 5, peach ? '#be8e73' : '#b3a3cf');
      rect(0, -19, 2, 3, '#58465e'); rect(5, -18, 1, 2, '#58465e'); rect(3, -14, 2, 1, '#cd8e87');
      rect(-5, -12, 12, 9, '#58465e'); rect(-4, -12, 10, 8, peach ? '#ecb5a4' : '#c4b1df'); rect(-2, -11, 5, 4, '#fff1d2');
      rect(-5, -3, 4, 3, '#77616a'); rect(3, -3 + bob, 4, 3, '#77616a');
      rect(-7, -12, 3, 6, '#ffe2bf'); rect(6, -12, 3, 6, '#ffe2bf');
      rect(-5, -26, 4, 3, peach ? '#f9d68f' : '#e6d8a3'); c.restore();
    }
    this.hits.push({ id: a.id, x: p.x - size * .28, y: base - size * .8, w: size * .56, h: size * .8 });
    if (seated || a.phase === 'waving') {
      c.font = '8px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#65556f';
      c.fillText(a.phase === 'waving' ? '♡' : seat?.kind === 'swing' ? '♪' : '···', p.x, y - 3);
    }
  }
  private animate = () => {
    if (this.disposed) return;
    const now = performance.now(), dt = Math.min(.1, (now - this.last) / 1000); this.last = now;
    if (!document.hidden) {
      const before = this.life.avatars.get('character')!, previous = { x: before.x, z: before.z };
      if (!this.editor.active) this.life.update(dt);
      const scarlet = this.life.avatars.get('character')!;
      this.walkCycle.advance(Math.hypot(scarlet.x - previous.x, scarlet.z - previous.z), !this.editor.active && scarlet.phase === 'walking');
      const c = this.ctx; c.fillStyle = '#eae9de'; c.fillRect(0, 0, this.canvas.width, this.canvas.height); this.hits = [];
      const items = this.editor.active ? this.editor.draft.items.filter(i => i.id !== this.editor.pending?.id) : this.life.layout;
      this.drawGround(items);
      const layers = items.filter(i => i.kind !== 'path').map(i => ({ depth: depth(i), draw: () => this.drawItem(i) }));
      if (!this.editor.active) for (const a of this.life.avatars.values()) layers.push({ depth: depth(a) + (this.life.seatOf(a) ? .35 : 0), draw: () => this.drawAvatar(a) });
      layers.sort((a, b) => a.depth - b.depth).forEach(layer => layer.draw());
      if (this.editor.pending) {
        if (this.editor.pending.kind === 'path') this.tile(this.editor.pending, 1, 1, this.editor.error ? '#d07880' : '#fff4bc', '#66547b');
        else this.drawItem(this.editor.pending, true);
      }
    }
    this.frame = requestAnimationFrame(this.animate);
  };
  private coords(e: PointerEvent) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * this.canvas.width / r.width, y: (e.clientY - r.top) * this.canvas.height / r.height }; }
  private pick(x: number, y: number) {
    for (const hit of [...this.hits].reverse()) {
      if (x < hit.x || x >= hit.x + hit.w || y < hit.y || y >= hit.y + hit.h) continue;
      if (!this.editor.active && !this.life.avatars.has(hit.id as AvatarId) && !this.life.layout.some(i => i.id === hit.id && ['bench', 'swing'].includes(i.kind))) continue;
      if (hit.image) {
        let px = Math.floor((x - hit.x) / hit.w * 128); if (hit.frame === -1) px = 127 - px;
        const py = Math.floor((y - hit.y) / hit.h * 128);
        if (!hit.image.getContext('2d')!.getImageData(px, py, 1, 1).data[3]) continue;
      }
      return hit.id;
    }
    // Floor items remain selectable in the editor even though they are drawn first.
    if (this.editor.active) {
      const p = this.ground(x, y);
      return [...this.editor.draft.items].reverse().find(i => { const f = footprint(i); return Math.abs(p.x - i.x) <= f.w / 2 && Math.abs(p.z - i.z) <= f.d / 2; })?.id;
    }
  }
  private pointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.button !== 2) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.drag = { x: e.clientX, y: e.clientY, sx: this.pan.x, sy: this.pan.y, moved: false, id: e.pointerId };
  };
  private pointerMove = (e: PointerEvent) => {
    const d = this.drag;
    if (d) {
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (Math.hypot(dx, dy) > 6) d.moved = true;
      if (d.moved) { this.canvas.style.cursor = 'grabbing'; this.focus = null; const r = this.canvas.getBoundingClientRect(); this.pan = { x: d.sx + dx * this.canvas.width / r.width, y: d.sy + dy * this.canvas.height / r.height }; }
      return;
    }
    const p = this.coords(e);
    this.canvas.style.cursor = this.pick(p.x, p.y) ? 'pointer' : 'crosshair';
    if (this.editor.active && this.editor.pending) { const target = this.ground(p.x, p.y); this.editor.followPointer(target.x, target.z); }
  };
  private pointerUp = (e: PointerEvent) => {
    const d = this.drag; this.drag = null;
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    if (!d || d.moved || e.button === 2) return;
    const p = this.coords(e), target = this.ground(p.x, p.y);
    if (this.editor.active) {
      if (this.editor.pending) { this.editor.position(target.x, target.z); this.callbacks.notice(this.editor.error ?? '위치를 고정했어요. «여기에 놓기»를 눌러주세요.'); }
      else { this.editor.selected = this.pick(p.x, p.y) ?? null; this.callbacks.notice(this.editor.selectedName); }
      return;
    }
    const id = this.pick(p.x, p.y);
    if (id) { this.select(id); if (!this.life.avatars.has(id as AvatarId)) this.commandUse(id); }
    else { const error = this.life.moveTo(this.selectedAvatar, target); this.callbacks.notice(error ?? `${this.life.avatars.get(this.selectedAvatar)!.name}에게 이동을 부탁했어요.`); }
  };
  private pointerCancel = () => { this.drag = null; };
  private wheel = (e: WheelEvent) => { e.preventDefault(); this.zoomBy(Math.exp(-e.deltaY * .001)); };
  private contextMenu = (e: Event) => e.preventDefault();
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
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame); this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.pointerDown); this.canvas.removeEventListener('pointermove', this.pointerMove); this.canvas.removeEventListener('pointerup', this.pointerUp);
    this.canvas.removeEventListener('pointercancel', this.pointerCancel); this.canvas.removeEventListener('wheel', this.wheel); this.canvas.removeEventListener('contextmenu', this.contextMenu); this.canvas.remove();
  }
}


