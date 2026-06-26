import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

// Copia config.js para dist/ automaticamente após cada build
function copyConfigJs(): Plugin {
  return {
    name: 'copy-config-js',
    closeBundle() {
      const src  = path.resolve(__dirname, 'config.js');
      const dest = path.resolve(__dirname, 'dist', 'config.js');
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        console.log('[copy-config-js] config.js → dist/config.js ✓');
      } else {
        console.warn('[copy-config-js] AVISO: config.js não encontrado!');
      }
    },
  };
}

export default defineConfig(() => ({
  // ✅ base com o nome EXATO do repositório no GitHub
  base: '/bolao-copa-2026/',
  plugins: [react(), tailwindcss(), copyConfigJs()],
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));

