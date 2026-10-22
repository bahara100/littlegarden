import { SCARLET2, SCARLET2_SIT } from './scarlet2';

/** Standing V1 and chair sitting V1 (128px, same canvas as Scarlet2). No walking drawings yet: she moves in her standing pose. */
const ROOT = 'sprites/snow-white/v1';
export const SNOW_WHITE = {
  frameSize: 128, worldSize: SCARLET2.worldSize, originY: 115 / 128,
  sources: {
    se: { idle: `${ROOT}/idle-se.png`, sit: `${ROOT}/sit-se.png` },
    ne: { idle: `${ROOT}/idle-ne.png`, sit: `${ROOT}/sit-ne.png` },
  },
} as const;
/** The seated drawings use the same common sitting base at (16,24) as Scarlet2's. */
export const SNOW_WHITE_SIT = SCARLET2_SIT;
