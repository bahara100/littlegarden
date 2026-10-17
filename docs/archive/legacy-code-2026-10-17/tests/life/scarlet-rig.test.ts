import test from 'node:test';
import assert from 'node:assert/strict';
import { LEG_BINDINGS, THIGH_LENGTH, SHIN_LENGTH, bodyPoint, rigBody, rigLeg } from '../../apps/client/src/scarletRig';
test('fixed rig preserves anatomical texture ownership, hip roots and bone lengths through a full cycle', () => {
  for (let frame = 0; frame < 12; frame+=.125) for (const side of ['left', 'right'] as const) {
    const leg = rigLeg(side, frame), binding = LEG_BINDINGS[side];
    assert.equal(leg.parts.thigh, `${side}Thigh`); assert.equal(leg.parts.shin, `${side}Shin`); assert.equal(leg.parts.boot, `${side}Boot`);
    assert.deepEqual(leg.hip, bodyPoint(binding.hip,rigBody(frame)));
    assert.ok(Math.abs(Math.hypot(leg.knee.x-leg.hip.x, leg.knee.y-leg.hip.y)-THIGH_LENGTH)<1e-9);
    assert.ok(Math.abs(Math.hypot(leg.ankle.x-leg.knee.x, leg.ankle.y-leg.knee.y)-SHIN_LENGTH)<1e-9);
    assert.ok(leg.knee.x >= leg.hip.x-4, 'knee stays in forward bend plane');
  }
});
test('pelvis drives torso and hip roots together, arms oppose each other, and comparison mode freezes upper motion',()=>{
  for(const frame of [0,.5,1,1.5,2,2.5,3,3.5]){
    const body=rigBody(frame);assert.equal(body.leftArm+body.rightArm,0);
    for(const side of ['left','right'] as const){
      assert.deepEqual(rigLeg(side,frame,false,false).hip,LEG_BINDINGS[side].hip);
      assert.deepEqual(rigLeg(side,frame).hip,bodyPoint(LEG_BINDINGS[side].hip,body));
    }
    assert.deepEqual(rigBody(frame,true),rigBody(0,true));
  }
  assert.ok(rigBody(1).y<rigBody(0).y);
  assert.ok(rigBody(0).leftArm>rigBody(2).leftArm);
  assert.deepEqual(rigBody(0),rigBody(4));
  assert.ok(Math.abs(rigLeg('left',.001).hip.x-rigLeg('left',3.999).hip.x)<.01);
});
test('opposite passing phases lift the right leg in frame 2 and left leg in frame 4, then wrap exactly', () => {
  assert.equal(rigLeg('left', 1).lift, 0); assert.equal(rigLeg('right', 1).lift, 2.5);
  assert.equal(rigLeg('left', 3).lift, 2.5); assert.equal(rigLeg('right', 3).lift, 0);
  for (const side of ['left','right'] as const) assert.deepEqual(rigLeg(side, 0), rigLeg(side, 4));
});
