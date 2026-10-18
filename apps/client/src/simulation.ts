import { DEFAULT_LAYOUT, HUB, cloneLayout, footprint, geometryError, worldFrom, type NavigationWorld, type PlacedItem, type Seat, type Point } from './layout';
export type { Point, Seat } from './layout';
import { AFFINITY_MAX, actionsToTry, affinityLevel, pickForMoment, type AffinityLevel, type Moment, type Unlock } from './affinity';
import { UNLOCKS } from './unlocks';
import type { ActionId } from './friendActions';
export type AvatarId = 'character' | 'peach' | 'lilac';
export type EquipmentId = string;

export type Phase = 'idle' | 'walking' | 'boarding' | 'seated' | 'swinging' | 'leaving' | 'waving' | 'greeting' | 'happy' | 'watching';
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
  /** The equipment just stepped off: skipped until the friend has done something else, so she does not climb straight back on. */
  leftItem: string | null;
  /** While greeting: the friend being greeted and when it started. */
  partner: AvatarId | null; since: number;
  /** Until when a petted friend who stays put (e.g. on a seat) shows a heart. */
  cheerUntil: number;
  /** An unlocked line in a speech bubble and an unlocked emotion over the head, each shown until its time. */
  speech: string; speechUntil: number; emote: string; emoteUntil: number;
  /** Going to or watching a pond: the shore tile to stand on and the pond centre to face. */
  watchSpot: Point | null; lookAt: Point | null;
}
export class LifeSimulation {
  time = 0;
  layout = cloneLayout(DEFAULT_LAYOUT).items;
  world = worldFrom(this.layout);
  get seats() { return this.world.seats; }
  readonly avatars = new Map<AvatarId, Avatar>();
  readonly reservations = new Map<string, AvatarId>();
  /** How close each friend feels to you (affinity.ts): one point for the first pat of each day, kept with the save. */
  readonly affinity: Record<AvatarId, number> = { character: 0, peach: 0, lilac: 0 };
  /** The day (YYYY-MM-DD) each friend's affinity last went up. */
  readonly petted: Partial<Record<AvatarId, string>> = {};
  /** Whether the day passes (morning → afternoon → evening → night); off keeps a bright afternoon. */
  dayCycle = true;
  /** Fraction of the day at time 0 (0 = midnight); a day lasts DAY.length seconds. */
  dayStart: number = DAY.start;
  dayFraction() { return this.dayCycle ? this.clock() : DAY.still; }
  /** Where the day has got to (0 = midnight), whether or not the cycle is shown; this is what the save keeps. */
  clock() { return ((this.dayStart + this.time / DAY.length) % 1 + 1) % 1; }
  setClock(fraction: number) { this.dayStart = ((fraction - this.time / DAY.length) % 1 + 1) % 1; }
  get night() { return dayPart(this.dayFraction()) === 'night'; }
  private lastPet: Partial<Record<AvatarId, number>> = {};
  /** What friends unlock as affinity grows (unlocks.ts; tests pass their own list). */
  unlocks: readonly Unlock[] = UNLOCKS;
  /** Lines said since the screen last asked (drainSpoken), so it can also show them as a notice. */
  private spoken: { id: AvatarId; text: string }[] = [];
  drainSpoken() { return this.spoken.splice(0); }
  /** A moment came for a friend: an unlocked line and/or emotion for it may show. Returns whether anything did. */
  moment(a: Avatar, when: Moment): boolean {
    const points = this.affinity[a.id];
    const line = pickForMoment(this.unlocks, 'line', a.id, points, when, this.random);
    const emote = pickForMoment(this.unlocks, 'emote', a.id, points, when, this.random);
    if (line) { a.speech = line.text; a.speechUntil = this.time + SPEECH.base + [...line.text].length * SPEECH.perChar; this.spoken.push({ id: a.id, text: line.text }); }
    if (emote) { a.emote = emote.emote; a.emoteUntil = this.time + (emote.seconds ?? 2); }
    return !!(line || emote);
  }
  /** Carries out an unlocked action (friendActions.ts); false when it cannot happen right now. */
  perform(a: Avatar, action: ActionId): boolean {
    switch (action) {
      case 'wave': this.settle(a); a.phase = 'waving'; a.until = this.time + 2.4; return true;
      case 'cheer': this.settle(a); a.phase = 'happy'; a.since = this.time; a.until = this.time + PET.duration; return true;
      case 'visitFriend': {
        const others = [...this.avatars.values()].filter(o => o.id !== a.id && !o.seatId && ['idle', 'walking', 'waving', 'happy'].includes(o.phase))
          .sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z));
        for (const o of others) for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
          const path = findPath(a, tileCentre({ x: o.x + dx, z: o.z + dz }), this.world);
          if (path && path.length > 2) { this.free(a); a.path = path; a.phase = 'walking'; a.deadline = this.time + 40; return true; }
        }
        return false;
      }
    }
  }
  constructor(private random: () => number = Math.random, private walkSpeeds: Partial<Record<AvatarId, number>> = {}) {
    FRIENDS.forEach((f, i) => this.avatars.set(f.id, { ...f.start, id: f.id, name: f.name, phase: 'idle', yaw: Math.PI / 4, path: [], seatId: null, progress: 0, until: .7 + i * .9, deadline: 0, directed: false, lastEquipment: null, leftItem: null, partner: null, since: 0, cheerUntil: 0, speech: '', speechUntil: 0, emote: '', emoteUntil: 0, watchSpot: null, lookAt: null }));
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
  private free(a: Avatar) { if (a.seatId && this.reservations.get(a.seatId) === a.id) this.reservations.delete(a.seatId); a.seatId = null; a.watchSpot = null; a.lookAt = null; }
  /** Ponds in the current layout. */
  get ponds() { return this.layout.filter(i => i.kind === 'pond'); }
  /** The pond a ground point is on, if any. */
  pondAt(p: Point) { return this.ponds.find(i => { const f = footprint(i); return Math.abs(p.x - f.x) <= f.w / 2 && Math.abs(p.z - f.z) <= f.d / 2; }); }
  /** Shore tiles around a pond that a friend can stand on (tile centres just outside its footprint), not taken by another watcher. */
  shoreSpots(pond: PlacedItem, except?: AvatarId): Point[] {
    const f = footprint(pond), spots: Point[] = [];
    for (let x = f.x - f.w / 2 + .5; x < f.x + f.w / 2; x++) spots.push({ x, z: f.z - f.d / 2 - .5 }, { x, z: f.z + f.d / 2 + .5 });
    for (let z = f.z - f.d / 2 + .5; z < f.z + f.d / 2; z++) spots.push({ x: f.x - f.w / 2 - .5, z }, { x: f.x + f.w / 2 + .5, z });
    const taken = [...this.avatars.values()].filter(o => o.id !== except && o.watchSpot).map(o => o.watchSpot!);
    return spots.filter(p => walkable(p, this.world) && !taken.some(t => Math.hypot(t.x - p.x, t.z - p.z) < .5));
  }
  /**
   * Go and watch a pond (the nearest one when none is given): walk to the closest free shore tile, then stand facing
   * the water for a while (phase 'watching'). Returns an error message when there is nowhere to stand.
   */
  watchPond(id: AvatarId, pondId: string | null = null, directed = true): string | null {
    const a = this.avatars.get(id)!;
    if (['boarding', 'seated', 'swinging', 'leaving'].includes(a.phase)) return '먼저 내려온 뒤 호수를 보러 갈 수 있어요.';
    const ponds = pondId ? this.ponds.filter(p => p.id === pondId) : [...this.ponds].sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z));
    for (const pond of ponds) {
      const routes = this.shoreSpots(pond, a.id).map(spot => ({ spot, path: findPath(a, spot, this.world) })).filter(r => r.path).sort((p, q) => p.path!.length - q.path!.length);
      const best = routes[0]; if (!best) continue;
      this.free(a); a.directed = directed; a.path = best.path!; a.phase = 'walking'; a.deadline = this.time + 40;
      a.watchSpot = best.spot; a.lookAt = { x: footprint(pond).x, z: footprint(pond).z };
      return null;
    }
    return '호숫가에 설 자리가 없어요.';
  }
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
    // A tap on a pond means "go and look at it".
    const pond = this.pondAt(target); if (pond) return this.watchPond(id, pond.id);
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
  /**
   * A pat: the friend is happy for a moment (a heart over their head). The first pat on each calendar day `today`
   * (YYYY-MM-DD) also raises affinity by one. Returns null while pats are too quick to count, otherwise whether
   * affinity went up and the level reached when it crossed into a new one.
   */
  pet(id: AvatarId, today: string): { gained: boolean; levelUp: AffinityLevel | null } | null {
    const a = this.avatars.get(id)!;
    if (this.time - (this.lastPet[id] ?? -Infinity) < PET.cooldown) return null;
    this.lastPet[id] = this.time;
    const gained = this.petted[id] !== today && this.affinity[id] < AFFINITY_MAX, before = affinityLevel(this.affinity[id]).index;
    if (gained) { this.affinity[id]++; this.petted[id] = today; }
    const after = affinityLevel(this.affinity[id]), result = { gained, levelUp: after.index > before ? after.level : null };
    if (!(result.levelUp && this.moment(a, 'levelUp'))) this.moment(a, 'pet');
    if (['boarding', 'seated', 'swinging', 'leaving'].includes(a.phase) || a.phase === 'greeting') { a.cheerUntil = this.time + PET.duration; return result; }
    const directed = a.directed;
    this.settle(a); a.phase = 'happy'; a.since = this.time; a.until = this.time + PET.duration; a.directed = directed;
    return result;
  }
  wave(id: AvatarId): string | null {
    const a = this.avatars.get(id)!;
    if (['boarding', 'seated', 'swinging', 'leaving'].includes(a.phase)) return '기구에서 내려온 뒤 인사할 수 있어요.';
    this.settle(a); a.phase = 'waving'; a.directed = true; a.until = this.time + 2.4; return null;
  }
  private choose(a: Avatar) {
    a.directed = false;
    const left = a.leftItem; a.leftItem = null;
    // Unlocked lines and emotions for a quiet moment, then any unlocked action that wins its roll.
    this.moment(a, 'idle');
    for (const action of actionsToTry(this.unlocks, a.id, this.affinity[a.id], this.random)) if (this.perform(a, action)) return;
    // Now and then a free friend goes to look at a pond (only rolled when there is one, so pond-less gardens behave as before).
    if (this.ponds.length && this.random() < LAKE.visit && !this.watchPond(a.id, null, false)) return;
    // Sit together: a free bench seat beside a friend who is sitting (or about to) is the first pick, most times.
    if (a.lastEquipment !== null && this.random() < REACTION.sitTogether) {
      const beside = this.seats.find(s => s.kind === 'bench' && s.equipment !== left && !this.reservations.has(s.id) &&
        this.seats.some(o => o.equipment === s.equipment && o.id !== s.id && this.reservations.has(o.id) && this.reservations.get(o.id) !== a.id));
      if (beside && !this.use(a.id, beside.equipment, false)) return;
    }
    // At night friends mostly rest on benches; by day they take turns between bench and swing.
    const preferred: EquipmentId = this.night && a.lastEquipment !== null ? 'bench' : a.lastEquipment === 'bench' ? 'swing' : a.lastEquipment === 'swing' ? 'bench' : a.id === 'lilac' ? 'swing' : 'bench';
    if (a.lastEquipment === null || this.random() < .7) {
      const options = [...new Set(this.seats.filter(s => s.kind === preferred && s.equipment !== left).map(s => s.equipment))];
      for (const id of options) if (!this.use(a.id, id, false)) return;
    }
    // Walk along: head for a tile beside where a strolling friend is going.
    const strolling = [...this.avatars.values()].filter(o => o.id !== a.id && o.phase === 'walking' && !o.seatId && o.path.length);
    if (strolling.length && this.random() < REACTION.walkAlong) {
      const goal = strolling[Math.floor(this.random() * strolling.length)].path.at(-1)!;
      for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const path = findPath(a, { x: goal.x + dx, z: goal.z + dz }, this.world);
        if (path && path.length > 2) { a.path = path; a.phase = 'walking'; a.deadline = this.time + 40; return; }
      }
    }
    for (let i = 0; i < 20; i++) {
      const target = world(1 + 2 * Math.floor(this.random() * (N - 1) / 2), 1 + 2 * Math.floor(this.random() * (N - 1) / 2));
      const path = findPath(a, target, this.world);
      if (path && path.length > 2) { a.path = path; a.phase = 'walking'; a.deadline = this.time + 40; return; }
    }
    a.leftItem = left; a.until = this.time + 2;  // nothing to do yet: try again soon, still skipping that equipment
  }
  /** Friends meeting: two free friends (not on a seat, not following an order) who come close stop, turn to each
   * other and greet. Each pair rolls once per meeting and then waits a while before greeting again. */
  private react() {
    const free = [...this.avatars.values()].filter(a => (a.phase === 'idle' || a.phase === 'walking') && !a.directed && !a.seatId);
    for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
      const a = free[i], b = free[j], key = [a.id, b.id].sort().join('+'), d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d > REACTION.leave) { this.met.delete(key); continue; }
      if (d > REACTION.meet || this.met.has(key) || this.time < (this.greetedUntil.get(key) ?? 0)) continue;
      this.met.add(key);
      if (this.random() >= REACTION.greet) continue;
      this.greetedUntil.set(key, this.time + REACTION.cooldown);
      for (const [p, q] of [[a, b], [b, a]] as const) {
        p.phase = 'greeting'; p.path = []; p.partner = q.id; p.since = this.time; p.until = this.time + REACTION.duration;
        p.yaw = Math.atan2(q.x - p.x, q.z - p.z);
        this.moment(p, 'greet');
      }
    }
  }
  private readonly met = new Set<string>();
  private readonly greetedUntil = new Map<string, number>();
  update(seconds: number) {
    const dt = Math.min(.1, Math.max(0, seconds)); this.time += dt;
    for (const a of this.avatars.values()) {
      if (a.phase === 'idle' || a.phase === 'waving' || a.phase === 'greeting' || a.phase === 'happy' || a.phase === 'watching') {
        if (this.time >= a.until) { if (a.phase === 'idle') this.choose(a); else { a.partner = null; this.settle(a, 1.5); } }
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
          else if (a.lookAt) {
            // At the shore: face the water and watch it for a while.
            a.phase = 'watching'; a.yaw = Math.atan2(a.lookAt.x - a.x, a.lookAt.z - a.z); a.since = this.time;
            a.until = this.time + LAKE.watch + this.random() * LAKE.extra; this.moment(a, 'watch');
          }
          else this.settle(a, 2 + this.random() * 2);
        }
      } else if (a.phase === 'boarding' || a.phase === 'leaving') {
        const s = this.seatOf(a); if (!s) { this.settle(a); continue; }
        a.progress = Math.min(1, Math.max(0, a.progress + (a.phase === 'boarding' ? dt : -dt) / .7));
        a.x = s.approach.x + (s.x - s.approach.x) * a.progress; a.z = s.approach.z + (s.z - s.approach.z) * a.progress; a.yaw = s.yaw;
        if (a.phase === 'boarding' && a.progress === 1) { a.phase = s.kind === 'swing' ? 'swinging' : 'seated'; a.lastEquipment = s.kind; this.moment(a, 'seat'); a.until = this.time + (7 + this.random() * 5) * (this.night ? DAY.nightRest : 1); }
        else if (a.phase === 'leaving' && a.progress === 0) { a.leftItem = s.equipment; this.settle(a, 2.5); }
      } else if (this.time >= a.until) this.beginExit(a);
    }
    this.react();
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
  const labels: Record<Phase, string> = { idle: '잠깐 쉬는 중', walking: a.seatId ? '기구로 가는 중' : '산책하는 중', boarding: '자리에 앉는 중', seated: '벤치에서 쉬는 중', swinging: '그네 타는 중', leaving: '내려오는 중', waving: '인사하는 중', greeting: '친구와 인사하는 중', happy: '기분 좋은 중', watching: '호수 구경하는 중' };
  if (a.phase === 'walking' && a.lookAt) return '호수 보러 가는 중';
  return labels[a.phase];
}
/** How often friends react to each other (chances are per meeting or per choice; distances in tiles, times in s). */
export const REACTION = { meet: 1.3, leave: 2.2, greet: .7, cooldown: 25, duration: 3.6, sitTogether: .5, walkAlong: .3 } as const;
/**
 * The symbol over a friend's head while waving or greeting ('' otherwise; seats add their own). A greeting starts with
 * a heart, then the pair take turns chatting (···) and humming (♪). When drawn greeting/waving art exists, the
 * renderers can play it for these phases instead.
 */
