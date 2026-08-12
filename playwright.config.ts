import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '3000';
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['./reporters/table-reporter.ts']],

  webServer: {
    command: 'node app/server.js',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: { PORT },
  },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
    },
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
