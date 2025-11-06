import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE || 'http://localhost:8080'
  const basePath = env.VITE_BASE_PATH || '/'
  return {
    plugins: [react()],
    base: basePath,
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', 'react-toastify'],
            'net-vendor': ['axios']
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
          secure: false
        },
        '/api/storefront': {
          target: apiBase,
          changeOrigin: true,
          secure: false
        },
        '/api/platform': {
          target: apiBase,
          changeOrigin: true,
          secure: false
        },
        '/api/vendors': {
          target: apiBase,
          changeOrigin: true,
          secure: false
        },
        '/auth': {
          target: apiBase,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
