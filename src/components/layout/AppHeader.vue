<template>
  <n-layout-header bordered class="app-header">
    <div class="header-content">
      <!-- 左侧：移动端呼出按钮 + 工作台上下文面包屑 -->
      <div class="header-left">
        <n-button quaternary circle class="mobile-menu-btn" @click="$emit('toggle-sidebar')">
          <template #icon>
            <n-icon><MenuOutline /></n-icon>
          </template>
        </n-button>

        <div class="context-crumbs">
          <button
            class="crumb-item crumb-root"
            :class="{ active: !selectedCategory }"
            @click="handleClearCategory"
          >
            <n-icon size="15" class="crumb-icon"><AppsOutline /></n-icon>
            <span class="crumb-title">全部项目</span>
            <span class="crumb-counter">{{ totalProjects }}</span>
          </button>

          <template v-if="selectedCategory">
            <span class="crumb-sep">/</span>
            <div class="crumb-item crumb-current">
              <n-icon size="15" class="crumb-icon"><FolderOutline /></n-icon>
              <span class="crumb-title">{{ selectedCategory }}</span>
              <span class="crumb-counter">{{ filteredCount }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- 中间：极简命令搜索框 (支持 ⌘ K 唤醒) -->
      <div class="header-center">
        <div class="command-search-box">
          <n-input
            ref="searchInputRef"
            v-model:value="searchInput"
            placeholder="搜索项目名称或分类..."
            clearable
            size="small"
            class="command-input"
            @clear="handleClearSearch"
          >
            <template #prefix>
              <n-icon size="15" class="search-icon">
                <SearchOutline />
              </n-icon>
            </template>
            <template #suffix>
              <div class="kbd-badge" v-if="!searchInput">
                <span class="kbd-key">{{ isMac ? '⌘' : 'Ctrl' }}</span>
                <span class="kbd-key">K</span>
              </div>
            </template>
          </n-input>
        </div>
      </div>

      <!-- 右侧：排序、主题、上传主操作与登录态 -->
      <div class="header-right">
        <div class="actions-group">
          <!-- 排序筛选 -->
          <n-dropdown :options="sortOptions" @select="handleSortSelect" trigger="click">
            <n-button size="small" secondary class="action-btn">
              <template #icon>
                <n-icon size="14"><SwapVerticalOutline /></n-icon>
              </template>
              <span class="btn-text">排序</span>
            </n-button>
          </n-dropdown>

          <!-- 切换明暗主题 -->
          <n-button size="small" secondary circle class="action-btn" @click="toggleTheme" title="切换明暗主题">
            <template #icon>
              <n-icon size="15">
                <SunnyOutline v-if="settingsStore.effectiveThemeMode === 'dark'" />
                <MoonOutline v-else />
              </n-icon>
            </template>
          </n-button>

          <!-- 云端上传项目主按钮 -->
          <n-button
            v-if="isCloudMode && isAuthenticated"
            type="primary"
            size="small"
            class="upload-primary-btn"
            @click="filesStore.showUploadModal = true"
          >
            <template #icon>
              <n-icon size="15"><CloudUploadOutline /></n-icon>
            </template>
            <span>上传项目</span>
          </n-button>

          <!-- 登出按钮 -->
          <n-button
            v-if="isCloudMode && isAuthenticated"
            size="small"
            quaternary
            circle
            type="error"
            @click="handleLogout"
            title="退出管理模式"
          >
            <template #icon>
              <n-icon size="15"><LogOutOutline /></n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </div>
  </n-layout-header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, h } from 'vue'
import {
  NLayoutHeader,
  NInput,
  NButton,
  NDropdown,
  NIcon,
  type DropdownOption,
  type InputInst,
} from 'naive-ui'
import {
  SearchOutline,
  SwapVerticalOutline,
  LogOutOutline,
  MenuOutline,
  SunnyOutline,
  MoonOutline,
  TimeOutline,
  TextOutline,
  ListOutline,
  AppsOutline,
  FolderOutline,
  CloudUploadOutline,
} from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useFilesStore } from '@/stores/files'
import { useAppMode } from '@/composables/useAppMode'
import { SortOption } from '@/types'

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const router = useRouter()
const searchStore = useSearchStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const filesStore = useFilesStore()
const { isCloudMode } = useAppMode()

const searchInputRef = ref<InputInst | null>(null)
const isMac = ref(true)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const selectedCategory = computed(() => filesStore.selectedCategory)
const totalProjects = computed(() => filesStore.totalProjects)
const filteredCount = computed(() => filesStore.filteredProjects.length)

