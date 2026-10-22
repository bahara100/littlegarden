import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const out = process.argv[2];
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const renderer of ['phaser', 'canvas']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); const errors = [];
    page.on('pageerror', e => errors.push(String(e))); page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.addInitScript(() => { localStorage.clear(); Math.random = () => .99; window.snowDraws = []; const draw = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function (im, ...args) { if (im instanceof HTMLImageElement && im.src.includes('/sprites/snow-white/v1/')) { window.snowDraws.push({ file: im.src.split('/').pop(), a: this.getTransform().a }); if (window.snowDraws.length > 40) window.snowDraws.shift(); } return draw.call(this, im, ...args); }; });
    await page.goto(`http://127.0.0.1:5173/${renderer === 'canvas' ? '?renderer=canvas' : ''}`); await page.waitForFunction(() => window.garden?.scarletModel === 'ready');
    const shown = () => page.evaluate(renderer => { const g = window.garden; if (renderer === 'phaser') { const s = g.game.scene.getScene('garden').avatars.get('snow').sprite; return { file: s.texture.key, flip: s.flipX, origin: s.originY }; } const d = window.snowDraws.at(-1); return d && { file: d.file.replace('.png', ''), flip: d.a < 0 }; }, renderer);
    // Standing and moving: the standing drawing both times (no walking drawings yet).
    await page.evaluate(() => { const g = window.garden; g.life.dayCycle = false; g.selectedAvatar = 'snow'; g.focusFriend(); for (const a of g.life.avatars.values()) { a.until = Infinity; a.directed = true; } g.life.moveTo('snow', { x: 6.5, z: 3.5 }); });
    await page.waitForTimeout(400);
    const walking = await shown(), phase = await page.evaluate(() => window.garden.life.avatars.get('snow').phase);
    assert.equal(phase, 'walking'); assert.match(walking.file, /^(snow-)?idle-(se|ne)$/, `${renderer} walking`);
    if (renderer === 'phaser') { assert.equal(walking.origin, 115 / 128); await page.screenshot({ path: `${out}/${renderer}-walking.png` }); }
    for (const [kind, turn, fill] of [['bench', 0, 0], ['bench', 1, 0], ['swing', 0, 0], ['seesaw', 0, 1], ['picnicTable', 0, 2], ['picnicTable', 1, 2], ['picnicRug', 0, 0]]) {
      const state = await page.evaluate(({ kind, turn, fill }) => {
        const g = window.garden, itemId = `snow-${kind}-${turn}-${fill}`;
        const err = g.restoreLayout({ items: kind === 'picnicRug' ? [] : [{ id: itemId, kind, x: 0, z: -1.5, turn }], stored: [] }); if (err) throw Error(err);
        g.selectedAvatar = 'snow'; g.focusFriend();
        for (const a of g.life.avatars.values()) { a.phase = 'idle'; a.path = []; a.until = Infinity; a.directed = true; }
        const id = kind === 'picnicRug' ? 'picnic-rug' : itemId;
        for (const f of ['peach', 'lilac'].slice(0, fill)) { const e = g.life.use(f, id); if (e) throw Error(`${f}: ${e}`); }
        const e = g.life.use('snow', id); if (e) throw Error(`snow ${kind}: ${e}`);
        const a = g.life.avatars.get('snow'); let n = 0;
        while (!['seated', 'swinging'].includes(a.phase) && n++ < 500) g.life.update(.1);
        a.until = Infinity; for (let i = 0; i < 30; i++) g.life.update(.1); a.until = Infinity;
        const seat = g.life.seatOf(a);
        const dir = (kind === 'bench' || kind === 'swing') ? (turn === 0 || turn === 3 ? 'sw' : 'se') : (Math.abs(Math.sin(seat.yaw)) >= Math.abs(Math.cos(seat.yaw)) ? (Math.sin(seat.yaw) >= 0 ? 'se' : 'nw') : (Math.cos(seat.yaw) >= 0 ? 'sw' : 'ne'));
        window.snowDraws = []; return { phase: a.phase, dir };
      }, { kind, turn, fill });
      await page.waitForTimeout(150);
      const s = await shown(), source = state.dir === 'se' || state.dir === 'sw' ? 'se' : 'ne', pose = kind === 'picnicRug' ? 'idle' : 'sit';
      assert.equal(s.file, renderer === 'phaser' ? `snow-${pose}-${source}` : `${pose}-${source}`, `${renderer} ${kind} ${turn} ${fill}`);
      assert.equal(s.flip, state.dir === 'sw' || state.dir === 'nw', `${renderer} ${kind} flip`);
      if (renderer === 'phaser') assert.equal(s.origin, kind === 'picnicRug' ? 115 / 128 : (96 * .97 + 24) / 128);
      await page.screenshot({ path: `${out}/${renderer}-${kind}-${turn}-${fill}.png` });
      await page.evaluate(() => { const g = window.garden, a = g.life.avatars.get('snow'); g.life.leave('snow'); let n = 0; while ((a.seatId || a.phase !== 'idle') && n++ < 500) g.life.update(.1); a.until = Infinity; window.snowDraws = []; });
      await page.waitForTimeout(120);
      const stood = await shown(); assert.match(stood.file, /idle-/, `${renderer} ${kind} stands up`);
      report.push(`${renderer} ${kind}/${turn}/${fill}: ${state.dir} ${pose}`);
    }
    assert.deepEqual(errors, []); await page.close();
  }
  console.log(report.join('\n'));
} finally { await browser.close(); }
