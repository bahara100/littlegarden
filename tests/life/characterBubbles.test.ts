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
  assert.deepEqual(bubbleContent(a, 0), { value: '👋', kind: 'emote' });
  a.phase = 'seated';
  assert.equal(bubbleContent(a, 0, 'bench').value, '···');
  assert.equal(bubbleContent(a, 0, 'swing').value, '♪');
});

test('emotion icons grow with the map in whole steps (1x, 2x, 3x)', async () => {
  const { emoteScale, EMOTE_TILE, EMOTE_ICONS } = await import('../../apps/client/src/characterBubbles.js');
  assert.equal(emoteScale(EMOTE_TILE), 1);          // the starting zoom
  assert.equal(emoteScale(EMOTE_TILE * .6), 1);     // never smaller than the art itself
  assert.equal(emoteScale(EMOTE_TILE * 1.6), 2);
  assert.equal(emoteScale(EMOTE_TILE * 3), 3);
  assert.equal(emoteScale(EMOTE_TILE * 9), 3);      // capped so a close-up does not swallow the friend
  assert.deepEqual(EMOTE_ICONS, { '♡': 'heart', '♪': 'note', '👋': 'wave', '!': 'exclaim', '···': 'dots', '🐟': 'fish' });
});
