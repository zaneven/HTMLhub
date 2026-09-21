<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
  NTabs,
  NTab,
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
  SaveOutline,
  SearchOutline,
  AddOutline,
  CloudUploadOutline,
  ExpandOutline,
  ContractOutline,
  EyeOutline,
  DownloadOutline,
  InformationCircleOutline,
} from '@vicons/ionicons5'
import { useFilesStore } from '@/stores/files'
import { useAppMode } from '@/composables/useAppMode'
import type { ProjectInfo } from '@/types'

const props = defineProps<{
  project: ProjectInfo
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const filesStore = useFilesStore()
const { apiBaseUrl } = useAppMode()
const message = useMessage()

// 状态定义
const loading = ref(false)
const isMaximized = ref(false)
const searchPattern = ref('')
const selectedKey = ref<string>('')
const selectedFile = ref<ProjectFileInfo | null>(null)

// 编辑器与内容状态
const fileContentLoading = ref(false)
const fileContent = ref('')
const originalContent = ref('')
const isSaving = ref(false)
const viewTab = ref<'code' | 'preview'>('code')
const iframeKey = ref(0) // 用于强制刷新 iframe

// 上传弹窗/状态
const showUploadModal = ref(false)
const uploadModalType = ref<'file' | 'directory'>('file')
const uploading = ref(false)

// 新建文件状态
const showNewFileModal = ref(false)
const newFileName = ref('')
const creatingFile = ref(false)

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

// 支持的文件类型扩展名
const textExtensions = ['.html', '.htm', '.css', '.js', '.mjs', '.json', '.svg', '.txt', '.xml', '.md', '.map']
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico']

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

// 获取项目公网访问直链
const projectLiveUrl = computed(() => {
  return filesStore.getFileUrl(props.project)
})

// 根据扩展名识别文件图标与颜色
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

// 项目总容量与统计
const projectStats = computed(() => {
  const list = rawFiles.value
  const totalBytes = list.reduce((sum, f) => sum + (f.size || 0), 0)
  const htmlCount = list.filter((f) => f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm')).length
  const cssCount = list.filter((f) => f.name.toLowerCase().endsWith('.css')).length
  const jsCount = list.filter((f) => f.name.toLowerCase().endsWith('.js') || f.name.toLowerCase().endsWith('.mjs')).length
  const imgCount = list.filter((f) => imageExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))).length

  return {
    totalFiles: list.length,
    totalSizeStr: formatSize(totalBytes),
    htmlCount,
    cssCount,
    jsCount,
    imgCount,
  }
})

// 选择文件
function handleSelectFile(file: ProjectFileInfo) {
  selectedKey.value = file.key
  selectedFile.value = file
  viewTab.value = 'code'
  loadFileContent(file)
}

// 获取单个文件直接访问链接
function getIndividualFileUrl(file: ProjectFileInfo): string {
  if (props.project.source === 'cloud') {
    // key 格式通常如: html-files/分类/项目名/路径 或 直接为 key
    return `${apiBaseUrl.value}/r2/${file.key}`
  }
  return `/${file.name}`
}

// 检查是否为文本文件
function isText(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return textExtensions.some((ext) => lower.endsWith(ext))
}

// 检查是否为图片文件
function isImage(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return imageExtensions.some((ext) => lower.endsWith(ext))
}

// 加载文件文本内容
async function loadFileContent(file: ProjectFileInfo) {
  if (!isText(file.name)) {
    fileContent.value = ''
    originalContent.value = ''
    return
  }

  fileContentLoading.value = true
  try {
    const url = getIndividualFileUrl(file)
    const response = await fetch(url)
    if (response.ok) {
      const text = await response.text()
      fileContent.value = text
      originalContent.value = text
    } else {
      message.error(`无法读取文件内容 (HTTP ${response.status})`)
      fileContent.value = ''
      originalContent.value = ''
    }
  } catch (err) {
    console.error('Error fetching file content:', err)
    message.error('加载文件内容失败')
  } finally {
    fileContentLoading.value = false
  }
}

// 内容是否被修改
const isModified = computed(() => {
  return fileContent.value !== originalContent.value
})

