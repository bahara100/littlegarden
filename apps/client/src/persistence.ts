import { CATALOG, cloneLayout, snapToTiles, type Layout, type PlacedItem } from './layout';
import { layoutError } from './editor';
import type { AvatarId } from './simulation';

export const SAVE_KEY = 'little-garden.layout.v1';
export const MAX_SAVE_BYTES = 200_000;
/** Current save format. Older saves are upgraded step by step by MIGRATIONS; newer ones are refused. */
export const SAVE_VERSION = 2;
export type Affinity = Record<AvatarId, number>;
export interface GardenSave { layout: Layout; affinity: Affinity }
type SaveData = { app: string; version: number; [key: string]: unknown };
/**
 * One step per version: MIGRATIONS[n] turns a version-n save into version n + 1. Add a step here whenever the format
 * changes, so every older save keeps loading.
 *   1 → 2: friends' affinity (how close they feel) is saved with the garden; old saves start everyone at 0.
 */
const MIGRATIONS: Record<number, (data: SaveData) => SaveData> = {
  1: data => ({ ...data, version: 2, friends: { affinity: { character: 0, peach: 0, lilac: 0 } } }),
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
    if (n !== undefined && (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 99)) throw new Error('친구 정보가 올바르지 않아요.');
    out[id] = (n as number | undefined) ?? 0;
  }
  return out;
}
export function decodeGarden(text: string): GardenSave {
  if (text.length > MAX_SAVE_BYTES) throw new Error('파일이 너무 커요. 200KB 이하의 놀이터 백업을 골라주세요.');
  const raw = JSON.parse(text);
  if (!raw || raw.app !== 'little-garden') throw new Error('지원하는 놀이터 백업 형식이 아니에요.');
  const data = upgradeSave(raw);
  const layout = data.layout as Layout;
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
  const friends = data.friends as { affinity?: unknown } | undefined;
  return { layout: layoutError(snapped.items) ? result : snapped, affinity: affinityFrom(friends?.affinity) };
}
export function decodeSave(text: string): Layout { return decodeGarden(text).layout; }
export function encodeSave(layout: Layout, affinity?: Affinity): string {
  return JSON.stringify({ app: 'little-garden', version: SAVE_VERSION, savedAt: new Date().toISOString(), layout: cloneLayout(layout),
    friends: { affinity: { ...(affinity ?? { character: 0, peach: 0, lilac: 0 }) } } }, null, 2);
}
export interface SaveStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function loadGarden(storage: SaveStorage): GardenSave | null { const text = storage.getItem(SAVE_KEY); return text === null ? null : decodeGarden(text); }
export function loadLayout(storage: SaveStorage): Layout | null { return loadGarden(storage)?.layout ?? null; }
export function saveLayout(storage: SaveStorage, layout: Layout, affinity?: Affinity) { storage.setItem(SAVE_KEY, encodeSave(layout, affinity)); }

/** View settings remembered per browser (not part of the garden backup). */
export const SETTINGS_KEY = 'little-garden.settings.v1';
export interface Settings { grid: boolean; zoom: number; selected: AvatarId; dayCycle: boolean; fps: boolean }
export const DEFAULT_SETTINGS: Settings = { grid: false, zoom: 1, selected: 'character', dayCycle: true, fps: false };
export function loadSettings(storage: SaveStorage): Settings {
  try {
    const v = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>, out = { ...DEFAULT_SETTINGS };
    if (typeof v.grid === 'boolean') out.grid = v.grid;
    if (typeof v.zoom === 'number' && Number.isFinite(v.zoom)) out.zoom = Math.max(.65, Math.min(5, v.zoom));
    if (v.selected === 'character' || v.selected === 'peach' || v.selected === 'lilac') out.selected = v.selected;
    if (typeof v.dayCycle === 'boolean') out.dayCycle = v.dayCycle;
    if (typeof v.fps === 'boolean') out.fps = v.fps;
    return out;
  } catch { return { ...DEFAULT_SETTINGS }; }
}
export function saveSettings(storage: SaveStorage, settings: Settings) {
  try { storage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* private mode or full storage: settings are a convenience */ }
}
