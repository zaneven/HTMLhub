<template>
  <n-layout-header bordered class="app-header">
    <div class="header-content">
      <!-- 左侧：占位 -->
      <div class="header-left"></div>

      <!-- 右侧：搜索栏和操作按钮 -->
      <div class="header-right">
        <n-space align="center" size="medium">
          <!-- 搜索栏 -->
          <div class="search-container">
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
              <n-button type="primary" @click="handleSearch" :loading="searching"> 搜索 </n-button>
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

          <!-- 排序选择 -->
          <n-dropdown :options="sortOptions" @select="handleSortSelect" trigger="click">
            <n-button size="small" secondary>
              <template #icon>
                <n-icon><SwapVerticalOutline /></n-icon>
              </template>
              排序
            </n-button>
          </n-dropdown>

          <!-- 设置按钮 -->
          <n-dropdown :options="settingsOptions" @select="handleSettingsSelect" trigger="click">
            <n-button size="small" secondary>
              <template #icon>
                <n-icon><SettingsOutline /></n-icon>
              </template>
            </n-button>
          </n-dropdown>

          <!-- 管理入口（仅云端模式且已登录显示） -->
          <n-button
            v-if="isCloudMode && isAuthenticated"
            size="small"
            type="primary"
            @click="handleAdminClick"
          >
            <template #icon>
              <n-icon><SettingsOutline /></n-icon>
            </template>
            管理
          </n-button>

          <!-- 退出登录按钮（仅云端模式且已登录显示） -->
          <n-button v-if="isCloudMode && isAuthenticated" size="small" @click="handleLogout">
            <template #icon>
              <n-icon><LogOutOutline /></n-icon>
            </template>
            退出
          </n-button>
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
  type DropdownOption,
} from 'naive-ui'
import {
  SearchOutline,
  SwapVerticalOutline,
  SettingsOutline,
  LogOutOutline,
} from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import { useSearchStore } from '../../stores/search'
import { useSettingsStore } from '../../stores/settings'
import { useAuthStore } from '../../stores/auth'
import { useAppMode } from '../../composables/useAppMode'
import { SortOption } from '../../types'

const router = useRouter()

// 响应式状态
const showSuggestions = ref(false)

// Store
const searchStore = useSearchStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const { isCloudMode } = useAppMode()

// 认证状态
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 计算属性 - 将searchInput与searchStore同步
const searchInput = computed({
  get: () => searchStore.searchQuery,
  set: (value: string) => searchStore.setSearchQuery(value),
})

const searching = computed(() => false)

// 搜索建议
const suggestions = computed(() => {
  if (!searchInput.value || searchInput.value.length < 2) return []

  // 这里可以实现更复杂的搜索建议逻辑
  const history = searchStore.searchHistory
  return history
    .filter((item) => item.toLowerCase().includes(searchInput.value.toLowerCase()))
    .slice(0, 5)
})

// 排序选项
const sortOptions: DropdownOption[] = [
  {
    label: '按名称排序',
    key: SortOption.NAME_ASC,
    icon: () => h(NIcon, null, { default: () => h(SearchOutline) }),
  },
  {
    label: '按修改时间排序',
    key: SortOption.DATE_ASC,
    icon: () => h(NIcon, null, { default: () => h(SearchOutline) }),
  },
  {
    label: '按大小排序',
    key: SortOption.SIZE_ASC,
    icon: () => h(NIcon, null, { default: () => h(SearchOutline) }),
  },
]

// 设置选项
const settingsOptions: DropdownOption[] = [
  {
    label: '主题设置',
    key: 'theme',
  },
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
    // searchInput已经与store同步，所以这里只需要关闭建议
    showSuggestions.value = false
    console.log('搜索执行:', searchInput.value)
  }
}

function handleClearSearch() {
  searchInput.value = ''
  showSuggestions.value = false
  console.log('搜索已清除')
}

function handleSuggestionClick(suggestion: string) {
  searchInput.value = suggestion
  handleSearch()
}

function handleSortSelect(key: string) {
  searchStore.setSortOption(key as SortOption)
}

function handleSettingsSelect(key: string) {
  if (key === 'theme') {
    // 切换主题模式
    const currentMode = settingsStore.preferences.theme.mode
    const newMode = currentMode === 'light' ? 'dark' : 'light'
    settingsStore.setThemeMode(newMode)
  }
}

function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('.search-container')) {
    showSuggestions.value = false
  }
}

// 管理入口点击处理
function handleAdminClick() {
  router.push('/admin')
}

// 退出登录
async function handleLogout() {
  await authStore.logout()
  router.push('/login')
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
  justify-content: space-between;
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

.search-container {
  position: relative;
  min-width: 300px;
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
  display: flex;
  justify-content: flex-end;
  align-items: center;
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

  .search-container {
    min-width: 250px;
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

  .search-container {
    min-width: 200px;
  }

  /* 移动端简化搜索栏 */
  .search-container :deep(.n-input-group .n-button) {
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
