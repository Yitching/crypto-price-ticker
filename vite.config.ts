import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// BASE_PATH lets GitHub Pages serve from /<repo-name>/.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
