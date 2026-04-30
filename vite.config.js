import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Ensure a single copy of react-query is used to avoid runtime mismatches
    dedupe: ['@tanstack/react-query']
  },
})
