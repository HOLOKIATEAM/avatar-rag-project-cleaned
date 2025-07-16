import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // ✅ <== AJOUT OBLIGATOIRE pour Docker + Nginx
  plugins: [react()],
})
