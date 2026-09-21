<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NCard,
  NUpload,
  NUploadDragger,
  NIcon,
  NSelect,
  NInput,
  NButton,
  NSpace,
  NAlert,
  NTabs,
  NTab,
  NTag,
  NTooltip,
  useMessage,
  type UploadFileInfo,
} from 'naive-ui'
import {
  CloudUploadOutline,
  DocumentOutline,
  DocumentTextOutline,
  FolderOpenOutline,
  ColorPaletteOutline,
  CodeSlashOutline,
  ImageOutline,
  CloseOutline,
  TrashOutline,
  CheckmarkCircleOutline,
  AlertCircleOutline,
} from '@vicons/ionicons5'
import { useFilesStore } from '@/stores/files'

const filesStore = useFilesStore()
const message = useMessage()

// 事件
const emit = defineEmits<{
  success: []
}>()

// 上传模式: 'files' (单文件或多文件组合) | 'directory' (整站文件夹)
const uploadMode = ref<'files' | 'directory'>('files')

// 表单数据
const selectedCategory = ref<string>('')
const newCategory = ref('')
const projectName = ref('')
const fileList = ref<UploadFileInfo[]>([])

// 计算属性
const categoryOptions = computed(() => {
  const categories = filesStore.categories.map((cat) => ({
    label: cat.name,
    value: cat.name,
  }))
  return [...categories, { label: '+ 新建分类', value: '__new__' }]
})

const isNewCategory = computed(() => selectedCategory.value === '__new__')

const effectiveCategory = computed(() => {
  if (isNewCategory.value) {
    return newCategory.value.trim()
  }
  return selectedCategory.value
})

// 支持的文件扩展名
const supportedExtensions = [
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.map',
  '.txt',
  '.xml',
]

// 计算总文件大小
const totalSize = computed(() => {
  return fileList.value.reduce((sum, f) => sum + (f.file?.size || 0), 0)
})

// 检查是否包含 HTML 文件
const hasHtmlFile = computed(() => {
  return fileList.value.some((f) => {
    const name = f.name.toLowerCase()
    return name.endsWith('.html') || name.endsWith('.htm')
  })
})

type FileWithRelativePath = File & { webkitRelativePath?: string }

// 检查是否包含 index.html 主入口
const hasIndexHtml = computed(() => {
  return fileList.value.some((f) => {
    const name = f.name.toLowerCase()
    const relativePath = ((f.file as FileWithRelativePath | undefined)?.webkitRelativePath || '').toLowerCase()
    return name === 'index.html' || relativePath.endsWith('/index.html')
  })
})

// 是否为多文件项目
const isMultiFile = computed(() => fileList.value.length > 1)

// 是否可以提交上传
const canUpload = computed(() => {
  if (fileList.value.length === 0 || effectiveCategory.value === '') return false
  if (!hasHtmlFile.value) return false
  if (isMultiFile.value && !projectName.value.trim()) return false
  return true
})

// 切换上传模式
function handleModeChange(mode: string | number) {
  uploadMode.value = mode === 'directory' ? 'directory' : 'files'
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// 根据文件扩展名获取对应矢量图标及样式类
function getFileIcon(fileName: string) {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    return { icon: DocumentTextOutline, color: '#f97316' }
  }
  if (lower.endsWith('.css')) {
    return { icon: ColorPaletteOutline, color: '#0ea5e9' }
  }
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) {
    return { icon: CodeSlashOutline, color: '#eab308' }
  }
  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.ico')
  ) {
    return { icon: ImageOutline, color: '#10b981' }
  }
  return { icon: DocumentOutline, color: '#6b7280' }
}

// 获取展示路径
function getDisplayPath(file: UploadFileInfo): string {
  const relativePath = (file.file as FileWithRelativePath | undefined)?.webkitRelativePath
  return relativePath || file.name
}

