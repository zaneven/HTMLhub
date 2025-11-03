<template>
  <n-layout-header bordered class="app-header">
    <div class="header-content">
      <!-- 左侧：汉堡菜单和面包屑导航 -->
      <div class="header-left">
        <n-button
          text
          @click="handleBackClick"
          :disabled="!canGoBack"
          class="back-button"
        >
          <template #icon>
            <n-icon>
              <chevron-back-outline />
            </n-icon>
          </template>
        </n-button>
      </div>

      <!-- 中间：搜索栏 -->
      <div class="header-center">
        <n-input-group>
          <n-input
            v-model:value="searchInput"
            placeholder="搜索文件名..."
            clearable
            @keyup.enter="handleSearch"
            @clear="handleClearSearch"
            class="search-input"
          >
            <template #prefix>
              <n-icon size="16">
                <SearchOutline />
              </n-icon>
            </template>
          </n-input>
          <n-button
            type="primary"
            @click="handleSearch"
            :loading="searching"
          >
            搜索
          </n-button>
        </n-input-group>

        <!-- 搜索建议 -->
        <div v-if="showSuggestions && suggestions.length" class="search-suggestions">
          <n-card size="small" embedded>
            <div
              v-for="suggestion in suggestions"
              :key="suggestion"
              class="suggestion-item"
              @click="handleSuggestionClick(suggestion)"
            >
              <n-icon size="14">
                <SearchOutline />
              </n-icon>
              <span>{{ suggestion }}</span>
            </div>
          </n-card>
        </div>
      </div>

      <!-- 右侧：操作按钮 -->
      <div class="header-right">
        <n-space align="center">
          <!-- 排序选择 -->
          <n-dropdown
            :options="sortOptions"
            @select="handleSortSelect"
            trigger="click"
          >
            <n-button size="small" secondary>
              <template #icon>
                <n-icon><SwapVerticalOutline /></n-icon>
              </template>
              排序
            </n-button>
          </n-dropdown>

          <!-- 设置按钮 -->
          <n-dropdown
            :options="settingsOptions"
            @select="handleSettingsSelect"
            trigger="click"
          >
            <n-button size="small" secondary>
              <template #icon>
                <n-icon><SettingsOutline /></n-icon>
              </template>
            </n-button>
          </n-dropdown>
        </n-space>
      </div>
    </div>
  </n-layout-header>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted, h } from 'vue'
import {
  NLayoutHeader,
  NInputGroup,
  NInput,
  NButton,
  NDropdown,
  NCard,
  NSpace,
  NIcon,
  type DropdownOption
} from 'naive-ui'
import {
  SearchOutline,
  SwapVerticalOutline,
  SettingsOutline,
  ChevronBackOutline
} from '@vicons/ionicons5'
import { useSearchStore } from '../../stores/search'
import { useSettingsStore } from '../../stores/settings'
import { SortOption } from '../../types'

// 响应式状态
const searchInput = ref('')
const showSuggestions = ref(false)

// Store
const searchStore = useSearchStore()
const settingsStore = useSettingsStore()

// 计算属性
const searching = computed(() => false) // 暂时设为false，后续实现

// 返回功能
const canGoBack = computed(() => {
  return window.history.length > 1
})

function handleBackClick() {
  window.history.back()
}

// 搜索建议
const suggestions = computed(() => {
  if (!searchInput.value || searchInput.value.length < 2) return []
  
  // 这里可以实现更复杂的搜索建议逻辑
  const history = searchStore.searchHistory
  return history
    .filter(item => item.toLowerCase().includes(searchInput.value.toLowerCase()))
    .slice(0, 5)
})

// 排序选项
const sortOptions: DropdownOption[] = [
  {
    label: '按名称排序',
    key: SortOption.NAME_ASC,
    icon: () => h(NIcon, null, { default: () => h(SearchOutline) })
  },
  {
    label: '按修改时间排序',
    key: SortOption.DATE_ASC,
    icon: () => h(NIcon, null, { default: () => h(SearchOutline) })
  },
  {
    label: '按大小排序',
    key: SortOption.SIZE_ASC,
    icon: () => h(NIcon, null, { default: () => h(SearchOutline) })
  },
  {
    label: '按类型排序',
    key: SortOption.CATEGORY,
    icon: () => h(NIcon, null, { default: () => h(SearchOutline) })
  }
]

