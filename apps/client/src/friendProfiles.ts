import type { AvatarId } from './simulation';

/**
 * Who each friend is (the player's settings) and how that shows in their day. The card text appears in the friend
 * panel; the numbers nudge LifeSimulation's choices. Leave a field out to keep the shared default behaviour.
 */
export interface FriendProfile {
  /** Line under the name on the friend card. */
  subtitle: string;
  /** A sentence or two about the friend. */
  intro: string;
  /** Rows shown on the card, e.g. ['성격', '활발함']. */
  facts: readonly [string, string][];
  /** A twin: they keep each other company (stroll after each other, always stop to greet). */
  twin?: AvatarId;
  /** Chance (0..1) that a free friend heads off for a walk before looking at the benches and swing. */
  stroll?: number;
  /** When strolling, the chance of walking after the twin when the twin is out walking. */
  followTwin?: number;
  /** How long they stay on a bench or swing, as a share of the usual time (active friends get up sooner). */
  rest?: number;
}

export const PROFILES: Record<AvatarId, FriendProfile> = {
  character: {
    subtitle: '오늘도 정원에서 함께 쉬어요',
    intro: '바닥을 누르면 그곳으로 걸어가요. 벤치에서 쉬거나, 가까이 다가가 작은 인사를 건네보세요.',
    facts: [],
  },
  peach: {
    subtitle: '루루의 쌍둥이 언니',
    intro: '활발하고 공원 산책을 좋아하는 쌍둥이 언니예요. 동생 루루와 함께 공원 이곳저곳을 걸어 다녀요.',
    facts: [['성격', '활발함'], ['좋아하는 것', '공원 산책'], ['가족', '쌍둥이 동생 루루']],
    twin: 'lilac', stroll: .45, followTwin: .5, rest: .7,
  },
  lilac: {
    subtitle: '모모의 쌍둥이 동생',
    intro: '활발하고 공원 산책을 좋아하는 쌍둥이 동생이에요. 언니 모모가 걸어가면 졸졸 따라가곤 해요.',
    facts: [['성격', '활발함'], ['좋아하는 것', '공원 산책'], ['가족', '쌍둥이 언니 모모']],
    twin: 'peach', stroll: .45, followTwin: .7, rest: .7,
  },
};
/** Whether two friends are twins. */
export const twins = (a: AvatarId, b: AvatarId) => PROFILES[a].twin === b;
