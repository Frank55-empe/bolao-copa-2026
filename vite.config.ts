import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

// ✅ BUG 3 CORRIGIDO: plugin que copia o config.js para dist/ a cada build.
// Sem isso o config.js não vai junto para o GitHub Pages e o CONFIG
// fica undefined em produção.
function copyConfigJs(): Plugin {
  return {
    name: 'copy-config-js',
    closeBundle() {
      const src = path.resolve(__dirname, 'config.js');
      const dest = path.resolve(__dirname, 'dist', 'config.js');
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        console.log('[copy-config-js] config.js → dist/config.js ✓');
      } else {
        console.warn('[copy-config-js] AVISO: config.js não encontrado na raiz do projeto!');
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/bolao-brasil-2026/',
    plugins: [react(), tailwindcss(), copyConfigJs()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
