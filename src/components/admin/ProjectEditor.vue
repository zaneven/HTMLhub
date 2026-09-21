<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  NInput,
  NTooltip,
  NModal,
  useMessage,
  type UploadCustomRequestOptions,
} from 'naive-ui'
import {
  CloseOutline,
  DocumentOutline,
  DocumentTextOutline,
  RefreshOutline,
  TrashOutline,
  FolderOpenOutline,
  OpenOutline,
  CopyOutline,
  ColorPaletteOutline,
  CodeSlashOutline,
  CodeWorkingOutline,
  ImageOutline,
  SearchOutline,
  CloudUploadOutline,
  DesktopOutline,
  PhonePortraitOutline,
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
const searchPattern = ref('')
const iframeKey = ref(0)
const previewDevice = ref<'desktop' | 'mobile'>('desktop')

// 增量上传弹窗状态
const showUploadModal = ref(false)
const uploadModalType = ref<'file' | 'directory'>('file')
const uploading = ref(false)

// 项目文件原始列表
interface ProjectFileInfo {
  name: string
  key: string
  size: number
  type: string
  modifiedAt: string
}
const rawFiles = ref<ProjectFileInfo[]>([])

// 搜索过滤后的文件列表
const filteredFiles = computed(() => {
  const q = searchPattern.value.trim().toLowerCase()
  if (!q) return rawFiles.value
  return rawFiles.value.filter((f) => f.name.toLowerCase().includes(q))
})

// 项目直链地址（固定预览当前项目根目录的 HTML 入口）
const projectLiveUrl = computed(() => {
  return filesStore.getFileUrl(props.project)
})

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// 统计信息
const projectStats = computed(() => {
  const list = rawFiles.value
  const totalBytes = list.reduce((sum, f) => sum + (f.size || 0), 0)
  return {
    totalFiles: list.length,
    totalSizeStr: formatSize(totalBytes),
  }
})

// 根据扩展名匹配矢量图标与颜色
function getFileVisual(name: string) {
  const lower = name.toLowerCase()
  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    return { icon: DocumentTextOutline, color: '#f97316' }
  }
  if (lower.endsWith('.css')) {
    return { icon: ColorPaletteOutline, color: '#0ea5e9' }
  }
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) {
    return { icon: CodeSlashOutline, color: '#eab308' }
  }
  if (lower.endsWith('.json')) {
    return { icon: CodeWorkingOutline, color: '#a855f7' }
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

// 加载项目文件列表
async function loadFiles() {
  loading.value = true
  try {
    const result = await filesStore.listProjectFiles(props.project.path)
    rawFiles.value = result
  } catch {
    message.error('加载项目文件失败')
  } finally {
    loading.value = false
  }
}

// 删除单个文件
async function handleDeleteFile(fileKey: string, fileName: string) {
  loading.value = true
  try {
    const success = await filesStore.deleteProjectFile(fileKey)
    if (success) {
      message.success(`已删除 ${fileName}`)
      await loadFiles()
      iframeKey.value++ // 刷新右侧预览
      emit('saved')
    } else {
      message.error(filesStore.error || '删除失败')
    }
  } catch {
    message.error('删除操作异常')
  } finally {
    loading.value = false
  }
}

// 打开上传弹窗
function openUploadModal(type: 'file' | 'directory') {
  uploadModalType.value = type
  showUploadModal.value = true
}

// 处理增量上传
async function handleIncrementalUpload(options: UploadCustomRequestOptions) {
  const file = options.file.file
  if (!file) return

  uploading.value = true
  try {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
    const success = await filesStore.addProjectFile(file, props.project.path, relativePath)
    if (success) {
      message.success(`已添加: ${file.name}`)
      await loadFiles()
      iframeKey.value++ // 刷新右侧预览
      showUploadModal.value = false
      emit('saved')
    } else {
      message.error(filesStore.error || '上传失败')
    }
  } catch {
    message.error('上传发生异常')
  } finally {
    uploading.value = false
  }
}

// 复制直链
async function handleCopyLink() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(projectLiveUrl.value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = projectLiveUrl.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    message.success('已复制访问直链')
  } catch {
    message.error('复制直链失败')
  }
}

