import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILES, twins } from '../../apps/client/src/friendProfiles.js';
import { LifeSimulation } from '../../apps/client/src/simulation.js';

test('Momo and Lulu are twins (Momo the elder) who love walking; Scarlet keeps the shared habits', () => {
  assert.ok(twins('peach', 'lilac') && twins('lilac', 'peach'));
  assert.ok(!twins('character', 'peach'));
  assert.match(PROFILES.peach.subtitle, /언니/); assert.match(PROFILES.lilac.subtitle, /동생/);
  for (const id of ['peach', 'lilac'] as const) {
    assert.ok(PROFILES[id].stroll! > 0 && PROFILES[id].rest! < 1, `${id} is active`);
    assert.ok(PROFILES[id].facts.some(([, v]) => v.includes('산책')));
  }
  assert.equal(PROFILES.character.stroll, undefined); assert.equal(PROFILES.character.rest, undefined);
});
test('a free twin sets off after the other twin who is out walking', () => {
  const sim = new LifeSimulation(() => 0), momo = sim.avatars.get('peach')!, lulu = sim.avatars.get('lilac')!;
  assert.equal(sim.moveTo('peach', { x: 6.5, z: -6.5 }), null);
  const goal = momo.path.at(-1)!;
  lulu.until = 0; sim.update(.05);
  assert.equal(lulu.phase, 'walking');
  const end = lulu.path.at(-1)!;
  assert.ok(Math.hypot(end.x - goal.x, end.z - goal.z) <= 1.01, 'Lulu heads for a tile beside where Momo is going');
});
test('twins always stop to greet each other; other friends only when the roll allows', () => {
  const place = (sim: LifeSimulation, a: 'character' | 'peach' | 'lilac', b: 'character' | 'peach' | 'lilac') => {
    const far = { x: 9.5, z: 9.5 };
    for (const f of sim.avatars.values()) Object.assign(f, f.id === a ? { x: .5, z: 4.5 } : f.id === b ? { x: 1.5, z: 4.5 } : far, { until: 1e9 });
    sim.update(.05);
  };
  const twinsSim = new LifeSimulation(() => .99);
  place(twinsSim, 'peach', 'lilac');
  assert.equal(twinsSim.avatars.get('peach')!.phase, 'greeting'); assert.equal(twinsSim.avatars.get('lilac')!.partner, 'peach');
  const othersSim = new LifeSimulation(() => .99);
  place(othersSim, 'character', 'peach');
  assert.equal(othersSim.avatars.get('character')!.phase, 'idle');
});