// 移除单个选定文件
function handleRemoveFile(fileId: string) {
  fileList.value = fileList.value.filter((f) => f.id !== fileId)
  if (fileList.value.length === 0) {
    projectName.value = ''
  } else if (fileList.value.length === 1 && !projectName.value) {
    const first = fileList.value[0]
    if (first) {
      const singleName = first.name.replace(/\.(html|htm)$/i, '')
      projectName.value = singleName
    }
  }
}

// 清空所有选定文件
function handleClearFiles() {
  fileList.value = []
  projectName.value = ''
}

// 文件变化处理
function handleFileChange(files: UploadFileInfo[]) {
  // 过滤支持的静态资源
  const validFiles = files.filter((file) => {
    const name = file.name.toLowerCase()
    return supportedExtensions.some((ext) => name.endsWith(ext))
  })

  fileList.value = validFiles

  // 智能推导项目名称
  if (validFiles.length > 0) {
    // 1. 如果是文件夹模式上传，尝试从 webkitRelativePath 提取根文件夹名称
    const firstFile = validFiles[0]?.file as File & { webkitRelativePath?: string }
    if (firstFile?.webkitRelativePath) {
      const parts = firstFile.webkitRelativePath.split('/')
      if (parts.length > 1 && parts[0] && !projectName.value) {
        projectName.value = parts[0]
      }
    } else if (validFiles.length === 1 && validFiles[0]) {
      // 2. 如果是单个文件，且是 HTML 文件，自动提取文件名（去扩展名）
      const singleFileName = validFiles[0].name
      if (singleFileName.toLowerCase().endsWith('.html') || singleFileName.toLowerCase().endsWith('.htm')) {
        if (!projectName.value) {
          projectName.value = singleFileName.replace(/\.(html|htm)$/i, '')
        }
      }
    }
  }
}

// 执行上传操作
async function handleUpload() {
  if (!canUpload.value) {
    if (fileList.value.length === 0) {
      message.warning('请选择需要上传的文件')
      return
    }
    if (!hasHtmlFile.value) {
      message.error('静态托管项目必须包含至少一个 HTML 文件')
      return
    }
    if (!effectiveCategory.value) {
      message.warning('请选择或输入项目分类')
      return
    }
    if (isMultiFile.value && !projectName.value.trim()) {
      message.warning('多文件项目必须填写项目名称以创建独立目录')
      return
    }
    return
  }

  const files = fileList.value
    .map((f) => f.file)
    .filter((f): f is File => f !== null && f !== undefined)

  if (files.length === 0) {
    message.error('文件无效')
    return
  }

  const success = await filesStore.uploadFiles(
    files,
    effectiveCategory.value,
    projectName.value.trim() || undefined,
  )

  if (success) {
    message.success('上传成功')
    fileList.value = []
    projectName.value = ''
    if (isNewCategory.value) {
      selectedCategory.value = newCategory.value.trim()
      newCategory.value = ''
    }
    emit('success')
  } else {
    message.error(filesStore.error || '上传失败')
  }
}

// 自定义上传阻止默认行为
function customRequest() {
  return
}
</script>

