<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    title="高级筛选"
    size="medium"
    :mask-closable="false"
    style="width: 600px"
  >
    <template #header-extra>
      <n-button quaternary circle @click="handleReset">
        <template #icon>
          <n-icon><refresh-outline /></n-icon>
        </template>
      </n-button>
    </template>

    <n-form ref="formRef" :model="filterForm" label-placement="left" label-width="100">
      <!-- 文件类型筛选 -->
      <n-form-item label="文件类型">
        <n-checkbox-group v-model:value="filterForm.categories">
          <n-space>
            <n-checkbox value="document" label="文档" />
            <n-checkbox value="image" label="图片" />
            <n-checkbox value="video" label="视频" />
            <n-checkbox value="audio" label="音频" />
            <n-checkbox value="code" label="代码" />
            <n-checkbox value="archive" label="压缩包" />
            <n-checkbox value="other" label="其他" />
          </n-space>
        </n-checkbox-group>
      </n-form-item>

      <!-- 文件大小筛选 -->
      <n-form-item label="文件大小">
        <n-space vertical style="width: 100%">
          <n-radio-group v-model:value="filterForm.sizeType">
            <n-space>
              <n-radio value="any" label="任意大小" />
              <n-radio value="range" label="指定范围" />
              <n-radio value="preset" label="预设范围" />
            </n-space>
          </n-radio-group>
          
          <div v-if="filterForm.sizeType === 'range'" class="size-range">
            <n-space align="center">
              <n-input-number
                v-model:value="filterForm.minSize"
                placeholder="最小"
                :min="0"
                style="width: 120px"
              />
              <span>-</span>
              <n-input-number
                v-model:value="filterForm.maxSize"
                placeholder="最大"
                :min="0"
                style="width: 120px"
              />
              <n-select
                v-model:value="filterForm.sizeUnit"
                :options="sizeUnitOptions"
                style="width: 80px"
              />
            </n-space>
          </div>
          
          <div v-if="filterForm.sizeType === 'preset'">
            <n-select
              v-model:value="filterForm.presetSize"
              :options="presetSizeOptions"
              placeholder="选择预设范围"
            />
          </div>
        </n-space>
      </n-form-item>

      <!-- 修改时间筛选 -->
      <n-form-item label="修改时间">
        <n-space vertical style="width: 100%">
          <n-radio-group v-model:value="filterForm.dateType">
            <n-space>
              <n-radio value="any" label="任意时间" />
              <n-radio value="range" label="指定范围" />
              <n-radio value="preset" label="预设范围" />
            </n-space>
          </n-radio-group>
          
          <div v-if="filterForm.dateType === 'range'">
            <n-space>
              <n-date-picker
                v-model:value="filterForm.startDate"
                type="date"
                placeholder="开始日期"
                style="width: 150px"
              />
              <span>-</span>
              <n-date-picker
                v-model:value="filterForm.endDate"
                type="date"
                placeholder="结束日期"
                style="width: 150px"
              />
            </n-space>
          </div>
          
          <div v-if="filterForm.dateType === 'preset'">
            <n-select
              v-model:value="filterForm.presetDate"
              :options="presetDateOptions"
              placeholder="选择时间范围"
            />
          </div>
        </n-space>
      </n-form-item>

      <!-- 标签筛选 -->
      <n-form-item label="标签">
        <n-dynamic-tags
          v-model:value="filterForm.tags"
          :max="10"
          placeholder="添加标签筛选"
        />
      </n-form-item>

      <!-- 路径筛选 -->
      <n-form-item label="路径包含">
        <n-input
          v-model:value="filterForm.pathContains"
          placeholder="输入路径关键词"
          clearable
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button @click="handleReset" secondary>重置</n-button>
        <n-button @click="handleApply" type="primary">应用筛选</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NButton,
  NSpace,
  NIcon,
  NCheckboxGroup,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NInputNumber,
  NSelect,
  NDatePicker,
  NDynamicTags,
  NInput,
  type FormInst
} from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { useSearchStore } from '@/stores/search'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchStore = useSearchStore()
const formRef = ref<FormInst | null>(null)

// 筛选表单数据
const filterForm = reactive({
  categories: [] as string[],
  sizeType: 'any' as 'any' | 'range' | 'preset',
  minSize: null as number | null,
  maxSize: null as number | null,
  sizeUnit: 'MB' as 'B' | 'KB' | 'MB' | 'GB',
  presetSize: null as string | null,
  dateType: 'any' as 'any' | 'range' | 'preset',
  startDate: null as number | null,
  endDate: null as number | null,
  presetDate: null as string | null,
  tags: [] as string[],
  pathContains: ''
})

// 计算属性
const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value)
})

// 选项数据
const sizeUnitOptions = [
  { label: 'B', value: 'B' },
  { label: 'KB', value: 'KB' },
  { label: 'MB', value: 'MB' },
  { label: 'GB', value: 'GB' }
]

