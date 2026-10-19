import { test, expect } from '@playwright/test';
import { proofPath } from './proof';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { PARK_PROPS } from '../../apps/client/src/parkProps.js';

test('seesaw art keeps the rest pose, fixed feet and unclipped ends through all motion frames', async ({ page }) => {
  await page.setViewportSize({ width: 1560, height: 620 }); await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
  const helper = ts.transpileModule(readFileSync('apps/client/src/seesaw.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText.replace(/export /g, '').replace(/^import .*;\r?\n/gm, '');
  await page.addScriptTag({ content: `const PARK_PROPS = ${JSON.stringify(PARK_PROPS)};\n${helper}` });
  const result = await page.evaluate(async () => {
    const image = new Image(); image.src = 'sprites/garden/park-props-v1/seesaw.png'; await image.decode();
    const frames: HTMLCanvasElement[] = (window as any).seesawFrames(image);
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const ctx = c.getContext('2d')!; ctx.drawImage(image, 0, 0); const original = ctx.getImageData(0, 0, 128, 128).data;
    const rest = frames[16].getContext('2d')!.getImageData(16, 16, 128, 128).data;
    let clipped = false, feetChanged = false;
    for (const frame of frames) {
      const p = frame.getContext('2d')!.getImageData(0, 0, 160, 160).data;
      for (let n = 0; n < 160; n++) for (const [x, y] of [[n, 0], [n, 159], [0, n], [159, n]]) if (p[(y * 160 + x) * 4 + 3]) clipped = true;
      for (let y = 118; y < 128; y++) for (let x = 42; x < 81; x++) {
        const n = (y * 128 + x) * 4, q = ((y + 16) * 160 + x + 16) * 4;
        if (original[n + 3] && original[n + 1] > original[n] * .92 && original[n + 1] > original[n + 2] * 1.15)
          for (let i = 0; i < 4; i++) if (original[n + i] !== p[q + i]) feetChanged = true;
      }
    }
    const panel = document.createElement('section'); panel.id = 'seesaw-art-proof';
    panel.style.cssText = 'position:fixed;inset:0;z-index:100000;background:#dce5c8;color:#4a5343;padding:20px;font:18px sans-serif';
    panel.innerHTML = '<h2>시소 · 받침은 고정, 판자 양 끝은 반대 높이</h2>';
    for (const n of [0, 16, 32]) { const frame = frames[n]; frame.style.cssText = 'width:480px;height:480px;image-rendering:pixelated'; panel.append(frame); }
    document.body.append(panel);
    return { restEqual: original.every((v, i) => v === rest[i]), clipped, feetChanged };
  });
  expect(result).toEqual({ restEqual: true, clipped: false, feetChanged: false });
  await page.locator('#seesaw-art-proof').screenshot({ path: proofPath('docs/design/seesaw-2026-10-19', 'motion-frames.png') });
});

for (const renderer of ['phaser', 'canvas']) for (const turn of [0, 1]) {
  test(`${renderer} seesaw turn ${turn}: two friends board and play, then one leaves`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    const problems: string[] = []; page.on('pageerror', e => problems.push(e.message));
    const save = encodeSave(gardenSave({ items: [{ id: 'pair-seesaw', kind: 'seesaw', x: 0, z: -1.5, turn }], stored: [] }));
    await page.addInitScript(([key, value]) => { localStorage.setItem(key, value); Math.random = () => .99; }, [SAVE_KEY, save]);
    await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
    await expect(page.locator('#loading')).toBeHidden();
    await page.click('#friend-peach'); await page.click('#request-seesaw');
    await page.click('#friend-lilac'); await page.click('#request-seesaw');
    await expect(page.locator('#status-peach')).toHaveText('시소 타는 중', { timeout: 25_000 });
    await expect(page.locator('#status-lilac')).toHaveText('시소 타는 중');
    await expect(page.locator('#request-seesaw')).toBeDisabled();
    await page.locator('#game').hover(); await page.mouse.wheel(0, -1100);
    await page.waitForTimeout(1200);
    await page.locator('#viewport').screenshot({ path: proofPath('docs/design/seesaw-2026-10-19', `${renderer}-${turn}.png`) });
    await page.waitForTimeout(1600);
    await page.locator('#viewport').screenshot({ path: proofPath('docs/design/seesaw-2026-10-19', `${renderer}-${turn}-opposite.png`) });
    await page.click('#leave-seat');
    await expect(page.locator('#status-peach')).toHaveText('시소에서 친구 기다리는 중');
    await expect(page.locator('#status-lilac')).not.toHaveText('시소 타는 중');
    expect(problems).toEqual([]);
  });
}
