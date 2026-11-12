import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5180,
    strictPort: true
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'dictionary/*.json', 'fonts/*.woff2'],
      manifest: {
        name: 'Word Tap',
        short_name: 'Word Tap',
        description: '点词即查、顺手收集、按计划复习的英语精读工具',
        theme_color: '#F7F5EF',
        background_color: '#F7F5EF',
        display: 'standalone',
        start_url: '/library',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        globIgnores: ['ocr/**'],
        runtimeCaching: [
          {
            urlPattern: /\/ocr\/.*\.(?:js|wasm|gz)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wordtap-ocr-assets-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ],
        globPatterns: ['**/*.{js,css,html,woff2,json,svg}']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary']
    }
  }
})

