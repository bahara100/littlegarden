import type { ScarletDirection } from './scarletDirections';

/** Whole-frame wardrobe V2 (user's pick over V3): SE V20, NE V3 body, mirrored west. */
const ROOT = 'sprites/garden/base-walk-v2';
export const FRIEND_BODY = { frameSize: 96, frameCount: 4, fps: 6, worldSize: 2.8, originY: 91 / 96 } as const;
export const FRIEND_IDS = ['peach', 'lilac'] as const;
export type FriendId = typeof FRIEND_IDS[number];
export const FRIEND_NAMES = { peach: 'momo', lilac: 'lulu' } as const;
export const FRIEND_DIRECTIONS = {
  se: { source: 'se', flipX: false }, sw: { source: 'se', flipX: true },
  ne: { source: 'ne', flipX: false }, nw: { source: 'ne', flipX: true },
} as const satisfies Record<ScarletDirection, { source: 'se' | 'ne'; flipX: boolean }>;
export function friendArt(id: FriendId, source: 'se' | 'ne') {
  const folder = `${ROOT}/${FRIEND_NAMES[id]}`;
  return { idle: `${folder}/idle-${source}.png`, walk: `${folder}/walk-${source}.png` };
}
export function friendTexture(id: FriendId, action: 'idle' | 'walk', source: 'se' | 'ne') {
  return `body-${id}-${action}-${source}`;
}

// Six source pixels travelled per step; calibrates the displayed stride to six FPS.
export const FRIEND_FRAME_DISTANCE = FRIEND_BODY.worldSize * 6 / FRIEND_BODY.frameSize;
export const FRIEND_SPEED = FRIEND_FRAME_DISTANCE * FRIEND_BODY.fps;
export class FriendWalkCycle {
  private distance = 0;
  get frame() { return Math.floor((this.distance + 1e-9) / FRIEND_FRAME_DISTANCE) % FRIEND_BODY.frameCount; }
  advance(distance: number, walking: boolean) {
    if (!walking) { this.distance = 0; return; }
    if (Number.isFinite(distance) && distance > 0) this.distance = (this.distance + distance) % (FRIEND_FRAME_DISTANCE * FRIEND_BODY.frameCount);
  }
}
