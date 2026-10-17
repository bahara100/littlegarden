import type { ScarletDirection } from './scarletDirections';

/** User-approved in-game SD art. Historical fullframe assets remain separate. */
const ROOT = 'sprites/scarlet/ingame-approved-v1';
export const SCARLET_SD = {
  frameSize: 96, frameCount: 4, fps: 6, worldSize: 3.9, originY: 88 / 96,
  sources: {
    se: { idle: `${ROOT}/idle-se.png`, walk: `${ROOT}/walk-se.png` },
    ne: { idle: `${ROOT}/idle-ne.png`, walk: `${ROOT}/walk-ne.png` },
  },
  review: `${ROOT}/review.html`,
} as const;
export const SCARLET_SD_DIRECTIONS = {
  se: { source: 'se', flipX: false }, sw: { source: 'se', flipX: true },
  ne: { source: 'ne', flipX: false }, nw: { source: 'ne', flipX: true },
} as const satisfies Record<ScarletDirection, { source: 'se' | 'ne'; flipX: boolean }>;

// Initial stride calibration: 4 horizontal source pixels (2 vertical) per cel.
// At the displayed size this is .1625 ground units per cel, or .975 units/sec at 6 FPS.
export const SCARLET_SD_FRAME_DISTANCE = SCARLET_SD.worldSize * 4 / SCARLET_SD.frameSize;
export const SCARLET_SD_SPEED = SCARLET_SD_FRAME_DISTANCE * SCARLET_SD.fps;

/** Advance only for distance actually walked; a blocked path cannot keep cycling feet. */
export class ScarletWalkCycle {
  private distance = 0;
  get frame() { return Math.floor((this.distance + 1e-9) / SCARLET_SD_FRAME_DISTANCE) % SCARLET_SD.frameCount; }
  advance(distance: number, walking: boolean) {
    if (!walking) { this.distance = 0; return; }
    if (Number.isFinite(distance) && distance > 0) {
      this.distance = (this.distance + distance) % (SCARLET_SD_FRAME_DISTANCE * SCARLET_SD.frameCount);
    }
  }
}
