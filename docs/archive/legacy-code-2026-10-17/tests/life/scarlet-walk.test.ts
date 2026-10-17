import test from 'node:test';
import assert from 'node:assert/strict';
import { walkFrame } from '../../apps/client/src/scarletWalk';
test('walk cycle displays four alternating phases and wraps to the first', () => {
  assert.deepEqual([0, .125, .25, .375, .5].map(t => walkFrame(t, 8)), [0, 1, 2, 3, 0]);
  assert.equal(walkFrame(-1), 0);
});
