/// <reference types="vitest/config" />
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 500,
    },
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        target: 'https://localhost:5000',
        changeOrigin: true,
      },
      '/socket': {
        target: 'ws://localhost:5000',
        ws: true,
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  }
})
