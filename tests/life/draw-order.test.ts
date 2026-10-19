import test from 'node:test';
import assert from 'node:assert/strict';
import { boxAround, drawRanks, sceneOrder, walkerDepth } from '../../apps/client/src/drawOrder.js';
import { DEFAULT_LAYOUT, footprint, type PlacedItem, type ItemKind } from '../../apps/client/src/layout.js';
import { PARK_INITIAL_LAYOUT } from '../../apps/client/src/parkLayout.js';

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

test('raised water banks and every upright prop cover a rear walker and yield to a front walker on all turns', () => {
  for (const kind of ['pond', 'stream', 'tree', 'fence', 'bench', 'swing', 'seesaw', 'picnicTable', 'drinkingFountain', 'fountain', 'bridge', 'flower'] as ItemKind[]) for (let turn = 0; turn < 4; turn++) {
    const item = { id: 'prop', kind, x: 0, z: 0, turn }, f = footprint(item);
    const order = sceneOrder([item], [{ id: 'back', x: 0, z: -f.d / 2 - 1.5 }, { id: 'front', x: 0, z: f.d / 2 + 1.5 }]);
    assert.ok(order.get('back')! < order.get(item.id)!, `${kind} turn ${turn} rear`);
    assert.ok(order.get(item.id)! < order.get('front')!, `${kind} turn ${turn} front`);
  }
});

test('bridge decks stay above water banks regardless of item order and walkers stay between the two rails', () => {
  for (let turn = 0; turn < 4; turn++) for (const reverse of [false, true]) {
    const stream: PlacedItem = { id: 'water', kind: 'stream', x: 0, z: 0, turn }, bridge: PlacedItem = { ...stream, id: 'deck', kind: 'bridge', turn: (turn + 1) % 4 };
    const items = reverse ? [bridge, stream] : [stream, bridge];
    const walker = { id: 'walker', x: .2, z: -.2 }, order = sceneOrder(items, [walker]);
    assert.ok(order.get(stream.id)! < order.get(bridge.id)!);
    const depth = walkerDepth(walker, items, order);
    assert.ok(order.get(bridge.id)! < depth && depth < order.get(bridge.id)! + .2);
  }
});
test('the connected brook in the full park cannot cover the bridge when spatial ordering has a cycle', () => {
  for (const items of [PARK_INITIAL_LAYOUT.items, [...PARK_INITIAL_LAYOUT.items].reverse()]) {
    const order = sceneOrder(items, []);
    assert.ok(order.get('park-brook-2')! < order.get('park-bridge')!);
  }
});
test('a friend walking to a reserved seat is not yet drawn with the seat; one sitting down is', async () => {
  const { LifeSimulation } = await import('../../apps/client/src/simulation.js');
  const sim = new LifeSimulation(() => .5), momo = sim.avatars.get('peach')!;
  assert.equal(sim.use('peach', 'bench'), null);
  assert.ok(sim.seatOf(momo) && momo.phase === 'walking');
  assert.equal(sim.riding(momo), false, 'still on the way: drawn by her own feet');
  for (let t = 0; t < 40 && !(momo.phase === 'boarding' && momo.progress > 0); t += .05) sim.update(.05);
  assert.equal(sim.riding(momo), true);
});
