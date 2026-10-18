import type { ItemKind } from './layout';

/** One original diagonal per new prop. Odd rotations mirror the whole drawing to change its ground axis. */
export const PARK_PROPS = {
  picnicTable: { file: 'picnic-table.png', width: 5.8 },
  seesaw: { file: 'seesaw.png', width: 5 },
  drinkingFountain: { file: 'drinking-fountain.png', width: 1.65 },
  fountain: { file: 'fountain.png', width: 5.2 },
  bridge: { file: 'wooden-bridge.png', width: 6 },
  stream: { file: 'stream.png', width: 6 },
} as const;
export type ParkPropKind = keyof typeof PARK_PROPS;
export const PARK_ROOT = 'sprites/garden/park-props-v1';
export const isParkProp = (kind: ItemKind): kind is ParkPropKind => kind in PARK_PROPS;
export const parkPropUrl = (kind: ParkPropKind) => `${PARK_ROOT}/${PARK_PROPS[kind].file}`;
