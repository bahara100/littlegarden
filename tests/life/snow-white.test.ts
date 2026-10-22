import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SNOW_WHITE, SNOW_WHITE_SIT } from '../../apps/client/src/snowWhite';
import { SCARLET2, SCARLET2_SIT } from '../../apps/client/src/scarlet2';
import { FRIENDS, LifeSimulation } from '../../apps/client/src/simulation';
import { PROFILES } from '../../apps/client/src/friendProfiles';

test('Snow White uses the exact standing V1 and chair sitting V1 drawings at Scarlet2 size', () => {
  for (const d of ['se', 'ne'] as const) {
    for (const [path, source] of [[SNOW_WHITE.sources[d].idle, `docs/art/pixel/snow-white-idle-v1/idle-${d}.png`], [SNOW_WHITE.sources[d].sit, `docs/art/pixel/snow-white-sit-v1/sit-${d}.png`]]) {
      const bytes = readFileSync(`apps/client/public/${path}`);
      assert.deepEqual(bytes, readFileSync(source));
      assert.equal(bytes.readUInt32BE(16), 128); assert.equal(bytes.readUInt32BE(20), 128);
    }
  }
  assert.equal(SNOW_WHITE.worldSize, SCARLET2.worldSize);
  assert.equal(SNOW_WHITE.originY * SNOW_WHITE.frameSize, 115);
  assert.equal(SNOW_WHITE_SIT.originY, SCARLET2_SIT.originY);
  assert.equal('walk' in SNOW_WHITE.sources.se, false, 'no walking drawings yet');
});
test('Snow White is a fourth friend with her own card and affinity', () => {
  assert.deepEqual(FRIENDS.map(f => f.id), ['character', 'peach', 'lilac', 'snow']);
  assert.equal(FRIENDS.find(f => f.id === 'snow')!.name, '스노우화이트');
  assert.ok(PROFILES.snow.subtitle && PROFILES.snow.twin === undefined);
  const sim = new LifeSimulation(() => .5);
  assert.equal(sim.affinity.snow, 0);
  assert.equal(sim.use('snow', 'bench'), null);
  assert.ok(sim.seatOf(sim.avatars.get('snow')!)?.kind === 'bench');
});
