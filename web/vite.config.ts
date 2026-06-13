/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker the API lives at the `backend` service; locally it's on :8080.
const apiProxyTarget = process.env.VITE_API_PROXY ?? 'http://localhost:8080'

// When the container is published on a different host port than the internal
// one (see docker-compose.yml), HMR needs the browser-facing port.
const hmrClientPort = process.env.VITE_HMR_CLIENT_PORT

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
    hmr: hmrClientPort ? { clientPort: Number(hmrClientPort) } : undefined,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
