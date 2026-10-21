import { test, expect } from '@playwright/test';

// A first visit starts the first song by itself (browsers may hold the sound until the first tap or key);
// pressing stop keeps the music off on later visits until a song is picked again.
test('the first song starts on a first visit, and stop keeps it off next time', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
  await page.keyboard.press('Shift');   // the first key or tap lets the browser play sound
  await expect(page.locator('#track-title')).toHaveText('♪ 햇살이 쉬어가는 공원');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('little-garden.settings.v1')!).track)).toBe('sunlit-park');
  await page.locator('#music-button').click();
  await page.locator('#music-stop').click();
  await expect(page.locator('#track-title')).toHaveText('♪ 눌러서 노래를 골라 보세요');
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await page.keyboard.press('Shift');
  await page.waitForTimeout(500);
  await expect(page.locator('#track-title')).toHaveText('♪ 눌러서 노래를 골라 보세요');
});
