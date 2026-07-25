import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/AssetFlow/', // 👈 This fixes the 404 errors for GitHub Pages assets
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
