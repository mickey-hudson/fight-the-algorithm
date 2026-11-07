import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The site is served from the apex of ftaplaylist.com (see public/CNAME), so assets
// live at the root rather than under a GitHub Pages project path.
//
// Two pages: the main app at / and the December holiday edition at /holiday/.
// Each is its own HTML entry, so GitHub Pages serves /holiday/ as a real file —
// no SPA routing or 404 fallback needed.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        holiday: resolve(__dirname, 'holiday/index.html'),
      },
    },
  },
})
