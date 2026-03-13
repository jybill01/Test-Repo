import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      // 빌드 최적화 설정
      rollupOptions: {
        output: {
          // 청크 분할 전략
          manualChunks: {
            // React 관련 라이브러리를 별도 청크로 분리
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI 라이브러리를 별도 청크로 분리
            'ui-vendor': ['framer-motion', 'lucide-react'],
            // 차트 라이브러리를 별도 청크로 분리
            'chart-vendor': ['recharts'],
            // React Query를 별도 청크로 분리
            'query-vendor': ['@tanstack/react-query'],
          },
        },
      },
      // 청크 크기 경고 임계값 (KB)
      chunkSizeWarningLimit: 1000,
      // 소스맵 생성 (프로덕션에서는 false 권장)
      sourcemap: mode !== 'production',
    },
  };
});