<template>
  <n-card title="上传静态项目" :bordered="false" class="upload-dialog-card">
    <n-space vertical size="large">
      <!-- 错误提示 -->
      <n-alert v-if="filesStore.error" type="error" closable>
        {{ filesStore.error }}
      </n-alert>

      <!-- 上传模式切换 Tabs -->
      <div class="mode-tabs-container">
        <n-tabs
          type="segment"
          animated
          :value="uploadMode"
          @update:value="handleModeChange"
        >
          <n-tab name="files">
            <template #default>
              <div class="tab-label">
                <n-icon size="16"><DocumentTextOutline /></n-icon>
                <span>文件选择 (单文件 / 多文件组合)</span>
              </div>
            </template>
          </n-tab>
          <n-tab name="directory">
            <template #default>
              <div class="tab-label">
                <n-icon size="16"><FolderOpenOutline /></n-icon>
                <span>整站文件夹 (保留深层目录)</span>
              </div>
            </template>
          </n-tab>
        </n-tabs>
      </div>

      <!-- 文件上传区域：根据模式绑定不同的 directory 属性 -->
      <div class="upload-dropzone-wrapper">
        <!-- 模式一：单文件 / 多文件自由组合模式 (无 directory，支持 Shift/Ctrl 复选多文件) -->
        <n-upload
          v-if="uploadMode === 'files'"
          :file-list="fileList"
          multiple
          :directory="false"
          :accept="supportedExtensions.join(',')"
          :custom-request="customRequest"
          :show-file-list="false"
          @update:file-list="handleFileChange"
        >
          <n-upload-dragger>
            <div class="dropzone-content">
              <div class="icon-avatar">
                <n-icon size="40" color="#6366f1">
                  <DocumentTextOutline />
                </n-icon>
              </div>
              <div class="dropzone-text-main">
                点击选择文件组合 或 拖拽文件到此处
              </div>
              <div class="dropzone-text-sub">
                支持按住 Shift / Ctrl 多选文件 (HTML + CSS + JS + 静态资源组合)
              </div>
              <div class="supported-tags">
                <span class="file-badge">.html</span>
                <span class="file-badge">.css</span>
                <span class="file-badge">.js</span>
                <span class="file-badge">.json</span>
                <span class="file-badge">图片/字体</span>
              </div>
            </div>
          </n-upload-dragger>
        </n-upload>

        <!-- 模式二：完整项目文件夹模式 (带 directory，保留子目录结构) -->
        <n-upload
          v-else
          :file-list="fileList"
          multiple
          directory
          directory-dnd
          :accept="supportedExtensions.join(',')"
          :custom-request="customRequest"
          :show-file-list="false"
          @update:file-list="handleFileChange"
        >
          <n-upload-dragger>
            <div class="dropzone-content">
              <div class="icon-avatar avatar-folder">
                <n-icon size="40" color="#0ea5e9">
                  <FolderOpenOutline />
                </n-icon>
              </div>
              <div class="dropzone-text-main">
                点击选择整站文件夹 或 拖拽文件夹到此处
              </div>
              <div class="dropzone-text-sub">
                自动递归扫描并保留内部 assets/、css/、js/ 等子目录层级结构
              </div>
              <div class="supported-tags">
                <span class="file-badge">递归子目录</span>
                <span class="file-badge">自动保留相对路径</span>
              </div>
            </div>
          </n-upload-dragger>
        </n-upload>
      </div>

      <!-- 入口与规则提示 -->
      <div v-if="fileList.length > 0" class="entrypoint-status-bar">
        <div v-if="hasIndexHtml" class="status-tip success">
          <n-icon size="16"><CheckmarkCircleOutline /></n-icon>
          <span>已成功识别主入口文件：<code>index.html</code></span>
        </div>
        <div v-else-if="hasHtmlFile" class="status-tip info">
          <n-icon size="16"><CheckmarkCircleOutline /></n-icon>
          <span>已包含 HTML 页面，建议在项目名称中注明该页面的用途</span>
        </div>
        <div v-else class="status-tip warning">
          <n-icon size="16"><AlertCircleOutline /></n-icon>
          <span>警告：当前未包含任何 .html 文件，静态托管网站必须包含至少一个 HTML 页面</span>
        </div>
      </div>

      <!-- 已选文件清单与快速管理 -->
      <div v-if="fileList.length > 0" class="selected-files-section">
        <div class="section-header">
          <div class="header-title">
            <span>已选清单 ({{ fileList.length }} 个文件)</span>
            <span class="total-size-badge">{{ formatFileSize(totalSize) }}</span>
          </div>
          <n-button size="tiny" quaternary type="error" @click="handleClearFiles">
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
            清空已选
          </n-button>
        </div>

        <div class="file-items-scroll">
          <div
            v-for="file in fileList"
            :key="file.id"
            class="selected-file-row"
          >
            <div class="file-meta">
              <n-icon size="16" :color="getFileIcon(file.name).color">
                <component :is="getFileIcon(file.name).icon" />
              </n-icon>
              <span class="file-display-name" :title="getDisplayPath(file)">
                {{ getDisplayPath(file) }}
              </span>
              <n-tag
                v-if="file.name.toLowerCase() === 'index.html'"
                type="success"
                size="tiny"
                :bordered="false"
              >
                主入口
              </n-tag>
            </div>
            <div class="file-action-area">
              <span class="file-size-text">
                {{ formatFileSize(file.file?.size ?? 0) }}
              </span>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <button
                    class="btn-remove-item"
                    type="button"
                    @click.stop="handleRemoveFile(file.id)"
                  >
                    <n-icon size="14"><CloseOutline /></n-icon>
                  </button>
                </template>
                移除此文件
              </n-tooltip>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类与项目信息表单 -->
      <div class="form-grid">
        <!-- 分类选择 -->
        <div class="form-item">
          <div class="form-label">项目分类 <span class="required-star">*</span></div>
          <n-select
            v-model:value="selectedCategory"
            :options="categoryOptions"
            placeholder="请选择或创建分类"
            filterable
          />
        </div>

        <!-- 新建分类输入 -->
        <div v-if="isNewCategory" class="form-item">
          <div class="form-label">新分类名称 <span class="required-star">*</span></div>
          <n-input v-model:value="newCategory" placeholder="请输入新分类名称" />
        </div>

        <!-- 项目名称 -->
        <div class="form-item">
          <div class="form-label">
            项目名称
            <span v-if="isMultiFile" class="required-star">* (多文件组合必填)</span>
            <span v-else class="optional-hint">(单文件可选，默认使用文件名)</span>
          </div>
          <n-input
            v-model:value="projectName"
            placeholder="例如: admin-dashboard 或 demo-page"
          />
        </div>
      </div>

      <!-- 提交上传按钮 -->
      <n-button
        type="primary"
        block
        size="large"
        :disabled="!canUpload"
        :loading="filesStore.uploading"
        @click="handleUpload"
      >
        <template #icon>
          <n-icon><CloudUploadOutline /></n-icon>
        </template>
        {{ isMultiFile ? '部署静态项目' : '上传静态网页' }}
      </n-button>
    </n-space>
  </n-card>
