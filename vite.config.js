import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.png',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'cenvora-logo-light.png',
        'cenvora-logo-dark.png'
      ],
      manifest: {
        name: 'Cenvora',
        short_name: 'Cenvora',
        description: 'Cenvora - Billing and Inventory Software',
        theme_color: '#222831',
        background_color: '#F5F5F0',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/app-icon-light.png',
            sizes: '1254x1254',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
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
