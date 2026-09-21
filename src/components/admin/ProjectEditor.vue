<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
  NSelect,
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
  AddOutline,
  RemoveOutline,
  ContractOutline,
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

// 屏幕视口分辨率预设（正常屏幕比例）
interface ScreenResolution {
  label: string
  value: string
  width: number
  height: number
  isFluid?: boolean
}

const resolutions: ScreenResolution[] = [
  { label: '标准桌面 (1440 × 900 · 16:10)', value: '1440x900', width: 1440, height: 900 },
  { label: '全高清大屏 (1920 × 1080 · 16:9)', value: '1920x1080', width: 1920, height: 1080 },
  { label: '紧凑桌面 (1280 × 720 · 16:9)', value: '1280x720', width: 1280, height: 720 },
  { label: '移动端视口 (375 × 812 · 手机)', value: '375x812', width: 375, height: 812 },
  { label: '流式铺满 (100% 自适应)', value: 'fluid', width: 0, height: 0, isFluid: true },
]

// 当前选中的视口分辨率，默认 1440x900 标准桌面
const selectedResValue = ref<string>('1440x900')

const currentResolution = computed(() => {
  return resolutions.find((r) => r.value === selectedResValue.value) || resolutions[0]!
})

// 视口舞台 DOM 引用及自适应缩放测量
const stageRef = ref<HTMLElement | null>(null)
const stageWidth = ref(1000)
const stageHeight = ref(700)
let resizeObserver: ResizeObserver | null = null

// 缩放模式与数值
const isAutoFit = ref(true)
const manualScale = ref(1)

// 自动计算的适合比例
const autoScaleRatio = computed(() => {
  if (currentResolution.value.isFluid) return 1
  const targetW = currentResolution.value.width
  const targetH = currentResolution.value.height
  if (targetW <= 0 || targetH <= 0) return 1

  // 预留四周 32px 边距
  const availW = Math.max(stageWidth.value - 40, 200)
  const availH = Math.max(stageHeight.value - 40, 200)

  const scaleW = availW / targetW
  const scaleH = availH / targetH
  const bestFit = Math.min(scaleW, scaleH)

  // 最多放大到 1.1，保留合理下限
  return Math.max(Math.min(bestFit, 1.1), 0.2)
})

// 当前生效的缩放比例
const effectiveScale = computed(() => {
  if (currentResolution.value.isFluid) return 1
  return isAutoFit.value ? autoScaleRatio.value : manualScale.value
})

// 缩放步进（放大）
function handleZoomIn() {
  isAutoFit.value = false
  manualScale.value = Math.min(Number((manualScale.value + 0.05).toFixed(2)), 1.5)
}

// 缩放步进（缩小）
function handleZoomOut() {
  isAutoFit.value = false
  manualScale.value = Math.max(Number((manualScale.value - 0.05).toFixed(2)), 0.2)
}

// 恢复自适应缩放
function handleResetAutoFit() {
  isAutoFit.value = true
  manualScale.value = autoScaleRatio.value
}

// 分辨率选择选项列表
const resolutionSelectOptions = computed(() => {
  return resolutions.map((r) => ({
    label: r.label,
    value: r.value,
  }))
})

// 切换分辨率时重置为自适应
function handleResolutionChange(val: string) {
  selectedResValue.value = val
  isAutoFit.value = true
}

// 增量上传弹窗状态
const showUploadModal = ref(false)
const uploadModalType = ref<'file' | 'directory'>('file')
const uploading = ref(false)

// 项目文件列表
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

// 项目入口直链地址（固定为当前项目根目录的 HTML 入口）
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

// 测量舞台尺寸
function updateStageDimensions() {
  if (stageRef.value) {
    stageWidth.value = stageRef.value.clientWidth
    stageHeight.value = stageRef.value.clientHeight
  }
}

