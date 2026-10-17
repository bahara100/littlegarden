import test from 'node:test';
import assert from 'node:assert/strict';
import { fullFrameIndex, FULL_WALK_FPS } from '../../apps/client/src/scarletFullFrames';
test('full-body playback reaches four cells and closes 4 to 1 at six FPS', () => {
  assert.equal(FULL_WALK_FPS,6);
  assert.deepEqual(Array.from({length:5},(_,i)=>fullFrameIndex((i+.01)/FULL_WALK_FPS)),[0,1,2,3,0]);
  assert.equal(fullFrameIndex(-1),0);
  assert.equal(fullFrameIndex(.51,6,4),3);
  assert.equal(fullFrameIndex(.51),3);
  assert.equal(fullFrameIndex(2/3,6,4),0);
  assert.equal(fullFrameIndex(2/3),0);
});
