import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    cors: {
      origin: "https://celluloidverse-5c0i.onrender.com",
      credentials: true,
    },
  },
})
