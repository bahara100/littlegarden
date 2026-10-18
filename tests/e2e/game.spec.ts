import { test, expect, type Page } from '@playwright/test';
import { DEFAULT_LAYOUT } from '../../apps/client/src/layout.js';
import { SAVE_KEY, encodeSave, gardenSave } from '../../apps/client/src/persistence.js';

/** Opens the game and waits until the playground is drawn; collects page errors and failed requests on the way. */
async function open(page: Page, path = '/') {
  const problems: string[] = [];
  page.on('pageerror', e => problems.push(`page error: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith('http://127.0.0.1')) problems.push(`${r.status()} ${r.url()}`); });
  await page.goto(path);
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#game canvas')).toBeVisible();
  return problems;
}
/** Puts a save in this browser before the page loads (only on the first load, so reloads see what the game wrote). */
async function seed(page: Page, value: string) {
  await page.addInitScript(([key, text]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(key, text); sessionStorage.setItem('seeded', '1'); } }, [SAVE_KEY, value]);
}
const placedCount = async (page: Page) => Number((await page.locator('#draft-count').textContent())!.match(/(\d+)개 배치/)![1]);

test('the playground opens with no errors or missing files', async ({ page }) => {
  const problems = await open(page);
  await expect(page).toHaveTitle(/작은 쉼표/);
  for (const id of ['#region-button', '#season-button', '#music-button', '#track-title', '#day-clock']) await expect(page.locator(id)).toBeVisible();
  await expect(page.locator('#region-label')).toHaveText('LITTLE GARDEN');
  await expect(page.locator('.scene-tag')).toBeVisible();
  await page.waitForTimeout(1500);  // let the friends start moving
  expect(problems).toEqual([]);
});

test('the Canvas renderer opens too', async ({ page }) => {
  const problems = await open(page, '/?renderer=canvas');
  await page.waitForTimeout(1000);
  expect(problems).toEqual([]);
});

test('regions and seasons are picked from the map label and remembered', async ({ page }) => {
  await open(page);
  await page.click('#region-button');
  await expect(page.locator('#region-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#region-menu')).toBeHidden();
  await page.click('#region-button'); await page.click('[data-region=onsen]');
  await expect(page.locator('#region-label')).toHaveText('HOT SPRING');
  await expect(page.locator('[data-region=onsen]')).toHaveAttribute('aria-checked', 'true');
  await page.click('#season-button'); await page.click('[data-season=winter]');
  await expect(page.locator('#season-label')).toHaveText('겨울');
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#region-label')).toHaveText('HOT SPRING');
  await expect(page.locator('#season-label')).toHaveText('겨울');
});

test('view switches are remembered and the FPS readout counts frames', async ({ page }) => {
  await open(page);
  await page.locator('label:has(#grid-toggle)').click();
  await page.locator('label:has(#fps-toggle)').click();
  await expect(page.locator('#fps')).toBeVisible();
  await expect(page.locator('#fps')).toHaveText(/^[1-9]\d* FPS$/);
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#grid-toggle')).toBeChecked();
  await expect(page.locator('#fps-toggle')).toBeChecked();
});

test('a pat raises affinity once a day', async ({ page }) => {
  await open(page);
  await page.click('#friend-lilac');
  await page.click('#pet');
  await expect(page.locator('#scene-hint')).toContainText('친밀도 1');
  await expect(page.locator('#selection-details')).toContainText('♥ 1 · 처음 만난 사이');
  await expect(page.locator('#selection-details')).toContainText('했어요 ♡');
  // Pats closer than the cooldown (game time, which runs slower on a slow machine) are ignored: try until one counts.
  await expect(async () => {
    await page.click('#pet');
    await expect(page.locator('#scene-hint')).toContainText('이미 올랐어요', { timeout: 700 });
  }).toPass({ timeout: 20_000 });
  await expect(page.locator('#selection-details')).toContainText('♥ 1 ·');
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await page.click('#friend-lilac');
  await expect(page.locator('#selection-details')).toContainText('♥ 1 ·');
});

test('decorating can be undone and redone', async ({ page }) => {
  await open(page);
  await page.click('#edit-mode');
  const before = await placedCount(page);
  await expect(page.locator('#edit-undo')).toBeDisabled();
  await page.click('[data-catalog=tree]');
  await page.fill('#item-x', '4.5'); await page.fill('#item-z', '4.5');
  await page.click('#item-place');
  expect(await placedCount(page)).toBe(before + 1);
  await page.keyboard.press('Control+z');
  await expect(page.locator('#draft-count')).toContainText(`${before}개 배치`);
  await page.click('#edit-redo');
  await expect(page.locator('#draft-count')).toContainText(`${before + 1}개 배치`);
  await page.click('#editor-cancel');
});

test('each region keeps its own layout', async ({ page }) => {
  await open(page);
  await page.click('#edit-mode'); const gardenCount = await placedCount(page); await page.click('#edit-mode');
  await page.click('#region-button'); await page.click('[data-region=onsen]');
  await page.click('#edit-mode');
  await page.click('[data-catalog=tree]');
  await page.fill('#item-x', '4.5'); await page.fill('#item-z', '4.5');
  await page.click('#item-place'); await page.click('#editor-apply');
  await page.click('#region-button'); await page.click('[data-region=garden]');
  await page.click('#edit-mode'); expect(await placedCount(page)).toBe(gardenCount); await page.click('#edit-mode');
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await page.click('#region-button'); await page.click('[data-region=onsen]');
  await page.click('#edit-mode'); expect(await placedCount(page)).toBe(gardenCount + 1);
});

test('the time of day carries on from the save', async ({ page }) => {
  await seed(page, encodeSave(gardenSave(DEFAULT_LAYOUT, { clock: .8 })));
  await open(page);
  await expect(page.locator('#day-clock')).toHaveText(/^오후 7:1\d$/);
  await expect(page.locator('#day-label')).toHaveText('노을 지는 저녁');
});

test('a save that cannot be read is not overwritten by automatic saves', async ({ page }) => {
  const broken = '{"app":"little-garden","version":3,"regions":{"garden":{"items":"broken"}}}';
  await seed(page, broken);
  await open(page);
  await expect(page.locator('#save-status')).toContainText('읽지 못했어요');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
  });
  await page.click('#region-button'); await page.click('[data-region=onsen]');
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(broken);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  test('the page fits the screen and the map controls stay inside it', async ({ page }) => {
    const problems = await open(page);
    const width = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(width[0]).toBeLessThanOrEqual(width[1]);
    const viewport = (await page.locator('#viewport').boundingBox())!;
    for (const id of ['#region-button', '#season-button', '#music-button']) {
      const box = (await page.locator(id).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(viewport.x);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.x + viewport.width + .5);
    }
    await page.tap('#music-button');
    await expect(page.locator('#music-menu')).toBeVisible();
    await expect(page.locator('#music-volume')).toBeVisible();
    expect(problems).toEqual([]);
  });
});
