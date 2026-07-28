import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
// @ts-ignore — vite-plugin-eslint doesn't expose types via package.json exports
import eslint from 'vite-plugin-eslint'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: '/lessing-hsiao/',
  plugins: [
    react(),
    tailwindcss(),
    // Lint only during `vite build`; skip in dev so edits recompile fast.
    // (Use `yarn lint` / the editor for live linting.)
    ...(command === 'build' ? [eslint()] : []),
  ],
}))
