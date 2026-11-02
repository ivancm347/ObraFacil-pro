import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages publica o projeto dentro de /ObraFacil-pro/
  base: '/ObraFacil-pro/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'pwa-manifest.webmanifest',
      // O manifesto é gerado pelo plugin. Os ícones SVG ficam em public/.
      includeAssets: ['obrafacil-logo.svg'],
      manifest: {
        id: '/ObraFacil-pro/',
        name: 'ObraFácil PRO - Orçamentos de Obra',
        short_name: 'ObraFácil',
        description: 'Gestão de orçamentos de obra, drywall e gesso',
        lang: 'pt-BR',
        theme_color: '#F05A28',
        background_color: '#101827',
        display: 'standalone',
        scope: '/ObraFacil-pro/',
        start_url: '/ObraFacil-pro/',
        orientation: 'portrait-primary',
        icons: [
          { src: 'obrafacil-logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'obrafacil-logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-css-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-files-cache', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      }
    })
  ],
  server: { host: true, port: 3000 }
})
