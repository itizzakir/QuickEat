import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    test: {
      environment: 'jsdom',
      // jsdom only exposes localStorage on a real (non-opaque) origin; without an explicit
      // url it defaults to about:blank and window.localStorage comes back as a bare object.
      environmentOptions: {
        jsdom: { url: 'http://localhost:5173' },
      },
      globals: true,
      setupFiles: './src/test/setup.js',
      css: false,
    },
  }
})
