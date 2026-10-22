import type { AvatarId } from './simulation';
import type { ActionId } from './friendActions';

/**
 * Affinity: how close each friend feels to you. A pat raises it by one point, once per friend per calendar day.
 * Points climb through named levels, and points unlock things a friend does: lines they say, emotions shown over
 * their head, and actions they take on their own. What is unlocked is content, listed in unlocks.ts; this file holds
 * the shapes and the rules for picking from that list.
 */
export const AFFINITY_MAX = 99;
export interface AffinityLevel { at: number; name: string }
export const AFFINITY_LEVELS: readonly AffinityLevel[] = [
  { at: 0, name: '처음 만난 사이' },
  { at: 3, name: '아는 사이' },
  { at: 7, name: '친구' },
  { at: 15, name: '단짝' },
  { at: 30, name: '소중한 친구' },
];
/** The level reached with these points (and the next one, if any). */
export function affinityLevel(points: number): { level: AffinityLevel; index: number; next: AffinityLevel | null } {
  let index = 0;
  AFFINITY_LEVELS.forEach((l, i) => { if (points >= l.at) index = i; });
  return { level: AFFINITY_LEVELS[index], index, next: AFFINITY_LEVELS[index + 1] ?? null };
}

/**
 * When a line or an emotion can show:
 * - pet: right after a pat · levelUp: a pat that reaches a new level (shown instead of a pet line)
 * - greet: meeting another friend · seat: sitting down on a bench or swing · idle: now and then while free
 * - watch: arriving at a pond's shore to look at it
 */
export type Moment = 'pet' | 'levelUp' | 'greet' | 'seat' | 'idle' | 'watch';
export const MOMENTS: Record<Moment, string> = { pet: '쓰다듬었을 때', levelUp: '단계가 올랐을 때', greet: '친구와 인사할 때', seat: '기구에 앉았을 때', idle: '쉬다가 가끔', watch: '호수를 바라볼 때' };
interface UnlockBase {
  /** Affinity points needed (0..99); the level thresholds in AFFINITY_LEVELS are good values. */
  at: number;
  /** Only this friend; leave out for everyone. */
  friend?: AvatarId;
  /** Chance (0..1) each time the moment comes; defaults: idle .1, actions .15, everything else 1. */
  chance?: number;
  /** For 'greet': only when greeting this friend (e.g. a twin calling the other). */
  with?: AvatarId;
}
/** Something said in a speech bubble over the head (keep it short: up to 24 characters). */
export interface LineUnlock extends UnlockBase { kind: 'line'; when: Moment; text: string }
/** An emotion over the head: a symbol or a short word such as ♡ ♪ ✿ ! ? 💤, shown for `seconds` (default 2). */
export interface EmoteUnlock extends UnlockBase { kind: 'emote'; when: Moment; emote: string; seconds?: number }
/** A behaviour the friend may choose on their own while free (friendActions.ts lists what exists). */
export interface ActionUnlock extends UnlockBase { kind: 'action'; action: ActionId }
export type Unlock = LineUnlock | EmoteUnlock | ActionUnlock;
export const LINE_MAX = 24;

const forFriend = (u: Unlock, friend: AvatarId, points: number) => points >= u.at && (!u.friend || u.friend === friend);
/** Everything this friend has unlocked at these points, in list order. */
export function unlockedFor(list: readonly Unlock[], friend: AvatarId, points: number): Unlock[] {
  return list.filter(u => forFriend(u, friend, points));
}
/** The next unlock this friend has not reached yet (fewest points first), if any. */
export function nextUnlock(list: readonly Unlock[], friend: AvatarId, points: number): Unlock | null {
  return list.filter(u => (!u.friend || u.friend === friend) && u.at > points).sort((a, b) => a.at - b.at)[0] ?? null;
}
const defaultChance = (u: Unlock) => u.chance ?? (u.kind === 'action' ? .15 : u.when === 'idle' ? .1 : 1);
/**
 * Picks one unlocked line or emotion for a moment: candidates that pass their chance roll, one of them at random.
 * Lines and emotions are picked separately, so a moment can show both.
 */
export function pickForMoment<K extends 'line' | 'emote'>(list: readonly Unlock[], kind: K, friend: AvatarId, points: number, when: Moment, random: () => number, partner?: AvatarId | null): Extract<Unlock, { kind: K }> | null {
  const ready = list.filter((u): u is Extract<Unlock, { kind: K }> => u.kind === kind && (u as LineUnlock | EmoteUnlock).when === when && forFriend(u, friend, points) && (!u.with || u.with === partner) && random() < defaultChance(u));
  return ready.length ? ready[Math.floor(random() * ready.length)] : null;
}
/** Unlocked actions that pass their chance roll this time, in a random order. */
export function actionsToTry(list: readonly Unlock[], friend: AvatarId, points: number, random: () => number): ActionId[] {
  const ready = list.filter((u): u is ActionUnlock => u.kind === 'action' && forFriend(u, friend, points) && random() < defaultChance(u));
  return ready.map(u => ({ u, k: random() })).sort((a, b) => a.k - b.k).map(x => x.u.action);
}
/** Problems in an unlock list (for the tests): unknown friends, moments or actions, points out of range, long lines. */
export function unlockErrors(list: readonly Unlock[], actions: readonly string[]): string[] {
  const friends = ['character', 'peach', 'lilac', 'snow'], errors: string[] = [];
  list.forEach((u, i) => {
    const where = `#${i + 1} (${u.kind})`;
    if (!Number.isInteger(u.at) || u.at < 0 || u.at > AFFINITY_MAX) errors.push(`${where}: at must be 0..${AFFINITY_MAX}`);
    if (u.friend && !friends.includes(u.friend)) errors.push(`${where}: unknown friend ${u.friend}`);
    if (u.with && (!friends.includes(u.with) || u.with === u.friend || u.kind === 'action' || u.when !== 'greet')) errors.push(`${where}: with needs a greet line/emotion and another known friend`);
    if (u.chance !== undefined && !(u.chance > 0 && u.chance <= 1)) errors.push(`${where}: chance must be in (0, 1]`);
    if (u.kind !== 'action' && !(u.when in MOMENTS)) errors.push(`${where}: unknown moment ${u.when}`);
    if (u.kind === 'line' && (!u.text.trim() || [...u.text].length > LINE_MAX)) errors.push(`${where}: line must be 1..${LINE_MAX} characters`);
    if (u.kind === 'emote' && (!u.emote.trim() || [...u.emote].length > 6)) errors.push(`${where}: emote must be 1..6 characters`);
    if (u.kind === 'action' && !actions.includes(u.action)) errors.push(`${where}: unknown action ${u.action}`);
  });
  return errors;
}
/** Today's date in the player's time zone, as YYYY-MM-DD: the key for "once a day". */
export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
