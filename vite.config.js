// C:\autisconnect\frontend\vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: ['.'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api
      },
      '/api/models': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    historyApiFallback: true,
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
      'face-api.js': 'face-api.js/dist/face-api.js',
    },
  },
});