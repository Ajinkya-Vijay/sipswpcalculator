import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { PAGES, NOT_FOUND } from './scripts/site-data.mjs'

// One Rollup input per generated page, so every URL ships a real HTML document
// with its own head and copy rather than a client-routed shell.
const input = Object.fromEntries(
  [...PAGES, NOT_FOUND].map((page) => [page.file.replace(/\.html$/, '').replace(/\//g, '-') || 'index', page.file]),
)

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: { input },
  },
})