const presetSizeOptions = [
  { label: '小文件 (< 1MB)', value: 'small' },
  { label: '中等文件 (1MB - 10MB)', value: 'medium' },
  { label: '大文件 (10MB - 100MB)', value: 'large' },
  { label: '超大文件 (> 100MB)', value: 'xlarge' }
]

const presetDateOptions = [
  { label: '今天', value: 'today' },
  { label: '昨天', value: 'yesterday' },
  { label: '最近7天', value: 'week' },
  { label: '最近30天', value: 'month' },
  { label: '最近3个月', value: 'quarter' },
  { label: '最近一年', value: 'year' }
]

// 监听显示状态，初始化表单
watch(() => props.show, (show) => {
  if (show) {
    initForm()
  }
})

// 初始化表单
function initForm() {
  const filter = searchStore.searchFilter
  
  filterForm.categories = filter.category ? [filter.category] : []
  filterForm.tags = [...filter.tags]
  
  // 恢复大小筛选
  if (filter.sizeRange.min !== undefined || filter.sizeRange.max !== undefined) {
    filterForm.sizeType = 'range'
    filterForm.minSize = filter.sizeRange.min || null
    filterForm.maxSize = filter.sizeRange.max || null
  } else {
    filterForm.sizeType = 'any'
    filterForm.minSize = null
    filterForm.maxSize = null
  }
  
  // 恢复日期筛选
  if (filter.dateRange.start || filter.dateRange.end) {
    filterForm.dateType = 'range'
    filterForm.startDate = filter.dateRange.start ? new Date(filter.dateRange.start).getTime() : null
    filterForm.endDate = filter.dateRange.end ? new Date(filter.dateRange.end).getTime() : null
  } else {
    filterForm.dateType = 'any'
    filterForm.startDate = null
    filterForm.endDate = null
  }
}

// 事件处理
function handleApply() {
  const filter = {
    keyword: searchStore.searchFilter.keyword, // 保持现有的keyword
    category: filterForm.categories.length > 0 ? filterForm.categories[0] : '', // 只取第一个分类
    tags: [...filterForm.tags],
    dateRange: {
      start: undefined as string | undefined,
      end: undefined as string | undefined
    },
    sizeRange: {
      min: undefined as number | undefined,
      max: undefined as number | undefined
    }
  }

  // 处理文件大小筛选
  if (filterForm.sizeType === 'range') {
    if (filterForm.minSize !== null) {
      filter.sizeRange.min = convertToBytes(filterForm.minSize, filterForm.sizeUnit)
    }
    if (filterForm.maxSize !== null) {
      filter.sizeRange.max = convertToBytes(filterForm.maxSize, filterForm.sizeUnit)
    }
  } else if (filterForm.sizeType === 'preset' && filterForm.presetSize) {
    const presetSizes = {
      small: { max: 1024 * 1024 }, // 1MB
      medium: { min: 1024 * 1024, max: 10 * 1024 * 1024 }, // 1MB - 10MB
      large: { min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 }, // 10MB - 100MB
      xlarge: { min: 100 * 1024 * 1024 } // > 100MB
    }
    const preset = presetSizes[filterForm.presetSize as keyof typeof presetSizes]
    if ('min' in preset) filter.sizeRange.min = preset.min
    if ('max' in preset) filter.sizeRange.max = preset.max
  }

  // 处理时间筛选
  if (filterForm.dateType === 'range') {
    if (filterForm.startDate) {
      filter.dateRange.start = new Date(filterForm.startDate).toISOString()
    }
    if (filterForm.endDate) {
      filter.dateRange.end = new Date(filterForm.endDate).toISOString()
    }
  } else if (filterForm.dateType === 'preset' && filterForm.presetDate) {
    const now = new Date()
    const presetDates = {
      today: { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      yesterday: { 
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      },
      week: { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      month: { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      quarter: { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
      year: { start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
    }
    const preset = presetDates[filterForm.presetDate as keyof typeof presetDates]
    if ('start' in preset) {
      filter.dateRange.start = preset.start.toISOString()
    }
    if ('end' in preset) {
      filter.dateRange.end = preset.end.toISOString()
    }
  }

  searchStore.setSearchFilter(filter)
  visible.value = false
}

function handleCancel() {
  visible.value = false
}

function handleReset() {
  Object.assign(filterForm, {
    categories: [],
    sizeType: 'any',
    minSize: null,
    maxSize: null,
    sizeUnit: 'MB',
    presetSize: null,
    dateType: 'any',
    startDate: null,
    endDate: null,
    presetDate: null,
    tags: [],
    pathContains: ''
  })
}

// 工具函数
function convertToBytes(size: number, unit: string): number {
  const units = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024
  }
  return size * units[unit as keyof typeof units]
}
</script>

<style scoped>
.size-range {
  margin-top: 8px;
}
</style>