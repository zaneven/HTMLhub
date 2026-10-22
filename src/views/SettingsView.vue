<template>
  <div class="settings-view">
    <n-card title="设置">
      <template #header-extra>
        <n-button @click="$router.go(-1)">返回</n-button>
      </template>
      
      <div class="settings-content">
        <n-form label-placement="left" label-width="120">
          <n-form-item label="主题模式">
            <n-select
              v-model:value="themeMode"
              :options="themeModeOptions"
              @update:value="handleThemeChange"
            />
          </n-form-item>
          
          <n-form-item label="每页显示">
            <n-input-number
              v-model:value="pageSize"
              :min="10"
              :max="100"
              :step="10"
              @update:value="handlePageSizeChange"
            />
          </n-form-item>
          
          <n-form-item label="默认视图">
            <n-radio-group v-model:value="defaultView" @update:value="handleViewChange">
              <n-radio value="list">列表视图</n-radio>
              <n-radio value="grid">网格视图</n-radio>
            </n-radio-group>
          </n-form-item>
        </n-form>
      </div>
    </n-card>

    <n-card title="关于 HTMLhub" class="about-card">
      <div class="about-row">
        <div class="about-version-block">
          <span class="about-label">当前版本</span>
          <span class="about-version">v{{ version }}</span>
        </div>
        <n-button secondary @click="router.push('/changelog')">查看更新日志</n-button>
      </div>

      <p class="about-meta">
        最近更新 {{ stats.latestDate }} · 累计 {{ stats.totalReleases }} 个版本、{{
          stats.totalChanges
        }}
        项变更记录
      </p>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NButton,
  NForm,
  NFormItem,
  NSelect,
  NInputNumber,
  NRadioGroup,
  NRadio
} from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'
import { useSearchStore } from '@/stores/search'
import { APP_VERSION, getChangelogStats } from '@/data/changelog'
import { ViewMode } from '@/types'

const router = useRouter()
const settingsStore = useSettingsStore()
const searchStore = useSearchStore()

const version = APP_VERSION
const stats = getChangelogStats()

const themeMode = ref(settingsStore.preferences.theme.mode)
const pageSize = ref(searchStore.pageSize)
const defaultView = ref(searchStore.viewMode)

const themeModeOptions = [
  { label: '跟随系统', value: 'auto' },
  { label: '浅色模式', value: 'light' },
  { label: '深色模式', value: 'dark' }
]

const handleThemeChange = (value: 'light' | 'dark' | 'auto') => {
  settingsStore.setThemeMode(value)
}

const handlePageSizeChange = (value: number | null) => {
  if (value !== null) {
    searchStore.pageSize = value
  }
}

const handleViewChange = (value: string) => {
  searchStore.viewMode = value === 'list' ? ViewMode.LIST : ViewMode.GRID
}
</script>

<style scoped>
.settings-view {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.settings-content {
  padding: 20px 0;
}

.about-card {
  margin-top: 16px;
}

.about-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.about-version-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.about-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.about-version {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--text-main);
}

.about-meta {
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-muted);
}
</style>