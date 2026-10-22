import type { Unlock } from './affinity';

/**
 * What friends unlock as affinity grows: lines, emotions and actions. Only content the player decided goes
 * here; add one entry per unlock. Guide with examples: docs/AFFINITY_UNLOCKS.md.
 *
 *   { kind: 'line', at: 3, when: 'pet', text: '…' }                      every friend, from 3 points, after a pat
 *   { kind: 'line', at: 7, friend: 'lilac', when: 'greet', text: '…' }   only Lulu
 *   { kind: 'emote', at: 7, when: 'seat', emote: '♪', seconds: 2 }
 *   { kind: 'action', at: 15, friend: 'peach', action: 'visitFriend', chance: .2 }
 */
export const UNLOCKS: readonly Unlock[] = [
  // Momo (the elder twin) and Lulu (the younger): lines the player chose on 2026-10-18, shown from the start.
  { kind: 'line', at: 0, friend: 'peach', when: 'pet', text: '헤헤, 오늘도 산책 가자!' },
  { kind: 'line', at: 0, friend: 'peach', when: 'greet', with: 'lilac', text: '루루, 언니 따라와~' },
  { kind: 'line', at: 0, friend: 'peach', when: 'idle', text: '저쪽 길도 걸어볼까?' },
  { kind: 'line', at: 0, friend: 'lilac', when: 'pet', text: '언니보다 내가 먼저야!' },
  { kind: 'line', at: 0, friend: 'lilac', when: 'greet', with: 'peach', text: '언니, 같이 가!' },
  { kind: 'line', at: 0, friend: 'lilac', when: 'watch', text: '물고기다! 언니 이것 봐!' },
  // Scarlet (likes fishing) and Snow White (likes eating): lines the player chose on 2026-10-22, shown from the start.
  { kind: 'line', at: 0, friend: 'character', when: 'idle', text: '어디, 괜찮을 술 없나...' },
  { kind: 'line', at: 0, friend: 'character', when: 'idle', text: '바람 따라, 구름 따라, 마음 가는 대로' },
  { kind: 'line', at: 0, friend: 'character', when: 'greet', text: '한잔 할텐가?' },
  { kind: 'line', at: 0, friend: 'snow', when: 'watch', text: '맛있어보이는군' },
];
