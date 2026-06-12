import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served at /nightstand/ on the personal site, but at / during local dev.
// The BASE_PATH env var lets the build script override this when assembling
// the production site.
const base = process.env.BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
