import test from 'node:test';
import assert from 'node:assert/strict';
import { REGIONS, DEFAULT_REGION, region, isRegionId } from '../../apps/client/src/regions.js';
import { nextTrack, trackLabel, type Track } from '../../apps/client/src/music.js';
import { loadSettings } from '../../apps/client/src/persistence.js';

test('regions have unique ids and numbers, full colour sets, and the garden first', () => {
  assert.equal(REGIONS[0].id, DEFAULT_REGION);
  assert.equal(new Set(REGIONS.map(r => r.id)).size, REGIONS.length);
  assert.equal(new Set(REGIONS.map(r => r.number)).size, REGIONS.length);
  const colour = /^#[0-9a-f]{6}$/;
  for (const r of REGIONS) {
    const g = r.ground;
    for (const c of [g.background, ...g.tiles, g.speck, ...g.edges, g.edgeLine, g.grid, ...g.path]) assert.match(c, colour, `${r.id} ${c}`);
  }
  assert.ok(REGIONS.some(r => r.id === 'onsen'), 'the hot spring is listed');
  assert.equal(region('onsen').name, '온천 마을');
  assert.equal(isRegionId('onsen'), true); assert.equal(isRegionId('moon'), false);
});
test('the chosen region is remembered and unknown ones fall back to the garden', () => {
  const storage = (value: unknown) => ({ getItem: () => JSON.stringify(value), setItem() {} });
  assert.equal(loadSettings(storage({ region: 'onsen' })).region, 'onsen');
  assert.equal(loadSettings(storage({ region: 'moon' })).region, 'garden');
  assert.equal(loadSettings(storage({})).region, 'garden');
});
test('the song list plays round in order and labels what is on', () => {
  const songs: Track[] = [{ id: 'a', title: '오후', src: 'music/a.mp3' }, { id: 'b', title: '밤', artist: '루루', src: 'music/b.mp3' }];
  assert.equal(nextTrack([], null), null);
  assert.equal(nextTrack(songs, null)?.id, 'a');
  assert.equal(nextTrack(songs, 'a')?.id, 'b');
  assert.equal(nextTrack(songs, 'b')?.id, 'a');
  assert.match(trackLabel(null, false, []), /준비 중/);
  assert.match(trackLabel(null, false, songs), /골라/);
  assert.equal(trackLabel(songs[1], true, songs), '♪ 밤 — 루루');
  assert.equal(trackLabel(songs[0], false, songs), '❚❚ 오후');
});
test('seasons recolour any region and are remembered; spring keeps the colours as drawn', async () => {
  const { SEASONS, DEFAULT_SEASON, seasonGround, mix, isSeasonId } = await import('../../apps/client/src/seasons.js');
  assert.deepEqual(SEASONS.map(s => s.id), ['spring', 'summer', 'autumn', 'winter']);
  assert.equal(DEFAULT_SEASON, 'spring');
  assert.equal(mix('#000000', '#ffffff', .5), '#808080'); assert.equal(mix('#123456', '#abcdef', 0), '#123456');
  const colour = /^#[0-9a-f]{6}$/;
  for (const r of REGIONS) for (const s of SEASONS) {
    const g = seasonGround(r.ground, s.id);
    for (const c of [g.background, ...g.tiles, g.speck, ...g.edges, g.edgeLine, g.grid, ...g.path]) assert.match(c, colour, `${r.id} ${s.id}`);
  }
  assert.deepEqual(seasonGround(REGIONS[0].ground, 'spring').tiles, REGIONS[0].ground.tiles);
  assert.notDeepEqual(seasonGround(REGIONS[0].ground, 'winter').tiles, REGIONS[0].ground.tiles);
  assert.equal(isSeasonId('winter'), true); assert.equal(isSeasonId('monsoon'), false);
  const storage = (value: unknown) => ({ getItem: () => JSON.stringify(value), setItem() {} });
  assert.equal(loadSettings(storage({ season: 'autumn' })).season, 'autumn');
  assert.equal(loadSettings(storage({ season: 'monsoon' })).season, 'spring');
});
