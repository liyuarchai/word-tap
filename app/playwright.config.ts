import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'pnpm build && pnpm preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_ENABLE_OCR_DEMO: 'true'
    }
  },
  projects: [
    { name: 'smoke', grep: /@smoke/ },
    { name: 'visual', grep: /@visual/ },
    { name: 'mock', grep: /@mock/ },
    { name: 'api', grep: /@api/ },
    { name: 'ocr-live', grep: /@ocr-live/ },
    { name: 'ebook-live', grep: /@ebook-live/ }
  ]
})

