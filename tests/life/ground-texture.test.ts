import test from 'node:test';
import assert from 'node:assert/strict';
import { groundPlan } from '../../apps/client/src/groundTexture.js';
import type { PlacedItem } from '../../apps/client/src/layout.js';
const paths = (points: number[][]): PlacedItem[] => points.map(([x, z], i) => ({ id: `path-${i}`, kind: 'path', x: x + .5, z: z + .5, turn: 0 }));

test('joined paths have only their outside perimeter, also at corners and junctions', () => {
  for (const [points, edges] of [
    [[[0, 0]], 4],
    [[[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], 10],
    [[[0, 0], [1, 0], [0, 1]], 8],
    [[[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]], 12],
  ] as [number[][], number][]) {
    const plan = groundPlan(paths(points));
    assert.equal(plan.cells.length, points.length); assert.equal(plan.edges.length, edges);
    for (const edge of plan.edges) {
      const mid = { x: (edge.a.x + edge.b.x) / 2, z: (edge.a.z + edge.b.z) / 2 };
      const inward = `${Math.floor(mid.x + edge.inward.x * .1)},${Math.floor(mid.z + edge.inward.z * .1)}`;
      const outside = `${Math.floor(mid.x - edge.inward.x * .1)},${Math.floor(mid.z - edge.inward.z * .1)}`;
      assert.ok(plan.path.has(inward)); assert.equal(plan.path.has(outside), false);
    }
  }
});

test('path decoration is independent of item order and supports separate path islands', () => {
  const items = paths([[-3, -2], [-2, -2], [5, 6]]);
  const first = groundPlan(items), reversed = groundPlan([...items].reverse());
  assert.deepEqual(first.cells, reversed.cells); assert.deepEqual(first.edges, reversed.edges);
  assert.equal(first.edges.length, 10); assert.equal(groundPlan([]).edges.length, 0);
});