// 保存文件修改
async function handleSaveFile() {
  if (!selectedFile.value) return
  if (!isModified.value) {
    message.info('文件内容无改动')
    return
  }

  isSaving.value = true
  try {
    const fileName = selectedFile.value.name.split('/').pop() || 'file'
    const blob = new Blob([fileContent.value], { type: selectedFile.value.type || 'text/plain' })
    const file = new File([blob], fileName, { type: selectedFile.value.type || 'text/plain' })

    const success = await filesStore.addProjectFile(
      file,
      props.project.path,
      selectedFile.value.name,
    )

    if (success) {
      originalContent.value = fileContent.value
      message.success(`已保存修改：${selectedFile.value.name}`)
      iframeKey.value++ // 刷新预览 iframe
      emit('saved')
    } else {
      message.error(filesStore.error || '保存失败')
    }
  } catch (err) {
    console.error('Save error:', err)
    message.error('保存文件发生异常')
  } finally {
    isSaving.value = false
  }
}

// 键盘快捷键监听 (Ctrl+S / Cmd+S 保存)
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    if (selectedFile.value && isText(selectedFile.value.name) && isModified.value) {
      e.preventDefault()
      handleSaveFile()
    }
  }
}

// 重置修改
function handleResetContent() {
  fileContent.value = originalContent.value
  message.info('已恢复为云端版本')
}

// 加载项目文件列表
async function loadFiles() {
  loading.value = true
  try {
    const result = await filesStore.listProjectFiles(props.project.path)
    rawFiles.value = result

    // 默认高亮选择主入口 index.html
    if (!selectedFile.value) {
      const entryFile = result.find(
        (f) => f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('/index.html'),
      )
      if (entryFile) {
        selectedKey.value = entryFile.key
        selectedFile.value = entryFile
        loadFileContent(entryFile)
      }
    } else {
      // 保持当前选中的文件对象更新
      const updated = result.find((f) => f.key === selectedFile.value?.key)
      if (updated) {
        selectedFile.value = updated
      }
    }
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
      if (selectedFile.value?.key === fileKey) {
        selectedKey.value = ''
        selectedFile.value = null
      }
      await loadFiles()
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

// 复制文本直链
async function handleCopyLink(url: string, label = '访问直链') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    message.success(`已复制${label}`)
  } catch {
    message.error('复制失败')
  }
}

// 新窗口打开直链
function handleOpenExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 下载文件
function handleDownloadFile(file: ProjectFileInfo) {
  const url = getIndividualFileUrl(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name.split('/').pop() || 'download'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 打开增量上传弹窗
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
      message.success(`已添加/更新: ${file.name}`)
      await loadFiles()
      showUploadModal.value = false
      emit('saved')
    } else {
      message.error(filesStore.error || '上传失败')
    }
  } catch {
    message.error('上传异常')
  } finally {
    uploading.value = false
  }
}

// 处理在线新建文件
async function handleCreateNewFile() {
  const trimmed = newFileName.value.trim()
  if (!trimmed) {
    message.warning('请输入文件名')
    return
  }

  // 基础校验
  if (trimmed.includes('\\') || trimmed.startsWith('/')) {
    message.error('路径格式无效，不能以斜杠开头')
    return
  }

  creatingFile.value = true
  try {
    let initialCode = ''
    if (trimmed.endsWith('.html') || trimmed.endsWith('.htm')) {
      initialCode = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${props.project.name}</title>\n</head>\n<body>\n  <h1>${props.project.name}</h1>\n</body>\n</html>\n`
    } else if (trimmed.endsWith('.css')) {
      initialCode = `/* ${trimmed} */\n`
    } else if (trimmed.endsWith('.js')) {
      initialCode = `// ${trimmed}\nconsole.log('${props.project.name} loaded');\n`
    }

    const blob = new Blob([initialCode], { type: 'text/plain' })
    const file = new File([blob], trimmed.split('/').pop() || 'file', { type: 'text/plain' })

    const success = await filesStore.addProjectFile(file, props.project.path, trimmed)
    if (success) {
      message.success(`成功创建文件: ${trimmed}`)
      showNewFileModal.value = false
      newFileName.value = ''
      await loadFiles()
      emit('saved')
    } else {
      message.error(filesStore.error || '创建文件失败')
    }
  } catch {
    message.error('创建异常')
  } finally {
    creatingFile.value = false
  }
}

