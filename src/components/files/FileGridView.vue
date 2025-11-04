<template>
  <div class="file-grid-view">
    <!-- 文件卡片网格 -->
    <div class="grid-container">
      <div
        v-for="file in files"
        :key="file.id"
        class="file-card"
        :class="{ 'selected': isSelected(file.id) }"
        @click="handleFileClick(file)"
        @dblclick="handleFileDoubleClick(file)"
      >
        <!-- 选择框 -->
        <div class="select-overlay">
          <n-checkbox
            :checked="isSelected(file.id)"
            @update:checked="(checked) => handleSelectChange(file.id, checked)"
            @click.stop
          />
        </div>

        <!-- 文件预览/图标 -->
        <div class="file-preview">
          <div class="file-icon">
            <n-icon size="48">
              <document-text-outline v-if="file.category === 'document'" />
              <image-outline v-else-if="file.category === 'image'" />
              <videocam-outline v-else-if="file.category === 'video'" />
              <musical-notes-outline v-else-if="file.category === 'audio'" />
              <code-outline v-else-if="file.category === 'code'" />
              <archive-outline v-else-if="file.category === 'archive'" />
              <document-outline v-else />
            </n-icon>
          </div>
          
          <!-- 文件扩展名标识 -->
          <div class="file-extension" v-if="file.extension">
            {{ file.extension.toUpperCase() }}
          </div>
        </div>

        <!-- 文件信息 -->
        <div class="file-info">
          <div class="file-name" :title="file.name">
            {{ file.nameWithoutExt }}
          </div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
            <span class="file-date">{{ formatDate(file.modifiedAt) }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="file-actions">
          <div class="action-buttons">
            <n-button 
              size="small" 
              @click.stop="handlePreview(file)"
              title="查看"
            >
              <template #icon>
                <n-icon><eye-outline /></n-icon>
              </template>
            </n-button>
            <n-button 
              size="small" 
              @click.stop="handleDownload(file)"
              title="下载"
            >
              <template #icon>
                <n-icon><download-outline /></n-icon>
              </template>
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="files.length === 0" class="empty-state">
      <n-empty description="没有找到文件" size="large">
        <template #icon>
          <n-icon size="64"><folder-open-outline /></n-icon>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  NButton,
  NCheckbox,
  NIcon,
  NEmpty
} from 'naive-ui'
import {
  DocumentTextOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNotesOutline,
  CodeOutline,
  ArchiveOutline,
  DocumentOutline,
  EyeOutline,
  DownloadOutline,
  FolderOpenOutline
} from '@vicons/ionicons5'
import { formatFileSize, getFilePreviewUrl } from '@/utils/fileUtils'
import type { FileInfo } from '@/types'

interface Props {
  files: FileInfo[]
  selectedFiles?: string[]
}

interface Emits {
  (e: 'file-click', file: FileInfo): void
  (e: 'file-double-click', file: FileInfo): void
  (e: 'select-change', fileId: string, selected: boolean): void
  (e: 'preview', file: FileInfo): void
  (e: 'download', file: FileInfo): void
  (e: 'action', action: string, file: FileInfo): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedFiles: () => []
})

const emit = defineEmits<Emits>()

// 计算属性
const isSelected = (fileId: string) => {
  return props.selectedFiles.includes(fileId)
}

// 方法
const handleFileClick = (file: FileInfo) => {
  // 使用工具函数生成兼容部署的预览URL
  const fileUrl = getFilePreviewUrl(file)
  window.open(fileUrl, '_blank', 'noopener')
}

const handleFileDoubleClick = (file: FileInfo) => {
  emit('file-double-click', file)
}

const handleSelectChange = (fileId: string, selected: boolean) => {
  emit('select-change', fileId, selected)
}

const handleDownload = (file: FileInfo) => {
  emit('download', file)
}

const handlePreview = (file: FileInfo) => {
  // 使用工具函数打开预览
  const fileUrl = getFilePreviewUrl(file)
  window.open(fileUrl, '_blank', 'noopener')
  emit('preview', file)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '今天'
  } else if (diffDays === 2) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    })
  }
}
</script>

<style scoped>
.file-grid-view {
  height: 100%;
  overflow: auto;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.file-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--n-card-color);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 240px;
}

.file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--n-color-primary);
}

.file-card.selected {
  border-color: var(--n-color-primary);
  background: var(--n-color-primary-suppl);
}

.select-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}

.file-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  margin-bottom: 12px;
}

.file-icon {
  color: var(--n-text-color-2);
}

.file-extension {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: var(--n-color-primary);
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--n-text-color);
  line-height: 1.4;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.file-category {
  display: flex;
  justify-content: flex-start;
}

.file-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.file-actions {
  margin-top: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.file-card:hover .file-actions {
  opacity: 1;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
    padding: 8px;
  }
  
  .file-card {
    padding: 12px;
    min-height: 200px;
  }
  
  .file-preview {
    height: 60px;
  }
  
  .file-icon {
    font-size: 36px;
  }
}

@media (max-width: 480px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>