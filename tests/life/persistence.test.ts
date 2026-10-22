import test from 'node:test';
import { MAX_ITEMS, ZOOM } from '../../apps/client/src/layout.js';
import assert from 'node:assert/strict';
import { DEFAULT_LAYOUT, cloneLayout, type Layout } from '../../apps/client/src/layout.js';
import { LayoutEditor } from '../../apps/client/src/editor.js';
import { DEFAULT_SETTINGS, SAVE_VERSION, SETTINGS_KEY, decodeGarden, decodeSave, emptySave, encodeSave, gardenSave, loadGarden, loadSettings, saveGarden, saveSettings, SAVE_KEY, type SaveStorage } from '../../apps/client/src/persistence.js';
import { LifeSimulation, DAY } from '../../apps/client/src/simulation.js';
import { AFFINITY_LEVELS, affinityLevel, todayKey } from '../../apps/client/src/affinity.js';

function memory(): SaveStorage {
  const values = new Map<string, string>();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } };
}
// The garden region's layout, the way most of these tests use a save.
const loadLayout = (storage: SaveStorage) => loadGarden(storage)?.regions.garden ?? null;
const saveLayout = (storage: SaveStorage, layout: Layout) => saveGarden(storage, gardenSave(layout));
const encode = (layout: Layout) => encodeSave(gardenSave(layout));

