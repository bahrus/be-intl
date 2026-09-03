// playwright.config.ts
import { PlaywrightTestConfig, devices } from '@playwright/test';
const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:8000/',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    // Surface the server's "Serving HTTP on ... port 8000" line (and any errors)
    // in the CI log so we can confirm it actually bound to 8000.
    stdout: 'pipe',
    stderr: 'pipe',
  },
  // 'list' (not the terse CI default 'dot') so failures print in full in the CI log.
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8000/',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Commented out - requires Chrome 146+ features (JSON imports with type assertion)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
};
export default config;
