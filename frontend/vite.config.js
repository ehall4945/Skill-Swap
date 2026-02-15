import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Essential for Docker
    port: 3000,      // Matches your docker-compose ports
    watch: {
      usePolling: true, // Use polling for file changes
    },
  },
})
