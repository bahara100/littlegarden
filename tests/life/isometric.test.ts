import assert from 'node:assert/strict';
import { test } from 'node:test';
import { project, unproject, depth } from '../../apps/client/src/isometric';

test('pixel picking reverses projection across zoom levels and map corners', () => {
  for (const unit of [4.5, 12, 33.7]) for (const point of [{ x: -8, z: -8 }, { x: 8, z: -8 }, { x: -3.5, z: 4.4 }, { x: .25, z: 7.25 }]) {
    const screen = project(point, unit), restored = unproject(screen.x, screen.y, unit);
    assert.ok(Math.abs(restored.x - point.x) < 1e-10);
    assert.ok(Math.abs(restored.z - point.z) < 1e-10);
  }
});
test('objects crossing behind and in front of a prop change painter order', () => {
  const prop = { x: 2, z: 1 };
  assert.ok(depth({ x: 2, z: 0 }) < depth(prop));
  assert.ok(depth({ x: 2, z: 2 }) > depth(prop));
  // Height in the sprite does not alter its ground depth.
  assert.equal(depth({ x: -2, z: 5 }), depth(prop));
});
