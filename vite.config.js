import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    outDir: 'build', // Define o diretório de saída como 'build' para o Render
    assetsDir: 'assets', // Mantém os assets em 'assets'
    chunkSizeWarningLimit: 1000, // Aumenta o limite para evitar avisos de chunks grandes
  },
  server: {
    fs: {
      allow: ['.'], // Permite acesso ao sistema de arquivos no servidor de desenvolvimento
    },
    proxy: {
      '/api': {
        target: mode === 'development' ? 'http://localhost:5000' : 'https://autisconnect.onrender.com', // Proxy dinâmico baseado no modo
        changeOrigin: true,
        secure: mode === 'development' ? false : true, // Ativa verificação SSL em produção
      },
    },
    historyApiFallback: true, // Suporte para SPA com roteamento no lado do cliente
  },
  optimizeDeps: {
    include: [
      'face-api.js',
      '@tensorflow/tfjs-core',
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-backend-webgl',
      '@tensorflow-models/pose-detection',
      '@tensorflow-models/coco-ssd',
    ],
  },
  resolve: {
    alias: {
      'face-api.js': 'face-api.js/dist/face-api.js', // Alias para face-api.js
    },
  },
}));