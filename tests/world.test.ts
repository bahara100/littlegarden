import test from 'node:test';
import assert from 'node:assert/strict';
import { move, blocked, validNickname, canUse } from '../packages/shared/world.js';
test('straight and diagonal movement have equal speed', () => {
  const a = move(800, 650, 1, 0, .05), b = move(800, 650, 1, 1, .05);
  assert.ok(Math.abs(Math.hypot(a.x - 800, a.y - 650) - Math.hypot(b.x - 800, b.y - 650)) < 1e-8);
});
test('world boundary and obstacle prevent movement', () => {
  assert.equal(move(44, 500, -1, 0, .05).x, 44);
  assert.equal(move(80, 200, 1, 0, .05).x, 80);
  assert.equal(blocked(150, 200), true);
});
test('time step is capped and invalid nicknames are rejected', () => {
  assert.equal(move(800, 650, 1, 0, 500).x, 818.5);
  assert.equal(validNickname('  산책자  '), '산책자');
  for (const name of ['', '가', '<img>', '가\n나', 'a'.repeat(13), null]) assert.throws(() => validNickname(name));
});
test('equipment requires proximity, free seat and unseated player', () => {
  assert.equal(canUse({ x: 520, y: 440, seat: '' }, 'bench-1', false), true);
  assert.equal(canUse({ x: 520, y: 440, seat: '' }, 'bench-1', true), false);
  assert.equal(canUse({ x: 800, y: 650, seat: '' }, 'bench-1', false), false);
  assert.equal(canUse({ x: 520, y: 440, seat: 'bench-2' }, 'bench-1', false), false);
  assert.equal(canUse({ x: 520, y: 440, seat: '' }, 'missing', false), false);
});
