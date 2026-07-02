import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/bolao-copa-2026/',
  plugins: [
    // seus plugins existentes (react, etc.)
  ],
})
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
