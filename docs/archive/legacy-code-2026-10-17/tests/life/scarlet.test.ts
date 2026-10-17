import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createScarlet } from '../../apps/client/src/scarlet.js';

test('Scarlet fits the shared character rig and her raised hands meet the swing ropes', () => {
  const rig = createScarlet();
  rig.root.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(rig.root).getSize(new THREE.Vector3());
  assert.ok(size.y > 1.9 && size.y < 2.6, `height ${size.y}`);
  assert.ok(size.x < 2.1 && size.z < 2.1);
  assert.equal(rig.legs.length, 2);
  for (const [arm, sign] of [[rig.rightArm, 1], [rig.leftArm, -1]] as const) {
    arm.rotation.z = sign * 2.65; rig.root.updateMatrixWorld(true);
    const hand = arm.localToWorld(new THREE.Vector3(0, -.32, .02));
    assert.ok(Math.abs(hand.x - sign * .52) < .025, `hand x ${hand.x}`);
    assert.ok(Math.abs(hand.z) < .03);
  }
  rig.root.traverse(object => {
    if (object instanceof THREE.Mesh) {
      const vertices = object.geometry.getAttribute('position');
      assert.ok(Array.from(vertices.array).every(Number.isFinite));
      object.geometry.dispose();
    }
  });
});