// 设置选项
const settingsOptions: DropdownOption[] = [
  {
    label: '主题设置',
    key: 'theme'
  },
  {
    label: '显示设置',
    key: 'display'
  },
  {
    label: '关于',
    key: 'about'
  }
]

// 监听搜索输入
watch(searchInput, (newValue) => {
  showSuggestions.value = newValue.length >= 2
})

// 点击外部关闭建议
watch(showSuggestions, (show) => {
  if (show) {
    nextTick(() => {
      document.addEventListener('click', handleClickOutside)
    })
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

// 事件处理
function handleSearch() {
  if (searchInput.value.trim()) {
    searchStore.setSearchQuery(searchInput.value.trim())
    showSuggestions.value = false
  }
}

function handleClearSearch() {
  searchInput.value = ''
  searchStore.clearSearch()
  showSuggestions.value = false
}

function handleSuggestionClick(suggestion: string) {
  searchInput.value = suggestion
  handleSearch()
}

function handleSortSelect(key: string) {
  searchStore.setSortOption(key as SortOption)
}

function handleSettingsSelect(key: string) {
  switch (key) {
    case 'theme':
      // 切换主题模式
      const currentMode = settingsStore.preferences.theme.mode
      const newMode = currentMode === 'light' ? 'dark' : 'light'
      settingsStore.setThemeMode(newMode)
      break
    case 'display':
      // 打开显示设置
      break
    case 'about':
      // 显示关于信息
      break
  }
}



function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('.header-center')) {
    showSuggestions.value = false
  }
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-header {
  height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  background: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left {
  flex-shrink: 0;
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-menu-btn {
  display: none;
}

.header-center {
  flex: 1;
  max-width: 600px;
  position: relative;
  min-width: 0; /* 允许收缩 */
}

.search-input {
  width: 100%;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 4px;
  margin: 2px 4px;
}

.suggestion-item:hover {
  background-color: var(--n-hover-color);
}

.header-right {
  flex-shrink: 0;
}

/* 平板端适配 */
@media (max-width: 1023px) {
  .app-header {
    padding: 0 12px;
  }
  
  .header-content {
    gap: 12px;
  }
  
  .header-left {
    min-width: 100px;
  }
  
  .header-center {
    max-width: 400px;
  }
}

/* 移动端适配 */
@media (max-width: 767px) {
  .app-header {
    height: 56px;
    padding: 0 8px;
  }
  
  .header-content {
    gap: 8px;
  }
  
  .header-left {
    min-width: 80px;
  }
  
  /* 移动端隐藏面包屑文字，只显示图标 */
  .header-left :deep(.n-breadcrumb-item__link) {
    font-size: 0;
  }
  
  .header-left :deep(.n-breadcrumb-item__link .n-icon) {
    font-size: 16px;
  }
  
  .header-center {
    max-width: none;
  }
  
  /* 移动端简化搜索栏 */
  .header-center :deep(.n-input-group .n-button) {
    display: none;
  }
  
  /* 移动端简化右侧按钮 */
  .header-right :deep(.n-button .n-button__content) {
    font-size: 0;
  }
  
  .header-right :deep(.n-button .n-icon) {
    margin: 0;
  }
  
  /* 移动端隐藏部分按钮 */
  .header-right :deep(.n-space > :nth-child(2)),
  .header-right :deep(.n-space > :nth-child(3)) {
    display: none;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex !important;
  }
  
  .app-header {
    height: 48px;
    padding: 0 4px;
  }
  
  .header-content {
    gap: 4px;
  }
  
  .header-left {
    min-width: 60px;
  }
}

/* 面包屑链接样式 */
.breadcrumb-link {
  padding: 0 !important;
  height: auto !important;
  color: var(--n-text-color) !important;
}

.breadcrumb-link:hover {
  color: var(--n-color-target) !important;
}

/* 超小屏幕只保留搜索和基本操作 */
@media (max-width: 480px) {
  .header-right :deep(.n-space > :nth-child(1)) {
    display: none;
  }
}

/* 桌面端优化 */
@media (min-width: 1024px) {
  .app-header {
    padding: 0 24px;
  }
  
  .header-content {
    gap: 24px;
  }
  
  .header-left {
    min-width: 200px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1440px) {
  .app-header {
    padding: 0 32px;
  }
  
  .header-content {
    gap: 32px;
  }
  
  .header-center {
    max-width: 800px;
  }
}
</style>