import { test, expect } from '@playwright/test';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';
import { DEFAULT_LAYOUT } from '../../apps/client/src/layout.js';

for (const renderer of ['phaser', 'canvas']) test(`${renderer} detailed lawn and joined paths keep editing and saved placements`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const problems: string[] = []; page.on('pageerror', e => problems.push(e.message));
  const save = encodeSave(gardenSave(DEFAULT_LAYOUT));
  await page.addInitScript(([key, value]) => { if (!sessionStorage.getItem('terrain-seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('terrain-seeded', '1'); } }, [SAVE_KEY, save]);
  await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
  await expect(page.locator('#loading')).toBeHidden();
  await page.locator('#viewport').screenshot({ path: `docs/design/terrain-details-2026-10-19/${renderer}-whole.png` });
  await page.locator('#game').hover(); await page.mouse.wheel(0, -450);
  await page.locator('#viewport').screenshot({ path: `docs/design/terrain-details-2026-10-19/${renderer}-detail.png` });
  await page.click('#edit-mode');
  await expect(page.locator('#editor-panel')).toBeVisible();
  await expect(page.locator('#draft-count')).toContainText(`${DEFAULT_LAYOUT.items.length}개 배치`);
  await page.locator('#viewport').screenshot({ path: `docs/design/terrain-details-2026-10-19/${renderer}-edit.png` });
  await page.click('#editor-cancel');
  await expect(page.locator('#mode-label')).toContainText('생활 모드');
  await expect(page.locator('#grid-toggle')).toHaveCount(0);
  await page.click('#season-button'); await page.click('[data-season=winter]');
  await expect(page.locator('#season-label')).toHaveText('겨울');
  await page.locator('#viewport').screenshot({ path: `docs/design/terrain-details-2026-10-19/${renderer}-winter.png` });
  expect(problems).toEqual([]);
});
