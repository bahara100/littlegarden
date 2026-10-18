import test from 'node:test';
import assert from 'node:assert/strict';
import { LifeSimulation } from '../../apps/client/src/simulation.js';
import { bubbleContent } from '../../apps/client/src/characterBubbles.js';

test('bubbles keep speech priority and expire back to existing emotions', () => {
  const sim = new LifeSimulation(() => .5), a = sim.avatars.get('peach')!;
  a.speech = '함께 쉬어요'; a.speechUntil = 3;
  a.emote = '✿'; a.emoteUntil = 5;
  assert.deepEqual(bubbleContent(a, 1), { value: '함께 쉬어요', kind: 'speech' });
  assert.deepEqual(bubbleContent(a, 3), { value: '✿', kind: 'emote' });
  assert.deepEqual(bubbleContent(a, 5), { value: '', kind: 'emote' });
});

test('ordinary greetings and seat reactions also use bubbles without new unlock content', () => {
  const sim = new LifeSimulation(() => .5), a = sim.avatars.get('lilac')!;
  a.phase = 'waving';
  assert.deepEqual(bubbleContent(a, 0), { value: '♡', kind: 'emote' });
  a.phase = 'seated';
  assert.equal(bubbleContent(a, 0, 'bench').value, '···');
  assert.equal(bubbleContent(a, 0, 'swing').value, '♪');
});
