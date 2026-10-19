import test from 'node:test';
import assert from 'node:assert/strict';
import { PARK_INITIAL_LAYOUT, initialLayout } from '../../apps/client/src/parkLayout.js';
import { CATALOG, HUB, MAX_ITEMS, DEFAULT_LAYOUT, footprint, worldFrom } from '../../apps/client/src/layout.js';
import { layoutError } from '../../apps/client/src/editor.js';
import { findPath, walkable, LifeSimulation } from '../../apps/client/src/simulation.js';
import { decodeGarden, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';

test('the landscaped park uses every prop, fits the garden and keeps every seat reachable', () => {
  const { items } = PARK_INITIAL_LAYOUT, world = worldFrom(items);
  assert.ok(items.length < MAX_ITEMS);
  assert.equal(layoutError(items), null);
  assert.deepEqual(new Set(items.map(i => i.kind)), new Set(Object.keys(CATALOG)));
  assert.equal(new Set(items.map(i => i.id)).size, items.length);
  for (const s of world.seats) assert.ok(findPath(HUB, s.approach, world), `reach ${s.id}`);
  const lake = items.find(i => i.kind === 'pond')!;
  assert.deepEqual([footprint(lake).w, footprint(lake).d], [5, 6]);
  const sim = new LifeSimulation(() => .5); sim.applyLayout(items);
  assert.ok(sim.shoreSpots(lake).length >= 4);
  assert.ok(findPath(HUB, { x: .5, z: 10.5 }, world), 'a walk crosses the brook on the bridge');
  assert.equal(walkable({ x: 4.5, z: 8.5 }, world), false, 'the brook beside the bridge blocks feet');
});

test('initial layouts are regional clones and the complete decorated park survives backup and restore', () => {
  assert.deepEqual(initialLayout('onsen'), DEFAULT_LAYOUT);
  const a = initialLayout('garden'); a.items[0].x = 100;
  assert.notEqual(initialLayout('garden').items[0].x, 100);
  const layout = initialLayout('garden');
  assert.deepEqual(decodeGarden(encodeSave(gardenSave(layout))).regions.garden, layout);
});
