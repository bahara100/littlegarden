import type { GroundTheme } from './regions';

/**
 * The four seasons. A season does not need its own art yet: it recolours any region's ground (regions.ts) by mixing
 * the tiles toward its own colour (spring keeps the colours and scatters pink petals). Season-specific trees, flowers
 * or snow are for later.
 */
export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';
export interface Season {
  id: SeasonId; name: string; icon: string; note: string;
  /** Colour the ground is mixed toward and how far (0 keeps it, 1 replaces it); the map edges move half as far. */
  tone: string; amount: number;
  /** Little marks on the tiles, if the season brings its own (petals, leaves, snow). */
  speck?: string;
}
export const SEASONS: readonly Season[] = [
  { id: 'spring', name: '봄', icon: '✿', note: '꽃이 피는 따스한 날', tone: '#ffffff', amount: 0, speck: '#e6a3b4' },
  { id: 'summer', name: '여름', icon: '☀', note: '햇살 가득한 푸른 날', tone: '#7fb35e', amount: .3 },
  { id: 'autumn', name: '가을', icon: '❦', note: '단풍 물드는 선선한 날', tone: '#dfa856', amount: .55, speck: '#c46f3c' },
  { id: 'winter', name: '겨울', icon: '❄', note: '눈 내리는 포근한 날', tone: '#f1f4f6', amount: .72, speck: '#ffffff' },
];
export const DEFAULT_SEASON: SeasonId = 'spring';
export function season(id: SeasonId): Season { return SEASONS.find(s => s.id === id) ?? SEASONS[0]; }
export function isSeasonId(value: unknown): value is SeasonId { return SEASONS.some(s => s.id === value); }

const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
/** `from` moved `amount` of the way toward `to`, as #rrggbb. */
export function mix(from: string, to: string, amount: number): string {
  const a = rgb(from), b = rgb(to);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, '0')).join('');
}
const looks = new WeakMap<GroundTheme, Map<SeasonId, GroundTheme>>();
/** A region's ground as it looks in a season (worked out once per region and season; renderers ask every frame). */
export function seasonGround(ground: GroundTheme, id: SeasonId): GroundTheme {
  let byRegion = looks.get(ground); if (!byRegion) looks.set(ground, byRegion = new Map());
  let look = byRegion.get(id); if (!look) byRegion.set(id, look = mixGround(ground, id));
  return look;
}
function mixGround(ground: GroundTheme, id: SeasonId): GroundTheme {
  const s = season(id), m = (c: string, k = 1) => mix(c, s.tone, s.amount * k);
  return {
    background: m(ground.background, .25),
    tiles: ground.tiles.map(c => m(c)) as unknown as GroundTheme['tiles'],
    speck: s.speck ?? m(ground.speck),
    edges: [m(ground.edges[0], .5), m(ground.edges[1], .5)], edgeLine: m(ground.edgeLine, .5),
    grid: m(ground.grid, .8),
    path: [m(ground.path[0], .5), m(ground.path[1], .5), m(ground.path[2], .5)],
  };
}
