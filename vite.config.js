import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';  // Para resolver paths absolutos em alias
import { fileURLToPath } from 'node:url';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/',
  resolve: {  // Seção para alias de paths
    alias: {
      '@': path.resolve(projectDirectory, './src'),  // Mapeia @ para ./src
    },
  },
  build: {
    outDir: 'build',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,  // Mantido, mas pode aumentar se warnings de assets
    // Sourcemaps de produção elevam bastante o uso de memória no Netlify.
    sourcemap: mode !== 'production',
    manifest: true,
  },
  server: {
    fs: {
      allow: ['.'],  // Mantido: Permite servir de diretórios parent
    },
    proxy: {
      '/api': {
        target: mode === 'development' ? 'http://localhost:5000' : 'https://autisconnect.onrender.com',
        changeOrigin: true,
        secure: mode !== 'development',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    globals: true,
  },
}));
