import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3000)
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './src/test/e2e/suites',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  // chatPair fixture creates 2 Clerk users + 2 backend accounts + 2 onboards
  // + conversation + 2 sign-ins, then teardown deletes both. 60s exceeds when
  // Clerk is slow; 90s leaves margin.
  timeout: 90_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    // App's source/default locale is 'es'; server picks locale from Accept-Language.
    // Pin the browser to es-AR so SSR renders Spanish (tests assert Spanish copy).
    locale: 'es-AR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // video: 'retain-on-failure',  // requiere ffmpeg; descomentar si está instalado
  },
  globalSetup: './src/test/e2e/support/global-setup.ts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `VITE_E2E=1 NODE_OPTIONS='--import ./instrument.server.mjs' vite dev --host localhost --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
