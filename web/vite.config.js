import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    host: 'localhost',
    https: false
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    outDir: 'dist'
  }
})
