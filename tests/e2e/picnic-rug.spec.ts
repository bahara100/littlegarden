import { test, expect } from '@playwright/test';
import { proofPath } from './proof';
import { PICNIC } from '../../apps/client/src/layout';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence';

for (const renderer of ['phaser', 'canvas']) test(`${renderer} picnic rug: click to sit, share two places and stand up safely`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const problems: string[] = []; page.on('pageerror', e => problems.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('127.0.0.1')) problems.push(`${r.status()} ${r.url()}`); });
  await page.addInitScript(([key, value]) => { localStorage.setItem(key, value); Math.random = () => .99; }, [SAVE_KEY, encodeSave(gardenSave({ items: [], stored: [] }))]);
  await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
  await expect(page.locator('#loading')).toBeHidden();
  await page.click('#friend-peach');
  await expect(page.locator('#request-picnicRug')).toContainText('2자리');
  const box = (await page.locator('#game canvas').boundingBox())!;
  const unit = Math.min(box.width / 51, box.height / 36);
  await page.mouse.click(box.x + box.width / 2 + (PICNIC.x - PICNIC.z) * unit,
    box.y + box.height * .56 + (PICNIC.x + PICNIC.z) / 2 * unit);
  await expect(page.locator('#selection-title')).toHaveText('피크닉 돗자리');
  await expect(page.locator('#status-peach')).toHaveText('돗자리에서 쉬는 중', { timeout: 25_000 });
  await page.click('#friend-lilac'); await expect(page.locator('#request-picnicRug')).toContainText('1자리');
  await page.click('#request-picnicRug');
  await expect(page.locator('#status-lilac')).toHaveText('돗자리에서 쉬는 중', { timeout: 25_000 });
  await page.click('#friend-character');
  await expect(page.locator('#request-picnicRug')).toBeDisabled();
  await expect(page.locator('#request-picnicRug')).toContainText('0자리');
  await page.locator('#game').hover(); await page.mouse.wheel(0, -400);
  await page.locator('#viewport').screenshot({ path: proofPath('docs/design/picnic-rug-seating-2026-10-19', `${renderer}-seated.png`) });
  await page.click('#friend-peach'); await expect(page.locator('#leave-seat')).toHaveText('일어나기');
  await page.click('#leave-seat');
  await expect(page.locator('#status-peach')).toHaveText('잠깐 쉬는 중');
  await expect(page.locator('#request-picnicRug')).toBeEnabled();
  await expect(page.locator('#request-picnicRug')).toContainText('1자리');
  expect(problems).toEqual([]);
});