export function reactionLabel(a: Avatar, time: number) {
  if (time < a.speechUntil) return a.speech;
  if (time < a.emoteUntil) return a.emote;
  if (a.phase === 'waving') return '👋';
  if (time < a.cheerUntil) return '♡';
  if (a.phase === 'happy') return time - a.since < PET.duration / 2 ? '♡' : '♪';
  // Watching a pond: a fish shows up now and then (2.5 s of every 5).
  if (a.phase === 'watching') return (time - a.since) % 5 < 2.5 ? '🐟' : '';
  if (a.phase !== 'greeting') return '';
  // Meeting: notice (!), wave hello (👋), then take turns chatting (··· / ♪).
  const t = time - a.since;
  if (t < GREET.notice) return '!';
  if (t < GREET.hello) return '👋';
  const turn = Math.floor((t - GREET.hello) / .8), speaking = (turn % 2 === 0) === (a.id < (a.partner ?? ''));
  return speaking ? (turn % 4 < 2 ? '···' : '♪') : '';
}
/** Ponds: chance a free friend goes to look when choosing what to do, and how long they watch (s). */
export const LAKE = { visit: .25, watch: 6, extra: 5 } as const;
/** A meeting's opening, in seconds from its start: "!" until `notice`, then a wave until `hello`, then chat. */
export const GREET = { notice: .6, hello: 1.4 } as const;
/** How long an unlocked line stays in its speech bubble: a base plus a little per character. */
export const SPEECH = { base: 2.4, perChar: .12 } as const;
/** Whether the current bubble contains a line of dialogue rather than an emotion icon. */
export function speaking(a: Avatar, time: number) { return time < a.speechUntil; }
/** Patting a friend: seconds of happiness and seconds before another pat counts. */
export const PET = { duration: 1.8, cooldown: .8 } as const;
/**
 * The garden's day: DAY.length seconds per day, starting at DAY.start (a fraction of the day, 0 = midnight); with the
 * day cycle off it stays at DAY.still. At night seated friends rest DAY.nightRest times as long.
 */
export const DAY = { length: 600, start: .3, still: .58, nightRest: 1.8 } as const;
export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';
export function dayPart(fraction: number): DayPart {
  const h = fraction * 24;
  return h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'afternoon' : h >= 17 && h < 20 ? 'evening' : 'night';
}
/** "오전 7:12" for a day fraction. */
export function clockLabel(fraction: number) {
  const minutes = Math.floor(fraction * 24 * 60) % (24 * 60), h = Math.floor(minutes / 60), m = minutes % 60;
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`;
}