const searchInput = computed({
  get: () => searchStore.searchQuery,
  set: (value: string) => searchStore.setSearchQuery(value),
})

const sortOptions: DropdownOption[] = [
  {
    label: '按名称排序',
    key: SortOption.NAME_ASC,
    icon: () => h(NIcon, null, { default: () => h(TextOutline) }),
  },
  {
    label: '按修改时间',
    key: SortOption.DATE_ASC,
    icon: () => h(NIcon, null, { default: () => h(TimeOutline) }),
  },
  {
    label: '按体积大小',
    key: SortOption.SIZE_ASC,
    icon: () => h(NIcon, null, { default: () => h(ListOutline) }),
  },
]

function handleClearSearch() {
  searchInput.value = ''
}

function handleClearCategory() {
  filesStore.setSelectedCategory('')
}

function handleSortSelect(key: string) {
  searchStore.setSortOption(key as SortOption)
}

function toggleTheme() {
  const currentMode = settingsStore.preferences.theme.mode
  const newMode = currentMode === 'light' ? 'dark' : 'light'
  settingsStore.setThemeMode(newMode)
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

// 快捷键 ⌘ K / Ctrl K 聚焦
function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  isMac.value = /mac/i.test(navigator.platform || navigator.userAgent)
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.app-header {
  height: 54px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  background: var(--n-header-color);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--n-border-color);
  position: sticky;
  top: 0;
  z-index: 90;
}

.header-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* 左侧工作台面包屑上下文 */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.mobile-menu-btn {
  display: none;
}

.context-crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crumb-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color-2);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.crumb-root:hover {
  background: rgba(var(--n-text-color-rgb), 0.06);
  color: var(--n-text-color-1);
}

.crumb-root.active {
  color: var(--n-text-color-1);
  font-weight: 700;
}

.crumb-current {
  color: #4f46e5;
  background: rgba(79, 70, 229, 0.08);
  font-weight: 700;
  cursor: default;
}

:root[data-theme='dark'] .crumb-current,
.dark .crumb-current {
  color: #818cf8;
  background: rgba(129, 140, 248, 0.15);
}

.crumb-icon {
  opacity: 0.85;
}

.crumb-sep {
  color: var(--n-text-color-3);
  font-size: 13px;
  opacity: 0.5;
}

.crumb-counter {
  font-size: 11px;
  font-family: monospace;
  font-variant-numeric: tabular-nums;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(var(--n-text-color-rgb), 0.08);
  color: var(--n-text-color-2);
}

.crumb-current .crumb-counter {
  background: rgba(79, 70, 229, 0.2);
  color: #4f46e5;
}

:root[data-theme='dark'] .crumb-current .crumb-counter,
.dark .crumb-current .crumb-counter {
  background: rgba(129, 140, 248, 0.25);
  color: #c7d2fe;
}

/* 中间搜索框 */
.header-center {
  flex: 1;
  max-width: 420px;
  display: flex;
  justify-content: center;
}

.command-search-box {
  width: 100%;
}

.command-input :deep(.n-input__border),
.command-input :deep(.n-input__state-border) {
  border-radius: 8px !important;
}

.command-input {
  background: rgba(var(--n-text-color-rgb), 0.04) !important;
  transition: all 0.2s ease;
}

.command-input:hover {
  background: rgba(var(--n-text-color-rgb), 0.06) !important;
}

.command-input:focus-within {
  background: var(--n-card-color) !important;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2) !important;
}

.search-icon {
  color: var(--n-text-color-3);
}

.kbd-badge {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 5px;
  background: rgba(var(--n-text-color-rgb), 0.08);
  border: 1px solid rgba(var(--n-text-color-rgb), 0.12);
  border-radius: 4px;
  line-height: 1;
}

.kbd-key {
  font-size: 10px;
  font-family: inherit;
  font-weight: 600;
  color: var(--n-text-color-3);
}

/* 右侧操作区 */
.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  border-radius: 8px !important;
  font-weight: 500;
}

.upload-primary-btn {
  background: #4f46e5 !important;
  border-radius: 8px !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
  transition: all 0.2s ease;
}

.upload-primary-btn:hover {
  background: #4338ca !important;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.45);
}

@media (max-width: 900px) {
  .header-center {
    max-width: 260px;
  }
}

@media (max-width: 767px) {
  .app-header {
    height: 50px;
    padding: 0 12px;
  }
  .mobile-menu-btn {
    display: inline-flex;
  }
  .header-center {
    display: none;
  }
  .btn-text {
    display: none;
  }
  .crumb-root .crumb-title {
    display: none;
  }
}
</style>
