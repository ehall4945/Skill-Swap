import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Essential for Docker
    port: 5173,
    watch: {
      usePolling: true, // Fixes file saving issues on Windows
    },
  },
  resolve: {
    alias: {
      // This maps the teammate's path to the actual internal path
      '/frontend/src': '/app/src',
    },
  },
})
