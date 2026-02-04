<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NIcon,
  NButton,
  NSpace,
  NSpin,
  NEmpty,
  NTag,
  NPopconfirm,
  NUpload,
  NUploadDragger,
  useMessage,
  type UploadFileInfo,
} from 'naive-ui'
import {
  CloseOutline,
  DocumentOutline,
  RefreshOutline,
  TrashOutline,
  AddOutline,
  FolderOpenOutline,
} from '@vicons/ionicons5'
import { useFilesStore } from '@/stores/files'
import type { ProjectInfo } from '@/types'

const props = defineProps<{
  project: ProjectInfo
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const filesStore = useFilesStore()
const message = useMessage()

// 状态
const loading = ref(false)
const files = ref<
  Array<{
    name: string
    key: string
    size: number
    type: string
    modifiedAt: string
  }>
>([])
const showUpload = ref(false)
const uploading = ref(false)

// 支持的文件扩展名
const supportedExtensions = [
  '.html',
  '.htm',
  '.js',
  '.css',
  '.json',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
]

// 加载项目文件列表
async function loadFiles() {
  loading.value = true
  try {
    const result = await filesStore.listProjectFiles(props.project.path)
    files.value = result
  } catch {
    message.error('加载项目文件失败')
  } finally {
    loading.value = false
  }
}

// 删除文件
async function handleDeleteFile(fileKey: string, fileName: string) {
  loading.value = true
  try {
    const success = await filesStore.deleteProjectFile(fileKey)
    if (success) {
      message.success(`已删除 ${fileName}`)
      await loadFiles()
      emit('saved')
    } else {
      message.error(filesStore.error || '删除失败')
    }
  } catch {
    message.error('删除失败')
  } finally {
    loading.value = false
  }
}

// 处理文件上传
async function handleUpload(options: { file: UploadFileInfo }) {
  const file = options.file.file
  if (!file) return

  uploading.value = true
  try {
    const success = await filesStore.addProjectFile(file, props.project.path)
    if (success) {
      message.success(`已添加 ${file.name}`)
      await loadFiles()
      showUpload.value = false
      emit('saved')
    } else {
      message.error(filesStore.error || '添加失败')
    }
  } catch {
    message.error('添加失败')
  } finally {
    uploading.value = false
  }
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// 获取文件类型标签
function getFileTypeLabel(type: string): string {
  if (type.includes('html')) return 'HTML'
  if (type.includes('css')) return 'CSS'
  if (type.includes('javascript')) return 'JS'
  if (type.includes('json')) return 'JSON'
  if (type.includes('svg')) return 'SVG'
  if (type.includes('image')) return '图片'
  if (type.includes('font')) return '字体'
  return '文件'
}

// 关闭编辑器
function handleClose() {
  emit('close')
}

onMounted(() => {
  loadFiles()
})
</script>

<template>
  <div class="project-editor">
    <!-- 头部 -->
    <div class="editor-header">
      <div class="header-left">
        <h3>{{ project.name }}</h3>
        <n-tag type="info" size="small">{{ project.category }}</n-tag>
        <n-tag size="small">{{ files.length }} 个文件</n-tag>
      </div>
      <div class="header-right">
        <n-space>
          <n-button size="small" type="primary" @click="showUpload = true">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            添加文件
          </n-button>
          <n-button size="small" quaternary @click="loadFiles">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
          </n-button>
          <n-button size="small" quaternary @click="handleClose">
            <template #icon>
              <n-icon><CloseOutline /></n-icon>
            </template>
            关闭
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 上传区域 -->
    <div v-if="showUpload" class="upload-area">
      <n-upload
        multiple
        :accept="supportedExtensions.join(',')"
        :custom-request="handleUpload as any"
        :show-file-list="false"
        :disabled="uploading"
      >
        <n-upload-dragger>
          <div class="upload-content">
            <n-icon size="32" :depth="3">
              <FolderOpenOutline />
            </n-icon>
            <p>点击或拖拽文件到此处添加</p>
            <p class="upload-hint">支持 HTML/JS/CSS/JSON/图片等静态资源</p>
          </div>
        </n-upload-dragger>
      </n-upload>
      <n-button size="small" quaternary style="margin-top: 8px" @click="showUpload = false">
        取消
      </n-button>
    </div>

    <!-- 加载状态 -->
    <n-spin :show="loading" description="加载中...">
      <div class="file-list">
        <div v-if="files.length === 0 && !loading" class="file-list-empty">
          <n-empty description="项目中没有文件" />
        </div>

        <div v-else class="file-items">
          <div v-for="file in files" :key="file.key" class="file-item">
            <div class="file-info">
              <n-icon size="18" class="file-icon">
                <DocumentOutline />
              </n-icon>
              <span class="file-name">{{ file.name }}</span>
              <n-tag size="small" :bordered="false">{{ getFileTypeLabel(file.type) }}</n-tag>
              <span class="file-size">{{ formatSize(file.size) }}</span>
            </div>
            <div class="file-actions">
              <n-popconfirm @positive-click="handleDeleteFile(file.key, file.name)">
                <template #trigger>
                  <n-button size="tiny" quaternary type="error">
                    <template #icon>
                      <n-icon><TrashOutline /></n-icon>
                    </template>
                    删除
                  </n-button>
                </template>
                确定要删除 "{{ file.name }}" 吗？
              </n-popconfirm>
            </div>
          </div>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<style scoped>
.project-editor {
  display: flex;
  flex-direction: column;
  max-height: 70vh;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color-embedded);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.upload-area {
  padding: 16px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color-embedded);
}

.upload-content {
  padding: 16px;
  text-align: center;
}

.upload-content p {
  margin: 8px 0 0;
  font-size: 14px;
}

.upload-hint {
  color: var(--n-text-color-3);
  font-size: 12px !important;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

.file-list-empty {
  padding: 48px;
  text-align: center;
}

.file-items {
  padding: 8px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.file-item:hover {
  background: var(--n-color-embedded);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  flex-shrink: 0;
  color: var(--n-text-color-3);
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
}

.file-size {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.file-actions {
  flex-shrink: 0;
  margin-left: 12px;
}
</style>
