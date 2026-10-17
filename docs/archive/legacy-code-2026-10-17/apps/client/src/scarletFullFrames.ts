export const FULL_FRAME_SE = 'sprites/scarlet/fullframe-se-v3/walk.png';
export const FULL_FRAME_LABELS = ['왼발 접지 · 왼발 앞으로', '오른발 이동 · 왼발 지지', '오른발 접지 · 오른발 앞으로', '왼발 이동 · 오른발 지지'];
export const FRAME_SIZE = 96;
export const FULL_WALK_SE = FULL_FRAME_SE;
export const FULL_KEYS_SW = 'sprites/scarlet/fullframe-sw-v3/walk.png';
export const FULL_WALK_SW = FULL_KEYS_SW;
export const FULL_KEYS_NE = 'sprites/scarlet/fullframe-ne-v5/walk.png';
export const FULL_KEYS_NW = 'sprites/scarlet/fullframe-nw-v15/walk.png';
export const FULL_WALK_FPS = 6;
export const FULL_WALK_LABELS = FULL_FRAME_LABELS;
export function fullFrameIndex(seconds: number, fps = FULL_WALK_FPS, count = 4) {
  return Math.floor(Math.max(0, seconds) * fps) % count;
}