test('saved placements and inventory survive a new editor; future item IDs stay unique', () => {
  const e = new LayoutEditor(), storage = memory();
  assert.equal(loadLayout(storage), null);
  e.enter(); e.begin('tree'); e.position(4, 1.5); assert.equal(e.place(), null);
  e.selected = 'bench'; assert.equal(e.store(), null); assert.equal(e.apply(), null);
  saveLayout(storage, e.committed);
  const restored = loadLayout(storage)!;
  assert.deepEqual(restored, e.committed);
  const next = new LayoutEditor(); next.committed = restored; next.enter(); next.begin('tree');
  assert.equal(next.pending!.id, 'placed-2');
  next.cancel(); assert.deepEqual(loadLayout(storage), restored);
  assert.deepEqual(decodeSave(encode(restored)), restored);
});
test('malformed, future-version, oversized and unsafe backups are rejected', () => {
  assert.throws(() => decodeSave('{'));
  assert.throws(() => decodeSave('x'.repeat(200_001)));
  const original = JSON.parse(encode(DEFAULT_LAYOUT));
  const reject = (change: (data: typeof original) => void) => { const value = structuredClone(original); change(value); assert.throws(() => decodeGarden(JSON.stringify(value))); };
  const garden = (d: typeof original) => d.regions.garden;
  reject(d => { d.version = SAVE_VERSION + 1; });
  reject(d => { garden(d).items = null; });
  reject(d => { garden(d).items[0].kind = 'unknown'; });
  reject(d => { garden(d).items[0].id = 'character'; });
  reject(d => { garden(d).items[0].x = '4'; });
  reject(d => { garden(d).items[0].turn = 4; });
  reject(d => { garden(d).items[0].w = -1; });
  reject(d => { garden(d).stored.push(garden(d).items[0]); });
  reject(d => { garden(d).items[1].x = garden(d).items[0].x; garden(d).items[1].z = garden(d).items[0].z; });
  reject(d => { garden(d).stored = Array.from({ length: MAX_ITEMS + 1 }, (_, n) => ({ ...garden(d).items[0], id: `stored-${n}` })); });
  reject(d => { d.regions.moon = garden(d); });
  reject(d => { d.world.clock = 1.5; });
  reject(d => { d.friends.petted = { lilac: 'yesterday' }; });
});
test('storage failures are reported without replacing recoverable source data', () => {
  const storage = memory(); storage.setItem(SAVE_KEY, '{broken');
  assert.throws(() => loadLayout(storage)); assert.equal(storage.getItem(SAVE_KEY), '{broken');
  const blocked: SaveStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.throws(() => loadLayout(blocked)); assert.throws(() => saveLayout(blocked, cloneLayout(DEFAULT_LAYOUT)));
});
test('saves from before tile alignment load onto whole tiles', () => {
  const old = cloneLayout(DEFAULT_LAYOUT);
  Object.assign(old.items.find(i => i.id === 'bench')!, { x: -3.25, z: -2 });
  Object.assign(old.items.find(i => i.id === 'tree-0')!, { x: -10.2, z: -9.3 });
  const loaded = decodeSave(encode(old));
  assert.deepEqual(loaded.items.find(i => i.id === 'bench'), { id: 'bench', kind: 'bench', x: -3.5, z: -2, turn: 0 });
  assert.deepEqual(loaded.items.find(i => i.id === 'tree-0'), { id: 'tree-0', kind: 'tree', x: -10.5, z: -9.5, turn: 0 });
});
test('older saves upgrade step by step: v1 and v2 layouts become the garden region', () => {
  const v1 = JSON.stringify({ app: 'little-garden', version: 1, savedAt: '2026-10-17T00:00:00Z', layout: cloneLayout(DEFAULT_LAYOUT) });
  const fromV1 = decodeGarden(v1);
  assert.deepEqual(fromV1.regions, { garden: decodeSave(encode(DEFAULT_LAYOUT)) });
  assert.deepEqual(fromV1.affinity, { character: 0, peach: 0, lilac: 0, snow: 0 });
  assert.deepEqual(fromV1.petted, {}); assert.equal(fromV1.clock, DAY.start);
  const v2 = JSON.stringify({ app: 'little-garden', version: 2, layout: cloneLayout(DEFAULT_LAYOUT), friends: { affinity: { character: 3, peach: 0, lilac: 12 } } });
  const fromV2 = decodeGarden(v2);
  assert.deepEqual(Object.keys(fromV2.regions), ['garden']);
  assert.deepEqual(fromV2.affinity, { character: 3, peach: 0, lilac: 12, snow: 0 }, 'friends added later start at 0');
  assert.equal(JSON.parse(encode(DEFAULT_LAYOUT)).version, SAVE_VERSION);
  assert.equal(SAVE_VERSION, 4);
});
test('each region keeps its own layout; friends, pat days and the clock round-trip', () => {
  const onsen = cloneLayout(DEFAULT_LAYOUT); onsen.stored.push(onsen.items.splice(onsen.items.findIndex(i => i.kind === 'swing'), 1)[0]);
  const storage = memory();
  saveGarden(storage, { regions: { garden: DEFAULT_LAYOUT, onsen }, affinity: { character: 3, peach: 0, lilac: 12 }, petted: { lilac: '2026-10-18' }, clock: .82 });
  const back = loadGarden(storage)!;
  assert.equal(back.regions.onsen!.items.some(i => i.kind === 'swing'), false, 'the hot spring has its own placements');
  assert.equal(back.regions.garden!.items.some(i => i.kind === 'swing'), true, 'the garden keeps its swing');
  assert.deepEqual(back.affinity, { character: 3, peach: 0, lilac: 12, snow: 0 });
  assert.deepEqual(back.petted, { lilac: '2026-10-18' });
  assert.equal(back.clock, .82);
  assert.deepEqual(decodeGarden(encodeSave(emptySave())).regions, {});
  assert.throws(() => decodeGarden(JSON.stringify({ ...JSON.parse(encode(DEFAULT_LAYOUT)), friends: { affinity: { peach: -1 } } })));
});
test('the day carries on from the saved clock, cycle shown or not', () => {
  const sim = new LifeSimulation(() => .5);
  sim.update(.1); sim.setClock(.9);
  assert.ok(Math.abs(sim.clock() - .9) < 1e-9);
  for (let i = 0; i < 300; i++) sim.update(.1);  // half a minute
  assert.ok(Math.abs(sim.clock() - (.9 + 30 / DAY.length)) < 1e-6);
  sim.dayCycle = false; assert.equal(sim.dayFraction(), DAY.still); assert.ok(sim.clock() > .9, 'the clock is still kept');
  sim.setClock(.99); for (let i = 0; i < 100; i++) sim.update(.1);
  assert.ok(sim.clock() < .1, 'it wraps past midnight');
});
const second = (sim: LifeSimulation) => { for (let i = 0; i < 10; i++) sim.update(.1); };
test('a pat raises affinity once a day; levels are named', () => {
  const sim = new LifeSimulation(() => .5);
  const first = sim.pet('lilac', '2026-10-18')!;
  assert.deepEqual(first, { gained: true, levelUp: null }); assert.equal(sim.affinity.lilac, 1);
  for (let i = 0; i < 5; i++) { second(sim); assert.equal(sim.pet('lilac', '2026-10-18')!.gained, false); }
  assert.equal(sim.affinity.lilac, 1, 'more pats the same day still make her happy but add nothing');
  assert.equal(sim.pet('lilac', '2026-10-18'), null, 'pats too close together are not counted at all');
  second(sim); assert.equal(sim.pet('peach', '2026-10-18')!.gained, true, 'each friend has their own day');
  sim.affinity.lilac = 2; second(sim);
  const next = sim.pet('lilac', '2026-10-19')!;
  assert.equal(next.gained, true); assert.equal(next.levelUp?.name, AFFINITY_LEVELS[1].name);
  sim.affinity.lilac = 99; second(sim); assert.equal(sim.pet('lilac', '2026-10-20')!.gained, false, 'never above the top');
  assert.equal(affinityLevel(0).level.name, '처음 만난 사이'); assert.equal(affinityLevel(15).level.name, '단짝'); assert.equal(affinityLevel(99).next, null);
  assert.match(todayKey(new Date(2026, 0, 5)), /^2026-01-05$/);
});
test('view and song settings are validated and remembered', () => {
  const storage = memory();
  assert.deepEqual(loadSettings(storage), DEFAULT_SETTINGS);
  const chosen = { ...DEFAULT_SETTINGS, grid: true, zoom: 99, selected: 'lilac' as const, dayCycle: false, fps: true, region: 'onsen' as const, season: 'winter' as const, volume: .3, muted: true, track: 'evening', trackTime: 42.5, playing: true, musicOff: true };
  saveSettings(storage, chosen);
  assert.deepEqual(loadSettings(storage), { ...chosen, zoom: ZOOM.max });
  storage.setItem(SETTINGS_KEY, JSON.stringify({ zoom: 99, selected: 'nobody', grid: 'yes', volume: 4, trackTime: -1, track: 7 }));
  assert.deepEqual(loadSettings(storage), { ...DEFAULT_SETTINGS, zoom: ZOOM.max, volume: 1 });
});
