import { test, expect, type Page } from '@playwright/test';
import { proofPath } from './proof';
import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';
import type { PlacedItem } from '../../apps/client/src/layout.js';

const proof = 'docs/design/water-occlusion-2026-10-19';
async function open(page: Page, renderer: string, items: PlacedItem[]) {
  await page.setViewportSize({ width: 1440, height: 2000 });
  const problems: string[] = []; page.on('pageerror', e => problems.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('127.0.0.1')) problems.push(`${r.status()} ${r.url()}`); });
  await page.addInitScript(([key, value]) => { localStorage.setItem(key, value); Math.random = () => .99; }, [SAVE_KEY, encodeSave(gardenSave({ items, stored: [] }))]);
  await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
  await expect(page.locator('#loading')).toBeHidden();
  await page.click('#friend-character');
  await page.locator('#game').hover(); await page.mouse.wheel(0, -600);
  const click = async (x: number, z: number) => {
    await page.locator('#game').scrollIntoViewIfNeeded();
    const box = (await page.locator('#game canvas').boundingBox())!;
    const unit = Math.min(box.width / 51, box.height / 36) * Number(await page.locator('#viewport').getAttribute('data-zoom')) / 100;
    const px = box.x + box.width / 2 + (x - z) * unit, py = box.y + box.height * .56 + (x + z) / 2 * unit;
    const receiver = await page.evaluate(({ px, py }) => document.elementFromPoint(px, py)?.tagName, { px, py });
    expect(receiver, `ground click ${x},${z} at ${px},${py}; bounds ${JSON.stringify(box)}`).toBe('CANVAS');
    await page.mouse.move(px, py);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await page.mouse.click(px, py, { delay: 100 });
    await expect(page.locator('#announcer')).toContainText('이동을 부탁했어요');
  };
  return { problems, click };
}

for (const renderer of ['phaser', 'canvas']) {
  test(`${renderer} watches the far shore from dry ground outside the raised lake rocks`, async ({ page }) => {
    const { click, problems } = await open(page, renderer, [{ id: 'lake', kind: 'pond', x: .5, z: -2, turn: 0 }]);
    await click(.5, -8.5);
    await expect(page.locator('#status-character')).toHaveText('산책하는 중');
    await expect(page.locator('#status-character')).toHaveText('잠깐 쉬는 중', { timeout: 30_000 });
    await click(.5, -2);
    await expect(page.locator('#status-character')).toHaveText('호수 구경하는 중', { timeout: 15_000 });
    await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-far-shore.png`) });
    expect(problems).toEqual([]);
  });

  test(`${renderer} crosses a stream above the deck and behind the near bridge rail`, async ({ page }) => {
    const { click, problems } = await open(page, renderer, [
      { id: 'brook', kind: 'stream', x: .5, z: 0, turn: 1 },
      { id: 'bridge', kind: 'bridge', x: .5, z: 0, turn: 0 },
    ]);
    // Further left avoids clicking the large heads of friends initially standing in front of the bridge.
    await click(-5.5, 1.5);
    await expect(page.locator('#status-character')).toHaveText('산책하는 중');
    await expect(page.locator('#status-character')).toHaveText('잠깐 쉬는 중', { timeout: 20_000 });
    await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-stream-bank.png`) });
    await click(3.5, .5);
    await expect(page.locator('#status-character')).toHaveText('산책하는 중');
    // Capture the two sides of the real walking crossing; the simulated path/depth rules are tested separately.
    await page.waitForTimeout(5500);
    await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-bridge-entry.png`) });
    await page.waitForTimeout(1500);
    await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-bridge-exit.png`) });
    await expect(page.locator('#status-character')).toHaveText('잠깐 쉬는 중', { timeout: 15_000 });
    expect(problems).toEqual([]);
    if (renderer !== 'phaser') return;
    const helper = ts.transpileModule(readFileSync('apps/client/src/raisedWaterArt.ts', 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText.replaceAll('export ', '');
    await page.addScriptTag({ content: `${helper}\nwindow.raisedWaterTest = { waterBankArt, bridgeFrontArt };` });
    const masks = await page.evaluate(async () => {
      const { waterBankArt, bridgeFrontArt } = (window as any).raisedWaterTest;
      const gallery = document.createElement('canvas'); gallery.width = 768; gallery.height = 1008;
      const gc = gallery.getContext('2d')!; gc.fillStyle = '#dce8ce'; gc.fillRect(0, 0, 768, 1008); gc.imageSmoothingEnabled = false;
      let y = 0; const results = [];
      for (const [url, w, h] of [['pond-v2/pond.png', 256, 160], ['park-props-v1/stream.png', 128, 128], ['park-props-v1/wooden-bridge.png', 128, 128]] as const) {
        const image = new Image(); image.src = `sprites/garden/${url}`; await image.decode();
        const mask: HTMLCanvasElement = url.includes('bridge') ? bridgeFrontArt(image) : waterBankArt(image, w, h);
        const source = document.createElement('canvas'); source.width = w; source.height = h; source.getContext('2d')!.drawImage(image, 0, 0);
        const a = source.getContext('2d')!.getImageData(0, 0, w, h).data, b = mask.getContext('2d')!.getImageData(0, 0, w, h).data;
        let copied = 0, changed = 0;
        for (let i = 0; i < b.length; i += 4) if (b[i + 3]) { copied++; if (!a[i + 3] || b[i] !== a[i] || b[i + 1] !== a[i + 1] || b[i + 2] !== a[i + 2]) changed++; }
        results.push({ copied, changed });
        gc.drawImage(image, 0, y, 384, h / w * 384); gc.drawImage(mask, 384, y, 384, h / w * 384); y += h / w * 384;
      }
      return { results, gallery: gallery.toDataURL() };
    });
    for (const r of masks.results) { expect(r.copied).toBeGreaterThan(100); expect(r.changed).toBe(0); }
    writeFileSync(proofPath(proof, 'raised-layers.png'), Buffer.from(masks.gallery.split(',')[1], 'base64'));
  });
}