onMounted(() => {
  loadFiles()
  nextTick(() => {
    updateStageDimensions()
    if (stageRef.value) {
      resizeObserver = new ResizeObserver(() => {
        updateStageDimensions()
      })
      resizeObserver.observe(stageRef.value)
    }
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<template>
  <div class="project-fullscreen-console">
    <!-- 顶部工作台标题栏 -->
    <header class="console-header">
      <div class="header-brand-group">
        <div class="brand-avatar">
          <n-icon size="22" color="#6366f1">
            <DocumentTextOutline />
          </n-icon>
        </div>
        <div class="brand-info">
          <div class="brand-title-line">
            <h3 class="project-title">{{ project.name }}</h3>
            <n-tag type="info" size="small" round :bordered="false">
              {{ project.category }}
            </n-tag>
            <span class="file-summary-badge">
              {{ projectStats.totalFiles }} 个静态文件 · {{ projectStats.totalSizeStr }}
            </span>
          </div>
          <div class="project-live-address" :title="projectLiveUrl">
            <span class="address-label">访问入口:</span>
            <a :href="projectLiveUrl" target="_blank" rel="noopener noreferrer">
              {{ projectLiveUrl }}
            </a>
          </div>
        </div>
      </div>

      <div class="header-actions">
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

    <!-- 双栏工作台主体 -->
    <div class="console-body">
      <!-- 左栏：静态文件管理目录 (固定宽度) -->
      <aside class="files-panel">
        <div class="panel-toolbar">
          <n-input
            v-model:value="searchPattern"
            size="small"
            placeholder="搜索项目文件..."
            clearable
          >
            <template #prefix>
              <n-icon size="14" color="#9ca3af"><SearchOutline /></n-icon>
            </template>
          </n-input>

          <div class="toolbar-button-group">
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
              刷新文件目录
            </n-tooltip>
          </div>
        </div>

        <!-- 文件列表 -->
        <div class="panel-file-list">
          <n-spin :show="loading">
            <div v-if="rawFiles.length === 0 && !loading" class="empty-hint-box">
              <n-empty description="当前项目暂无文件" size="small" />
            </div>

            <div v-else-if="filteredFiles.length === 0 && !loading" class="empty-hint-box">
              <n-empty description="未找到匹配的文件" size="small" />
            </div>

            <div v-else class="file-items-scroll">
              <div
                v-for="file in filteredFiles"
                :key="file.key"
                class="file-row"
              >
                <div class="file-row-meta">
                  <n-icon size="16" :color="getFileVisual(file.name).color">
                    <component :is="getFileVisual(file.name).icon" />
                  </n-icon>
                  <span class="file-row-name" :title="file.name">
                    {{ file.name }}
                  </span>
                  <span
                    v-if="file.name.toLowerCase() === 'index.html' || file.name.toLowerCase().endsWith('/index.html')"
                    class="entry-badge"
                  >
                    入口
                  </span>
                </div>

                <div class="file-row-ops">
                  <span class="file-row-size">{{ formatSize(file.size) }}</span>
                  <n-popconfirm @positive-click="handleDeleteFile(file.key, file.name)">
                    <template #trigger>
                      <button class="btn-file-delete" type="button" title="删除文件">
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

        <footer class="panel-footer">
          <span>{{ projectStats.totalFiles }} 个静态文件</span>
          <span class="footer-separator">·</span>
          <span>共占用 {{ projectStats.totalSizeStr }}</span>
        </footer>
      </aside>

      <!-- 右栏：固定 HTML 预览舞台 (支持正常屏幕比例与适当缩放) -->
      <main class="preview-panel">
        <!-- 预览区顶部控制工具条 -->
        <div class="preview-navbar">
          <!-- 左侧：视口比例选择器 -->
          <div class="navbar-left">
            <span class="navbar-label">屏幕视口比例:</span>
            <n-select
              :value="selectedResValue"
              :options="resolutionSelectOptions"
              size="small"
              style="width: 250px"
              @update:value="handleResolutionChange"
            />
          </div>

          <!-- 右侧：缩放控制与页面刷新 -->
          <div class="navbar-right">
            <n-space size="small" align="center">
              <!-- 缩放控制工具组 (流式模式下禁用) -->
              <div v-if="!currentResolution.isFluid" class="zoom-controls">
                <button
                  class="btn-zoom"
                  title="缩小 5%"
                  :disabled="effectiveScale <= 0.2"
                  @click="handleZoomOut"
                >
                  <n-icon size="14"><RemoveOutline /></n-icon>
                </button>
                <span class="zoom-value-text" :class="{ 'is-auto': isAutoFit }">
                  {{ Math.round(effectiveScale * 100) }}%
                </span>
                <button
                  class="btn-zoom"
                  title="放大 5%"
                  :disabled="effectiveScale >= 1.5"
                  @click="handleZoomIn"
                >
                  <n-icon size="14"><AddOutline /></n-icon>
                </button>
                <button
                  class="btn-zoom-fit"
                  :class="{ 'is-active': isAutoFit }"
                  title="自适应屏幕大小"
                  @click="handleResetAutoFit"
                >
                  <n-icon size="13" style="margin-right: 3px;"><ContractOutline /></n-icon>
                  自适应
                </button>
              </div>

              <!-- 刷新页面 -->
              <n-button size="small" secondary @click="handleRefreshPreview">
                <template #icon>
                  <n-icon><RefreshOutline /></n-icon>
                </template>
                刷新页面
              </n-button>
            </n-space>
          </div>
        </div>

        <!-- 预览主舞台 (包含按正常屏幕比例布局并缩放的网页 iframe) -->
        <div class="preview-stage-container" ref="stageRef">
          <!-- 模式一：固定正常屏幕比例 (通过工业级 transform 稳定缩放) -->
          <div
            v-if="!currentResolution.isFluid"
            class="scaled-screen-outer-box"
            :style="{
              width: `${currentResolution.width * effectiveScale}px`,
              height: `${currentResolution.height * effectiveScale}px`,
            }"
          >
            <div
              class="scaled-screen-viewport"
              :style="{
                width: `${currentResolution.width}px`,
                height: `${currentResolution.height}px`,
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'top left',
              }"
            >
              <iframe
                :key="iframeKey"
                :src="projectLiveUrl"
                class="fullscreen-live-iframe"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              ></iframe>
            </div>
          </div>

          <!-- 模式二：流式 100% 满铺 -->
          <div v-else class="fluid-screen-viewport">
            <iframe
              :key="iframeKey"
              :src="projectLiveUrl"
              class="fullscreen-live-iframe"
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
.project-fullscreen-console {
  display: flex;
  flex-direction: column;
  height: 96vh;
  min-height: 650px;
  background: var(--n-color);
  border-radius: 8px;
  overflow: hidden;
}

/* 顶部工作台标题栏 */
.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color-embedded);
  flex-shrink: 0;
}

