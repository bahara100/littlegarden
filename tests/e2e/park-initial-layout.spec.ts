import { test, expect } from '@playwright/test';
import { proofPath } from './proof';
import { PARK_INITIAL_LAYOUT } from '../../apps/client/src/parkLayout.js';
import { DEFAULT_LAYOUT } from '../../apps/client/src/layout.js';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';

const proof = 'docs/design/park-initial-2026-10-19';
for (const renderer of ['phaser', 'canvas']) test(`${renderer} opens the landscaped small park with the full prop collection`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const problems: string[] = []; page.on('pageerror', e => problems.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('127.0.0.1')) problems.push(`${r.status()} ${r.url()}`); });
  await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
  await expect(page.locator('#loading')).toBeHidden();
  await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-whole.png`) });
  await page.locator('#game').hover(); await page.mouse.wheel(0, -200);
  await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-detail.png`) });
  await page.click('#edit-mode');
  await expect(page.locator('#draft-count')).toContainText(`${PARK_INITIAL_LAYOUT.items.length}개 배치`);
  await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-editor.png`) });
  await page.click('#editor-cancel');
  // The unopened hot-spring region keeps its old draft instead of inheriting the garden's new park.
  await page.click('#region-button'); await page.click('[data-region=onsen]');
  await page.click('#edit-mode');
  await expect(page.locator('#draft-count')).toContainText(`${DEFAULT_LAYOUT.items.length}개 배치`);
  expect(problems).toEqual([]);
});

test('a saved park stays intact until the player confirms the new regional initial layout', async ({ page }) => {
  const saved = gardenSave(DEFAULT_LAYOUT, { affinity: { character: 7, peach: 8, lilac: 9 } });
  await page.addInitScript(([key, value]) => { if (!sessionStorage.getItem('initial-seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('initial-seeded', '1'); } }, [SAVE_KEY, encodeSave(saved)]);
  await page.goto('/'); await expect(page.locator('#loading')).toBeHidden();
  await page.click('#edit-mode'); await expect(page.locator('#draft-count')).toContainText(`${DEFAULT_LAYOUT.items.length}개 배치`);
  await page.click('#editor-cancel'); await page.click('#reset-layout');
  await page.click('#replace-cancel');
  await page.click('#edit-mode'); await expect(page.locator('#draft-count')).toContainText(`${DEFAULT_LAYOUT.items.length}개 배치`);
  await page.click('#editor-cancel'); await page.click('#reset-layout'); await page.click('#replace-confirm');
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await page.click('#edit-mode'); await expect(page.locator('#draft-count')).toContainText(`${PARK_INITIAL_LAYOUT.items.length}개 배치`);
  const back = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(back.friends.affinity).toEqual({ ...saved.affinity, snow: 0 });  // a friend added after this save starts at 0
  expect(back.regions.garden.items).toEqual(PARK_INITIAL_LAYOUT.items);
});
