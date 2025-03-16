import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 環境変数に基づいて設定を切り替え
const isDevelopment = process.env.NODE_ENV === 'development';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: isDevelopment 
          ? 'http://backend:5000'  // ローカル開発環境（Docker内）
          : 'https://attendance-system-production-18e1.up.railway.app', // 本番環境
        changeOrigin: true,
        secure: !isDevelopment,
        rewrite: (path) => path
      }
    }
  }
})
