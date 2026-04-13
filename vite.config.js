import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'public',
  publicDir: false,
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js',
      'vue-router': 'vue-router'
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router']
  },
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  }
});