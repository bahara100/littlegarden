import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';

const proof = 'docs/design/fountain-water-2026-10-19';
for (const renderer of ['phaser', 'canvas']) test(`${renderer} fountain water flows without changing its stone or silhouette`, async ({ page }) => {
  mkdirSync(proof, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  const problems: string[] = []; page.on('pageerror', e => problems.push(e.message));
  const save = encodeSave(gardenSave({ items: [{ id: 'water-test', kind: 'fountain', x: .5, z: .5, turn: 0 }], stored: [] }));
  await page.addInitScript(([key, value]) => { localStorage.setItem(key, value); Math.random = () => .99; }, [SAVE_KEY, save]);
  await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
  await expect(page.locator('#loading')).toBeHidden();
  await page.locator('#game').hover(); await page.mouse.wheel(0, -800);
  await page.locator('#viewport').screenshot({ path: `${proof}/${renderer}.png` });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.click('#edit-mode');
  await expect(page.locator('[data-catalog=fountain]')).toBeVisible();
  await page.click('[data-catalog=fountain]');
  await page.click('#item-rotate');
  await page.locator('#viewport').screenshot({ path: `${proof}/${renderer}-editor.png` });
  const helper = ts.transpileModule(readFileSync('apps/client/src/fountainWater.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText.replaceAll('export ', '');
  await page.addScriptTag({ content: `${helper}\nwindow.fountainWaterTest = { fountainFrames, fountainFrame };` });
  const result = await page.evaluate(async () => {
    const source = new Image(); source.src = 'sprites/garden/park-props-v1/fountain.png'; await source.decode();
    const original = document.createElement('canvas'); original.width = original.height = 128;
    original.getContext('2d')!.drawImage(source, 0, 0);
    const px = original.getContext('2d')!.getImageData(0, 0, 128, 128).data;
    const { fountainFrames, fountainFrame } = (window as any).fountainWaterTest;
    const frames: HTMLCanvasElement[] = fountainFrames(source);
    let stoneChanges = 0, alphaChanges = 0, waterChanges = 0;
    const hashes = new Set<number>();
    for (const frame of frames) {
      const data = frame.getContext('2d')!.getImageData(0, 0, 128, 128).data;
      let hash = 2166136261;
      for (let i = 0; i < px.length; i += 4) {
        const changed = data[i] !== px[i] || data[i + 1] !== px[i + 1] || data[i + 2] !== px[i + 2];
        const water = px[i + 3] && px[i + 1] >= px[i] + 9 && px[i + 2] >= px[i] + 15 && px[i + 2] >= px[i + 1] - 18;
        if (changed && !water) stoneChanges++;
        if (changed && water) waterChanges++;
        if (data[i + 3] !== px[i + 3]) alphaChanges++;
        hash = Math.imul(hash ^ data[i], 16777619); hash = Math.imul(hash ^ data[i + 1], 16777619);
      }
      hashes.add(hash);
    }
    const atlas = document.createElement('canvas'); atlas.width = 128 * 6; atlas.height = 128 * 4;
    frames.forEach((frame, i) => atlas.getContext('2d')!.drawImage(frame, i % 6 * 128, Math.floor(i / 6) * 128));
    return { stoneChanges, alphaChanges, waterChanges, unique: hashes.size, count: frames.length,
      loop: fountainFrame(0) === fountainFrame(2), still: fountainFrame(1, true), atlas: atlas.toDataURL() };
  });
  expect(result.stoneChanges).toBe(0); expect(result.alphaChanges).toBe(0);
  expect(result.waterChanges).toBeGreaterThan(5000); expect(result.unique).toBe(24);
  expect(result.count).toBe(24); expect(result.loop).toBe(true); expect(result.still).toBe(0);
  if (renderer === 'phaser') writeFileSync(`${proof}/water-frames.png`, Buffer.from(result.atlas.split(',')[1], 'base64'));
  expect(problems).toEqual([]);
});
