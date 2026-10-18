/**
 * Places the playground can be. Each region has a Korean name shown on the map label and the colours both renderers use for
 * the ground. A new region is one entry here; its own art (props, decorations) comes later and `ready` stays false
 * until it has some — those regions show their colours over the garden's props and are marked "준비 중".
 */
export interface GroundTheme {
  /** Behind the map. */
  background: string;
  /** Five tile shades, picked by a fixed hash so the floor looks hand-laid. */
  tiles: readonly [string, string, string, string, string];
  /** Little marks on one tile in five. */
  speck: string;
  /** The two visible edges of the map block (right, front) and their outline. */
  edges: readonly [string, string]; edgeLine: string;
  /** Tile outlines when the grid is shown. */
  grid: string;
  /** Path tiles: fill, outline, highlight. */
  path: readonly [string, string, string];
}
export interface Region { id: RegionId; name: string; number: string; note: string; ready: boolean; ground: GroundTheme }
export type RegionId = 'garden' | 'onsen';

export const REGIONS: readonly Region[] = [
  {
    id: 'garden', name: '작은 공원', number: '01', note: '햇살 머무는 놀이터', ready: true,
    ground: {
      background: '#eae9de', tiles: ['#bdcf98', '#b8ca92', '#b5c88c', '#c2d29d', '#bbce94'], speck: '#8fae77',
      edges: ['#81966d', '#9cac7c'], edgeLine: '#718666', grid: '#91ab7a', path: ['#e0d1ac', '#c6b88f', '#eee3c7'],
    },
  },
  {
    id: 'onsen', name: '온천 마을', number: '02', note: '김이 오르는 따뜻한 돌바닥', ready: false,
    ground: {
      background: '#e7e9e6', tiles: ['#d3cfc4', '#cdc8bc', '#c8c3b6', '#d8d4c9', '#cfcabe'], speck: '#aaa497',
      edges: ['#9b9387', '#b0a99c'], edgeLine: '#857e73', grid: '#a49d90', path: ['#c9a57e', '#a5835f', '#dcbf98'],
    },
  },
];
export const DEFAULT_REGION: RegionId = 'garden';
export function region(id: RegionId): Region { return REGIONS.find(r => r.id === id) ?? REGIONS[0]; }
export function isRegionId(value: unknown): value is RegionId { return REGIONS.some(r => r.id === value); }
