import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LAYOUT, cloneLayout } from '../../apps/client/src/layout.js';
import { LayoutEditor } from '../../apps/client/src/editor.js';
import { DEFAULT_SETTINGS, SAVE_VERSION, SETTINGS_KEY, decodeGarden, decodeSave, encodeSave, loadGarden, loadLayout, loadSettings, saveLayout, saveSettings, SAVE_KEY, type SaveStorage } from '../../apps/client/src/persistence.js';

function memory(): SaveStorage {
  const values = new Map<string, string>();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } };
}
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
  assert.deepEqual(decodeSave(encodeSave(restored)), restored);
});
test('malformed, future-version, oversized and unsafe backups are rejected', () => {
  assert.throws(() => decodeSave('{'));
  assert.throws(() => decodeSave('x'.repeat(200_001)));
  const original = JSON.parse(encodeSave(DEFAULT_LAYOUT));
  const reject = (change: (data: typeof original) => void) => { const value = structuredClone(original); change(value); assert.throws(() => decodeSave(JSON.stringify(value))); };
  reject(d => { d.version = 3; });
  reject(d => { d.layout.items = null; });
  reject(d => { d.layout.items[0].kind = 'unknown'; });
  reject(d => { d.layout.items[0].id = 'character'; });
  reject(d => { d.layout.items[0].x = '4'; });
  reject(d => { d.layout.items[0].turn = 4; });
  reject(d => { d.layout.items[0].w = -1; });
  reject(d => { d.layout.stored.push(d.layout.items[0]); });
  reject(d => { d.layout.items[1].x = d.layout.items[0].x; d.layout.items[1].z = d.layout.items[0].z; });
  reject(d => { d.layout.stored = Array.from({ length: 161 }, (_, n) => ({ ...d.layout.items[0], id: `stored-${n}` })); });
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
  Object.assign(old.items.find(i => i.id === 'tree-0')!, { x: -6.2, z: -5.3 });
  const loaded = decodeSave(encodeSave(old));
  assert.deepEqual(loaded.items.find(i => i.id === 'bench'), { id: 'bench', kind: 'bench', x: -3.5, z: -2, turn: 0 });
  assert.deepEqual(loaded.items.find(i => i.id === 'tree-0'), { id: 'tree-0', kind: 'tree', x: -6.5, z: -5.5, turn: 0 });
});
test('version-1 saves upgrade to the current format; affinity and settings round-trip', () => {
  const v1 = JSON.stringify({ app: 'little-garden', version: 1, savedAt: '2026-10-17T00:00:00Z', layout: cloneLayout(DEFAULT_LAYOUT) });
  const old = decodeGarden(v1);
  assert.deepEqual(old.layout, decodeSave(encodeSave(DEFAULT_LAYOUT)));
  assert.deepEqual(old.affinity, { character: 0, peach: 0, lilac: 0 });
  assert.equal(JSON.parse(encodeSave(DEFAULT_LAYOUT)).version, SAVE_VERSION);
  const storage = memory();
  saveLayout(storage, DEFAULT_LAYOUT, { character: 3, peach: 0, lilac: 12 });
  assert.deepEqual(loadGarden(storage)!.affinity, { character: 3, peach: 0, lilac: 12 });
  assert.throws(() => decodeGarden(JSON.stringify({ ...JSON.parse(encodeSave(DEFAULT_LAYOUT)), friends: { affinity: { peach: -1 } } })));
  assert.deepEqual(loadSettings(storage), DEFAULT_SETTINGS);
  saveSettings(storage, { grid: true, zoom: 9, selected: 'lilac', dayCycle: false, fps: true });
  assert.deepEqual(loadSettings(storage), { grid: true, zoom: 5, selected: 'lilac', dayCycle: false, fps: true });
  storage.setItem(SETTINGS_KEY, JSON.stringify({ zoom: 9, selected: 'nobody', grid: 'yes' }));
  assert.deepEqual(loadSettings(storage), { ...DEFAULT_SETTINGS, zoom: 5 });
});
