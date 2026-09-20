import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(() => {
  // 支持通过环境变量配置部署基础路径
  const base = process.env.BASE_URL || process.env.VITE_BASE_URL || '/'

  return {
    base,
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/variables.scss" as *;`,
        },
      },
    },
    // 静态资源配置
    publicDir: 'public',
    server: {
      fs: {
        // 允许访问html-files目录
        allow: ['..']
      },
    },
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
    },
  }
})
