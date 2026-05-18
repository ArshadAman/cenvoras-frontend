import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['cenvorapwa.jpeg'],
      manifest: {
        name: 'Cenvora',
        short_name: 'Cenvora',
        description: 'Cenvora - Billing and Inventory Software',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          {
            src: '/cenvorapwa.jpeg',
            sizes: '192x192',
            type: 'image/jpeg',
            purpose: 'any maskable'
          },
          {
            src: '/cenvorapwa.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 50000000, // 50MB
      }
    })
  ],
  resolve: {
    // Ensure a single copy of react-query is used to avoid runtime mismatches
    dedupe: ['@tanstack/react-query']
  },
})
