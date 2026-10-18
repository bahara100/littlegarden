import { CATALOG, DEFAULT_LAYOUT, cloneLayout, snapToTiles, type Layout, type PlacedItem } from './layout';
import { layoutError } from './editor';
import { DAY, type AvatarId } from './simulation';
import { DEFAULT_REGION, REGIONS, isRegionId, type RegionId } from './regions';
import { AFFINITY_MAX } from './affinity';
import { DEFAULT_SEASON, isSeasonId, type SeasonId } from './seasons';

export const SAVE_KEY = 'little-garden.layout.v1';
export const MAX_SAVE_BYTES = 200_000;
/** Current save format. Older saves are upgraded step by step by MIGRATIONS; newer ones are refused. */
export const SAVE_VERSION = 3;
export type Affinity = Record<AvatarId, number>;
/** The day (YYYY-MM-DD) each friend's affinity last went up from a pat. */
export type Petted = Partial<Record<AvatarId, string>>;
export interface GardenSave {
  /** Each region's own placements and storage; a region not listed yet opens with the default layout. */
  regions: Partial<Record<RegionId, Layout>>;
  affinity: Affinity; petted: Petted;
  /** Where the day had got to (0 = midnight, .5 = noon). */
  clock: number;
}
export function emptySave(): GardenSave { return { regions: {}, affinity: { character: 0, peach: 0, lilac: 0 }, petted: {}, clock: DAY.start }; }
/** A save holding one layout, in the garden region. */
export function gardenSave(layout: Layout, extra: Partial<GardenSave> = {}): GardenSave { return { ...emptySave(), regions: { garden: layout }, ...extra }; }
type SaveData = { app: string; version: number; [key: string]: unknown };
/**
 * One step per version: MIGRATIONS[n] turns a version-n save into version n + 1. Add a step here whenever the format
 * changes, so every older save keeps loading.
 *   1 → 2: friends' affinity (how close they feel) is saved with the garden; old saves start everyone at 0.
 *   2 → 3: every region keeps its own layout (the old one becomes the garden's), the time of day is saved, and
 *          friends remember the day they were last patted.
 */
const MIGRATIONS: Record<number, (data: SaveData) => SaveData> = {
  1: data => ({ ...data, version: 2, friends: { affinity: { character: 0, peach: 0, lilac: 0 } } }),
  2: ({ layout, ...data }) => ({ ...data, version: 3, regions: { garden: layout }, world: { clock: DAY.start } }),
};
export function upgradeSave(data: SaveData): SaveData {
  if (!Number.isInteger(data.version) || data.version < 1) throw new Error('지원하는 놀이터 백업 형식이 아니에요.');
  if (data.version > SAVE_VERSION) throw new Error('더 새로운 버전에서 만든 백업이에요. 페이지를 새로고침한 뒤 다시 불러와 주세요.');
  while (data.version < SAVE_VERSION) data = MIGRATIONS[data.version](data);
  return data;
}
function affinityFrom(value: unknown): Affinity {
  const v = (value ?? {}) as Record<string, unknown>, out: Affinity = { character: 0, peach: 0, lilac: 0 };
  for (const id of Object.keys(out) as AvatarId[]) {
    const n = v[id];
    if (n !== undefined && (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > AFFINITY_MAX)) throw new Error('친구 정보가 올바르지 않아요.');
    out[id] = (n as number | undefined) ?? 0;
  }
  return out;
}
function pettedFrom(value: unknown): Petted {
  const v = (value ?? {}) as Record<string, unknown>, out: Petted = {};
  for (const id of ['character', 'peach', 'lilac'] as AvatarId[]) {
    const d = v[id];
    if (d === undefined) continue;
    if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error('친구 정보가 올바르지 않아요.');
    out[id] = d;
  }
  return out;
}
export function decodeGarden(text: string): GardenSave {
  if (text.length > MAX_SAVE_BYTES) throw new Error('파일이 너무 커요. 200KB 이하의 놀이터 백업을 골라주세요.');
  const raw = JSON.parse(text);
  if (!raw || raw.app !== 'little-garden') throw new Error('지원하는 놀이터 백업 형식이 아니에요.');
  const data = upgradeSave(raw);
  const stored = (data.regions ?? {}) as Record<string, unknown>;
  if (typeof stored !== 'object' || Array.isArray(stored) || Object.keys(stored).some(id => !isRegionId(id))) throw new Error('지역 정보가 올바르지 않아요.');
  const regions: GardenSave['regions'] = {};
  for (const r of REGIONS) if (stored[r.id] !== undefined) regions[r.id] = decodeLayout(stored[r.id]);
  const friends = data.friends as { affinity?: unknown; petted?: unknown } | undefined, world = data.world as { clock?: unknown } | undefined;
  const clock = world?.clock ?? DAY.start;
  if (typeof clock !== 'number' || !Number.isFinite(clock) || clock < 0 || clock >= 1) throw new Error('하루 시각 정보가 올바르지 않아요.');
  return { regions, affinity: affinityFrom(friends?.affinity), petted: pettedFrom(friends?.petted), clock };
}
/** One region's placements and storage, checked like an editor would. */
function decodeLayout(value: unknown): Layout {
  const layout = value as Layout;
  if (!layout || !Array.isArray(layout.items) || !Array.isArray(layout.stored) || layout.items.length + layout.stored.length > 160) throw new Error('배치 또는 보관함 형식이 올바르지 않아요.');
  const ids = new Set<string>();
  function item(value: unknown): PlacedItem {
    const v = value as PlacedItem;
    if (!v || typeof v.id !== 'string' || !v.id.length || v.id.length > 100 || ['character', 'peach', 'lilac'].includes(v.id) || ids.has(v.id) || !Object.hasOwn(CATALOG, v.kind) ||
      !Number.isFinite(v.x) || !Number.isFinite(v.z) || Math.abs(v.x) > 8 || Math.abs(v.z) > 8 || !Number.isInteger(v.turn) || v.turn < 0 || v.turn > 3 ||
      [v.w, v.d].some(n => n !== undefined && (typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > 16))) throw new Error('기구 정보나 고유 번호가 올바르지 않아요.');
    ids.add(v.id);
    return { id: v.id, kind: v.kind, x: v.x, z: v.z, turn: v.turn, ...(v.w === undefined ? {} : { w: v.w }), ...(v.d === undefined ? {} : { d: v.d }) };
  }
  const result = { items: layout.items.map(item), stored: layout.stored.map(item) };
  const error = layoutError(result.items); if (error) throw new Error(error);
  // Saves from before tile alignment move onto whole tiles when that still gives a valid layout.
  const snapped = { items: result.items.map((i: PlacedItem) => snapToTiles(i)), stored: result.stored.map((i: PlacedItem) => snapToTiles(i)) };
  return layoutError(snapped.items) ? result : snapped;
}
/** The garden region's layout in a backup (the default layout when it has none). */
export function decodeSave(text: string): Layout { return decodeGarden(text).regions.garden ?? cloneLayout(DEFAULT_LAYOUT); }
export function encodeSave(save: GardenSave): string {
  const regions = Object.fromEntries(Object.entries(save.regions).map(([id, layout]) => [id, cloneLayout(layout!)]));
  return JSON.stringify({ app: 'little-garden', version: SAVE_VERSION, savedAt: new Date().toISOString(), regions,
    friends: { affinity: { ...save.affinity }, petted: { ...save.petted } }, world: { clock: save.clock } }, null, 2);
}
export interface SaveStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function loadGarden(storage: SaveStorage): GardenSave | null { const text = storage.getItem(SAVE_KEY); return text === null ? null : decodeGarden(text); }
export function saveGarden(storage: SaveStorage, save: GardenSave) { storage.setItem(SAVE_KEY, encodeSave(save)); }

