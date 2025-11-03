import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 静态资源配置
  publicDir: 'public',
  server: {
    fs: {
      // 允许访问html-files目录
      allow: ['..']
    },
    // 配置静态文件服务
    middlewareMode: false,
  },
  // 配置静态资源复制
  assetsInclude: ['**/*.html'],
  // 构建优化
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['naive-ui'],
        },
      },
    },
    // 复制html-files到构建输出
    copyPublicDir: true,
  },
})
