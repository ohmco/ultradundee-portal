import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Replace 'ultradundee' below with your actual GitHub repo name if different
export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: '/ultradundee-portal/',
})
