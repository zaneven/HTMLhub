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
  useMessage,
  type UploadFileInfo
} from 'naive-ui'
import { CloudUploadOutline, DocumentOutline } from '@vicons/ionicons5'
import { useFilesStore } from '@/stores/files'

const filesStore = useFilesStore()
const message = useMessage()

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

const canUpload = computed(() => {
  return fileList.value.length > 0 && effectiveCategory.value !== ''
})

// 文件变化处理
function handleFileChange(files: UploadFileInfo[]) {
  // 只保留 HTML 文件
  fileList.value = files.filter(file => {
    const name = file.name.toLowerCase()
    return name.endsWith('.html') || name.endsWith('.htm')
  })
}

// 上传处理
async function handleUpload() {
  if (!canUpload.value) {
    message.warning('请选择文件和分类')
    return
  }

  const file = fileList.value[0]?.file
  if (!file) {
    message.error('文件无效')
    return
  }

  const success = await filesStore.uploadFile(
    file,
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
  } else {
    message.error(filesStore.error || '上传失败')
  }
}

// 自定义上传（阻止默认上传行为）
function customRequest() {
  // 不执行任何操作，由我们的 handleUpload 处理
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
        :max="1"
        accept=".html,.htm"
        :custom-request="customRequest"
        @update:file-list="handleFileChange"
      >
        <n-upload-dragger>
          <div style="padding: 24px">
            <n-icon size="48" :depth="3">
              <CloudUploadOutline />
            </n-icon>
            <n-text style="display: block; margin-top: 12px; font-size: 16px">
              点击或拖拽 HTML 文件到此处上传
            </n-text>
            <n-text depth="3" style="display: block; margin-top: 8px">
              仅支持 .html 或 .htm 文件
            </n-text>
          </div>
        </n-upload-dragger>
      </n-upload>

      <!-- 已选文件预览 -->
      <div v-if="fileList.length > 0" style="display: flex; align-items: center; gap: 8px; padding: 12px; background: var(--n-color-embedded); border-radius: 6px">
        <n-icon size="20" color="#18a058">
          <DocumentOutline />
        </n-icon>
        <span>{{ fileList[0]?.name }}</span>
        <span style="color: var(--n-text-color-3); margin-left: auto">
          {{ ((fileList[0]?.file?.size ?? 0) / 1024).toFixed(1) }} KB
        </span>
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

      <!-- 项目名称（可选） -->
      <div>
        <n-text style="display: block; margin-bottom: 8px">
          项目名称 <span style="color: var(--n-text-color-3)">(可选，留空则使用文件名)</span>
        </n-text>
        <n-input
          v-model:value="projectName"
          placeholder="自定义项目名称"
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
        上传文件
      </n-button>
    </n-space>
  </n-card>
</template>
