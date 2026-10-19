import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FRIEND_IDS, FRIEND_NAMES, FRIEND_BODY, FRIEND_DIRECTIONS, FRIEND_SPEED, FRIEND_FRAME_DISTANCE, FriendWalkCycle, friendArt } from '../../apps/client/src/friendBodyArt';
import { scarletDirection } from '../../apps/client/src/scarletDirections';
import { LifeSimulation } from '../../apps/client/src/simulation';
import { FRIEND_REAR_SIT, friendRearSitArt } from '../../apps/client/src/friendSittingArt';

test('rear seated game sprites are the exact newly tailored base poses, separate from approved walking V2', () => {
  const folder = 'docs/art/pixel/garden-friends-sit-rear-v2';
  const manifest = JSON.parse(readFileSync(`${folder}/manifest.json`, 'utf8'));
  for (const id of FRIEND_IDS) {
    const who = FRIEND_NAMES[id], bytes = readFileSync(`apps/client/public/${friendRearSitArt(id)}`);
    assert.deepEqual(bytes, readFileSync(`${folder}/${who}/full-ne.png`));
    assert.equal(bytes.readUInt32BE(16), FRIEND_REAR_SIT.frameSize);
    assert.equal(bytes.readUInt32BE(20), FRIEND_REAR_SIT.frameSize);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.characters[who].assets['full-ne.png']);
    assert.ok(friendArt(id, 'ne').walk.includes('base-walk-v2'));
  }
});

test('both runtime wardrobes match reviewed sheets and approved base provenance', () => {
  const folder = 'docs/art/pixel/garden-friends-base-walk-v2';
  const manifest = JSON.parse(readFileSync(`${folder}/manifest.json`, 'utf8'));
  const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  for (const source of ['se', 'ne'] as const) {
    const base = manifest.baseSources[source];
    assert.equal(sha(readFileSync(`docs/art/pixel/${base.folder}/walk.png`)), base.sha256);
    for (const id of FRIEND_IDS) for (const [action, path] of Object.entries(friendArt(id, source))) {
      const bytes = readFileSync(`apps/client/public/${path}`);
      assert.deepEqual(bytes, readFileSync(`${folder}/${FRIEND_NAMES[id]}/${action}-${source}.png`));
      assert.equal(bytes.readUInt32BE(16), action === 'walk' ? 384 : 96);
      assert.equal(bytes.readUInt32BE(20), 96);
      assert.equal(sha(bytes), manifest.characters[FRIEND_NAMES[id]].assets[`${action}-${source}.png`]);
    }
  }
  for (const [yaw, direction, source, flipX] of [[Math.PI / 2, 'se', 'se', false], [0, 'sw', 'se', true], [Math.PI, 'ne', 'ne', false], [-Math.PI / 2, 'nw', 'ne', true]] as const) {
    assert.equal(scarletDirection(yaw), direction);
    assert.deepEqual(FRIEND_DIRECTIONS[direction], { source, flipX });
  }
});

test('shared-body actors walk independently at six FPS; blocking, seating and editing stop feet', () => {
  for (const hz of [30, 60, 120]) {
    const sim = new LifeSimulation(() => .5, { peach: FRIEND_SPEED, lilac: FRIEND_SPEED });
    for (const a of sim.avatars.values()) { a.until = Infinity; a.x = -4; a.z = a.id === 'peach' ? -4 : a.id === 'lilac' ? -6 : 6; }
    const momo = sim.avatars.get('peach')!;
    momo.phase = 'walking'; momo.path = [{ x: -2, z: -4 }]; momo.deadline = 40;
    const cycles = { peach: new FriendWalkCycle(), lilac: new FriendWalkCycle() };
    const seen = [0];
    for (let n = 1; n <= hz * 2 / 3; n++) {
      const before = momo.x;
      sim.update(1 / hz);
      cycles.peach.advance(momo.x - before, momo.phase === 'walking');
      cycles.lilac.advance(0, false);
      if (n % (hz / FRIEND_BODY.fps) === 0) seen.push(cycles.peach.frame);
    }
    assert.deepEqual(seen, [0, 1, 2, 3, 0]);
    assert.equal(cycles.lilac.frame, 0);
    cycles.peach.advance(FRIEND_FRAME_DISTANCE * 2, true);
    for (const blockedDistance of [0, -1, Infinity, NaN]) cycles.peach.advance(blockedDistance, true);
    assert.equal(cycles.peach.frame, 2);
    cycles.peach.advance(0, false);
    assert.equal(cycles.peach.frame, 0);
  }
});
