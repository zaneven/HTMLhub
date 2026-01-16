<template>
  <!-- 移动端抽屉模式 -->
  <n-drawer
    v-if="isMobile"
    v-model:show="drawerVisible"
    :width="280"
    placement="left"
    class="mobile-sidebar"
  >
    <n-drawer-content title="HTMLManager" closable>
      <div class="sidebar-content mobile">
        <!-- 移动端侧边栏内容 -->
        <div class="quick-stats">
          <n-card size="small" embedded>
            <n-statistic label="分类数" :value="totalCategories" />
            <n-divider style="margin: 8px 0" />
            <n-statistic label="项目数" :value="totalProjects" />
          </n-card>
        </div>

        <div class="category-section">
          <div class="section-title">
            <n-icon size="16">
              <FolderOutline />
            </n-icon>
            <span>分类</span>
          </div>

          <n-menu
            :options="categoryMenuOptions"
            :value="selectedCategory"
            @update:value="handleCategorySelect"
          />
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>

  <!-- 桌面端侧边栏 -->
  <n-layout-sider v-else bordered :width="sidebarWidth" class="app-sidebar">
    <div class="sidebar-content">
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <n-space align="center" justify="space-between">
          <div class="logo">
            <n-icon size="24" color="#18a058">
              <FolderOpenOutline />
            </n-icon>
            <span class="logo-text">HTMLManager</span>
          </div>
        </n-space>
      </div>

      <!-- 快速统计 -->
      <div class="quick-stats">
        <n-card size="small" embedded>
          <n-statistic label="分类数" :value="totalCategories" />
          <n-divider style="margin: 8px 0" />
          <n-statistic label="项目数" :value="totalProjects" />
        </n-card>
      </div>

      <!-- 分类导航 -->
      <div class="category-section">
        <div class="section-title">
          <n-icon size="16">
            <FolderOutline />
          </n-icon>
          <span>分类</span>
        </div>

        <n-menu
          :options="categoryMenuOptions"
          :value="selectedCategory"
          @update:value="handleCategorySelect"
        />
      </div>
    </div>
  </n-layout-sider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import {
  NLayoutSider,
  NDrawer,
  NDrawerContent,
  NSpace,
  NIcon,
  NCard,
  NStatistic,
  NDivider,
  NMenu,
  type MenuOption,
} from 'naive-ui'
import { FolderOpenOutline, FolderOutline, AppsOutline } from '@vicons/ionicons5'
import { useFilesStore } from '../../stores/files'

// 响应式状态
const drawerVisible = ref(false)
const windowWidth = ref(window.innerWidth)

// 响应式断点
const isMobile = computed(() => windowWidth.value < 768)
const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
const sidebarWidth = computed(() => {
  if (isTablet.value) return 240
  return 280
})

// 窗口大小监听
function handleResize() {
  windowWidth.value = window.innerWidth
}

// 暴露给父组件的方法
defineExpose({
  toggleDrawer: () => {
    drawerVisible.value = !drawerVisible.value
  },
  openDrawer: () => {
    drawerVisible.value = true
  },
  closeDrawer: () => {
    drawerVisible.value = false
  },
})

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize() // 初始化
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Store
const filesStore = useFilesStore()

// 计算属性
const totalProjects = computed(() => filesStore.totalProjects)
const totalCategories = computed(() => filesStore.totalCategories)
const selectedCategory = computed(() => filesStore.selectedCategory)

// 分类菜单选项
const categoryMenuOptions = computed((): MenuOption[] => {
  const categories = filesStore.categories
  const options: MenuOption[] = [
    {
      label: '全部项目',
      key: '',
      icon: () => h(NIcon, null, { default: () => h(AppsOutline) }),
    },
  ]

  categories.forEach((category) => {
    options.push({
      label: `${category.name} (${category.projectCount})`,
      key: category.name,
      icon: () => h(NIcon, null, { default: () => h(FolderOutline) }),
    })
  })

  return options
})

// 事件处理
function handleCategorySelect(category: string) {
  filesStore.setSelectedCategory(category)
  // 移动端选择后关闭抽屉
  if (isMobile.value) {
    drawerVisible.value = false
  }
}
</script>

<style scoped>
.app-sidebar {
  height: 100vh;
  transition: width 0.3s ease;
}

.sidebar-content {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.sidebar-content.mobile {
  padding: 12px;
  gap: 12px;
}

.sidebar-header {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-weight: 600;
  font-size: 16px;
  color: var(--n-text-color);
  white-space: nowrap;
}

.quick-stats {
  flex-shrink: 0;
}

.category-section {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--n-text-color-2);
  white-space: nowrap;
}

/* 移动端抽屉样式 */
.mobile-sidebar {
  z-index: 1000;
}

.mobile-sidebar :deep(.n-drawer-content) {
  padding: 0;
}

.mobile-sidebar .sidebar-content {
  height: calc(100vh - 60px);
}

/* 平板端适配 */
@media (max-width: 1023px) {
  .sidebar-content {
    padding: 12px;
    gap: 12px;
  }

  .section-title {
    font-size: 13px;
  }
}

/* 移动端适配 */
@media (max-width: 767px) {
  .app-sidebar {
    display: none;
  }

  .sidebar-content.mobile {
    padding: 8px;
    gap: 8px;
  }

  .quick-stats :deep(.n-card) {
    padding: 8px;
  }

  .section-title {
    font-size: 12px;
    margin-bottom: 6px;
  }
}

/* 桌面端优化 */
@media (min-width: 1024px) {
  .sidebar-content {
    padding: 20px;
    gap: 20px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1440px) {
  .sidebar-content {
    padding: 24px;
    gap: 24px;
  }

  .logo-text {
    font-size: 18px;
  }

  .section-title {
    font-size: 15px;
  }
}

/* 滚动条优化 */
.category-section::-webkit-scrollbar {
  width: 4px;
}

.category-section::-webkit-scrollbar-track {
  background: transparent;
}

.category-section::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.category-section::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 暗色主题下的滚动条 */
@media (prefers-color-scheme: dark) {
  .category-section::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
  }

  .category-section::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}
</style>
