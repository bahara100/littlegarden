/**
 * Behaviours a friend can choose on their own once unlocked (unlocks.ts, kind 'action'). Each one is a building
 * block made from what friends can already do, so it needs no new art; LifeSimulation.perform() carries them out.
 * A new behaviour: add it here, then add its case to perform() in simulation.ts.
 */
export const FRIEND_ACTIONS = {
  wave: { name: '혼자 손 흔들기', note: '멈춰 서서 잠깐 손을 흔들어요 (♡).' },
  cheer: { name: '혼자 기뻐하기', note: '그 자리에서 잠깐 기뻐해요 (♡ → ♪).' },
  visitFriend: { name: '친구에게 다가가기', note: '자유롭게 노는 가장 가까운 친구 옆 칸으로 걸어가요. 도착하면 인사하기도 해요.' },
} as const;
export type ActionId = keyof typeof FRIEND_ACTIONS;
export const ACTION_IDS = Object.keys(FRIEND_ACTIONS) as ActionId[];