/** View settings remembered per browser (not part of the garden backup). */
export const SETTINGS_KEY = 'little-garden.settings.v1';
export interface Settings { grid: boolean; zoom: number; selected: AvatarId; dayCycle: boolean; fps: boolean; region: RegionId; season: SeasonId;
  /** The song player: loudness 0..1, muted, the song last heard and where in it, and whether it was playing. */
  volume: number; muted: boolean; track: string | null; trackTime: number; playing: boolean }
export const DEFAULT_SETTINGS: Settings = { grid: false, zoom: 1, selected: 'character', dayCycle: true, fps: false, region: DEFAULT_REGION, season: DEFAULT_SEASON,
  volume: .6, muted: false, track: null, trackTime: 0, playing: false };
export function loadSettings(storage: SaveStorage): Settings {
  try {
    const v = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>, out = { ...DEFAULT_SETTINGS };
    if (typeof v.grid === 'boolean') out.grid = v.grid;
    if (typeof v.zoom === 'number' && Number.isFinite(v.zoom)) out.zoom = Math.max(.65, Math.min(5, v.zoom));
    if (v.selected === 'character' || v.selected === 'peach' || v.selected === 'lilac') out.selected = v.selected;
    if (typeof v.dayCycle === 'boolean') out.dayCycle = v.dayCycle;
    if (typeof v.fps === 'boolean') out.fps = v.fps;
    if (isRegionId(v.region)) out.region = v.region;
    if (isSeasonId(v.season)) out.season = v.season;
    if (typeof v.volume === 'number' && Number.isFinite(v.volume)) out.volume = Math.max(0, Math.min(1, v.volume));
    if (typeof v.muted === 'boolean') out.muted = v.muted;
    if (typeof v.track === 'string' && v.track.length <= 100) out.track = v.track;
    if (typeof v.trackTime === 'number' && Number.isFinite(v.trackTime) && v.trackTime >= 0) out.trackTime = v.trackTime;
    if (typeof v.playing === 'boolean') out.playing = v.playing;
    return out;
  } catch { return { ...DEFAULT_SETTINGS }; }
}
export function saveSettings(storage: SaveStorage, settings: Settings) {
  try { storage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* private mode or full storage: settings are a convenience */ }
}
