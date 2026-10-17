export type ScarletDirection = 'se' | 'sw' | 'nw' | 'ne';
/** Simulation yaw is atan2(dx,dz); camera projection is (x-z,(x+z)/2). */
export function scarletDirection(yaw: number): ScarletDirection {
  const x = Math.sin(yaw), z = Math.cos(yaw);
  if (Math.abs(x) >= Math.abs(z)) return x >= 0 ? 'se' : 'nw';
  return z >= 0 ? 'sw' : 'ne';
}
