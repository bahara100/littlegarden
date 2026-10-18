import test from 'node:test';
import assert from 'node:assert/strict';
import { boxAround, drawRanks, sceneOrder } from '../../apps/client/src/drawOrder.js';
import { DEFAULT_LAYOUT, footprint } from '../../apps/client/src/layout.js';

test('fences behind a corner tree are drawn before it, even when their centre sum is larger', () => {
  const order = sceneOrder(DEFAULT_LAYOUT.items, []);
  const tree = DEFAULT_LAYOUT.items.find(i => i.id === 'tree-0')!, t = footprint(tree);
  const fences = DEFAULT_LAYOUT.items.filter(i => i.kind === 'fence');
  let checked = 0;
  for (const fence of fences) {
    const f = footprint(fence);
    const wholyBehind = f.z + f.d / 2 <= t.z - t.d / 2 || f.x + f.w / 2 <= t.x - t.w / 2;
    const near = Math.abs((f.x - f.z) - (t.x - t.z)) < 4;
    if (!wholyBehind || !near) continue;
    assert.ok(order.get(fence.id)! < order.get(tree.id)!, `${fence.id} is behind ${tree.id}`);
    checked++;
  }
  assert.ok(checked >= 3, 'the corner fences next to the tree were checked');
  // The case from the screenshot: the next top fence has a larger x + z than the tree but lies wholly behind it.
  const nextFence = fences.find(i => i.z === tree.z - 2 && i.x === tree.x + 2.5)!;
  assert.ok(nextFence.x + nextFence.z > tree.x + tree.z);
  assert.ok(order.get(nextFence.id)! < order.get(tree.id)!);
});
test('a friend in front of a tree is drawn after it, and one behind it before it', () => {
  const tree = { id: 'tree', kind: 'tree' as const, x: .5, z: .5, turn: 0 };
  const order = sceneOrder([tree], [{ id: 'front', x: .5, z: 1.5 }, { id: 'back', x: .5, z: -.5 }]);
  assert.ok(order.get('back')! < order.get('tree')! && order.get('tree')! < order.get('front')!);
});
test('every box gets one rank, also when the pairwise order would loop', () => {
  const boxes = [boxAround({ x: 0, z: 0 }, 1), boxAround({ x: 1, z: 0 }, 1), boxAround({ x: 0, z: 1 }, 1), boxAround({ x: .3, z: .3 }, 1)];
  assert.deepEqual([...drawRanks(boxes)].sort(), [0, 1, 2, 3]);
});
