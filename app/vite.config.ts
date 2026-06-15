/// <reference types="vitest/config" />
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// https://vite.dev/config/
export default defineConfig(() => {
  dotenv.config({
    path: ['./.env', '../.env'],
  })

  const defineEnv: Record<string, string> = {}
  const envVarsToExpose = [
    'GOOGLE_AUTH_CLIENT_ID',
    'STRIPE_PUBLISHABLE_KEY'
  ]

  envVarsToExpose.forEach(key => {
    if (process.env[key]) {
      defineEnv[`import.meta.env.${key}`] = JSON.stringify(process.env[key])
    }
  })

  return {
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
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './tests/setup.ts',
    },
    ...(Object.keys(defineEnv).length > 0 && {
      define: defineEnv,
    }),
  }
})
