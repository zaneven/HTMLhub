<template>
  <div class="file-detail-view">
    <n-card title="文件详情">
      <template #header-extra>
        <n-space>
          <n-button @click="handlePreview" :disabled="!fileInfo">
            <template #icon>
              <n-icon><eye-outline /></n-icon>
            </template>
            预览
          </n-button>
          <n-button @click="handleDownload" :disabled="!fileInfo">
            <template #icon>
              <n-icon><download-outline /></n-icon>
            </template>
            下载
          </n-button>
          <n-button @click="$router.go(-1)">返回</n-button>
        </n-space>
      </template>
      
      <div class="file-detail-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <n-spin size="large">
            <template #description>
              正在加载文件信息...
            </template>
          </n-spin>
        </div>

        <!-- 错误状态 -->
        <n-alert
          v-else-if="error"
          type="error"
          title="加载失败"
          :description="error"
          show-icon
        />

        <!-- 文件信息 -->
        <div v-else-if="fileInfo" class="file-info-container">
          <!-- 文件基本信息 -->
          <n-card title="基本信息" class="info-card">
            <n-descriptions :column="2" size="medium">
              <n-descriptions-item label="文件名">
                <n-text strong>{{ fileInfo.name }}</n-text>
              </n-descriptions-item>
              <n-descriptions-item label="文件大小">
                {{ formatFileSize(fileInfo.size) }}
              </n-descriptions-item>
              <n-descriptions-item label="文件类型">
                <n-tag :type="getCategoryType(fileInfo.category)">
                  {{ fileInfo.extension.toUpperCase() }}
                </n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="分类">
                <n-tag :type="getCategoryType(fileInfo.category)">
                  {{ fileInfo.category }}
                </n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="创建时间">
                {{ formatDate(fileInfo.createdAt) }}
              </n-descriptions-item>
              <n-descriptions-item label="修改时间">
                {{ formatDate(fileInfo.modifiedAt) }}
              </n-descriptions-item>
              <n-descriptions-item label="文件路径" :span="2">
                <n-text code>{{ fileInfo.path }}</n-text>
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- 标签信息 -->
          <n-card title="标签" class="info-card" v-if="fileInfo.tags.length > 0">
            <n-space>
              <n-tag
                v-for="tag in fileInfo.tags"
                :key="tag"
                type="info"
                size="medium"
              >
                {{ tag }}
              </n-tag>
            </n-space>
          </n-card>

          <!-- 文件预览 -->
          <n-card title="预览" class="info-card preview-card" v-if="isHtmlFile">
            <div class="preview-container">
              <iframe
                :src="previewUrl"
                class="preview-iframe"
                @load="handleIframeLoad"
                @error="handleIframeError"
              />
            </div>
          </n-card>

          <!-- 不支持预览的文件类型 -->
          <n-card title="预览" class="info-card" v-else>
            <n-result
              status="info"
              title="不支持预览"
              description="此文件类型暂不支持在线预览，您可以下载文件查看内容。"
            >
              <template #footer>
                <n-button type="primary" @click="handleDownload">
                  下载文件
                </n-button>
              </template>
            </n-result>
          </n-card>
        </div>

        <!-- 文件不存在 -->
        <n-empty v-else description="文件不存在或已被删除">
          <template #extra>
            <n-button @click="$router.go(-1)">返回</n-button>
          </template>
        </n-empty>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NCard,
  NButton,
  NEmpty,
  NText,
  NSpace,
  NIcon,
  NSpin,
  NAlert,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NResult
} from 'naive-ui'
import {
  EyeOutline,
  DownloadOutline
} from '@vicons/ionicons5'
import { formatFileSize, getFilePreviewUrl } from '@/utils/fileUtils'
import type { FileInfo } from '@/types'

const route = useRoute()

// 响应式状态
const loading = ref(false)
const error = ref<string | null>(null)
const fileInfo = ref<FileInfo | null>(null)

// 计算属性
const fileId = computed(() => route.params.fileId as string)

const isHtmlFile = computed(() => {
  return fileInfo.value?.extension.toLowerCase() === '.html'
})

const previewUrl = computed(() => {
  if (!fileInfo.value || !isHtmlFile.value) return undefined
  return getFilePreviewUrl(fileInfo.value)
})

// 生命周期
onMounted(() => {
  loadFileInfo()
})

// 方法
async function loadFileInfo() {
  if (!fileId.value) return
  
  loading.value = true
  error.value = null
  
  try {
    // 模拟API调用 - 实际项目中应该调用真实的API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟文件数据 - 实际项目中应该从API获取
    fileInfo.value = {
      id: fileId.value,
      name: 'example.html',
      nameWithoutExt: 'example',
      extension: '.html',
      path: '/path/to/example.html',
      absolutePath: '/absolute/path/to/example.html',
      size: 1024 * 50, // 50KB
      category: 'document',
      tags: ['网页', '前端', '示例'],
      createdAt: '2024-01-01T10:00:00Z',
      modifiedAt: '2024-01-15T15:30:00Z'
    }
  } catch (err) {
    error.value = '加载文件信息失败，请稍后重试。'
    console.error('Failed to load file info:', err)
  } finally {
    loading.value = false
  }
}

function handlePreview() {
  if (fileInfo.value) {
    // 直接在新标签页打开文件，而不是显示预览弹窗
    const url = getFilePreviewUrl(fileInfo.value)
    window.open(url, '_blank', 'noopener')
  }
}

function handleDownload() {
  if (!fileInfo.value) return
  
  const downloadUrl = `/api/files/download?path=${encodeURIComponent(fileInfo.value.path)}`
  
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = fileInfo.value.name
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function handleIframeLoad() {
  // preview loaded
}

function handleIframeError() {
  console.error('Failed to load preview')
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getCategoryType(category: string): 'default' | 'error' | 'info' | 'warning' | 'success' | 'primary' {
  const typeMap: Record<string, 'default' | 'error' | 'info' | 'warning' | 'success' | 'primary'> = {
    document: 'info',
    image: 'success',
    video: 'warning',
    audio: 'primary',
    code: 'error',
    archive: 'default'
  }
  return typeMap[category] || 'default'
}
</script>

<style scoped>
.file-detail-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.file-detail-content {
  min-height: 400px;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.file-info-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  width: 100%;
}

.preview-card {
  min-height: 500px;
}

.preview-container {
  height: 450px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-detail-view {
    padding: 12px;
  }
  
  .file-info-container {
    gap: 16px;
  }
  
  .preview-card {
    min-height: 300px;
  }
  
  .preview-container {
    height: 250px;
  }
}
</style>