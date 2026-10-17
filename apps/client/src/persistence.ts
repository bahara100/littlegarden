import { CATALOG, cloneLayout, snapToTiles, type Layout, type PlacedItem } from './layout';
import { layoutError } from './editor';

export const SAVE_KEY = 'little-garden.layout.v1';
export const MAX_SAVE_BYTES = 200_000;
export function decodeSave(text: string): Layout {
  if (text.length > MAX_SAVE_BYTES) throw new Error('파일이 너무 커요. 200KB 이하의 놀이터 백업을 골라주세요.');
  const data = JSON.parse(text);
  if (!data || data.app !== 'little-garden' || data.version !== 1) throw new Error('지원하는 놀이터 백업 형식이 아니에요.');
  const layout = data.layout;
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
export function encodeSave(layout: Layout): string {
  return JSON.stringify({ app: 'little-garden', version: 1, savedAt: new Date().toISOString(), layout: cloneLayout(layout) }, null, 2);
}
export interface SaveStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function loadLayout(storage: SaveStorage): Layout | null { const text = storage.getItem(SAVE_KEY); return text === null ? null : decodeSave(text); }
export function saveLayout(storage: SaveStorage, layout: Layout) { storage.setItem(SAVE_KEY, encodeSave(layout)); }
