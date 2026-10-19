import { test, expect } from '@playwright/test';
import { proofPath } from './proof';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';

for (const renderer of ['phaser', 'canvas']) for (const turn of [0, 1]) test(`${renderer} picnic table turn ${turn}: friends sit on both benches and get off`, async ({ page }) => {
  const proof = 'docs/design/picnic-grid-2026-10-19';
  await page.setViewportSize({ width: 1440, height: 1100 });
  const problems: string[] = []; page.on('pageerror', e => problems.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('127.0.0.1')) problems.push(`${r.status()} ${r.url()}`); });
  const save = encodeSave(gardenSave({ items: [{ id: 'picnic-test', kind: 'picnicTable', x: 0, z: -1.5, turn }], stored: [] }));
  await page.addInitScript(([key, value]) => { localStorage.setItem(key, value); Math.random = () => .99; }, [SAVE_KEY, save]);
  await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
  await expect(page.locator('#loading')).toBeHidden();
  for (const id of ['peach', 'lilac', 'character']) { await page.click(`#friend-${id}`); await page.click('#request-picnicTable'); }
  for (const id of ['peach', 'lilac', 'character']) await expect(page.locator(`#status-${id}`)).toHaveText('테이블에서 쉬는 중', { timeout: 35_000 });
  await expect(page.locator('#request-picnicTable')).toContainText('1자리');
  await page.locator('#game').hover(); await page.mouse.wheel(0, -800);
  await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-${turn}-seated.png`) });
  await page.click('#leave-seat');
  await expect(page.locator('#request-picnicTable')).toBeEnabled();
  await expect(page.locator('#request-picnicTable')).toContainText('2자리');
  await page.click('#edit-mode');
  const box = (await page.locator('#game canvas').boundingBox())!;
  const unit = Math.min(box.width / 51, box.height / 36) * Number(await page.locator('#viewport').getAttribute('data-zoom')) / 100;
  await page.mouse.click(box.x + box.width / 2 + 1.5 * unit, box.y + box.height * .56 - (turn ? 1.53 : 2.03) * unit);
  await expect(page.locator('#editor-selection')).toHaveText('피크닉 테이블');
  await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}-${turn}-grid.png`) });
  expect(problems).toEqual([]);
});
