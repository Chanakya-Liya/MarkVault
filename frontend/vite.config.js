import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxy = {
  '/api': {
    target: 'http://backend:3001',
    changeOrigin: true,
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    proxy,
  },
})
