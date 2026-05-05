import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { localApiProxy } from './apiProxyConfig'

export default defineConfig({
  plugins: [react()],
  server: { proxy: localApiProxy },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
