import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueSetupExtend from 'vite-plugin-vue-setup-extend';

// https://vite.dev/config/
export default defineConfig({ 
  define: {
    'process.env': process.env
  },
  vue: {
    compilerOptions: {
      isCustomElement: tag => tag === 'audioplayer' // 如果是 Web Component 或自定义元素，排除解析
    }
  },
  resolve: {
    alias: {
      '@': '/src',  
    }
  },
  plugins: [
    vue(),
    VueSetupExtend()
  ],
  server: {
    port: 5173, 
  },
  build: {
    outDir: 'dist', 
  }
})
