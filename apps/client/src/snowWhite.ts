import { SCARLET2, SCARLET2_SIT } from './scarlet2';

/** Standing V1, walking V1 (four drawings, 6 FPS) and chair sitting V1, on the same 128px canvas as Scarlet2. */
const ROOT = 'sprites/snow-white/v1';
export const SNOW_WHITE = {
  frameSize: 128, frameCount: 4, fps: 6, worldSize: SCARLET2.worldSize, originY: 115 / 128,
  sources: {
    se: { idle: `${ROOT}/idle-se.png`, walk: `${ROOT}/walk-se.png`, sit: `${ROOT}/sit-se.png` },
    ne: { idle: `${ROOT}/idle-ne.png`, walk: `${ROOT}/walk-ne.png`, sit: `${ROOT}/sit-ne.png` },
  },
} as const;
/** The seated drawings use the same common sitting base at (16,24) as Scarlet2's. */
export const SNOW_WHITE_SIT = SCARLET2_SIT;