// 刷新右侧预览页面
function handleRefreshPreview() {
  iframeKey.value++
  message.success('预览页面已刷新')
}

// 在新标签页打开页面
function handleOpenExternal() {
  window.open(projectLiveUrl.value, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  loadFiles()
})
</script>

<template>
  <div class="project-manager-wrapper">
    <!-- 顶部工作台标题栏 -->
    <header class="manager-header">
      <div class="header-left">
        <div class="brand-avatar">
          <n-icon size="20" color="#6366f1">
            <DocumentTextOutline />
          </n-icon>
        </div>
        <div class="brand-info">
          <div class="project-name-row">
            <h3 class="project-name">{{ project.name }}</h3>
            <n-tag type="info" size="tiny" round>{{ project.category }}</n-tag>
            <span class="meta-stat-pill">
              {{ projectStats.totalFiles }} 个文件 · {{ projectStats.totalSizeStr }}
            </span>
          </div>
          <div class="project-live-address" :title="projectLiveUrl">
            <span>在线地址: </span>
            <a :href="projectLiveUrl" target="_blank" rel="noopener noreferrer">
              {{ projectLiveUrl }}
            </a>
          </div>
        </div>
      </div>

      <div class="header-right">
        <n-space size="small" align="center">
          <n-button size="small" type="primary" @click="handleOpenExternal">
            <template #icon>
              <n-icon><OpenOutline /></n-icon>
            </template>
            在新标签页打开
          </n-button>
          <n-button size="small" secondary @click="handleCopyLink">
            <template #icon>
              <n-icon><CopyOutline /></n-icon>
            </template>
            复制直链
          </n-button>
          <n-button size="small" quaternary circle @click="$emit('close')">
            <template #icon>
              <n-icon><CloseOutline /></n-icon>
            </template>
          </n-button>
        </n-space>
      </div>
    </header>

    <!-- 双栏主体：左侧文件管理，右侧固定 HTML 网页实时预览 -->
    <div class="manager-body">
      <!-- 左栏：文件目录与管理 -->
      <aside class="files-sidebar">
        <!-- 工具操作栏 -->
        <div class="sidebar-toolbar">
          <n-input
            v-model:value="searchPattern"
            size="small"
            placeholder="搜索文件..."
            clearable
          >
            <template #prefix>
              <n-icon size="14" color="#9ca3af"><SearchOutline /></n-icon>
            </template>
          </n-input>

          <div class="sidebar-action-buttons">
            <n-button size="tiny" secondary type="primary" @click="openUploadModal('file')">
              <template #icon>
                <n-icon><CloudUploadOutline /></n-icon>
              </template>
              添加文件
            </n-button>
            <n-button size="tiny" secondary type="info" @click="openUploadModal('directory')">
              <template #icon>
                <n-icon><FolderOpenOutline /></n-icon>
              </template>
              添加文件夹
            </n-button>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button size="tiny" quaternary circle @click="loadFiles">
                  <template #icon>
                    <n-icon><RefreshOutline /></n-icon>
                  </template>
                </n-button>
              </template>
              刷新文件列表
            </n-tooltip>
          </div>
        </div>

        <!-- 文件列表 -->
        <div class="sidebar-file-list">
          <n-spin :show="loading">
            <div v-if="rawFiles.length === 0 && !loading" class="empty-status">
              <n-empty description="当前项目暂无文件" size="small" />
            </div>

            <div v-else-if="filteredFiles.length === 0 && !loading" class="empty-status">
              <n-empty description="未找到匹配的文件" size="small" />
            </div>

            <div v-else class="file-rows-wrapper">
              <div
                v-for="file in filteredFiles"
                :key="file.key"
                class="file-item-row"
              >
                <div class="item-left">
                  <n-icon size="16" :color="getFileVisual(file.name).color">
                    <component :is="getFileVisual(file.name).icon" />
                  </n-icon>
                  <span class="item-filename" :title="file.name">
                    {{ file.name }}
                  </span>
                  <span
                    v-if="file.name.toLowerCase() === 'index.html' || file.name.toLowerCase().endsWith('/index.html')"
                    class="entry-tag"
                  >
                    入口
                  </span>
                </div>

                <div class="item-right">
                  <span class="item-size">{{ formatSize(file.size) }}</span>
                  <n-popconfirm @positive-click="handleDeleteFile(file.key, file.name)">
                    <template #trigger>
                      <button class="btn-item-delete" type="button" title="删除文件">
                        <n-icon size="13"><TrashOutline /></n-icon>
                      </button>
                    </template>
                    确定要删除 "{{ file.name }}" 吗？
                  </n-popconfirm>
                </div>
              </div>
            </div>
          </n-spin>
        </div>

        <!-- 底部状态条 -->
        <footer class="sidebar-bottom-stat">
          <span>共 {{ projectStats.totalFiles }} 个文件</span>
          <span class="dot-separator">·</span>
          <span>总大小 {{ projectStats.totalSizeStr }}</span>
        </footer>
      </aside>

      <!-- 右栏：固定的 HTML 预览窗口 (始终预览项目根目录 HTML 入口) -->
      <main class="preview-stage">
        <!-- 预览控制条 -->
        <div class="preview-control-bar">
          <div class="control-bar-left">
            <span class="preview-title-badge">项目实时预览</span>
            <span class="preview-url-text" :title="projectLiveUrl">{{ projectLiveUrl }}</span>
          </div>

          <div class="control-bar-right">
            <n-space size="small" align="center">
              <!-- 设备视口切换 -->
              <div class="device-switch-group">
                <button
                  class="btn-device"
                  :class="{ 'is-active': previewDevice === 'desktop' }"
                  title="桌面视口 (100%)"
                  @click="previewDevice = 'desktop'"
                >
                  <n-icon size="15"><DesktopOutline /></n-icon>
                </button>
                <button
                  class="btn-device"
                  :class="{ 'is-active': previewDevice === 'mobile' }"
                  title="移动视口 (375px)"
                  @click="previewDevice = 'mobile'"
                >
                  <n-icon size="15"><PhonePortraitOutline /></n-icon>
                </button>
              </div>

              <!-- 刷新预览 -->
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button size="tiny" secondary @click="handleRefreshPreview">
                    <template #icon>
                      <n-icon><RefreshOutline /></n-icon>
                    </template>
                    刷新页面
                  </n-button>
                </template>
                重新加载右侧网页
              </n-tooltip>
            </n-space>
          </div>
        </div>

        <!-- 预览内容舞台 -->
        <div class="preview-viewport-container" :class="`device-${previewDevice}`">
          <div class="iframe-card">
            <iframe
              :key="iframeKey"
              :src="projectLiveUrl"
              class="live-iframe"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            ></iframe>
          </div>
        </div>
      </main>
    </div>

    <!-- 增量上传弹窗 -->
    <n-modal
      v-model:show="showUploadModal"
      preset="card"
      :title="uploadModalType === 'directory' ? '添加文件夹' : '添加文件'"
      style="width: 480px; max-width: 90vw"
    >
      <n-upload
        multiple
        :directory="uploadModalType === 'directory'"
        :custom-request="handleIncrementalUpload"
        :show-file-list="false"
        :disabled="uploading"
      >
        <n-upload-dragger>
          <div style="padding: 24px; text-align: center">
            <n-icon size="42" :color="uploadModalType === 'directory' ? '#0ea5e9' : '#6366f1'">
              <component :is="uploadModalType === 'directory' ? FolderOpenOutline : CloudUploadOutline" />
            </n-icon>
            <div style="margin-top: 12px; font-weight: 600; font-size: 15px">
              {{ uploadModalType === 'directory' ? '点击或拖拽文件夹到此处' : '点击或拖拽文件到此处' }}
            </div>
            <div style="margin-top: 6px; font-size: 12px; color: var(--n-text-color-3)">
              文件将保存到当前项目目录下，上传后右侧预览将自动刷新
            </div>
          </div>
        </n-upload-dragger>
      </n-upload>
    </n-modal>
  </div>
