/** Fixed identity parts: animation changes joint positions, never their textures. */
export const RIG_PARTS = {
  body: { width: 64, height: 69 },
  leftArm: { width: 12, height: 22 },
  rightArm: { width: 13, height: 23 },
  leftThigh: { width: 7, height: 10 },
  leftShin: { width: 6, height: 11 },
  leftBoot: { width: 10, height: 7 },
  rightThigh: { width: 7, height: 10 },
  rightShin: { width: 6, height: 11 },
  rightBoot: { width: 10, height: 7 },
} as const;
export type RigPart = keyof typeof RIG_PARTS;
export type Joint = { x: number; y: number };
export const LEG_BINDINGS = {
  left: { hip: { x: 54, y: 61 }, thigh: 'leftThigh', shin: 'leftShin', boot: 'leftBoot' },
  right: { hip: { x: 47, y: 61 }, thigh: 'rightThigh', shin: 'rightShin', boot: 'rightBoot' },
} as const;
export type LegSide = keyof typeof LEG_BINDINGS;
export const THIGH_LENGTH = 9, SHIN_LENGTH = 11;
export const RIG_SAMPLE_COUNT = 8, RIG_RENDER_FPS = 12;
export const BODY_PIVOT = { x: 50.5, y: 61 };
export function cycleValue(values: readonly number[], frame: number) {
  const phase = ((frame % 4) + 4) % 4, i = Math.floor(phase), t = phase-i;
  return values[i]*(1-t)+values[(i+1)%4]*t;
}
export function rigBody(frame: number, standing = false, motion = true) {
  if(standing || !motion) return { x:0, y:0, lean:0, leftArm:0, rightArm:0 };
  const shift=cycleValue([1,0,-1,0],frame);
  return { x:shift*.5, y:cycleValue([0,-.8,0,-.8],frame), lean:shift*.018,
    leftArm:shift*.30, rightArm:-shift*.30 };
}
export function bodyPoint(point: Joint, pose: ReturnType<typeof rigBody>): Joint {
  const x=point.x-BODY_PIVOT.x,y=point.y-BODY_PIVOT.y;
  return {x:BODY_PIVOT.x+pose.x+x*Math.cos(pose.lean)-y*Math.sin(pose.lean),
    y:BODY_PIVOT.y+pose.y+x*Math.sin(pose.lean)+y*Math.cos(pose.lean)};
}
export function solveLeg(hip: Joint, target: Joint) {
  const dx = target.x - hip.x, dy = target.y - hip.y;
  const rawDistance = Math.hypot(dx, dy), distance = Math.max(Math.abs(THIGH_LENGTH-SHIN_LENGTH)+.01, Math.min(THIGH_LENGTH+SHIN_LENGTH-.01, rawDistance));
  const ux = rawDistance ? dx / rawDistance : 0, uy = rawDistance ? dy / rawDistance : 1;
  const a = (THIGH_LENGTH ** 2 - SHIN_LENGTH ** 2 + distance ** 2) / (2 * distance);
  const h = Math.sqrt(Math.max(0, THIGH_LENGTH ** 2 - a ** 2));
  return { hip: { ...hip }, knee: { x: hip.x + ux * a + uy * h, y: hip.y + uy * a - ux * h },
    ankle: { x: hip.x + ux * distance, y: hip.y + uy * distance } };
}
export function rigLeg(side: LegSide, frame: number, standing = false, motion = true) {
  const binding = LEG_BINDINGS[side], phase = frame+(side==='right'?2:0);
  const stride = standing ? 0 : cycleValue([4,0,-4,0],phase), lift = standing ? 0 : cycleValue([0,0,0,2.5],phase);
  const hip = bodyPoint(binding.hip,rigBody(frame,standing,motion));
  // Feet stay on their ground tracks while hips move with the torso.
  const joints = solveLeg(hip, { x: binding.hip.x + stride * 2 / Math.sqrt(5), y: 80 + stride / Math.sqrt(5) - lift });
  return { side, parts: { thigh: binding.thigh, shin: binding.shin, boot: binding.boot }, ...joints, lift };
}
