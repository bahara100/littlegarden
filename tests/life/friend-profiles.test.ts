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
  const twinsSim = Object.assign(new LifeSimulation(() => .99), { greetFrom: 0 });
  place(twinsSim, 'peach', 'lilac');
  assert.equal(twinsSim.avatars.get('peach')!.phase, 'greeting'); assert.equal(twinsSim.avatars.get('lilac')!.partner, 'peach');
  const othersSim = Object.assign(new LifeSimulation(() => .99), { greetFrom: 0 });
  place(othersSim, 'character', 'peach');
  assert.equal(othersSim.avatars.get('character')!.phase, 'idle');
});
test("the twins' chosen lines: a greeting line only for the other twin", () => {
  const sim = Object.assign(new LifeSimulation(() => 0), { greetFrom: 0 }), momo = sim.avatars.get('peach')!, lulu = sim.avatars.get('lilac')!;
  for (const f of sim.avatars.values()) Object.assign(f, { x: 9.5, z: 9.5, until: 1e9 });
  Object.assign(momo, { x: .5, z: 4.5 }); Object.assign(lulu, { x: 1.5, z: 4.5 });
  sim.update(.05);
  assert.equal(momo.speech, '루루, 언니 따라와~'); assert.equal(lulu.speech, '언니, 같이 가!');
  const other = Object.assign(new LifeSimulation(() => 0), { greetFrom: 0 }), scarlet = other.avatars.get('character')!, momo2 = other.avatars.get('peach')!;
  for (const f of other.avatars.values()) Object.assign(f, { x: 9.5, z: 9.5, until: 1e9 });
  Object.assign(scarlet, { x: .5, z: 4.5 }); Object.assign(momo2, { x: 1.5, z: 4.5 });
  other.update(.05);
  assert.equal(momo2.phase, 'greeting'); assert.equal(momo2.speech, '', 'Momo greets Scarlet without the twin line');
  assert.equal(other.pet('peach', '2026-10-18')?.gained, true); assert.equal(momo2.speech, '헤헤, 오늘도 산책 가자!');
});
test('after greeting, the same two friends pass each other without stopping for 3 minutes', async () => {
  const { REACTION } = await import('../../apps/client/src/simulation.js');
  assert.equal(REACTION.cooldown, 180);
  const sim = Object.assign(new LifeSimulation(() => 0), { greetFrom: 0 }), momo = sim.avatars.get('peach')!, lulu = sim.avatars.get('lilac')!;
  const meet = () => {
    for (const f of sim.avatars.values()) Object.assign(f, { x: f.id === 'character' ? -9.5 : 9.5, z: f.id === 'snow' ? -9.5 : 9.5, until: 1e9, phase: 'idle', path: [] });
    Object.assign(momo, { x: 5.5, z: 4.5 }); sim.update(.05);   // apart: the meeting is over
    Object.assign(lulu, { x: 6.5, z: 4.5 }); sim.update(.05);   // together again
  };
  meet(); assert.equal(momo.phase, 'greeting'); assert.equal(sim.sinceGreeting('lilac', 'peach'), 0);
  for (let t = 0; t < 100; t += .1) sim.update(.1);
  meet(); assert.equal(momo.phase, 'idle', 'greeted 100 s ago: no second stop');
  Object.assign(lulu, { x: 9.5, z: 9.5 });  // apart while the rest of the 3 minutes passes
  for (let t = 0; t < 90; t += .1) sim.update(.1);
  meet(); assert.equal(momo.phase, 'greeting', 'more than 3 minutes later they greet again');
});
test('nobody greets in the first 10 seconds, when everyone starts side by side', async () => {
  const { REACTION } = await import('../../apps/client/src/simulation.js');
  assert.equal(REACTION.quietStart, 10);
  const sim = new LifeSimulation(() => 0), momo = sim.avatars.get('peach')!, lulu = sim.avatars.get('lilac')!;
  for (const f of sim.avatars.values()) Object.assign(f, { x: f.id === 'character' ? -9.5 : 9.5, z: f.id === 'snow' ? -9.5 : 9.5, until: 1e9, phase: 'idle', path: [] });
  Object.assign(momo, { x: 5.5, z: 4.5 }); Object.assign(lulu, { x: 6.5, z: 4.5 });
  for (let t = 0; t < 12; t += .05) sim.update(.05);
  assert.equal(momo.phase, 'idle', 'the twins stood together from the start and did not greet');
  Object.assign(lulu, { x: 9.5, z: 9.5 }); sim.update(.05);       // apart …
  Object.assign(lulu, { x: 6.5, z: 4.5 }); sim.update(.05);       // … and together again after the quiet start
  assert.equal(momo.phase, 'greeting');
  sim.applyLayout(sim.layout);                                        // a layout change puts everyone back together
  assert.ok(sim.greetFrom >= sim.time + 10 - 1e-9);
});
