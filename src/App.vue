<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, computed, ref } from 'vue'
import { darkTheme, lightTheme, zhCN, dateZhCN } from 'naive-ui'
import { useSettingsStore } from './stores/settings'
import { useFilesStore } from './stores/files'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppHeader from './components/layout/AppHeader.vue'

const settingsStore = useSettingsStore()
const filesStore = useFilesStore()
const sidebarRef = ref()

// 主题配置
const theme = computed(() => {
  return settingsStore.effectiveThemeMode === 'dark' ? darkTheme : lightTheme
})

// 主题覆盖配置
const themeOverrides = computed(() => ({
  common: {
    primaryColor: settingsStore.currentTheme.primaryColor,
    primaryColorHover: settingsStore.currentTheme.primaryColor + '20',
    primaryColorPressed: settingsStore.currentTheme.primaryColor + '40',
    borderRadius: `${settingsStore.currentTheme.borderRadius}px`,
    fontSize: `${settingsStore.currentTheme.fontSize}px`
  }
}))

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
          <n-layout has-sider class="app-layout">
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
        </n-message-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<style>
/* 全局样式，确保应用占满整个视口 */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>

<style scoped>
.app-layout {
  height: 100vh;
  width: 100%;
}

.main-layout-content {
  padding: 16px;
  overflow: auto;
  height: calc(100vh - 64px); /* 减去头部高度 */
}

/* 移动端适配 */
@media (max-width: 767px) {
  .main-layout-content {
    padding: 8px;
    height: calc(100vh - 56px); /* 移动端头部高度 */
  }
}

/* 平板端适配 */
@media (min-width: 768px) and (max-width: 1023px) {
  .main-layout-content {
    padding: 12px;
  }
}

/* 桌面端优化 */
@media (min-width: 1024px) {
  .main-layout-content {
    padding: 20px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1440px) {
  .main-layout-content {
    padding: 24px;
  }
}
</style>
