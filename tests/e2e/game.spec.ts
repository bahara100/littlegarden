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
/** Zoom is by wheel and pinch only (no buttons); the current percent is on #viewport[data-zoom]. */
const zoomPercent = async (page: Page) => Number(await page.locator('#viewport').getAttribute('data-zoom'));
async function wheelZoomIn(page: Page) {
  const box = (await page.locator('#game').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -300);
  await expect.poll(() => zoomPercent(page)).toBeGreaterThan(100);
}
const placedCount = async (page: Page) => Number((await page.locator('#draft-count').textContent())!.match(/(\d+)개 배치/)![1]);

test('the playground opens with no errors or missing files', async ({ page }) => {
  const problems = await open(page);
  await expect(page).toHaveTitle(/작은 쉼표/);
  for (const id of ['#region-button', '#season-button', '#music-button', '#track-title', '#day-clock']) await expect(page.locator(id)).toBeVisible();
  await expect(page.locator('#region-label')).toHaveText('LITTLE GARDEN');
  // No zoom buttons and no message box on the map; messages go to an invisible status area for screen readers.
  await expect(page.locator('.view-controls')).toHaveCount(0);
  await expect(page.locator('.scene-hint')).toHaveCount(0);
  expect((await page.locator('#announcer').boundingBox())!.width).toBeLessThanOrEqual(1);
  await expect(page.locator('.scene-tag')).toBeVisible();
  await page.waitForTimeout(1500);  // let the friends start moving
  expect(problems).toEqual([]);
});

test('the top bars on the map stay on one row when the window is narrow', async ({ page }) => {
  for (const width of [1280, 900, 700]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    const scene = (await page.locator('.scene-bar').boundingBox())!, music = (await page.locator('.music-bar').boundingBox())!;
    const map = (await page.locator('#viewport').boundingBox())!;
    expect(music.y, `${width}px`).toBe(scene.y);
    expect(music.x, `${width}px`).toBeGreaterThanOrEqual(scene.x + scene.width);
    expect(music.x + music.width, `${width}px`).toBeLessThanOrEqual(map.x + map.width);
  }
});

test('the Canvas renderer opens too', async ({ page }) => {
  const problems = await open(page, '/?renderer=canvas');
  await page.waitForTimeout(1000);
  expect(problems).toEqual([]);
});