</template>

<style scoped>
.project-manager-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  min-height: 600px;
  background: var(--n-color);
  border-radius: 8px;
  overflow: hidden;
}

/* 顶部标题栏 */
.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color-embedded);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-info {
  min-width: 0;
}

.project-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color);
  white-space: nowrap;
}

.meta-stat-pill {
  font-size: 11px;
  color: var(--n-text-color-3);
}

.project-live-address {
  font-size: 11px;
  color: var(--n-text-color-3);
  font-family: var(--font-mono, monospace);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-live-address a {
  color: var(--n-text-color-2);
  text-decoration: none;
}

.project-live-address a:hover {
  text-decoration: underline;
  color: #6366f1;
}

/* 主体分栏 */
.manager-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 左栏：文件列表 */
.files-sidebar {
  width: 340px;
  border-right: 1px solid var(--n-border-color);
  background: var(--n-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-toolbar {
  padding: 12px;
  border-bottom: 1px solid var(--n-border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-action-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-file-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-status {
  padding: 40px 0;
}

.file-rows-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.15s ease;
  user-select: none;
}

.file-item-row:hover {
  background: var(--n-color-embedded);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.item-filename {
  font-size: 13px;
  font-family: var(--font-mono, monospace);
  color: var(--n-text-color-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-tag {
  font-size: 10px;
  background: #10b981;
  color: #ffffff;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 500;
  line-height: 1.2;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 8px;
}

.item-size {
  font-size: 11px;
  color: var(--n-text-color-3);
}

.btn-item-delete {
  border: none;
  background: transparent;
  padding: 2px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--n-text-color-3);
  opacity: 0;
  transition: all 0.15s ease;
}

.file-item-row:hover .btn-item-delete {
  opacity: 1;
}

.btn-item-delete:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.sidebar-bottom-stat {
  padding: 8px 12px;
  border-top: 1px solid var(--n-border-color);
  font-size: 11px;
  color: var(--n-text-color-3);
  display: flex;
  align-items: center;
  background: var(--n-color-embedded);
}

.dot-separator {
  margin: 0 4px;
}

/* 右栏：预览舞台 */
.preview-stage {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--n-color-embedded);
  overflow: hidden;
}

.preview-control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color);
  flex-shrink: 0;
}

.control-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.preview-title-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--n-text-color);
  white-space: nowrap;
}

.preview-url-text {
  font-size: 11px;
  font-family: var(--font-mono, monospace);
  color: var(--n-text-color-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.control-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-switch-group {
  display: inline-flex;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 2px;
  background: var(--n-color-embedded);
}

.btn-device {
  border: none;
  background: transparent;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--n-text-color-3);
  transition: all 0.15s ease;
}

.btn-device:hover {
  color: var(--n-text-color);
}

.btn-device.is-active {
  background: var(--n-color);
  color: #6366f1;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.preview-viewport-container {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  overflow: hidden;
  box-sizing: border-box;
}

.preview-viewport-container.device-desktop .iframe-card {
  width: 100%;
  height: 100%;
  border-radius: 6px;
}

.preview-viewport-container.device-mobile .iframe-card {
  width: 375px;
  height: 100%;
  max-height: 720px;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 4px solid var(--n-border-color);
}

.iframe-card {
  background: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--n-border-color);
}

.live-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}
</style>
