import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_PORT = parseInt(process.env.VITE_API_PORT ?? '5000', 10);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true
      }
    }
  }
})
