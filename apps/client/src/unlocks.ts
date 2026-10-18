import type { Unlock } from './affinity';

/**
 * What friends unlock as affinity grows: lines, emotions and actions. The list is empty until the content is
 * decided; add one entry per unlock. Guide with examples: docs/AFFINITY_UNLOCKS.md.
 *
 *   { kind: 'line', at: 3, when: 'pet', text: '…' }                      every friend, from 3 points, after a pat
 *   { kind: 'line', at: 7, friend: 'lilac', when: 'greet', text: '…' }   only Lulu
 *   { kind: 'emote', at: 7, when: 'seat', emote: '♪', seconds: 2 }
 *   { kind: 'action', at: 15, friend: 'peach', action: 'visitFriend', chance: .2 }
 */
export const UNLOCKS: readonly Unlock[] = [];
