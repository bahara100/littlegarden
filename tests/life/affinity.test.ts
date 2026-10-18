import test from 'node:test';
import assert from 'node:assert/strict';
import { MOMENTS, nextUnlock, pickForMoment, unlockErrors, unlockedFor, type Unlock } from '../../apps/client/src/affinity.js';
import { UNLOCKS } from '../../apps/client/src/unlocks.js';
import { ACTION_IDS } from '../../apps/client/src/friendActions.js';
import { LifeSimulation, reactionLabel, speaking } from '../../apps/client/src/simulation.js';

const second = (sim: LifeSimulation) => { for (let i = 0; i < 10; i++) sim.update(.1); };
// A sample list for the tests only; the game's own list (unlocks.ts) is filled in when the content is decided.
const SAMPLE: Unlock[] = [
  { kind: 'line', at: 1, when: 'pet', text: '또 왔구나!' },
  { kind: 'line', at: 3, when: 'levelUp', text: '우리 이제 아는 사이야' },
  { kind: 'line', at: 1, friend: 'lilac', when: 'greet', text: '안녕!' },
  { kind: 'emote', at: 0, when: 'seat', emote: '♪', seconds: 1.5 },
  { kind: 'emote', at: 5, friend: 'peach', when: 'pet', emote: '✿' },
  { kind: 'action', at: 7, action: 'wave', chance: 1 },
];

test('the unlock list in the game is valid, and bad entries are caught', () => {
  assert.deepEqual(unlockErrors(UNLOCKS, ACTION_IDS), []);
  assert.deepEqual(unlockErrors(SAMPLE, ACTION_IDS), []);
  const bad = [
    { kind: 'line', at: 120, when: 'pet', text: '…' },
    { kind: 'line', at: 1, when: 'dance', text: '…' },
    { kind: 'line', at: 1, when: 'pet', text: '이 대사는 스무 글자를 훌쩍 넘어가서 말풍선에 들어가지 않아요' },
    { kind: 'emote', at: 1, friend: 'nobody', when: 'pet', emote: '♡' },
    { kind: 'action', at: 1, action: 'fly' },
    { kind: 'action', at: 1, action: 'wave', chance: 0 },
  ] as unknown as Unlock[];
  assert.equal(unlockErrors(bad, ACTION_IDS).length, 6);
  assert.deepEqual(Object.keys(MOMENTS).sort(), ['greet', 'idle', 'levelUp', 'pet', 'seat']);
});

test('unlocks follow points and friend', () => {
  assert.equal(unlockedFor(SAMPLE, 'character', 0).length, 1);           // the seat emote is for everyone from 0
  assert.equal(unlockedFor(SAMPLE, 'lilac', 1).length, 3);               // + pet line, + her own greet line
  assert.equal(unlockedFor(SAMPLE, 'character', 1).length, 2);
  assert.deepEqual(nextUnlock(SAMPLE, 'peach', 3), SAMPLE[4]);
  assert.equal(nextUnlock(SAMPLE, 'lilac', 99), null);
  assert.equal(pickForMoment(SAMPLE, 'line', 'lilac', 0, 'pet', () => .5), null, 'not enough points yet');
  assert.equal(pickForMoment(SAMPLE, 'line', 'lilac', 1, 'pet', () => .5)?.text, '또 왔구나!');
});

test('a pat shows an unlocked line in a bubble and an emotion; a new level says its own line', () => {
  const sim = new LifeSimulation(() => .5); sim.unlocks = SAMPLE;
  const momo = sim.avatars.get('peach')!;
  sim.affinity.peach = 5;
  sim.pet('peach', '2026-10-18');
  assert.equal(momo.speech, '또 왔구나!'); assert.equal(speaking(momo, sim.time), true);
  assert.equal(reactionLabel(momo, sim.time), '또 왔구나!');
  assert.equal(momo.emote, '✿');
  assert.deepEqual(sim.drainSpoken(), [{ id: 'peach', text: '또 왔구나!' }]); assert.deepEqual(sim.drainSpoken(), []);
  for (let i = 0; i < 6; i++) second(sim);
  assert.equal(speaking(momo, sim.time), false, 'the bubble goes away');

  const lulu = sim.avatars.get('lilac')!; sim.affinity.lilac = 2;
  sim.pet('lilac', '2026-10-18');                                       // 2 → 3: a new level
  assert.equal(lulu.speech, '우리 이제 아는 사이야');
});

test('meeting a friend and sitting down are moments too; an unlocked action is chosen on its own', () => {
  const sim = new LifeSimulation(() => .05); sim.unlocks = SAMPLE;
  const lulu = sim.avatars.get('lilac')!, momo = sim.avatars.get('peach')!;
  sim.affinity.lilac = 1;
  // Put the two free friends next to each other: they meet and greet (greet roll .05 < .7).
  for (const a of [lulu, momo]) { a.until = 1e9; a.directed = false; }
  Object.assign(momo, { x: lulu.x + .9, z: lulu.z });
  sim.update(.05);
  assert.equal(lulu.phase, 'greeting'); assert.equal(lulu.speech, '안녕!'); assert.equal(momo.speech, '', 'the greet line is only Lulu’s');

  const sat = new LifeSimulation(() => .5); sat.unlocks = SAMPLE;
  const hong = sat.avatars.get('character')!;
  assert.equal(sat.use('character', 'bench'), null);
  for (let t = 0; t < 40 && hong.phase !== 'seated'; t += .05) sat.update(.05);
  assert.equal(hong.phase, 'seated'); assert.equal(hong.emote, '♪');

  const waver = new LifeSimulation(() => .5); waver.unlocks = SAMPLE;
  const peach = waver.avatars.get('peach')!; waver.affinity.peach = 7; peach.until = 0;
  waver.update(.05);
  assert.equal(peach.phase, 'waving', 'from 7 points she sometimes waves on her own');
});

test('visitFriend walks to a tile beside the nearest free friend', () => {
  const sim = new LifeSimulation(() => .5);
  sim.unlocks = [{ kind: 'action', at: 0, friend: 'lilac', action: 'visitFriend', chance: 1 }];
  const lulu = sim.avatars.get('lilac')!; lulu.until = 0;
  for (const a of sim.avatars.values()) if (a.id !== 'lilac') a.until = 1e9;
  sim.update(.05);
  assert.equal(lulu.phase, 'walking');
  const goal = lulu.path.at(-1)!, nearest = [...sim.avatars.values()].filter(a => a.id !== 'lilac').sort((p, q) => Math.hypot(p.x - goal.x, p.z - goal.z) - Math.hypot(q.x - goal.x, q.z - goal.z))[0];
  assert.ok(Math.hypot(nearest.x - goal.x, nearest.z - goal.z) < 1.6, 'she heads for a friend');
});
