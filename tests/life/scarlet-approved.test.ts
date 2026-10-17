import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SCARLET_SD, SCARLET_SD_DIRECTIONS, SCARLET_SD_FRAME_DISTANCE, SCARLET_SD_SPEED, ScarletWalkCycle } from '../../apps/client/src/scarletApproved';
import { LifeSimulation } from '../../apps/client/src/simulation';

test('runtime sheets are byte-identical to user-approved SE and NE, with frame-wise mirrors', () => {
  const approval = JSON.parse(readFileSync('docs/art/pixel/scarlet-ingame-walk-approved.json', 'utf8'));
  assert.deepEqual(SCARLET_SD_DIRECTIONS, approval.directions);
  for (const source of ['se', 'ne'] as const) {
    const files = SCARLET_SD.sources[source];
    const walk = readFileSync(`apps/client/public/${files.walk}`);
    assert.equal(createHash('sha256').update(walk).digest('hex'), approval.sources[source].sha256);
    assert.equal(walk.readUInt32BE(16), 384);
    assert.equal(walk.readUInt32BE(20), 96);
    assert.deepEqual(readFileSync(`apps/client/public/${files.idle}`), readFileSync(`docs/art/pixel/scarlet-ingame-sd-v1/idle-${source}.png`));
  }
});

test('distance playback keeps 1-2-3-4 order at six FPS regardless of render rate', () => {
  for (const hz of [30, 60, 120]) {
    const cycle = new ScarletWalkCycle();
    const seen = [cycle.frame];
    for (let n = 1; n <= hz * 2 / 3; n++) {
      cycle.advance(SCARLET_SD_SPEED / hz, true);
      if (n % (hz / SCARLET_SD.fps) === 0) seen.push(cycle.frame);
    }
    assert.deepEqual(seen, [0, 1, 2, 3, 0]);
  }
});

test('blocked feet freeze without resetting the step, and stopping resets it', () => {
  const cycle = new ScarletWalkCycle();
  cycle.advance(SCARLET_SD_FRAME_DISTANCE * 2, true);
  assert.equal(cycle.frame, 2);
  for (const distance of [0, -1, NaN, Infinity]) cycle.advance(distance, true);
  assert.equal(cycle.frame, 2);
  cycle.advance(0, false);
  assert.equal(cycle.frame, 0);
  cycle.advance(SCARLET_SD_FRAME_DISTANCE, true);
  assert.equal(cycle.frame, 1);
});

test('new SD speed is opt-in; friend and historical movement speeds are preserved', () => {
  for (const configured of [false, true]) {
    const sim = new LifeSimulation(() => .5, configured ? { character: SCARLET_SD_SPEED } : {});
    for (const a of sim.avatars.values()) { a.until = Infinity; a.x = 0; a.z = a.id === 'character' ? 0 : a.id === 'peach' ? 2 : -2; }
    for (const id of ['character', 'peach'] as const) {
      const a = sim.avatars.get(id)!;
      a.phase = 'walking'; a.path = [{ x: 1, z: a.z }]; a.deadline = 40;
    }
    sim.update(.1);
    assert.ok(Math.abs(sim.avatars.get('character')!.x - .1 * (configured ? SCARLET_SD_SPEED : 1.45)) < 1e-9);
    assert.ok(Math.abs(sim.avatars.get('peach')!.x - .145) < 1e-9);
  }
});
