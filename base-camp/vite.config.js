import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served at /base-camp/ on the personal site, but at / during local dev.
// BASE_PATH lets the root build script override this when assembling the site.
const base = process.env.BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
