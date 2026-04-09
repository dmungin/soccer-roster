import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  fullyParallel: false, // Tests depend on sequential auth state
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && DB_PATH=./data/e2e-test.db node server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30000,
    env: {
      PORT: '3000',
      DB_PATH: './data/e2e-test.db',
    },
  },
});
