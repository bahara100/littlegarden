import test from 'node:test';
import assert from 'node:assert/strict';
import { friendSide, scarletDirection } from '../../apps/client/src/scarletDirections';
test('world yaw follows all four isometric screen diagonals', () => {
  assert.equal(scarletDirection(Math.PI / 2), 'se');
  assert.equal(scarletDirection(0), 'sw');
  assert.equal(scarletDirection(-Math.PI / 2), 'nw');
  assert.equal(scarletDirection(Math.PI), 'ne');
  assert.equal(scarletDirection(Math.PI * 2), 'sw');
});
test('front-only friends face screen right for SE/NE and their mirror for SW/NW', () => {
  assert.equal(friendSide(Math.PI / 2), 'se');
  assert.equal(friendSide(Math.PI), 'se');
  assert.equal(friendSide(0), 'sw');
  assert.equal(friendSide(-Math.PI / 2), 'sw');
});
