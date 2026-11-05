import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const reverbProxyTarget = process.env.REVERB_PROXY_TARGET

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),   
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    ...(reverbProxyTarget
      ? {
          proxy: {
            '/app': {
              target: reverbProxyTarget,
              changeOrigin: true,
              ws: true,
            },
          },
        }
      : {}),
  },
})
