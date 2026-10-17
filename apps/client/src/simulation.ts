import { DEFAULT_LAYOUT, HUB, cloneLayout, geometryError, worldFrom, type NavigationWorld, type PlacedItem, type Seat, type Point } from './layout';
export type { Point, Seat } from './layout';
export type AvatarId = 'character' | 'peach' | 'lilac';
export type EquipmentId = string;

export type Phase = 'idle' | 'walking' | 'boarding' | 'seated' | 'swinging' | 'leaving' | 'waving';
export const FRIENDS = [
  { id: 'character' as const, name: '홍련', color: '#8b70ab', start: { x: -.5, z: 2.5 } },
  { id: 'peach' as const, name: '모모', color: '#d7a18b', start: { x: -2.5, z: 2.5 } },
  { id: 'lilac' as const, name: '루루', color: '#b5a4cd', start: { x: 2.5, z: 2.5 } },
];
const DEFAULT_WORLD = worldFrom(DEFAULT_LAYOUT.items);
export const SEATS = DEFAULT_WORLD.seats;
/** Half-tile navigation lattice: floor tiles are 1×1 with centres at k+.5, so odd indices are tile centres, even ones tile edges. */
const STEP = .5, MIN = -7, N = 29, OFF_CENTRE = 2;
/** Centre of the floor tile containing p. */
export function tileCentre(p: Point): Point { return { x: Math.floor(p.x) + .5, z: Math.floor(p.z) + .5 }; }
/** Foot radius is included here; canopy meshes never block navigation. */
export function walkable(p: Point, nav: NavigationWorld = DEFAULT_WORLD) {
  return Number.isFinite(p.x) && Number.isFinite(p.z) && Math.abs(p.x) <= 7.25 && Math.abs(p.z) <= 7.25 &&
    !nav.rectangles.some(r => Math.abs(p.x - r.x) < r.w / 2 + .34 && Math.abs(p.z - r.z) < r.d / 2 + .34) &&
    !nav.trunks.some(t => Math.hypot(p.x - t.x, p.z - t.z) < t.r);
}
function clearSegment(a: Point, b: Point, nav: NavigationWorld = DEFAULT_WORLD) {
  if (!walkable(a, nav) || !walkable(b, nav)) return false;
  const dx = b.x - a.x, dz = b.z - a.z, length2 = dx * dx + dz * dz;
  for (const t of nav.trunks) {
    const f = length2 ? Math.max(0, Math.min(1, ((t.x - a.x) * dx + (t.z - a.z) * dz) / length2)) : 0;
    if (Math.hypot(a.x + dx * f - t.x, a.z + dz * f - t.z) < t.r) return false;
  }
  for (const r of nav.rectangles) {
    let enter = 0, exit = 1;
    for (const [start, delta, min, max] of [[a.x, dx, r.x - r.w / 2 - .34, r.x + r.w / 2 + .34], [a.z, dz, r.z - r.d / 2 - .34, r.z + r.d / 2 + .34]]) {
      if (Math.abs(delta) < 1e-9) { if (start <= min || start >= max) { enter = 2; break; } }
      else { const p = (min - start) / delta, q = (max - start) / delta; enter = Math.max(enter, Math.min(p, q)); exit = Math.min(exit, Math.max(p, q)); }
    }
    if (enter < exit && enter < 1 && exit > 0) return false;
  }
  return true;
}
const clampIndex = (i: number) => Math.max(0, Math.min(N - 1, i));
function cell(p: Point) { return { x: clampIndex(Math.round((p.x - MIN) / STEP)), z: clampIndex(Math.round((p.z - MIN) / STEP)) }; }
/** Lattice node to join a path from p: its tile centre when reachable in a straight line, else the nearest node. */
function anchor(p: Point, nav: NavigationWorld) {
  const c = tileCentre(p), centre = cell(c);
  return clearSegment(p, world(centre.x, centre.z), nav) ? centre : cell(p);
}
function world(x: number, z: number): Point { return { x: MIN + x * STEP, z: MIN + z * STEP }; }
const key = (x: number, z: number) => z * N + x;
/** Four-neighbour A*: no diagonal corner cutting, no renderer or wall-clock dependency.
 * Steps along a tile edge cost extra, so friends walk down tile centres and turn on them, using edges only to squeeze past obstacles. */
