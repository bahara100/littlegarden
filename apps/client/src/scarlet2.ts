import { SCARLET_SD_DIRECTIONS } from './scarletApproved';
import { FRIEND_BODY } from './friendBodyArt';

/** Standing V2 + the user's final walking V6. Original Scarlet art stays separate. */
const ROOT = 'sprites/scarlet2/approved-v6';
export const SCARLET2 = {
  frameSize: 128, frameCount: 4, fps: 6,
  // The shared 96px body sits at (16,24) in the 128px hat/sword canvas.
  worldSize: FRIEND_BODY.worldSize * 128 / 96, originY: 115 / 128,
  sources: {
    se: { idle: `${ROOT}/idle-se.png`, walk: `${ROOT}/walk-se.png` },
    ne: { idle: `${ROOT}/idle-ne.png`, walk: `${ROOT}/walk-ne.png` },
  },
  review: `${ROOT}/review.html`,
} as const;
export const SCARLET2_DIRECTIONS = SCARLET_SD_DIRECTIONS;
export const SCARLET2_FRAME_DISTANCE = SCARLET2.worldSize * 6 / SCARLET2.frameSize;
export const SCARLET2_SPEED = SCARLET2_FRAME_DISTANCE * SCARLET2.fps;

/** Distance drives the four whole drawings; standing and blocked feet do not slide. */
export class Scarlet2WalkCycle {
  private distance = 0;
  get frame() { return Math.floor((this.distance + 1e-9) / SCARLET2_FRAME_DISTANCE) % SCARLET2.frameCount; }
  advance(distance: number, walking: boolean) {
    if (!walking) { this.distance = 0; return; }
    if (Number.isFinite(distance) && distance > 0) this.distance = (this.distance + distance) % (SCARLET2_FRAME_DISTANCE * SCARLET2.frameCount);
  }
}
