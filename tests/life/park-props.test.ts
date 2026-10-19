import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, bridgeLift, footprint, geometryError, snapToTiles, worldFrom, type PlacedItem } from '../../apps/client/src/layout.js';
import { findPath, walkable } from '../../apps/client/src/simulation.js';
import { LayoutEditor, layoutError } from '../../apps/client/src/editor.js';
import { decodeSave, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';
import { PARK_PROPS, type ParkPropKind } from '../../apps/client/src/parkProps.js';
import { existsSync } from 'node:fs';

const water: PlacedItem = { id: 'stream', kind: 'stream', x: 6, z: 5, turn: 1 };
const bridge: PlacedItem = { id: 'bridge', kind: 'bridge', x: 6, z: 5, turn: 0 };

test('six new decorations keep whole-tile footprints, rotate, store and round-trip saves', () => {
  for (const kind of Object.keys(PARK_PROPS) as ParkPropKind[]) {
    assert.ok(existsSync(`apps/client/public/sprites/garden/park-props-v1/${PARK_PROPS[kind].file}`));
    const editor = new LayoutEditor(); editor.enter(); editor.draft = { items: [], stored: [] };
    assert.equal(editor.begin(kind), null);
    editor.position(6, 5); editor.rotate();
    const f = footprint(editor.pending!);
    assert.equal(f.w, CATALOG[kind].d); assert.equal(f.d, CATALOG[kind].w);
    for (const edge of [f.x - f.w / 2, f.x + f.w / 2, f.z - f.d / 2, f.z + f.d / 2]) assert.ok(Number.isInteger(edge));
    assert.equal(editor.place(), null); assert.equal(editor.store(), null);
    const saved = gardenSave(editor.draft);
    assert.deepEqual(decodeSave(encodeSave(saved)), editor.draft);
  }
});

test('water blocks feet; a perpendicular bridge opens only its deck and keeps the banks blocked', () => {
  assert.equal(walkable({ x: 6, z: 5 }, worldFrom([water])), false);
  assert.equal(geometryError([water, bridge]), null);
  const nav = worldFrom([water, bridge]);
  assert.equal(walkable({ x: 6, z: 5 }, nav), true);
  assert.equal(walkable({ x: 6, z: 6.5 }, nav), false);
  const route = findPath({ x: 3.5, z: 5 }, { x: 8.5, z: 5 }, nav);
  assert.ok(route); assert.ok(route.some(p => Math.abs(p.x - 6) < 1 && Math.abs(p.z - 5) <= .5));
  assert.equal(layoutError([water, bridge]), null);
  assert.equal(walkable({ x: water.x - 1.5, z: water.z }, worldFrom([water])), false, 'the raised stream bank is blocked too');
  assert.ok(bridgeLift({ x: 6, z: 5 }, [bridge]) > 0);
  assert.ok(bridgeLift({ x: 8, z: 5 }, [bridge]) > 0, 'entry ramps meet the raised deck');
  assert.equal(bridgeLift({ x: 9, z: 5 }, [bridge]), 0);
  const solid = snapToTiles({ id: 'solid', kind: 'fountain' as const, x: 6, z: 5, turn: 0 });
  assert.ok(geometryError([water, solid]), 'only the bridge may overlap water');
});

test('stream pieces can touch end to end without overlapping, in both directions', () => {
  for (const turn of [0, 1]) {
    const first = { ...water, turn }, second = { ...water, id: 'next', turn, x: water.x + (turn ? 0 : 4), z: water.z + (turn ? 4 : 0) };
    assert.equal(geometryError([first, second]), null);
    assert.ok(geometryError([first, { ...second, x: first.x, z: first.z }]));
  }
});

test('bridge arch height meets dry ground smoothly on either axis', () => {
  for (const turn of [0, 1, 2, 3]) {
    const item = { ...bridge, x: 0, z: 0, turn };
    let previous = 0;
    for (let along = -3; along <= 3; along += .125) {
      const p = turn % 2 ? { x: 0, z: along } : { x: along, z: 0 };
      const h = bridgeLift(p, [item]);
      assert.ok(h >= 0 && h <= 1.05);
      assert.ok(Math.abs(h - previous) < .08, 'no vertical jump at the entry or exit');
      previous = h;
    }
    assert.equal(bridgeLift({ x: 0, z: 0 }, [item]), 1.05);
  }
});