export function findPath(start: Point, destination: Point, nav: NavigationWorld = DEFAULT_WORLD): Point[] | null {
  if (!walkable(start, nav) || !walkable(destination, nav)) return null;
  const s = anchor(start, nav), g = anchor(destination, nav);
  if (!clearSegment(start, world(s.x, s.z), nav) || !walkable(world(g.x, g.z), nav)) return null;
  const startKey = key(s.x, s.z), goalKey = key(g.x, g.z);
  const open = [startKey], cost = new Map([[startKey, 0]]), parent = new Map<number, number>();
  const heuristic = (k: number) => Math.abs(k % N - g.x) + Math.abs(Math.floor(k / N) - g.z);
  while (open.length) {
    open.sort((a, b) => (cost.get(a)! + heuristic(a)) - (cost.get(b)! + heuristic(b)));
    const current = open.shift()!;
    if (current === goalKey) {
      const path = [current]; let cursor = current;
      while (parent.has(cursor)) { cursor = parent.get(cursor)!; path.push(cursor); }
      const result = path.reverse().map(k => world(k % N, Math.floor(k / N)));
      const last = result[result.length - 1];
      if (!clearSegment(last, destination, nav)) return null;
      if (Math.hypot(last.x - destination.x, last.z - destination.z) > .001) result.push({ ...destination });
      return result;
    }
    const x = current % N, z = Math.floor(current / N);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= N || nz >= N || !clearSegment(world(x, z), world(nx, nz), nav)) continue;
      const onEdge = dx ? z % 2 === 0 : x % 2 === 0;
      const next = key(nx, nz), candidate = cost.get(current)! + 1 + (onEdge ? OFF_CENTRE : 0);
      if (candidate >= (cost.get(next) ?? Infinity)) continue;
      cost.set(next, candidate); parent.set(next, current); if (!open.includes(next)) open.push(next);
    }
  }
  return null;
}
export interface Avatar extends Point {
  id: AvatarId; name: string; phase: Phase; yaw: number; path: Point[]; seatId: string | null;
  progress: number; until: number; deadline: number; directed: boolean; lastEquipment: EquipmentId | null;
}
export class LifeSimulation {
  time = 0;
  layout = cloneLayout(DEFAULT_LAYOUT).items;
  world = worldFrom(this.layout);
  get seats() { return this.world.seats; }
  readonly avatars = new Map<AvatarId, Avatar>();
  readonly reservations = new Map<string, AvatarId>();
  constructor(private random: () => number = Math.random, private walkSpeeds: Partial<Record<AvatarId, number>> = {}) {
    FRIENDS.forEach((f, i) => this.avatars.set(f.id, { ...f.start, id: f.id, name: f.name, phase: 'idle', yaw: Math.PI / 4, path: [], seatId: null, progress: 0, until: .7 + i * .9, deadline: 0, directed: false, lastEquipment: null }));
  }
  applyLayout(items: PlacedItem[]) {
    if (geometryError(items)) throw new Error('Invalid playground layout');
    const nav = worldFrom(items);
    if (!walkable(HUB, nav) || nav.seats.some(s => !findPath(HUB, s.approach, nav))) throw new Error('Inaccessible playground layout');
    this.layout = items.map(i => ({ ...i })); this.world = nav; this.reservations.clear();
    const occupied: Point[] = [];
    for (const a of this.avatars.values()) {
      const candidates: Point[] = [];
      for (let x = 1; x < N; x += 2) for (let z = 1; z < N; z += 2) candidates.push(world(x, z));
      candidates.sort((p, q) => Math.hypot(p.x - HUB.x, p.z - HUB.z) - Math.hypot(q.x - HUB.x, q.z - HUB.z));
      const safe = candidates.find(p => occupied.every(o => Math.hypot(p.x - o.x, p.z - o.z) > .8) && findPath(HUB, p, this.world));
      Object.assign(a, safe ?? HUB); occupied.push({ x: a.x, z: a.z });
      a.phase = 'idle'; a.path = []; a.seatId = null; a.progress = 0; a.directed = false; a.until = this.time + 1 + occupied.length * .5;
    }
  }
  seatOf(a: Avatar) { return this.seats.find(s => s.id === a.seatId); }
  private free(a: Avatar) { if (a.seatId && this.reservations.get(a.seatId) === a.id) this.reservations.delete(a.seatId); a.seatId = null; }
  private settle(a: Avatar, delay = 2) { this.free(a); a.phase = 'idle'; a.path = []; a.progress = 0; a.until = this.time + delay; }
  private beginExit(a: Avatar) { if (a.phase !== 'boarding') a.progress = 1; a.phase = 'leaving'; a.path = []; a.deadline = this.time + 2; }
  leave(id: AvatarId) {
    const a = this.avatars.get(id)!;
    if (['boarding', 'seated', 'swinging'].includes(a.phase)) { this.beginExit(a); return true; }
    if (a.phase === 'leaving') return true;
    this.settle(a); return true;
  }
  resume(id: AvatarId) { const a = this.avatars.get(id)!; a.directed = false; this.leave(id); if (a.phase === 'idle') a.until = this.time + .4; }
  moveTo(id: AvatarId, target: Point): string | null {
    const a = this.avatars.get(id)!;
    if (['boarding', 'seated', 'swinging', 'leaving'].includes(a.phase)) return '먼저 내려온 뒤 이동을 지시해주세요.';
    // Stop on the centre of the clicked tile; a centre too close to an obstacle falls back to the clicked point.
    const path = findPath(a, tileCentre(target), this.world) ?? findPath(a, target, this.world); if (!path) return '이곳까지 걸어갈 수 없어요. 빈 바닥을 선택해주세요.';
    this.free(a); a.directed = true; a.path = path; a.phase = 'walking'; a.deadline = this.time + 40; return null;
  }
  use(id: AvatarId, equipment: EquipmentId, directed = true): string | null {
    const a = this.avatars.get(id)!;
    if (['boarding', 'seated', 'swinging', 'leaving'].includes(a.phase)) return '먼저 기구에서 내려와주세요.';
    // Plan before replacing the old command: a failed request leaves it intact.
    const candidates = this.seats.filter(s => s.equipment === equipment && (!this.reservations.has(s.id) || this.reservations.get(s.id) === id));
    const choice = candidates.map(s => ({ seat: s, path: findPath(a, s.approach, this.world) })).filter(c => c.path !== null).sort((a, b) => a.path!.length - b.path!.length)[0];
    if (!choice) return candidates.length ? '기구에 도착할 수 있는 길이 없어요.' : '다른 친구가 이용하거나 가는 중이에요.';
    this.free(a); this.reservations.set(choice.seat.id, id); a.seatId = choice.seat.id;
    a.path = choice.path!; a.phase = 'walking'; a.directed = directed; a.deadline = this.time + 40; return null;
  }
  wave(id: AvatarId): string | null {
    const a = this.avatars.get(id)!;
    if (['boarding', 'seated', 'swinging', 'leaving'].includes(a.phase)) return '기구에서 내려온 뒤 인사할 수 있어요.';
    this.settle(a); a.phase = 'waving'; a.directed = true; a.until = this.time + 2.4; return null;
  }
  private choose(a: Avatar) {
    a.directed = false;
    const preferred: EquipmentId = a.lastEquipment === 'bench' ? 'swing' : a.lastEquipment === 'swing' ? 'bench' : a.id === 'lilac' ? 'swing' : 'bench';
    if (a.lastEquipment === null || this.random() < .7) {
      const options = [...new Set(this.seats.filter(s => s.kind === preferred).map(s => s.equipment))];
      for (const id of options) if (!this.use(a.id, id, false)) return;
    }
    for (let i = 0; i < 20; i++) {
      const target = world(1 + 2 * Math.floor(this.random() * (N - 1) / 2), 1 + 2 * Math.floor(this.random() * (N - 1) / 2));
      const path = findPath(a, target, this.world);
      if (path && path.length > 2) { a.path = path; a.phase = 'walking'; a.deadline = this.time + 40; return; }
    }
    a.until = this.time + 2;
  }
  update(seconds: number) {
    const dt = Math.min(.1, Math.max(0, seconds)); this.time += dt;
    for (const a of this.avatars.values()) {
      if (a.phase === 'idle' || a.phase === 'waving') {
        if (this.time >= a.until) { if (a.phase === 'waving') this.settle(a, 1.5); else this.choose(a); }
      } else if (a.phase === 'walking') {
        if (this.time > a.deadline) { this.settle(a, 1); continue; }
        let remaining = dt * (this.walkSpeeds[a.id] ?? 1.45);
        while (a.path.length && remaining > 0) {
          const p = a.path[0], dx = p.x - a.x, dz = p.z - a.z, length = Math.hypot(dx, dz);
          if (length < .001) { a.path.shift(); continue; }
          a.yaw = Math.atan2(dx, dz); const step = Math.min(length, remaining);
          const next = { x: a.x + dx / length * step, z: a.z + dz / length * step };
          if (!clearSegment(a, next, this.world)) { this.settle(a, 1); break; }
          Object.assign(a, next); remaining -= step;
          if (step >= length - .001) { a.x = p.x; a.z = p.z; a.path.shift(); }
        }
        if (!a.path.length) {
          if (a.seatId) { a.phase = 'boarding'; a.progress = 0; }
          else this.settle(a, 2 + this.random() * 2);
        }
      } else if (a.phase === 'boarding' || a.phase === 'leaving') {
        const s = this.seatOf(a); if (!s) { this.settle(a); continue; }
        a.progress = Math.min(1, Math.max(0, a.progress + (a.phase === 'boarding' ? dt : -dt) / .7));
        a.x = s.approach.x + (s.x - s.approach.x) * a.progress; a.z = s.approach.z + (s.z - s.approach.z) * a.progress; a.yaw = s.yaw;
        if (a.phase === 'boarding' && a.progress === 1) { a.phase = s.kind === 'swing' ? 'swinging' : 'seated'; a.lastEquipment = s.kind; a.until = this.time + 7 + this.random() * 5; }
        else if (a.phase === 'leaving' && a.progress === 0) this.settle(a, 2.5);
      } else if (this.time >= a.until) this.beginExit(a);
    }
    // Gentle separation, not hard collision: friends can pass instead of deadlocking.
    const friends = [...this.avatars.values()];
    for (let i = 0; i < friends.length; i++) for (let j = i + 1; j < friends.length; j++) {
      const a = friends[i], b = friends[j];
      if (a.phase !== 'walking' && b.phase !== 'walking') continue;
      const dx = a.x - b.x, dz = a.z - b.z, length = Math.hypot(dx, dz);
      if (length >= .5) continue;
      const nx = length > .001 ? dx / length : 1, nz = length > .001 ? dz / length : 0;
      const push = (.5 - length) * dt * 1.3;
      for (const [p, sign] of [[a, 1], [b, -1]] as const) {
        if (p.phase !== 'walking') continue;
        const next = { x: p.x + nx * push * sign, z: p.z + nz * push * sign };
        if (walkable(next, this.world)) Object.assign(p, next);
      }
    }
  }
}
export function activityLabel(a: Avatar) {
  const labels: Record<Phase, string> = { idle: '잠깐 쉬는 중', walking: a.seatId ? '기구로 가는 중' : '산책하는 중', boarding: '자리에 앉는 중', seated: '벤치에서 쉬는 중', swinging: '그네 타는 중', leaving: '내려오는 중', waving: '인사하는 중' };
  return labels[a.phase];
}

