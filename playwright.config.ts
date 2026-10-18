import { defineConfig, devices } from '@playwright/test';

/**
 * Screen tests in a real (headless) browser, against the built game as it is deployed: `npm run test:e2e`.
 * The build is served with `vite preview`, so files the deploy filter leaves out would show up as failed requests.
 */
const PORT = 4179;
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // Each test runs the whole game; a few at a time keeps timing honest on small machines.
  workers: process.env.CI ? 2 : 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // On GitHub each failure also shows as a note on the run page, readable without opening the logs.
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}/`, trace: 'retain-on-failure', screenshot: 'only-on-failure', locale: 'ko-KR' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx vite preview apps/client --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