</template>

<style scoped>
.upload-dialog-card {
  padding: 0;
  background: transparent;
}

.mode-tabs-container {
  margin-bottom: 4px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.upload-dropzone-wrapper {
  border-radius: 8px;
  overflow: hidden;
}

.dropzone-content {
  padding: 24px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.icon-avatar.avatar-folder {
  background: rgba(14, 165, 233, 0.1);
}

.dropzone-text-main {
  font-size: 15px;
  font-weight: 600;
  color: var(--n-text-color);
  margin-bottom: 4px;
}

.dropzone-text-sub {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-bottom: 12px;
}

.supported-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.file-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  color: var(--n-text-color-2);
}

.entrypoint-status-bar {
  border-radius: 6px;
  overflow: hidden;
}

.status-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 6px;
}

.status-tip.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-tip.info {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.status-tip.warning {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-tip code {
  font-weight: 600;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 4px;
  border-radius: 3px;
}

.selected-files-section {
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--n-border-color);
}

.header-title {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-size-badge {
  font-size: 11px;
  font-weight: normal;
  color: var(--n-text-color-3);
  background: var(--n-color);
  padding: 1px 6px;
  border-radius: 10px;
  border: 1px solid var(--n-border-color);
}

.file-items-scroll {
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 4px;
  background: var(--n-color);
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.selected-file-row:hover {
  border-color: var(--n-border-color);
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.file-display-name {
  font-size: 12px;
  font-family: var(--font-mono, monospace);
  color: var(--n-text-color-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-action-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 8px;
}

.file-size-text {
  font-size: 11px;
  color: var(--n-text-color-3);
}

.btn-remove-item {
  border: none;
  background: transparent;
  color: var(--n-text-color-3);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-remove-item:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color);
}

.required-star {
  color: #ef4444;
  font-size: 12px;
}

.optional-hint {
  color: var(--n-text-color-3);
  font-size: 12px;
  font-weight: normal;
}
</style>

