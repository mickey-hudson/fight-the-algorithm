import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The site is served from the apex of ftaplaylist.com (see public/CNAME), so assets
// live at the root rather than under a GitHub Pages project path.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
