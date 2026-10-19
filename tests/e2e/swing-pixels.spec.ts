import { test, expect } from '@playwright/test';
import { proofPath } from './proof';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';

test('swing motion keeps the approved rest artwork and samples moving edges from the source', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 2360 });
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
  const helper = ts.transpileModule(readFileSync('apps/client/src/swingFrames.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText.replace('export function', 'function');
  await page.addScriptTag({ content: helper });
  const result = await page.evaluate(async () => {
    const source = new Image(); source.src = 'sprites/garden/playground-swing-v1.png'; await source.decode();
    const canvas = (w = 128, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const panel = document.createElement('section'); panel.id = 'swing-proof';
    panel.style.cssText = 'position:fixed;inset:0;z-index:100000;overflow:auto;background:#e7eddb;padding:20px;color:#413343;font:16px sans-serif;';
    panel.innerHTML = '<h2>그네 흔들림 · 원본 도트 직접 사용</h2><p>왼쪽: 이전 방식 / 오른쪽: 수정 후 · 양 끝과 가운데 동작</p>';
    document.body.append(panel);
    const results = [];
    for (const rig of [
      { row: 0, pivots: [[182, 140], [285, 101]], forward: 1 },
      { row: 1, pivots: [[160, 97], [262, 135]], forward: -1 },
    ]) {
      const layers = [0, 1, 2, 3].map(col => {
        const c = canvas(444), ctx = c.getContext('2d')!;
        ctx.drawImage(source, col * 444, rig.row * 444, 444, 444, 0, 0, 444, 444);
        const p = ctx.getImageData(0, 0, 444, 444);
        for (let i = 3; i < p.data.length; i += 4) if (p.data[i] < 180) p.data[i] = 0;
        ctx.putImageData(p, 0, 0); return c;
      });
      const whole = canvas(444), wc = whole.getContext('2d')!;
      layers.forEach(layer => wc.drawImage(layer, 0, 0));
      const px = wc.getImageData(0, 0, 444, 444).data;
      let left = 444, top = 444, right = 0, bottom = 0;
      for (let y = 0; y < 444; y++) for (let x = 0; x < 444; x++) if (px[(y * 444 + x) * 4 + 3]) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      const sw = right - left + 1, sh = bottom - top + 1, scale = 124 / Math.max(sw, sh);
      const fit = { left, top, sw, sh, dw: Math.round(sw * scale), dh: Math.round(sh * scale) };
      const fitted = layers.map(layer => {
        const c = canvas(), ctx = c.getContext('2d')!; ctx.imageSmoothingEnabled = false;
        ctx.drawImage(layer, left, top, sw, sh, (128 - fit.dw) / 2, 128 - fit.dh, fit.dw, fit.dh); return c;
      });
      const at = ([x, y]: number[]) => ({ x: (x - left) * fit.dw / sw + (128 - fit.dw) / 2 + 24, y: (y - top) * fit.dh / sh + 128 - fit.dh + 24 });
      const p1 = at(rig.pivots[0]), p2 = at(rig.pivots[1]);
      const m = (p2.y - p1.y) / (p2.x - p1.x), y0 = p1.y - m * p1.x;
      let restEqual = false, clipped = false;
      for (let k = -16; k <= 16; k++) {
        const angle = Math.PI / 10 * k / 16;
        const before = canvas(176), after = canvas(176);
        const bc = before.getContext('2d')!, ac = after.getContext('2d')!;
        bc.imageSmoothingEnabled = false;
        const a = rig.forward * Math.sin(angle), b = Math.sin(angle) / 2 - (1 - Math.cos(angle));
        bc.setTransform(1 - a * m, -b * m, a, 1 + b, -a * y0, -b * y0); bc.drawImage(fitted[1], 24, 24);
        // The production frame painter, not a second copy of its implementation.
        (window as any).paintSwingFrame(ac, layers[1], fit, fitted[1], 24, angle, rig.forward, m, y0);
        const old = bc.getImageData(0, 0, 176, 176).data, now = ac.getImageData(0, 0, 176, 176).data;
        if (k === 0) restEqual = old.every((v, i) => v === now[i]);
        for (let n = 0; n < 176; n++) for (const [x, y] of [[n, 0], [n, 175], [0, n], [175, n]]) if (now[(y * 176 + x) * 4 + 3]) clipped = true;
        if (![-16, 0, 16].includes(k)) continue;
        const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:16px;margin:12px 0';
        for (const moving of [before, after]) {
          const composite = canvas(176), ctx = composite.getContext('2d')!;
          ctx.drawImage(fitted[0], 24, 24); ctx.drawImage(moving, 0, 0); ctx.drawImage(fitted[2], 24, 24); ctx.drawImage(fitted[3], 24, 24);
          composite.style.cssText = 'width:352px;height:352px;image-rendering:pixelated;background:#dbe5ca'; row.append(composite);
        }
        panel.append(row);
      }
      results.push({ restEqual, clipped });
    }
    return results;
  });
  expect(result).toEqual([{ restEqual: true, clipped: false }, { restEqual: true, clipped: false }]);
  await page.locator('#swing-proof').screenshot({ path: proofPath('docs/design/swing-pixels-2026-10-19', 'comparison.png') });
});

test('a friend boards the swing and the updated motion renders in the game', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', e => problems.push(e.message));
  const save = encodeSave(gardenSave({ items: [{ id: 'swing', kind: 'swing', x: 3.5, z: -1.5, turn: 0 }], stored: [] }));
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, save]);
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
  await page.click('#friend-peach');
  await page.click('#request-swing');
  await expect(page.locator('#selection-details')).toContainText('그네 타는 중', { timeout: 25_000 });
  await page.click('#focus-friend');
  await page.locator('#viewport').screenshot({ path: proofPath('docs/design/swing-pixels-2026-10-19', 'in-game.png') });
  expect(problems).toEqual([]);
});