onMounted(() => {
  loadFiles()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="project-workbench" :class="{ 'is-fullscreen': isMaximized }">
    <!-- 顶部工作台导航条 -->
    <header class="workbench-header">
      <div class="header-brand">
        <div class="brand-avatar">
          <n-icon size="20" color="#6366f1">
            <DocumentTextOutline />
          </n-icon>
        </div>
        <div class="brand-titles">
          <div class="project-title-row">
            <h2 class="project-heading">{{ project.name }}</h2>
            <n-tag type="info" size="tiny" round>{{ project.category }}</n-tag>
            <span class="file-stat-chip">
              {{ projectStats.totalFiles }} 个文件 · {{ projectStats.totalSizeStr }}
            </span>
          </div>
          <div class="project-url-subtitle" :title="projectLiveUrl">
            <span>托管地址: </span>
            <a :href="projectLiveUrl" target="_blank" rel="noopener noreferrer">
              {{ projectLiveUrl }}
            </a>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <n-space size="small" align="center">
          <!-- 在线预览整个项目 -->
          <n-button size="small" type="primary" @click="handleOpenExternal(projectLiveUrl)">
            <template #icon>
              <n-icon><OpenOutline /></n-icon>
            </template>
            预览站点
          </n-button>

          <!-- 复制公网直链 -->
          <n-button size="small" secondary @click="handleCopyLink(projectLiveUrl, '站点直链')">
            <template #icon>
              <n-icon><CopyOutline /></n-icon>
            </template>
            复制直链
          </n-button>

          <!-- 刷新文件列表 -->
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button size="small" quaternary circle @click="loadFiles">
                <template #icon>
                  <n-icon><RefreshOutline /></n-icon>
                </template>
              </n-button>
            </template>
            刷新文件树
          </n-tooltip>

          <!-- 全屏切换 -->
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button size="small" quaternary circle @click="isMaximized = !isMaximized">
                <template #icon>
                  <n-icon>
                    <component :is="isMaximized ? ContractOutline : ExpandOutline" />
                  </n-icon>
                </template>
              </n-button>
            </template>
            {{ isMaximized ? '退出全屏' : '全屏工作台' }}
          </n-tooltip>

          <!-- 关闭控制台 -->
          <n-button size="small" quaternary circle @click="$emit('close')">
            <template #icon>
              <n-icon><CloseOutline /></n-icon>
            </template>
          </n-button>
        </n-space>
      </div>
    </header>

    <!-- 工作台双栏主体 -->
    <div class="workbench-body">
      <!-- 左栏：文件资源管理器 (File Explorer Tree) -->
      <aside class="workbench-sidebar">
        <!-- 资源管理器工具栏 -->
        <div class="sidebar-top-tools">
          <div class="sidebar-search">
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
          </div>

          <div class="sidebar-actions-row">
            <n-button size="tiny" secondary type="primary" @click="openUploadModal('file')">
              <template #icon>
                <n-icon><CloudUploadOutline /></n-icon>
              </template>
              上传文件
            </n-button>
            <n-button size="tiny" secondary type="info" @click="openUploadModal('directory')">
              <template #icon>
                <n-icon><FolderOpenOutline /></n-icon>
              </template>
              上传文件夹
            </n-button>
            <n-button size="tiny" quaternary @click="showNewFileModal = true">
              <template #icon>
                <n-icon><AddOutline /></n-icon>
              </template>
              新建
            </n-button>
          </div>
        </div>

        <!-- 目录树内容区域 -->
        <div class="sidebar-tree-container">
          <n-spin :show="loading">
            <div v-if="rawFiles.length === 0 && !loading" class="empty-files">
              <n-empty description="当前项目暂无文件" size="small" />
            </div>

            <div v-else-if="filteredFiles.length === 0 && !loading" class="empty-files">
              <n-empty description="未找到匹配的文件" size="small" />
            </div>

            <div v-else class="tree-content-wrapper">
              <div
                v-for="file in filteredFiles"
                :key="file.key"
                class="file-node-row"
                :class="{ 'is-active': selectedKey === file.key }"
                @click="handleSelectFile(file)"
              >
                <div class="file-node-left">
                  <n-icon size="16" :color="getFileVisual(file.name).color">
                    <component :is="getFileVisual(file.name).icon" />
                  </n-icon>
                  <span class="file-node-name" :title="file.name">
                    {{ file.name }}
                  </span>
                  <span
                    v-if="file.name.toLowerCase() === 'index.html'"
                    class="badge-entry"
                  >
                    Entry
                  </span>
                </div>
                <div class="file-node-right">
                  <span class="node-size">{{ formatSize(file.size) }}</span>
                  <n-popconfirm @positive-click.stop="handleDeleteFile(file.key, file.name)">
                    <template #trigger>
                      <button
                        class="btn-row-action btn-row-delete"
                        type="button"
                        title="删除文件"
                        @click.stop
                      >
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

        <!-- 底部资产构成小条 -->
        <footer class="sidebar-footer">
          <span>{{ projectStats.totalFiles }} 个项目文件</span>
          <span class="footer-dot">·</span>
          <span>总计 {{ projectStats.totalSizeStr }}</span>
        </footer>
      </aside>

      <!-- 右栏：工作区 (Preview & Editor Workspace) -->
      <main class="workbench-main">
        <!-- 场景 1：未选中文件时，展示项目概览与控制台仪表盘 -->
        <div v-if="!selectedFile" class="workspace-overview-dashboard">
          <div class="overview-hero">
            <div class="hero-icon-box">
              <n-icon size="36" color="#6366f1">
                <FolderOpenOutline />
              </n-icon>
            </div>
            <h3 class="hero-title">{{ project.name }}</h3>
            <p class="hero-desc">
              静态托管项目控制台 · 云端 R2 存储支持全球 CDN 极速加速
            </p>
          </div>

          <!-- 核心指标卡片组 -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-num text-orange">{{ projectStats.htmlCount }}</div>
              <div class="metric-label">HTML 页面</div>
            </div>
            <div class="metric-card">
              <div class="metric-num text-blue">{{ projectStats.cssCount }}</div>
              <div class="metric-label">CSS 样式</div>
            </div>
            <div class="metric-card">
              <div class="metric-num text-yellow">{{ projectStats.jsCount }}</div>
              <div class="metric-label">JS 脚本</div>
            </div>
            <div class="metric-card">
              <div class="metric-num text-green">{{ projectStats.imgCount }}</div>
              <div class="metric-label">媒体图像</div>
            </div>
          </div>

          <!-- 访问直链卡片 -->
          <div class="overview-access-card">
            <div class="card-left-info">
              <div class="card-tag">在线访问入口</div>
              <div class="card-url">{{ projectLiveUrl }}</div>
            </div>
            <div class="card-right-btn">
              <n-button type="primary" @click="handleOpenExternal(projectLiveUrl)">
                <template #icon>
                  <n-icon><OpenOutline /></n-icon>
                </template>
                打开访问
              </n-button>
              <n-button secondary @click="handleCopyLink(projectLiveUrl, '站点访问链接')">
                <template #icon>
                  <n-icon><CopyOutline /></n-icon>
                </template>
                复制链接
              </n-button>
            </div>
          </div>

          <!-- 快捷提示 -->
          <div class="overview-tips-banner">
            <n-icon size="18" color="#6366f1"><InformationCircleOutline /></n-icon>
            <span>
              在左侧文件列表中点击任一 HTML / CSS / JS 文件可进行<strong>在线代码查看与热修改保存</strong>；点击图片可查看原图。
            </span>
          </div>
        </div>

        <!-- 场景 2：选中文本文件 (HTML / CSS / JS / JSON 等) -->
        <div v-else-if="isText(selectedFile.name)" class="workspace-editor-view">
          <!-- 编辑器顶部工具条 -->
          <div class="editor-subbar">
            <div class="subbar-breadcrumb">
              <n-icon size="16" :color="getFileVisual(selectedFile.name).color">
                <component :is="getFileVisual(selectedFile.name).icon" />
              </n-icon>
              <span class="subbar-filename">{{ selectedFile.name }}</span>
              <span v-if="isModified" class="modified-dot" title="有未保存的修改"></span>
              <span class="file-size-badge">{{ formatSize(selectedFile.size) }}</span>
            </div>

            <div class="subbar-actions">
              <!-- 若是 HTML 文件，提供「代码查看/编辑」与「实时内嵌预览」切换 -->
              <div
                v-if="selectedFile.name.toLowerCase().endsWith('.html') || selectedFile.name.toLowerCase().endsWith('.htm')"
                class="html-mode-tabs"
              >
                <n-tabs
                  v-model:value="viewTab"
                  type="segment"
                  size="small"
                  style="width: 170px"
                >
                  <n-tab name="code">
                    <div class="tab-inner">
                      <n-icon size="14"><CodeSlashOutline /></n-icon>
                      <span>代码</span>
                    </div>
                  </n-tab>
                  <n-tab name="preview">
                    <div class="tab-inner">
                      <n-icon size="14"><EyeOutline /></n-icon>
                      <span>预览</span>
                    </div>
                  </n-tab>
                </n-tabs>
              </div>

              <!-- 操作按钮组 -->
              <n-space size="small">
                <template v-if="viewTab === 'code'">
                  <n-button
                    size="small"
                    type="primary"
                    :disabled="!isModified"
                    :loading="isSaving"
                    @click="handleSaveFile"
                  >
                    <template #icon>
                      <n-icon><SaveOutline /></n-icon>
                    </template>
                    保存修改
                  </n-button>
                  <n-button
                    v-if="isModified"
                    size="small"
                    quaternary
                    @click="handleResetContent"
                  >
                    还原
                  </n-button>
                </template>

                <template v-else>
                  <n-button size="small" secondary @click="iframeKey++">
                    <template #icon>
                      <n-icon><RefreshOutline /></n-icon>
                    </template>
                    刷新页面
                  </n-button>
                </template>

                <n-button
                  size="small"
                  quaternary
                  @click="handleOpenExternal(getIndividualFileUrl(selectedFile))"
                >
                  <template #icon>
                    <n-icon><OpenOutline /></n-icon>
                  </template>
                  独立窗口打开
                </n-button>

                <n-button size="small" quaternary @click="handleDownloadFile(selectedFile)">
                  <template #icon>
                    <n-icon><DownloadOutline /></n-icon>
                  </template>
                </n-button>

                <n-popconfirm @positive-click="handleDeleteFile(selectedFile.key, selectedFile.name)">
                  <template #trigger>
                    <n-button size="small" quaternary type="error">
                      <template #icon>
                        <n-icon><TrashOutline /></n-icon>
                      </template>
                    </n-button>
                  </template>
                  确定要删除 "{{ selectedFile.name }}" 吗？
                </n-popconfirm>
              </n-space>
            </div>
          </div>

          <!-- 编辑器内容区域 -->
          <div class="editor-content-area">
            <n-spin :show="fileContentLoading" style="height: 100%">
              <!-- 代码编辑模式 -->
              <div v-if="viewTab === 'code'" class="code-editor-box">
                <textarea
                  v-model="fileContent"
                  class="code-textarea"
                  spellcheck="false"
                  placeholder="文件为空或正在读取..."
                ></textarea>
                <div class="code-status-footer">
                  <span>字符数: {{ fileContent.length }}</span>
                  <span class="footer-divider">|</span>
                  <span>行数: {{ fileContent.split('\n').length }}</span>
                  <span class="footer-divider">|</span>
                  <span>快捷键: Ctrl/Cmd + S 快速保存</span>
                  <span v-if="isModified" class="unsaved-badge">有未保存更改</span>
                </div>
              </div>

              <!-- 实时 iframe 页面渲染模式 (针对 HTML) -->
              <div v-else class="preview-iframe-wrapper">
                <iframe
                  :key="iframeKey"
                  :src="getIndividualFileUrl(selectedFile)"
                  class="preview-iframe"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                ></iframe>
              </div>
            </n-spin>
          </div>
        </div>

        <!-- 场景 3：选中图片文件 (PNG / JPG / SVG / GIF / WEBP / ICO) -->
        <div v-else-if="isImage(selectedFile.name)" class="workspace-image-view">
          <div class="image-subbar">
            <div class="subbar-breadcrumb">
              <n-icon size="16" color="#10b981"><ImageOutline /></n-icon>
              <span class="subbar-filename">{{ selectedFile.name }}</span>
              <span class="file-size-badge">{{ formatSize(selectedFile.size) }}</span>
            </div>
            <div class="subbar-actions">
              <n-space size="small">
                <n-button
                  size="small"
                  secondary
                  @click="handleOpenExternal(getIndividualFileUrl(selectedFile))"
                >
                  <template #icon>
                    <n-icon><OpenOutline /></n-icon>
                  </template>
                  在新标签页打开原图
                </n-button>
                <n-button size="small" secondary @click="handleDownloadFile(selectedFile)">
                  <template #icon>
                    <n-icon><DownloadOutline /></n-icon>
                  </template>
                  下载图片
                </n-button>
                <n-popconfirm @positive-click="handleDeleteFile(selectedFile.key, selectedFile.name)">
                  <template #trigger>
                    <n-button size="small" quaternary type="error">
                      <template #icon>
                        <n-icon><TrashOutline /></n-icon>
                      </template>
                      删除
                    </n-button>
                  </template>
                  确定要删除图片 "{{ selectedFile.name }}" 吗？
                </n-popconfirm>
              </n-space>
            </div>
          </div>

          <div class="image-preview-stage">
            <div class="checkerboard-box">
              <img
                :src="getIndividualFileUrl(selectedFile)"
                :alt="selectedFile.name"
                class="preview-img-element"
              />
            </div>
            <div class="image-meta-info">
              <span>文件名称: {{ selectedFile.name }}</span>
              <span>·</span>
              <span>大小: {{ formatSize(selectedFile.size) }}</span>
              <span>·</span>
              <span>上传时间: {{ formatDate(selectedFile.modifiedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 场景 4：其他未知或二进制文件 -->
        <div v-else class="workspace-binary-view">
          <div class="binary-card">
            <n-icon size="48" color="#9ca3af"><DocumentOutline /></n-icon>
            <h4 class="binary-filename">{{ selectedFile.name }}</h4>
            <p class="binary-size">{{ formatSize(selectedFile.size) }}</p>
            <div class="binary-actions">
              <n-button type="primary" @click="handleDownloadFile(selectedFile)">
                <template #icon>
                  <n-icon><DownloadOutline /></n-icon>
                </template>
                下载此文件
              </n-button>
              <n-popconfirm @positive-click="handleDeleteFile(selectedFile.key, selectedFile.name)">
                <template #trigger>
                  <n-button quaternary type="error">
                    <template #icon>
                      <n-icon><TrashOutline /></n-icon>
                    </template>
                    删除文件
                  </n-button>
                </template>
                确定要删除 "{{ selectedFile.name }}" 吗？
              </n-popconfirm>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 弹窗 1：增量添加文件/文件夹 -->
    <n-modal
      v-model:show="showUploadModal"
      preset="card"
      :title="uploadModalType === 'directory' ? '向项目添加文件夹' : '向项目添加文件'"
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
              上传后将自动同步至云端，并保留文件相对结构
            </div>
          </div>
        </n-upload-dragger>
      </n-upload>
    </n-modal>

    <!-- 弹窗 2：在线新建文件 -->
    <n-modal
      v-model:show="showNewFileModal"
      preset="card"
      title="新建静态文件"
      style="width: 420px; max-width: 90vw"
    >
      <n-space vertical size="medium">
        <div>
          <div style="margin-bottom: 6px; font-size: 13px; font-weight: 500">
            文件相对路径
          </div>
          <n-input
            v-model:value="newFileName"
            placeholder="例如: extra.css 或 assets/js/custom.js"
            @keyup.enter="handleCreateNewFile"
          />
        </div>
        <div style="font-size: 12px; color: var(--n-text-color-3)">
          支持直接输入带路径的文件名（如 <code>css/app.css</code>），系统将自动创建对应子路径。
        </div>
        <n-space justify="end">
          <n-button @click="showNewFileModal = false">取消</n-button>
          <n-button type="primary" :loading="creatingFile" @click="handleCreateNewFile">
            立即创建
          </n-button>
        </n-space>
      </n-space>
    </n-modal>
  </div>
</template>

<style scoped>
.project-workbench {
  display: flex;
  flex-direction: column;
  height: 75vh;
  min-height: 550px;
  background: var(--n-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.project-workbench.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  border-radius: 0;
}

/* 顶部导航 */
.workbench-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color-embedded);
  flex-shrink: 0;
}

.header-brand {
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

.brand-titles {
  min-width: 0;
}

.project-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-heading {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color);
  white-space: nowrap;
}

.file-stat-chip {
  font-size: 11px;
  color: var(--n-text-color-3);
}

.project-url-subtitle {
  font-size: 11px;
  color: var(--n-text-color-3);
  font-family: var(--font-mono, monospace);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-url-subtitle a {
  color: var(--n-text-color-2);
  text-decoration: none;
}

.project-url-subtitle a:hover {
  text-decoration: underline;
  color: #6366f1;
}

/* 主体分栏 */
.workbench-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 左侧栏 */
.workbench-sidebar {
  width: 320px;
  border-right: 1px solid var(--n-border-color);
  background: var(--n-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-top-tools {
  padding: 12px;
  border-bottom: 1px solid var(--n-border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-actions-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-files {
  padding: 40px 0;
}

.tree-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-node-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.file-node-row:hover {
  background: var(--n-color-embedded);
}

.file-node-row.is-active {
  background: rgba(99, 102, 241, 0.12);
}

.file-node-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.file-node-name {
  font-size: 13px;
  font-family: var(--font-mono, monospace);
  color: var(--n-text-color-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-entry {
  font-size: 10px;
  background: #10b981;
  color: #ffffff;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 500;
  line-height: 1.2;
}

.file-node-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 8px;
}

.node-size {
  font-size: 11px;
  color: var(--n-text-color-3);
}

.btn-row-action {
  border: none;
  background: transparent;
  padding: 2px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s ease;
}

.file-node-row:hover .btn-row-action {
  opacity: 1;
}

.btn-row-delete {
  color: var(--n-text-color-3);
}

.btn-row-delete:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.sidebar-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--n-border-color);
  font-size: 11px;
  color: var(--n-text-color-3);
  display: flex;
  align-items: center;
  background: var(--n-color-embedded);
}

.footer-dot {
  margin: 0 4px;
}

/* 右侧工作台 */
.workbench-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--n-color);
  overflow: hidden;
}

/* 概览仪表盘 */
.workspace-overview-dashboard {
  padding: 32px 40px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.overview-hero {
  text-align: center;
  padding: 20px 0 10px;
}

.hero-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(99, 102, 241, 0.1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.hero-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  color: var(--n-text-color);
}

.hero-desc {
  margin: 0;
  font-size: 13px;
  color: var(--n-text-color-3);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  padding: 16px;
  border-radius: 8px;
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  text-align: center;
}

.metric-num {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.metric-label {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 4px;
}

.text-orange { color: #f97316; }
.text-blue { color: #0ea5e9; }
.text-yellow { color: #eab308; }
.text-green { color: #10b981; }

.overview-access-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  gap: 16px;
}

.card-tag {
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.card-url {
  font-size: 14px;
  font-family: var(--font-mono, monospace);
  font-weight: 500;
  color: var(--n-text-color);
}

.card-right-btn {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.overview-tips-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 6px;
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  font-size: 13px;
  color: var(--n-text-color-2);
}

/* 编辑器视图 */
.workspace-editor-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-subbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color-embedded);
  flex-shrink: 0;
}

.subbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.subbar-filename {
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-mono, monospace);
  color: var(--n-text-color);
}

.modified-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f97316;
}

.file-size-badge {
  font-size: 11px;
  color: var(--n-text-color-3);
}

.subbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tab-inner {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.editor-content-area {
  flex: 1;
  min-height: 0;
  position: relative;
}

.code-editor-box {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.code-textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: var(--font-mono, 'Fira Code', Menlo, Monaco, Consolas, monospace);
  font-size: 13px;
  line-height: 1.6;
  background: var(--n-color);
  color: var(--n-text-color);
  box-sizing: border-box;
}

.code-status-footer {
  padding: 4px 16px;
  border-top: 1px solid var(--n-border-color);
  background: var(--n-color-embedded);
  font-size: 11px;
  color: var(--n-text-color-3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-divider {
  color: var(--n-border-color);
}

.unsaved-badge {
  margin-left: auto;
  color: #f97316;
  font-weight: 500;
}

.preview-iframe-wrapper {
  width: 100%;
  height: 100%;
  background: #ffffff;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 图片预览视图 */
.workspace-image-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.image-subbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color-embedded);
  flex-shrink: 0;
}

.image-preview-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--n-color-embedded);
  overflow: auto;
}

.checkerboard-box {
  max-width: 85%;
  max-height: 70%;
  padding: 16px;
  background-image: linear-gradient(45deg, #eee 25%, transparent 25%),
    linear-gradient(-45deg, #eee 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eee 75%),
    linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img-element {
  max-width: 100%;
  max-height: 50vh;
  object-fit: contain;
  display: block;
}

.image-meta-info {
  margin-top: 16px;
  font-size: 12px;
  color: var(--n-text-color-3);
  display: flex;
  gap: 8px;
}

/* 二进制视图 */
.workspace-binary-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.binary-card {
  text-align: center;
  padding: 32px;
  border-radius: 12px;
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
}

.binary-filename {
  margin: 12px 0 4px;
  font-size: 16px;
  font-weight: 600;
}

.binary-size {
  margin: 0 0 16px;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.binary-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
