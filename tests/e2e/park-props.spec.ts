import { test, expect } from '@playwright/test';
import { proofPath } from './proof';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';
import type { PlacedItem } from '../../apps/client/src/layout.js';

const items: PlacedItem[] = [
  { id: 'picnic-new', kind: 'picnicTable', x: -6, z: -4.5, turn: 0 },
  { id: 'seesaw-new', kind: 'seesaw', x: -4, z: .5, turn: 0 },
  { id: 'drink-new', kind: 'drinkingFountain', x: .5, z: -4.5, turn: 0 },
  { id: 'fountain-new', kind: 'fountain', x: 5.5, z: -4.5, turn: 0 },
  { id: 'stream-new', kind: 'stream', x: 5, z: 4, turn: 1 },
  { id: 'stream-next', kind: 'stream', x: 5, z: 8, turn: 1 },
  { id: 'bridge-new', kind: 'bridge', x: 5, z: 4, turn: 0 },
];

for (const renderer of ['phaser', 'canvas']) {
  test(`${renderer} renders the six park props and can place, rotate, store and undo a new one`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const problems: string[] = [];
    page.on('pageerror', e => problems.push(e.message));
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith('http://127.0.0.1')) problems.push(`${r.status()} ${r.url()}`); });
    const save = encodeSave(gardenSave({ items, stored: [] }));
    await page.addInitScript(([key, value]) => { if (!sessionStorage.getItem('park-seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('park-seeded', '1'); } }, [SAVE_KEY, save]);
    await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
    await expect(page.locator('#loading')).toBeHidden();
    await expect(page.locator('#game canvas')).toBeVisible();
    await page.locator('.viewport').screenshot({ path: proofPath('docs/art/pixel/park-props-v1', `game-${renderer}.png`) });
    await page.click('#edit-mode');
    for (const kind of ['picnicTable', 'seesaw', 'drinkingFountain', 'fountain', 'bridge', 'stream']) await expect(page.locator(`[data-catalog=${kind}]`)).toBeVisible();
    await page.click('[data-catalog=fountain]');
    await page.fill('#item-x', '-7.5'); await page.fill('#item-z', '7.5');
    await page.click('#item-rotate');
    await expect(page.locator('#item-place')).toBeEnabled();
    await page.click('#item-place');
    await expect(page.locator('#draft-count')).toContainText('8개 배치');
    await page.click('#item-store');
    await expect(page.locator('#draft-count')).toContainText('7개 배치');
    await page.click('#edit-undo');
    await expect(page.locator('#draft-count')).toContainText('8개 배치');
    await page.click('#editor-apply');
    await page.reload(); await expect(page.locator('#loading')).toBeHidden();
    await page.click('#edit-mode');
    await expect(page.locator('#draft-count')).toContainText('8개 배치');
    expect(problems).toEqual([]);
  });
}
