import { test, expect } from '@playwright/test';
import { proofPath } from './proof';
import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';

for (const renderer of ['phaser', 'canvas']) test(`${renderer} new lake art loads, rotates and keeps shore watching`, async ({ page }) => {
  const proof = 'docs/design/pond-fish-2026-10-19';
  await page.setViewportSize({ width: 1440, height: 1100 });
  const problems: string[] = []; page.on('pageerror', e => problems.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('127.0.0.1')) problems.push(`${r.status()} ${r.url()}`); });
  const save = encodeSave(gardenSave({ items: [{ id: 'lake-test', kind: 'pond', x: .5, z: -2, turn: 0 }], stored: [] }));
  await page.addInitScript(([key, value]) => { localStorage.setItem(key, value); Math.random = () => .99; }, [SAVE_KEY, save]);
  const loaded = page.waitForResponse(r => r.url().endsWith('/sprites/garden/pond-v2/pond.png'));
  await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
  expect((await loaded).ok()).toBe(true);
  await expect(page.locator('#loading')).toBeHidden();
  await page.locator('#game').hover(); await page.mouse.wheel(0, -800);
  const game = page.locator('#game canvas'), box = (await game.boundingBox())!;
  // Pond centre is safely inside the water, away from friends on the shore.
  await page.click('#friend-lilac');
  const zoom = Number(await page.locator('#viewport').getAttribute('data-zoom')) / 100;
  const unit = Math.min(box.width / 51, box.height / 36) * zoom;
  await page.mouse.click(box.x + box.width / 2 + unit * 2.5, box.y + box.height * .56 - unit * .75);
  await expect(page.locator('#status-lilac')).toHaveText('호수 구경하는 중', { timeout: 30_000 });
  await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}.png`) });
  await page.click('#edit-mode');
  await expect(page.locator('#draft-count')).toContainText('1개 배치');
  // Select the existing lake by its centre and rotate its 5x6 footprint.
  await page.mouse.click(box.x + box.width / 2 + unit * 2.5, box.y + box.height * .56 - unit * .75);
  await page.click('#item-rotate');
  await expect(page.locator('#item-place')).toBeEnabled();
  await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-rotated.png`) });
  await page.click('#item-place'); await page.click('#editor-apply');
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  if (renderer === 'phaser') {
    const helper = ts.transpileModule(readFileSync('apps/client/src/pondFish.ts', 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText.replaceAll('export ', '');
    await page.addScriptTag({ content: `${helper}\nwindow.pondFishTest = { preparePondFish, pondFishArt };` });
    const fish = await page.evaluate(async () => {
      const source = new Image(); source.src = 'sprites/garden/pond-v2/pond.png'; await source.decode();
      const { preparePondFish, pondFishArt } = (window as any).pondFishTest; preparePondFish(source);
      const base = document.createElement('canvas'); base.width = 256; base.height = 160;
      const bc = base.getContext('2d')!; bc.drawImage(source, 0, 0); const pixels = bc.getImageData(0, 0, 256, 160).data;
      const atlas = document.createElement('canvas'); atlas.width = 2048; atlas.height = 2560;
      let outside = 0, minVisible = Infinity; const unique = new Set<number>();
      for (let frame = 0; frame < 128; frame++) {
        const layer: HTMLCanvasElement = pondFishArt(frame / 4), data = layer.getContext('2d')!.getImageData(0, 0, 256, 160).data;
        let visible = 0, hash = 2166136261;
        for (let i = 0; i < data.length; i += 4) if (data[i + 3]) {
          visible++; hash = Math.imul(hash ^ i, 16777619);
          if (!(pixels[i + 1] > pixels[i] + 12 && pixels[i + 2] > pixels[i] + 12 && pixels[i + 3])) outside++;
        }
        minVisible = Math.min(minVisible, visible); unique.add(hash);
        const c = atlas.getContext('2d')!, x = frame % 8 * 256, y = Math.floor(frame / 8) * 160;
        c.fillStyle = '#dce8ce'; c.fillRect(x, y, 256, 160); c.drawImage(source, x, y); c.drawImage(layer, x, y);
      }
      const stillA = pondFishArt(0, true).toDataURL(), stillB = pondFishArt(19, true).toDataURL();
      return { outside, minVisible, unique: unique.size, still: stillA === stillB, atlas: atlas.toDataURL() };
    });
    expect(fish.outside).toBe(0); expect(fish.minVisible).toBeGreaterThan(60);
    expect(fish.unique).toBeGreaterThan(120); expect(fish.still).toBe(true);
    writeFileSync(proofPath(proof, `fish-frames.png`), Buffer.from(fish.atlas.split(',')[1], 'base64'));
  }
  expect(problems).toEqual([]);
});
