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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
import { ViewMode } from '@/types'

const settingsStore = useSettingsStore()
const searchStore = useSearchStore()

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
</style>