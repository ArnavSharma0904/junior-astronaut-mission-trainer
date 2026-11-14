import { defineConfig, devices } from '@playwright/test';

// Release checks always run against the BUILT preview, never the dev server.
// PW_CHANNEL lets a machine without Playwright's bundled Chromium use an installed Chrome
// (recorded in the evidence when used). CI uses the bundled browser.
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  // Full missions run six animated turns; 30 s was too tight on a two-core software-rendered runner.
  timeout: 60_000,
  workers: 3,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, channel } }],
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
