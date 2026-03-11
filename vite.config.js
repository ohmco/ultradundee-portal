import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'ultradundee' below with your actual GitHub repo name if different
export default defineConfig({
  plugins: [react()],
  base: '/ultradundee-portal/',
})
