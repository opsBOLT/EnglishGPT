import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiTarget =
    (env.VITE_ENGLISHGPT_API_URL || env.VITE_ENGLISHGPT_PUBLIC_MARKING_API_BASE_URL || 'https://englishgpt.everythingenglish.xyz').replace(
      /\/$/,
      ''
    );

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'X_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@supabase')) return 'supabase';
              if (id.includes('livekit')) return 'livekit';
              if (id.includes('@tremor') || id.includes('recharts')) return 'charts';
              if (id.includes('framer-motion')) return 'motion';
              if (id.includes('@radix-ui') || id.includes('@headlessui')) return 'ui-kit';
            }
          },
        },
      },
    },
  };
});
