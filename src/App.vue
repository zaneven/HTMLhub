<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { onMounted, computed, ref, watch } from 'vue'
import { darkTheme, lightTheme, zhCN, dateZhCN } from 'naive-ui'
import { useSettingsStore } from './stores/settings'
import { useFilesStore } from './stores/files'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppHeader from './components/layout/AppHeader.vue'

const route = useRoute()
const settingsStore = useSettingsStore()
const filesStore = useFilesStore()
const sidebarRef = ref()

// 是否显示布局
const showLayout = computed(() => {
  return route.name !== 'login' && route.name !== 'admin'
})

// 主题配置
const theme = computed(() => {
  return settingsStore.effectiveThemeMode === 'dark' ? darkTheme : lightTheme
})

// 监听主题模式变化，同步到 html 根节点 data-theme 属性
watch(
  () => settingsStore.effectiveThemeMode,
  (mode) => {
    document.documentElement.setAttribute('data-theme', mode)
  },
  { immediate: true }
)

// 主题覆盖配置
const themeOverrides = computed(() => {
  const isDark = settingsStore.effectiveThemeMode === 'dark'
  const primaryColor = settingsStore.currentTheme.primaryColor
  const borderRadius = settingsStore.currentTheme.borderRadius

  // 设计系统变量
  const brand = {
    primary: primaryColor,
    primaryHover: primaryColor + 'cc',
    primaryPressed: primaryColor + 'ee',
    primarySuppl: primaryColor,
    bg: isDark ? '#0f172a' : '#fcfcff',
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e5e7eb',
    text1: isDark ? '#f8fafc' : '#0f172a',
    text2: isDark ? '#94a3b8' : '#475569',
    text3: isDark ? '#64748b' : '#94a3b8',
  }

  return {
    common: {
      primaryColor: brand.primary,
      primaryColorHover: brand.primaryHover,
      primaryColorPressed: brand.primaryPressed,
      primaryColorSuppl: brand.primarySuppl,
      borderRadius: `${borderRadius}px`,
      fontSize: `${settingsStore.currentTheme.fontSize}px`,
      bodyColor: brand.bg,
      cardColor: brand.card,
      modalColor: brand.card,
      popoverColor: brand.card,
      textColor1: brand.text1,
      textColor2: brand.text2,
      textColor3: brand.text3,
      borderColor: brand.border,
      hoverColor: isDark ? '#1e1e2d' : '#f1f5f9',
    },
    Card: {
      borderRadius: `${borderRadius}px`,
      boxShadow: isDark 
        ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)' 
        : '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      borderColor: brand.border,
      titleFontSizeMedium: '1.1rem',
      titleFontWeight: '700',
    },
    Button: {
      borderRadiusMedium: `${borderRadius}px`,
      fontWeight: '600',
      paddingMedium: '0 18px',
      // 确保主按钮文字为白色，次要按钮文字颜色与主色一致且有足够对比度
      textColorPrimary: '#ffffff',
      textColorHoverPrimary: '#ffffff',
      textColorPressedPrimary: '#ffffff',
      textColorFocusPrimary: '#ffffff',
      textColorGhostPrimary: brand.primary,
      textColorTextPrimary: brand.primary,
      // 亮色模式下的次要按钮
      textColorSecondary: isDark ? '#ffffff' : '#1f2937',
    },
    Layout: {
      color: brand.bg,
      headerColor: isDark ? 'rgba(8, 8, 12, 0.8)' : 'rgba(252, 252, 255, 0.8)',
      siderColor: brand.card,
    },
    Menu: {
      itemBorderRadius: `${borderRadius}px`,
      itemHeightMedium: '42px',
      fontSizeMedium: '14px',
      itemColorActive: 'transparent',
      itemColorActiveHover: 'transparent',
      itemTextColorActive: '#ffffff',
      itemTextColorActiveHover: '#ffffff',
      itemTextColorChildActive: brand.primary,
      itemTextColorChildActiveHover: brand.primaryHover,
      itemIconColorActive: '#ffffff',
      itemIconColorActiveHover: '#ffffff',
      itemIconColorChildActive: brand.primary,
      itemIconColorChildActiveHover: brand.primaryHover,
    },
    Input: {
      borderRadius: `${borderRadius}px`,
      color: isDark ? '#1e1e2d' : '#f8fafc',
    },
    Modal: {
      borderRadius: `${borderRadius}px`,
    }
  }
})

// 切换侧边栏
function handleToggleSidebar() {
  if (sidebarRef.value) {
    sidebarRef.value.toggleDrawer()
  }
}

onMounted(async () => {
  // 初始化设置
  settingsStore.loadPreferences()
  settingsStore.initThemeDetection()

  // 加载文件索引数据
  await filesStore.loadIndexData()
})
</script>

<template>
  <n-config-provider
    :theme="theme"
    :theme-overrides="themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-message-provider>
          <!-- 带布局的页面 -->
          <n-layout v-if="showLayout" has-sider class="app-layout">
            <!-- 侧边栏 -->
            <AppSidebar ref="sidebarRef" />

            <!-- 主内容区 -->
            <n-layout>
              <!-- 头部 -->
              <AppHeader @toggle-sidebar="handleToggleSidebar" />

              <!-- 内容区域 -->
              <n-layout-content class="main-layout-content">
                <RouterView />
              </n-layout-content>
            </n-layout>
          </n-layout>

          <!-- 全屏页面（登录页等） -->
          <div v-else class="fullscreen-layout">
            <RouterView />
          </div>
        </n-message-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* 全局样式 */
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}

.app-layout {
  height: 100vh;
  width: 100%;
}

.fullscreen-layout {
  height: 100vh;
  width: 100%;
}

.main-layout-content {
  padding: 32px;
  overflow-y: auto;
  height: calc(100vh - 64px);
  /* 使用固定的主色透明度背景，避免未定义变量导致渲染问题 */
  background: radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
}

/* 移动端适配 */
@media (max-width: 767px) {
  .main-layout-content {
    padding: 16px;
    height: calc(100vh - 56px);
  }
}
</style>
