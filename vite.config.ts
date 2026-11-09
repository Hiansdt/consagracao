import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'art/*.jpg'],
      manifest: {
        name: 'Consagração Total',
        short_name: 'Consagração',
        description: 'Preparação de 33 dias para a Consagração Total a Jesus por Maria, segundo São Luís Maria Grignion de Montfort.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#161924',
        theme_color: '#161924',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything is precached so the app works offline after the first visit.
        globPatterns: ['**/*.{js,css,html,png,jpg,woff2}'],
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
  },
})
