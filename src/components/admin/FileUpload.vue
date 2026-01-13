<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NCard,
  NUpload,
  NUploadDragger,
  NIcon,
  NText,
  NSelect,
  NInput,
  NButton,
  NSpace,
  NAlert,
  NList,
  NListItem,
  useMessage,
  type UploadFileInfo
} from 'naive-ui'
import { CloudUploadOutline, DocumentOutline, TrashOutline } from '@vicons/ionicons5'
import { useFilesStore } from '@/stores/files'

const filesStore = useFilesStore()
const message = useMessage()

// 事件
const emit = defineEmits<{
  success: []
}>()

// 表单数据
const selectedCategory = ref<string>('')
const newCategory = ref('')
const projectName = ref('')
const fileList = ref<UploadFileInfo[]>([])

// 计算属性
const categoryOptions = computed(() => {
  const categories = filesStore.categories.map(cat => ({
    label: cat.name,
    value: cat.name
  }))
  // 添加"新建分类"选项
  return [
    ...categories,
    { label: '+ 新建分类', value: '__new__' }
  ]
})

const isNewCategory = computed(() => selectedCategory.value === '__new__')

const effectiveCategory = computed(() => {
  if (isNewCategory.value) {
    return newCategory.value.trim()
  }
  return selectedCategory.value
})

// 是否为多文件项目
const isMultiFile = computed(() => fileList.value.length > 1)

// 必须有文件、分类，多文件时必须有项目名
const canUpload = computed(() => {
  if (fileList.value.length === 0 || effectiveCategory.value === '') return false
  if (isMultiFile.value && !projectName.value.trim()) return false
  return true
})

// 计算总文件大小
const totalSize = computed(() => {
  return fileList.value.reduce((sum, f) => sum + (f.file?.size || 0), 0)
})

// 文件变化处理 - 支持多种文件类型
function handleFileChange(files: UploadFileInfo[]) {
  // 保留 HTML/JS/CSS 等静态资源文件
  fileList.value = files.filter(file => {
    const name = file.name.toLowerCase()
    return name.endsWith('.html') || 
           name.endsWith('.htm') || 
           name.endsWith('.js') || 
           name.endsWith('.css') ||
           name.endsWith('.json') ||
           name.endsWith('.svg') ||
           name.endsWith('.png') ||
           name.endsWith('.jpg') ||
           name.endsWith('.jpeg') ||
           name.endsWith('.gif') ||
           name.endsWith('.ico') ||
           name.endsWith('.woff') ||
           name.endsWith('.woff2') ||
           name.endsWith('.ttf')
  })
}

// 上传处理
async function handleUpload() {
  if (!canUpload.value) {
    if (isMultiFile.value && !projectName.value.trim()) {
      message.warning('多文件项目必须填写项目名称')
    } else {
      message.warning('请选择文件和分类')
    }
    return
  }

  // 收集所有有效文件
  const files = fileList.value
    .map(f => f.file)
    .filter((f): f is File => f !== null && f !== undefined)

  if (files.length === 0) {
    message.error('文件无效')
    return
  }

  const success = await filesStore.uploadFiles(
    files,
    effectiveCategory.value,
    projectName.value.trim() || undefined
  )

  if (success) {
    message.success('上传成功')
    // 重置表单
    fileList.value = []
    projectName.value = ''
    if (isNewCategory.value) {
      selectedCategory.value = newCategory.value.trim()
      newCategory.value = ''
    }
    // 发出成功事件
    emit('success')
  } else {
    message.error(filesStore.error || '上传失败')
  }
}

// 自定义上传（阻止默认上传行为）
function customRequest() {
  return
}
</script>

<template>
  <n-card title="上传文件" :bordered="true">
    <n-space vertical size="large">
      <!-- 错误提示 -->
      <n-alert v-if="filesStore.error" type="error" closable>
        {{ filesStore.error }}
      </n-alert>

      <!-- 文件选择 -->
      <n-upload
        :file-list="fileList"
        multiple
        directory-dnd
        accept=".html,.htm,.js,.css,.json,.svg,.png,.jpg,.jpeg,.gif,.ico,.woff,.woff2,.ttf"
        :custom-request="customRequest"
        @update:file-list="handleFileChange"
      >
        <n-upload-dragger>
          <div style="padding: 24px">
            <n-icon size="48" :depth="3">
              <CloudUploadOutline />
            </n-icon>
            <n-text style="display: block; margin-top: 12px; font-size: 16px">
              点击或拖拽文件/文件夹到此处上传
            </n-text>
            <n-text depth="3" style="display: block; margin-top: 8px">
              支持 HTML/JS/CSS/图片等静态资源，可一次上传多个文件
            </n-text>
          </div>
        </n-upload-dragger>
      </n-upload>

      <!-- 已选文件列表 -->
      <div v-if="fileList.length > 0">
        <n-text style="display: block; margin-bottom: 8px">
          已选择 {{ fileList.length }} 个文件，共 {{ (totalSize / 1024).toFixed(1) }} KB
        </n-text>
        <div style="max-height: 150px; overflow-y: auto; background: var(--n-color-embedded); border-radius: 6px; padding: 8px">
          <div
            v-for="file in fileList"
            :key="file.id"
            style="display: flex; align-items: center; gap: 8px; padding: 4px 8px; font-size: 13px"
          >
            <n-icon size="16" color="#18a058">
              <DocumentOutline />
            </n-icon>
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
              {{ file.name }}
            </span>
            <span style="color: var(--n-text-color-3); font-size: 12px">
              {{ ((file.file?.size ?? 0) / 1024).toFixed(1) }} KB
            </span>
          </div>
        </div>
      </div>

      <!-- 分类选择 -->
      <div>
        <n-text style="display: block; margin-bottom: 8px">选择分类</n-text>
        <n-select
          v-model:value="selectedCategory"
          :options="categoryOptions"
          placeholder="选择或创建分类"
          filterable
        />
      </div>

      <!-- 新建分类输入 -->
      <div v-if="isNewCategory">
        <n-text style="display: block; margin-bottom: 8px">新分类名称</n-text>
        <n-input
          v-model:value="newCategory"
          placeholder="输入新分类名称"
        />
      </div>

      <!-- 项目名称 -->
      <div>
        <n-text style="display: block; margin-bottom: 8px">
          项目名称
          <span v-if="isMultiFile" style="color: #d03050">（多文件项目必填）</span>
          <span v-else style="color: var(--n-text-color-3)">(可选，留空则使用文件名)</span>
        </n-text>
        <n-input
          v-model:value="projectName"
          placeholder="输入项目名称"
        />
      </div>

      <!-- 上传按钮 -->
      <n-button
        type="primary"
        block
        :disabled="!canUpload"
        :loading="filesStore.uploading"
        @click="handleUpload"
      >
        <template #icon>
          <n-icon><CloudUploadOutline /></n-icon>
        </template>
        上传{{ isMultiFile ? '项目' : '文件' }}
      </n-button>
    </n-space>
  </n-card>
</template>
