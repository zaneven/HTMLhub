<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    :title="modalTitle"
    style="width: 90vw; height: 90vh"
    :closable="true"
    :mask-closable="true"
    class="file-preview-modal"
  >
    <template #header-extra>
      <n-space>
        <n-button
          size="small"
          @click="openInNewTab"
          :disabled="!canOpenInNewTab"
        >
          <template #icon>
            <n-icon><OpenOutline /></n-icon>
          </template>
          新窗口打开
        </n-button>
        <n-button
          size="small"
          @click="downloadFile"
          :disabled="!fileInfo"
        >
          <template #icon>
            <n-icon><DownloadOutline /></n-icon>
          </template>
          下载
        </n-button>
      </n-space>
    </template>

    <div class="preview-container">
      <div v-if="loading" class="loading-container">
        <n-spin size="large">
          <template #description>
            正在加载预览...
          </template>
        </n-spin>
      </div>

      <div v-else-if="error" class="error-container">
        <n-result
          status="error"
          title="预览失败"
          :description="error"
        >
          <template #footer>
            <n-button @click="retryPreview">重试</n-button>
          </template>
        </n-result>
      </div>

      <div v-else-if="fileInfo" class="preview-content">
        <!-- HTML文件预览 -->
        <iframe
          v-if="isHtmlFile"
          ref="previewFrame"
          :src="previewUrl"
          class="preview-iframe"
          @load="handleIframeLoad"
          @error="handleIframeError"
        />

        <!-- 其他文件类型的预览 -->
        <div v-else class="unsupported-preview">
          <n-result
            status="info"
            title="不支持的文件类型"
            description="此文件类型暂不支持预览，您可以下载文件查看内容。"
          >
            <template #footer>
              <n-button type="primary" @click="downloadFile">
                下载文件
              </n-button>
            </template>
          </n-result>
        </div>
      </div>
    </div>

    <!-- 文件信息面板 -->
    <div v-if="fileInfo && showFileInfo" class="file-info-panel">
      <n-card size="small" title="文件信息">
        <n-descriptions :column="2" size="small">
          <n-descriptions-item label="文件名">
            {{ fileInfo.name }}
          </n-descriptions-item>
          <n-descriptions-item label="文件大小">
            {{ formatFileSize(fileInfo.size) }}
          </n-descriptions-item>
          <n-descriptions-item label="修改时间">
            {{ formatDate(fileInfo.modifiedAt) }}
          </n-descriptions-item>
          <n-descriptions-item label="文件类型">
            {{ fileInfo.extension.toUpperCase() }}
          </n-descriptions-item>
          <n-descriptions-item label="分类">
            {{ fileInfo.category }}
          </n-descriptions-item>
          <n-descriptions-item label="路径">
            {{ fileInfo.path }}
          </n-descriptions-item>
        </n-descriptions>
        
        <div v-if="fileInfo.tags.length > 0" class="file-tags">
          <n-space>
            <span>标签：</span>
            <n-tag
              v-for="tag in fileInfo.tags"
              :key="tag"
              size="small"
              type="info"
            >
              {{ tag }}
            </n-tag>
          </n-space>
        </div>
      </n-card>
    </div>

    <template #action>
      <n-space justify="space-between">
        <n-button
          size="small"
          @click="showFileInfo = !showFileInfo"
        >
          {{ showFileInfo ? '隐藏' : '显示' }}文件信息
        </n-button>
        <n-button @click="visible = false">
          关闭
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal,
  NCard,
  NButton,
  NSpace,
  NIcon,
  NSpin,
  NResult,
  NDescriptions,
  NDescriptionsItem,
  NTag
} from 'naive-ui'
import {
  OpenOutline,
  DownloadOutline
} from '@vicons/ionicons5'
import { getFilePreviewUrl, formatFileSize, formatDate } from '@/utils/fileUtils'
import type { FileInfo } from '@/types'

interface Props {
  show: boolean
  fileInfo: FileInfo | null
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'download', fileInfo: FileInfo): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式状态
const loading = ref(false)
const error = ref<string | null>(null)
const showFileInfo = ref(false)
const previewFrame = ref<HTMLIFrameElement | null>(null)

// 计算属性
const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value)
})

const modalTitle = computed(() => {
  return props.fileInfo ? `预览 - ${props.fileInfo.name}` : '文件预览'
})

const isHtmlFile = computed(() => {
  return props.fileInfo?.extension.toLowerCase() === '.html'
})

const canOpenInNewTab = computed(() => {
  return isHtmlFile.value && previewUrl.value
})

const previewUrl = computed(() => {
  if (!props.fileInfo || !isHtmlFile.value) return undefined
  return getFilePreviewUrl(props.fileInfo)
})

// 监听文件变化
watch(() => props.fileInfo, (newFile) => {
  if (newFile && props.show) {
    loadPreview()
  }
}, { immediate: true })

watch(() => props.show, (show) => {
  if (show && props.fileInfo) {
    loadPreview()
  } else {
    resetState()
  }
})

// 方法
function loadPreview() {
  if (!props.fileInfo) return
  
  loading.value = true
  error.value = null
  
  if (isHtmlFile.value) {
    // HTML文件通过iframe加载，加载状态由iframe的load事件处理
    // 设置一个超时，防止iframe一直不触发load事件
    setTimeout(() => {
      if (loading.value) {
        loading.value = false
        error.value = '文件加载超时，请检查文件路径是否正确。'
      }
    }, 10000) // 10秒超时
  } else {
    // 其他文件类型暂不支持预览
    loading.value = false
  }
}

function handleIframeLoad() {
  loading.value = false
  error.value = null
}

function handleIframeError(event: Event) {
  console.error('Iframe load error:', event)
  loading.value = false
  error.value = '文件加载失败，请检查文件是否存在或网络连接是否正常。'
}

function retryPreview() {
  loadPreview()
}

function openInNewTab() {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
  }
}

function downloadFile() {
  if (props.fileInfo) {
    emit('download', props.fileInfo)
  }
}

function resetState() {
  loading.value = false
  error.value = null
  showFileInfo.value = false
}

// formatFileSize 和 formatDate 已从 @/utils/fileUtils 导入
</script>

<style scoped lang="scss">
.file-preview-modal {
  --n-body-padding: 0;
}

.preview-container {
  height: calc(90vh - 120px);
  position: relative;
  overflow: hidden;
}

.loading-container,
.error-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-content {
  height: 100%;
  position: relative;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.unsupported-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-info-panel {
  margin-top: 16px;
  border-top: 1px solid var(--n-border-color);
  padding-top: 16px;
}

.file-tags {
  margin-top: 12px;
}

/* 响应式设计 */
@media (max-width: $breakpoint-sm) {
  .file-preview-modal {
    width: 95vw !important;
    height: 95vh !important;
  }
  
  .preview-container {
    height: calc(95vh - 100px);
  }
}
</style>