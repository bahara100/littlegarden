import { test, expect } from '@playwright/test';
import { proofPath } from './proof';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';
import type { PlacedItem } from '../../apps/client/src/layout.js';

const proof = 'docs/design/fountain-watch-2026-10-19';
const FOUNTAIN: PlacedItem = { id: 'court-fountain', kind: 'fountain', x: .5, z: -3.5, turn: 0 };

for (const renderer of ['phaser', 'canvas']) {
  test(`${renderer}: tapping the fountain sends the friend to watch it, with a fountain icon over the head`, async ({ page }) => {
    // The walk takes a while on GitHub's slower machines, where the game clock falls behind real time.
    test.slow();
    await page.setViewportSize({ width: 1440, height: 1600 });
    const problems: string[] = []; page.on('pageerror', e => problems.push(e.message));
    await page.addInitScript(([key, value]) => { localStorage.setItem(key, value); Math.random = () => .99; }, [SAVE_KEY, encodeSave(gardenSave({ items: [FOUNTAIN], stored: [] }))]);
    await page.goto(renderer === 'canvas' ? '/?renderer=canvas' : '/');
    await expect(page.locator('#loading')).toBeHidden();
    await page.click('#friend-character');
    await page.locator('#game').hover(); await page.mouse.wheel(0, -600);
    await page.locator('#game').scrollIntoViewIfNeeded();
    // Tap the fountain's own tiles (its stone basin): the friend goes to the next tile and watches.
    const box = (await page.locator('#game canvas').boundingBox())!;
    const unit = Math.min(box.width / 51, box.height / 36) * Number(await page.locator('#viewport').getAttribute('data-zoom')) / 100;
    const { x, z } = FOUNTAIN, px = box.x + box.width / 2 + (x - z) * unit, py = box.y + box.height * .56 + (x + z) / 2 * unit;
    await page.mouse.move(px, py);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await page.mouse.click(px, py, { delay: 100 });
    await expect(page.locator('#status-character')).toHaveText('분수 보러 가는 중');
    await expect(page.locator('#status-character')).toHaveText('분수 구경하는 중', { timeout: 90_000 });
    const bubble = page.locator('.character-bubble[data-friend=character]');
    await expect(bubble).toHaveAttribute('data-emote', 'fountain');
    await expect(bubble.locator('img.emote-icon')).toHaveAttribute('alt', '⛲');
    await page.locator('#viewport').screenshot({ path: proofPath(proof, `${renderer}.png`) });
    expect(problems).toEqual([]);
  });
}
