import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api/v1 requests to backend on port 3000
      '/api/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Disable source maps in production (Requirement 12.1)
    sourcemap: false,
    // Enable minification with terser for console removal (Requirements 12.2, 12.3)
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log statements in production
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        // Remove comments in production
        comments: false,
      },
    },
  },
})
