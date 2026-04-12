import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
// @ts-ignore — vite-plugin-eslint doesn't expose types via package.json exports
import eslint from 'vite-plugin-eslint'

// https://vite.dev/config/
export default defineConfig({
  base: '/lessing-hsiao/',
  plugins: [
    react(),
    tailwindcss(),
    eslint(),
  ],
})
