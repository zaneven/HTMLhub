<template>
  <n-layout-header bordered class="app-header">
    <div class="header-content">
      <div class="header-left">
        <n-button quaternary circle class="mobile-menu-btn" @click="$emit('toggle-sidebar')">
          <template #icon>
            <n-icon><MenuOutline /></n-icon>
          </template>
        </n-button>
      </div>

      <div class="header-right">
        <n-space align="center" size="large">
          <div class="search-wrapper">
            <n-input
              v-model:value="searchInput"
              placeholder="快速查找项目..."
              clearable
              @keyup.enter="handleSearch"
              @clear="handleClearSearch"
              class="refined-search"
              round
            >
              <template #prefix>
                <n-icon size="18">
                  <SearchOutline />
                </n-icon>
              </template>
            </n-input>
          </div>

          <div class="actions">
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button circle quaternary @click="toggleTheme">
                  <template #icon>
                    <n-icon>
                      <SunnyOutline v-if="settingsStore.effectiveThemeMode === 'dark'" />
                      <MoonOutline v-else />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              切换主题
            </n-tooltip>

            <n-dropdown :options="sortOptions" @select="handleSortSelect" trigger="click">
              <n-button circle quaternary>
                <template #icon>
                  <n-icon><SwapVerticalOutline /></n-icon>
                </template>
              </n-button>
            </n-dropdown>

            <n-button v-if="isCloudMode && isAuthenticated" circle quaternary @click="handleLogout" type="error">
              <template #icon>
                <n-icon><LogOutOutline /></n-icon>
              </template>
            </n-button>
          </div>
        </n-space>
      </div>
    </div>
  </n-layout-header>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import {
  NLayoutHeader,
  NInput,
  NButton,
  NDropdown,
  NSpace,
  NIcon,
  NTooltip,
  type DropdownOption,
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
} from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import { useSearchStore } from '../../stores/search'
import { useSettingsStore } from '../../stores/settings'
import { useAuthStore } from '../../stores/auth'
import { useAppMode } from '../../composables/useAppMode'
import { SortOption } from '../../types'

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const router = useRouter()
const searchStore = useSearchStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const { isCloudMode } = useAppMode()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const searchInput = computed({
  get: () => searchStore.searchQuery,
  set: (value: string) => searchStore.setSearchQuery(value),
})

const sortOptions: DropdownOption[] = [
  {
    label: '按名称',
    key: SortOption.NAME_ASC,
    icon: () => h(NIcon, null, { default: () => h(TextOutline) }),
  },
  {
    label: '按时间',
    key: SortOption.DATE_ASC,
    icon: () => h(NIcon, null, { default: () => h(TimeOutline) }),
  },
  {
    label: '按大小',
    key: SortOption.SIZE_ASC,
    icon: () => h(NIcon, null, { default: () => h(ListOutline) }),
  },
]

function handleSearch() {
  // 搜索逻辑已通过 computed 同步到 store
}

function handleClearSearch() {
  searchInput.value = ''
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
</script>

<style scoped>
.app-header {
  height: 64px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  background: var(--n-header-color);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
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
}

.header-left {
  display: flex;
  align-items: center;
}

.mobile-menu-btn {
  display: none;
}

.search-wrapper {
  width: 320px;
}

.refined-search {
  background: rgba(var(--n-text-color-rgb), 0.03) !important;
  transition: all 0.3s ease;
}

.refined-search:focus-within {
  background: var(--n-card-color) !important;
  box-shadow: 0 0 0 2px var(--n-primary-color-suppl) !important;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 767px) {
  .app-header {
    padding: 0 16px;
  }
  .brand-text, .search-wrapper {
    display: none;
  }
}
</style>