for (const renderer of ['phaser', 'canvas']) {
  test(`${renderer} shows a head bubble for emotions and hides it while decorating`, async ({ page }) => {
    const problems = await open(page, renderer === 'canvas' ? '/?renderer=canvas' : '/');
    await page.click('#resume');
    await page.click('#wave');
    const bubble = page.locator('.character-bubble[data-friend=character]');
    await expect(bubble).toBeVisible();
    await expect(bubble).toHaveAttribute('data-emote', 'wave');  // a wave shows the pixel hand
    await expect(bubble.locator('img.emote-icon')).toHaveAttribute('alt', '👋');
    expect(await bubble.locator('img.emote-icon').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBe(16);
    await expect(bubble).toHaveAttribute('data-kind', 'emote');
    // At the starting zoom the icon is its 16 px art at 1x; zooming in grows it in whole steps with the friends.
    const icon = bubble.locator('img.emote-icon'), iconWidth = async () => (await icon.boundingBox())!.width;
    expect(await iconWidth()).toBe(16);
    await page.mouse.move(...await (async () => { const b = (await page.locator('#game').boundingBox())!; return [b.x + b.width / 2, b.y + b.height / 2] as [number, number]; })());
    await page.mouse.wheel(0, -600);
    await expect(bubble).toBeVisible();
    await expect.poll(iconWidth).toBe(32);
    await page.click('#edit-mode');
    await expect(bubble).toBeHidden();
    expect(problems).toEqual([]);
  });
}

test('regions and seasons are picked from the map label and remembered', async ({ page }) => {
  await open(page);
  await page.click('#region-button');
  await expect(page.locator('#region-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#region-menu')).toBeHidden();
  await page.click('#region-button'); await page.click('[data-region=onsen]');
  await expect(page.locator('#region-label')).toHaveText('HOT SPRING');
  await expect(page.locator('[data-region=onsen]')).toHaveAttribute('aria-checked', 'true');
  await page.click('#season-button');
  for (const id of ['spring', 'summer', 'autumn', 'winter']) {  // each season shows its pixel icon
    const img = page.locator(`#season-list [data-season=${id}] img.pixel-icon`);
    await expect(img).toHaveAttribute('src', new RegExp(`sprites/ui/seasons/${id}\.png$`));
    expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBe(16);
  }
  await page.click('[data-season=winter]');
  await expect(page.locator('#season-label')).toHaveText('겨울');
  await expect(page.locator('#season-icon img')).toHaveAttribute('src', /winter\.png$/);
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#region-label')).toHaveText('HOT SPRING');
  await expect(page.locator('#season-label')).toHaveText('겨울');
});

test('view switches are remembered and the FPS readout counts frames', async ({ page }) => {
  await open(page);
  await page.click('.display-panel summary');  // the settings fold out
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
  await expect(page.locator('#announcer')).toContainText('친밀도 1');
  await expect(page.locator('#selection-details')).toContainText('♥ 1 · 처음 만난 사이');
  await expect(page.locator('#selection-details')).toContainText('했어요 ♡');
  // Pats closer than the cooldown (game time, which runs slower on a slow machine) are ignored: try until one counts.
  await expect(async () => {
    await page.click('#pet');
    await expect(page.locator('#announcer')).toContainText('이미 올랐어요', { timeout: 700 });
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

test('decorating and a friend close-up keep the zoom the player chose', async ({ page }) => {
  await open(page);
  await wheelZoomIn(page);
  const chosen = await zoomPercent(page);
  await page.click('#edit-mode');
  expect(await zoomPercent(page)).toBe(chosen);
  await page.click('#edit-mode');
  await page.click('#focus-friend');
  expect(await zoomPercent(page)).toBe(300);
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await expect.poll(() => zoomPercent(page)).toBe(chosen);
  await page.click('#focus-friend'); await page.click('#edit-mode');
  expect(await zoomPercent(page)).toBe(chosen);
});

test('a volume change before the playground is ready is remembered', async ({ page }) => {
  // Hold the Phaser download back so the playground is still loading while the volume changes.
  await page.route(/phaserGarden-.*\.js$/, async route => { await new Promise(r => setTimeout(r, 4000)); await route.continue(); });
  await page.goto('/');
  await expect(page.locator('#loading')).toBeVisible();
  // The loading screen covers the map, so this is the keyboard path: events go straight to the controls.
  await page.locator('#music-button').dispatchEvent('click');
  await page.locator('#music-volume').evaluate((input: HTMLInputElement) => { input.value = '25'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#music-mute').dispatchEvent('click');
  await expect(page.locator('#loading')).toBeVisible();
  await expect(page.locator('#loading')).toBeHidden({ timeout: 20_000 });
  await page.unroute(/phaserGarden-.*\.js$/);
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#music-volume-value')).toHaveText('25');
  await expect(page.locator('#music-mute')).toHaveAttribute('aria-pressed', 'true');
});

test('a pond can be placed from the decoration list', async ({ page }) => {
  const problems = await open(page);
  await page.click('#edit-mode');
  const before = await placedCount(page);
  await page.click('[data-catalog=pond]');
  await page.fill('#item-x', '4'); await page.fill('#item-z', '4.5');
  await page.click('#item-place');
  expect(await placedCount(page)).toBe(before + 1);
  await page.click('#editor-apply');
  await expect(page.locator('#edit-mode')).toContainText('꾸미기');
  expect(problems).toEqual([]);
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
    const top = async (id: string) => (await page.locator(id).boundingBox())!.y;
    expect(await top('.music-bar')).toBe(await top('.scene-bar'));  // one row, nothing drops below
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
  test('two fingers zoom in and out without sending anyone walking', async ({ page, context }) => {
    await open(page);
    const box = (await page.locator('#game').boundingBox())!, cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const cdp = await context.newCDPSession(page);
    const fingers = (type: string, gap: number) => cdp.send('Input.dispatchTouchEvent', { type: type as 'touchStart', touchPoints: type === 'touchEnd' ? [] : [{ x: cx - gap / 2, y: cy, id: 1 }, { x: cx + gap / 2, y: cy, id: 2 }] });
    const pinch = async (from: number, to: number) => {
      await fingers('touchStart', from);
      for (let i = 1; i <= 16; i++) { await fingers('touchMove', from + (to - from) * i / 16); await page.waitForTimeout(16); }
      await fingers('touchEnd', 0);
    };
    const percent = () => zoomPercent(page);
    expect(await percent()).toBe(100);
    await pinch(40, 200);
    await expect.poll(percent).toBeGreaterThan(250);
    const wide = await percent();
    await pinch(200, 80);
    await expect.poll(percent).toBeLessThan(wide);
    await expect(page.locator('#announcer')).not.toContainText('이동을 부탁했어요');
  });
});
