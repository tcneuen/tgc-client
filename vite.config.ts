import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const host = env.VITE_API_HOST ?? 'localhost'
  const port = env.VITE_API_PORT ?? '3000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/v1': {
          target: `https://${host}:${port}`,
          changeOrigin: true,
          // Allow the self-signed cert used by the dev server
          secure: false,
        },
      },
    },
  }
})
