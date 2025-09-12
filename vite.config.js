import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';  // Novo: Para resolver paths absolutos em alias

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {  // Novo: Seção para alias de paths
    alias: {
      '@': path.resolve(__dirname, './src'),  // Mapeia @ para ./src (resolve ../services/api como '@/services/api')
    },
  },
  build: {
    outDir: 'build',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,  // Mantido, mas pode aumentar se warnings de assets
    sourcemap: true,  // Novo: Para debug em produção (facilita logs no Render)
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
}));