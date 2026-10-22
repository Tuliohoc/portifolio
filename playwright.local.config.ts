import { defineConfig, devices } from '@playwright/test';

/* Temporary local config: another session is holding port 5173 with a different
   checkout, so this run verifies OUR files on an isolated port. */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  workers: undefined,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5199',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node scripts/serve.mjs 5199',
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: true,
  },
});
