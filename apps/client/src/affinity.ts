/**
 * Affinity: how close each friend feels to you. A pat raises it by one point, once per friend per calendar day.
 * Points climb through named levels; each level can unlock effects on how the friend behaves. The effects are not
 * decided yet, so every level's list is empty: add an effect kind to AffinityEffect, list it on a level, and read
 * it in simulation.ts through affinityEffects().
 */
export const AFFINITY_MAX = 99;
/** Something a level changes about a friend. None yet; add kinds here, e.g. { kind: 'greetMore'; chance: number }. */
export type AffinityEffect = never;
export interface AffinityLevel { at: number; name: string; effects: readonly AffinityEffect[] }
export const AFFINITY_LEVELS: readonly AffinityLevel[] = [
  { at: 0, name: '처음 만난 사이', effects: [] },
  { at: 3, name: '아는 사이', effects: [] },
  { at: 7, name: '친구', effects: [] },
  { at: 15, name: '단짝', effects: [] },
  { at: 30, name: '소중한 친구', effects: [] },
];
/** The level reached with these points (and the next one, if any). */
export function affinityLevel(points: number): { level: AffinityLevel; index: number; next: AffinityLevel | null } {
  let index = 0;
  AFFINITY_LEVELS.forEach((l, i) => { if (points >= l.at) index = i; });
  return { level: AFFINITY_LEVELS[index], index, next: AFFINITY_LEVELS[index + 1] ?? null };
}
/** Every effect unlocked so far, lowest level first. */
export function affinityEffects(points: number): AffinityEffect[] {
  return AFFINITY_LEVELS.filter(l => points >= l.at).flatMap(l => l.effects);
}
/** Today's date in the player's time zone, as YYYY-MM-DD: the key for "once a day". */
export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
