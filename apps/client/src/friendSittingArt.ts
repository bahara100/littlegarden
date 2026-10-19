import type { FriendId } from './friendBodyArt';

/** New compact rear sitting base, tailored costumes and the existing heads. NW mirrors this complete NE pose. */
export const FRIEND_REAR_SIT = { root: 'sprites/garden/friends-sit-rear-v2', frameSize: 96 } as const;
export const friendRearSitArt = (id: FriendId) => `${FRIEND_REAR_SIT.root}/${id}-ne.png`;
export const friendRearSitTexture = (id: FriendId) => `friends-sit-rear-${id}`;