.header-brand-group {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-avatar {
  width: 40px;
  height: 40px;
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

.brand-title-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.project-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--n-text-color);
  white-space: nowrap;
}

.file-summary-badge {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.project-live-address {
  font-size: 12px;
  color: var(--n-text-color-3);
  font-family: var(--font-mono, monospace);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.address-label {
  margin-right: 4px;
}

.project-live-address a {
  color: var(--n-text-color-2);
  text-decoration: none;
}

.project-live-address a:hover {
  text-decoration: underline;
  color: #6366f1;
}

/* 双栏主体 */
.console-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 左侧文件面板 */
.files-panel {
  width: 350px;
  border-right: 1px solid var(--n-border-color);
  background: var(--n-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.panel-toolbar {
  padding: 12px;
  border-bottom: 1px solid var(--n-border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar-button-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-file-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-hint-box {
  padding: 40px 0;
}

.file-items-scroll {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.15s ease;
  user-select: none;
}

.file-row:hover {
  background: var(--n-color-embedded);
}

.file-row-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.file-row-name {
  font-size: 13px;
  font-family: var(--font-mono, monospace);
  color: var(--n-text-color-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-badge {
  font-size: 10px;
  background: #10b981;
  color: #ffffff;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 500;
  line-height: 1.2;
}

.file-row-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 8px;
}

.file-row-size {
  font-size: 11px;
  color: var(--n-text-color-3);
}

.btn-file-delete {
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

.file-row:hover .btn-file-delete {
  opacity: 1;
}

.btn-file-delete:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.panel-footer {
  padding: 8px 14px;
  border-top: 1px solid var(--n-border-color);
  font-size: 11px;
  color: var(--n-text-color-3);
  display: flex;
  align-items: center;
  background: var(--n-color-embedded);
}

.footer-separator {
  margin: 0 4px;
}

/* 右侧预览面板 */
.preview-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--n-color-embedded);
  overflow: hidden;
}

.preview-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color);
  flex-shrink: 0;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.navbar-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color-2);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-controls {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  background: var(--n-color-embedded);
  padding: 1px;
}

.btn-zoom {
  border: none;
  background: transparent;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--n-text-color-2);
  transition: all 0.15s ease;
}

.btn-zoom:hover:not(:disabled) {
  background: var(--n-color);
  color: var(--n-text-color);
}

.btn-zoom:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-value-text {
  font-size: 12px;
  font-weight: 600;
  padding: 0 6px;
  min-width: 44px;
  text-align: center;
  color: var(--n-text-color);
  font-family: var(--font-mono, monospace);
}

.zoom-value-text.is-auto {
  color: #6366f1;
}

.btn-zoom-fit {
  border: none;
  border-left: 1px solid var(--n-border-color);
  background: transparent;
  padding: 4px 8px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  color: var(--n-text-color-2);
  transition: all 0.15s ease;
}

.btn-zoom-fit:hover {
  background: var(--n-color);
  color: var(--n-text-color);
}

.btn-zoom-fit.is-active {
  background: var(--n-color);
  color: #6366f1;
  font-weight: 500;
}

/* 预览舞台 */
.preview-stage-container {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  position: relative;
  background-image: radial-gradient(var(--n-border-color) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 固定正常屏幕比例下的真实包围盒 */
.scaled-screen-outer-box {
  position: relative;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  background: #ffffff;
  overflow: hidden;
  transition: width 0.2s ease, height 0.2s ease;
}

/* 视口容器 */
.scaled-screen-viewport {
  background: #ffffff;
  position: absolute;
  top: 0;
  left: 0;
}

/* 流式模式 */
.fluid-screen-viewport {
  width: 100%;
  height: 100%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
  background: #ffffff;
  overflow: hidden;
}

.fullscreen-live-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
  display: block;
}
</style>
