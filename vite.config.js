import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';  // Para resolver paths absolutos em alias
import CircularDependencyPlugin from 'circular-dependency-plugin';  // Novo: Para detectar ciclos

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Novo: Plugin para detectar dependências circulares (falha o build se encontrar)
    new CircularDependencyPlugin({
      exclude: /node_modules/,  // Ignora node_modules
      include: /src/,           // Só checa em src/
      failOnError: true,        // Para o build com erro se ciclo detectado
      allowAsyncCycles: false,  // Não permite ciclos assíncronos
    }),
  ],
  resolve: {  // Seção para alias de paths
    alias: {
      '@': path.resolve(__dirname, './src'),  // Mapeia @ para ./src
    },
  },
  build: {
    outDir: 'build',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,  // Mantido, mas pode aumentar se warnings de assets
    sourcemap: true,  // Mantido: Para debug em produção (facilita logs no Render)
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