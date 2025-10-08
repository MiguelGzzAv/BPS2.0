import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173, // Default Vite port
    proxy: {
      // Proxy API requests to the backend service in Docker
      '/api': {
        target: 'http://server:3000', // 'server' is the name of the backend service in docker-compose.yml
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true, // Enable polling for file changes to work in Docker
    },
  },
})