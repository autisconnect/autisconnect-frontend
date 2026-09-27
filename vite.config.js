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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@tensorflow') || id.includes('face-api')) return 'vendor-ai';
          if (id.includes('phaser')) return 'vendor-games';
          if (id.includes('chart.js') || id.includes('recharts') || id.includes('react-chartjs-2')) return 'vendor-charts';
          if (id.includes('leaflet')) return 'vendor-maps';
          if (id.includes('react-bootstrap') || id.includes('bootstrap')) return 'vendor-ui';
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          return undefined;
        },
      },
    },
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
