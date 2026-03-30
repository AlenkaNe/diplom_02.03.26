// E2E: браузер + реальный frontend (Express). Рекомендуется стек из корня:
//   docker compose up
//   открыть http://localhost:3001
//
// Запуск из папки frontend:
//   npm run test:e2e
//
// Переменные:
//   PLAYWRIGHT_BASE_URL — URL фронта (по умолчанию http://127.0.0.1:3001)

const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001';

module.exports = defineConfig({
  globalSetup: require.resolve('./global-setup.js'),
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/playwright-report' }]],
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ru-RU',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
