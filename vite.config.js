import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE || 'http://localhost:8081'
  const target = apiBase.replace('://localhost', '://127.0.0.1')
  console.log(`[vite proxy] target: ${target}`)
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
        '/api': { target, changeOrigin: true, secure: false },
        '/api/storefront': { target, changeOrigin: true, secure: false },
        '/api/platform': { target, changeOrigin: true, secure: false },
        '/api/vendors': { target, changeOrigin: true, secure: false },
        '/store': { target, changeOrigin: true, secure: false },
        '/auth': { target, changeOrigin: true, secure: false }
      }
    }
  }
})
