import { test, expect } from '@playwright/test';
import { proofPath } from './proof';
import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';

const proof = 'docs/design/drinking-water-2026-10-19';
for (const renderer of ['phaser', 'canvas']) test(`${renderer}: drinking water flows while the tap and stone stay intact`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const save = encodeSave(gardenSave({ items: [{ id: 'drinking-test', kind: 'drinkingFountain', x: .5, z: .5, turn: 0 }], stored: [] }));
  await page.addInitScript(([key, value]) => { localStorage.setItem(key, value); Math.random = () => .99; }, [SAVE_KEY, save]);
  await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
  await expect(page.locator('#loading')).toBeHidden();
  await page.locator('#game').hover(); await page.mouse.wheel(0, -800);
  await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}.png`) });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.click('#edit-mode');
  await page.click('[data-catalog=drinkingFountain]');
  await page.click('#item-rotate');
  await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-editor.png`) });
  const helper = ts.transpileModule(readFileSync('apps/client/src/drinkingWater.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText.replaceAll('export ', '');
  await page.addScriptTag({ content: `${helper}\nwindow.drinkingWaterTest = { drinkingWaterFrames, drinkingWaterFrame };` });
  const result = await page.evaluate(async () => {
    const source = new Image(); source.src = 'sprites/garden/park-props-v1/drinking-fountain.png'; await source.decode();
    const original = document.createElement('canvas'); original.width = original.height = 128;
    original.getContext('2d')!.drawImage(source, 0, 0);
    const px = original.getContext('2d')!.getImageData(0, 0, 128, 128).data;
    const { drinkingWaterFrames, drinkingWaterFrame } = (window as any).drinkingWaterTest;
    const frames: HTMLCanvasElement[] = drinkingWaterFrames(source);
    let outsideChanges = 0, alphaChanges = 0, streamChanges = 0, rippleChanges = 0;
    const hashes = new Set<number>();
    for (const frame of frames) {
      const data = frame.getContext('2d')!.getImageData(0, 0, 128, 128).data;
      let hash = 2166136261;
      for (let i = 0; i < px.length; i += 4) {
        const x = i / 4 % 128, y = Math.floor(i / 4 / 128);
        const changed = data[i] !== px[i] || data[i + 1] !== px[i + 1] || data[i + 2] !== px[i + 2];
        if (changed && !(x >= 50 && x <= 77 && y >= 5 && y <= 31)) outsideChanges++;
        if (changed && y < 24) streamChanges++;
        if (changed && y >= 24) rippleChanges++;
        if (data[i + 3] !== px[i + 3]) alphaChanges++;
        hash = Math.imul(hash ^ data[i], 16777619); hash = Math.imul(hash ^ data[i + 1], 16777619);
      }
      hashes.add(hash);
    }
    const atlas = document.createElement('canvas'); atlas.width = atlas.height = 128 * 4;
    frames.forEach((frame, i) => atlas.getContext('2d')!.drawImage(frame, i % 4 * 128, Math.floor(i / 4) * 128));
    return { outsideChanges, alphaChanges, streamChanges, rippleChanges, unique: hashes.size, count: frames.length,
      loop: drinkingWaterFrame(0) === drinkingWaterFrame(16 / 12), still: drinkingWaterFrame(1, true), atlas: atlas.toDataURL() };
  });
  expect(result.outsideChanges).toBe(0); expect(result.alphaChanges).toBe(0);
  expect(result.streamChanges).toBeGreaterThan(300); expect(result.rippleChanges).toBeGreaterThan(50);
  expect(result.unique).toBe(16); expect(result.count).toBe(16);
  expect(result.loop).toBe(true); expect(result.still).toBe(0);
  if (renderer === 'phaser') writeFileSync(proofPath(proof, 'water-frames.png'), Buffer.from(result.atlas.split(',')[1], 'base64'));
  expect(errors).toEqual([]);
});
