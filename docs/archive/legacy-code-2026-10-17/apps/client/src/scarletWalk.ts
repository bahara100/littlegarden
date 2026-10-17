import type { ScarletDirection } from './scarletDirections';
export const SCARLET_WALK_SE = 'sprites/scarlet/scarlet-se-walk-v2.png';
export const SCARLET_WALK_SHEETS: Record<ScarletDirection, string> = {
  se: SCARLET_WALK_SE,
  sw: 'sprites/scarlet/scarlet-sw-walk-v3.png',
  nw: 'sprites/scarlet/scarlet-nw-walk-v3.png',
  ne: 'sprites/scarlet/scarlet-ne-walk-v3.png',
};
export const WALK_FPS = 6;
/** Four phases, row order: left contact, passing, right contact, opposite passing. */
export function walkFrame(seconds: number, fps = WALK_FPS) {
  return Math.floor(Math.max(0, seconds) * fps) % 4;
}
