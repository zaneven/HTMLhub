<template>
  <!-- 移动端抽屉模式 -->
  <n-drawer
    v-if="isMobile"
    v-model:show="drawerVisible"
    :width="280"
    placement="left"
    class="mobile-sidebar"
  >
    <n-drawer-content title="文件浏览器" closable>
      <div class="sidebar-content mobile">
        <!-- 移动端侧边栏内容 -->
        <div class="quick-stats">
          <n-card size="small" embedded>
            <n-statistic label="总文件数" :value="totalFiles" />
            <n-divider style="margin: 8px 0" />
            <n-statistic 
              label="总大小" 
              :value="formatFileSize(totalSize)" 
              :value-style="{ fontSize: '14px' }"
            />
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
  <n-layout-sider
    v-else
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="sidebarWidth"
    :collapsed="collapsed"
    show-trigger
    @collapse="collapsed = true"
    @expand="collapsed = false"
    class="app-sidebar"
  >
    <div class="sidebar-content">
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <n-space align="center" justify="space-between">
          <div v-if="!collapsed" class="logo">
            <n-icon size="24" color="#18a058">
              <FolderOpenOutline />
            </n-icon>
            <span class="logo-text">文件浏览器</span>
          </div>
          <n-icon v-else size="24" color="#18a058">
            <FolderOpenOutline />
          </n-icon>
        </n-space>
      </div>

      <!-- 快速统计 -->
      <div v-if="!collapsed" class="quick-stats">
        <n-card size="small" embedded>
          <n-statistic label="总文件数" :value="totalFiles" />
          <n-divider style="margin: 8px 0" />
          <n-statistic 
            label="总大小" 
            :value="formatFileSize(totalSize)" 
            :value-style="{ fontSize: '14px' }"
          />
        </n-card>
      </div>

      <!-- 分类导航 -->
      <div class="category-section">
        <div v-if="!collapsed" class="section-title">
          <n-icon size="16">
            <FolderOutline />
          </n-icon>
          <span>分类</span>
        </div>
        
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
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
  type MenuOption
} from 'naive-ui'
import {
  FolderOpenOutline,
  FolderOutline,
  DocumentOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNoteOutline,
  CodeSlashOutline,
  ArchiveOutline
} from '@vicons/ionicons5'
import { useFilesStore } from '../../stores/files'
import { useSearchStore } from '../../stores/search'
import { formatFileSize } from '../../utils/fileUtils'

// 响应式状态
const collapsed = ref(false)
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
  // 移动端自动收起侧边栏
  if (isMobile.value) {
    collapsed.value = true
  }
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
  }
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
const searchStore = useSearchStore()

// 计算属性
const totalFiles = computed(() => filesStore.totalFiles)
const totalSize = computed(() => {
  const stats = filesStore.getStats
  return stats.totalSize
})
const selectedCategory = computed(() => searchStore.searchFilter.category)

// 分类图标映射
const categoryIcons: Record<string, unknown> = {
  // 目录相关图标
  'examples': FolderOutline,
  'templates': FolderOutline,
  'components': CodeSlashOutline,
  'assets': ImageOutline,
  'docs': DocumentOutline,
  'images': ImageOutline,
  'videos': VideocamOutline,
  'audio': MusicalNoteOutline,
  'scripts': CodeSlashOutline,
  'styles': CodeSlashOutline,
  'data': ArchiveOutline,
  '根目录': FolderOpenOutline,
  // 原有的分类图标
  '文档': DocumentOutline,
  '图片': ImageOutline,
  '视频': VideocamOutline,
  '音频': MusicalNoteOutline,
  '代码': CodeSlashOutline,
  '压缩包': ArchiveOutline,
  '其他': FolderOutline
}

// 分类菜单选项
const categoryMenuOptions = computed((): MenuOption[] => {
  const categories = filesStore.categories
  const options: MenuOption[] = [
    {
      label: '全部文件',
      key: '',
      icon: () => h(NIcon, null, { default: () => h(FolderOpenOutline) })
    }
  ]
  
  categories.forEach(category => {
    const IconComponent = categoryIcons[category.name] || FolderOutline
    options.push({
      label: `${category.name} (${category.count})`,
      key: category.name,
      icon: () => h(NIcon, null, { default: () => h(IconComponent) })
    })
  })
  
  return options
})

// 事件处理
function handleCategorySelect(category: string) {
  searchStore.setCategoryFilter(category)
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

.tags-section {
  flex-shrink: 0;
  max-height: 200px;
  overflow-y: auto;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.tag-item {
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.tag-item:hover {
  transform: translateY(-1px);
}

.quick-actions {
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color);
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
  
  .tags-container {
    max-height: 120px;
  }
  
  .section-title {
    font-size: 13px;
  }
}

/* 移动端适配 */
@media (max-width: 767px) {
  .app-sidebar {
    display: none; /* 移动端隐藏固定侧边栏 */
  }
  
  .sidebar-content.mobile {
    padding: 8px;
    gap: 8px;
  }
  
  .tags-container {
    max-height: 100px;
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
  
  .tags-container {
    max-height: 250px;
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
.tags-container::-webkit-scrollbar,
.category-section::-webkit-scrollbar {
  width: 4px;
}

.tags-container::-webkit-scrollbar-track,
.category-section::-webkit-scrollbar-track {
  background: transparent;
}

.tags-container::-webkit-scrollbar-thumb,
.category-section::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.tags-container::-webkit-scrollbar-thumb:hover,
.category-section::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 暗色主题下的滚动条 */
@media (prefers-color-scheme: dark) {
  .tags-container::-webkit-scrollbar-thumb,
  .category-section::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
  }

  .tags-container::-webkit-scrollbar-thumb:hover,
  .category-section::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

/* 收起状态下的样式修复 */
:deep(.n-layout-sider--collapsed) {
  .n-menu-item {
    padding: 0 !important;
    justify-content: center !important;
  }
  
  .n-menu-item-content {
    padding: 8px 0 !important;
    justify-content: center !important;
  }
  
  .n-menu-item-content-header {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }
  
  .n-icon {
    margin: 0 !important;
  }
}

/* 确保图标在收起状态下正确显示 */
:deep(.n-layout-sider--collapsed .n-menu .n-menu-item .n-icon) {
  font-size: 22px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style>