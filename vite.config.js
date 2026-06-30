import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cma-api': {
        target: 'https://openaccess-api.clevelandart.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cma-api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
