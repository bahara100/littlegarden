import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCARLET2, SCARLET2_DIRECTIONS, SCARLET2_SPEED, SCARLET2_FRAME_DISTANCE, Scarlet2WalkCycle } from '../../apps/client/src/scarlet2';
import { FRIEND_BODY } from '../../apps/client/src/friendBodyArt';

test('map Scarlet2 uses exact final walking V6 and standing V2 without altering original Scarlet', () => {
  for (const d of ['se', 'ne'] as const) {
    for (const [path, source] of [[SCARLET2.sources[d].walk, `docs/art/pixel/scarlet2-walk-v6/walk-${d}.png`], [SCARLET2.sources[d].idle, `docs/art/pixel/scarlet2-base-v2/idle-${d}.png`]]) {
      const bytes = readFileSync(`apps/client/public/${path}`);
      assert.deepEqual(bytes, readFileSync(source));
      assert.equal(bytes.readUInt32BE(20), 128);
      assert.equal(bytes.readUInt32BE(16), path.includes('walk') ? 512 : 128);
    }
  }
  assert.deepEqual(SCARLET2_DIRECTIONS.sw, { source: 'se', flipX: true });
  assert.deepEqual(SCARLET2_DIRECTIONS.nw, { source: 'ne', flipX: true });
  assert.equal(SCARLET2.worldSize / SCARLET2.frameSize, FRIEND_BODY.worldSize / FRIEND_BODY.frameSize);
  assert.equal(SCARLET2.originY * SCARLET2.frameSize, 115);
});

test('Scarlet2 walks 1–2–3–4 at six FPS, freezes when blocked and returns to idle', () => {
  for (const hz of [30, 60, 120]) {
    const cycle = new Scarlet2WalkCycle(), seen = [cycle.frame];
    for (let n = 1; n <= hz * 2 / 3; n++) {
      cycle.advance(SCARLET2_SPEED / hz, true);
      if (n % (hz / 6) === 0) seen.push(cycle.frame);
    }
    assert.deepEqual(seen, [0, 1, 2, 3, 0]);
  }
  const cycle = new Scarlet2WalkCycle();cycle.advance(SCARLET2_FRAME_DISTANCE * 2, true);
  for (const d of [0, -1, NaN, Infinity]) cycle.advance(d, true);
  assert.equal(cycle.frame, 2);cycle.advance(0, false);assert.equal(cycle.frame, 0);
});
