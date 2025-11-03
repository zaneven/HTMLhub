<template>
  <div class="file-list-view">
    <!-- 表头 -->
    <div class="list-header">
      <div class="header-cell select-cell">
        <n-checkbox
          :checked="allSelected"
          :indeterminate="someSelected"
          @update:checked="handleSelectAll"
        />
      </div>
      <div class="header-cell name-cell">
        <n-button text @click="handleSort('name')">
          文件名
          <template #icon>
            <n-icon v-if="sortBy === 'name'">
              <chevron-up-outline v-if="sortOrder === 'asc'" />
              <chevron-down-outline v-else />
            </n-icon>
          </template>
        </n-button>
      </div>
      <div class="header-cell size-cell">
        <n-button text @click="handleSort('size')">
          大小
          <template #icon>
            <n-icon v-if="sortBy === 'size'">
              <chevron-up-outline v-if="sortOrder === 'asc'" />
              <chevron-down-outline v-else />
            </n-icon>
          </template>
        </n-button>
      </div>
      <div class="header-cell date-cell">
        <n-button text @click="handleSort('modifiedAt')">
          修改时间
          <template #icon>
            <n-icon v-if="sortBy === 'modifiedAt'">
              <chevron-up-outline v-if="sortOrder === 'asc'" />
              <chevron-down-outline v-else />
            </n-icon>
          </template>
        </n-button>
      </div>
      <div class="header-cell actions-cell">操作</div>
    </div>

    <!-- 文件列表 -->
    <div class="list-body">
      <div
        v-for="file in files"
        :key="file.id"
        class="file-row"
        :class="{ 'selected': isSelected(file.id) }"
        @click="handleFileClick(file)"
        @dblclick="handleFileDoubleClick(file)"
      >
        <!-- 选择框 -->
        <div class="select-cell">
          <n-checkbox
            :checked="isSelected(file.id)"
            @update:checked="(checked) => handleSelectChange(file.id, checked)"
            @click.stop
          />
        </div>

        <!-- 文件名 -->
        <div class="name-cell">
          <div class="file-icon">
            <n-icon size="20">
              <document-text-outline v-if="file.category === 'document'" />
              <image-outline v-else-if="file.category === 'image'" />
              <videocam-outline v-else-if="file.category === 'video'" />
              <musical-notes-outline v-else-if="file.category === 'audio'" />
              <code-outline v-else-if="file.category === 'code'" />
              <archive-outline v-else-if="file.category === 'archive'" />
              <document-outline v-else />
            </n-icon>
          </div>
          <div class="file-name-info">
            <div class="file-name" :title="file.name">{{ file.name }}</div>
            <div class="file-path" :title="file.path">{{ file.path }}</div>
          </div>
        </div>

        <!-- 文件大小 -->
        <div class="size-cell">
          {{ formatFileSize(file.size) }}
        </div>

        <!-- 修改时间 -->
        <div class="date-cell">
          {{ formatDate(file.modifiedAt) }}
        </div>

        <!-- 操作按钮 -->
        <div class="actions-cell">
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
      <n-empty description="没有找到文件" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NButton,
  NCheckbox,
  NIcon,
  NEmpty
} from 'naive-ui'
import {
  ChevronUpOutline,
  ChevronDownOutline,
  DocumentTextOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNotesOutline,
  CodeOutline,
  ArchiveOutline,
  DocumentOutline,
  EyeOutline,
  DownloadOutline
} from '@vicons/ionicons5'
import { formatFileSize } from '@/utils/fileUtils'
import type { FileInfo } from '@/types'

interface Props {
  files: FileInfo[]
  selectedFiles?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface Emits {
  (e: 'file-click', file: FileInfo): void
  (e: 'file-double-click', file: FileInfo): void
  (e: 'select-change', fileId: string, selected: boolean): void
  (e: 'sort-change', field: string): void
  (e: 'preview', file: FileInfo): void
  (e: 'download', file: FileInfo): void
  (e: 'action', action: string, file: FileInfo): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedFiles: () => [],
  sortBy: '',
  sortOrder: 'asc'
})

const emit = defineEmits<Emits>()

// 计算属性
const isSelected = (fileId: string) => {
  return props.selectedFiles.includes(fileId)
}

const allSelected = computed(() => {
  return props.files.length > 0 && props.files.every(file => props.selectedFiles.includes(file.id))
})

const someSelected = computed(() => {
  return props.selectedFiles.length > 0 && !allSelected.value
})

// 方法
const handleFileClick = (file: FileInfo) => {
  // 直接在新标签页打开文件
  const fileUrl = `/${file.path}`
  window.open(fileUrl, '_blank')
}

const handleFileDoubleClick = (file: FileInfo) => {
  emit('file-double-click', file)
}

const handleSelectChange = (fileId: string, selected: boolean) => {
  emit('select-change', fileId, selected)
}

const handleSelectAll = (selected: boolean) => {
  if (selected) {
    // 选择所有文件
    props.files.forEach(file => {
      if (!props.selectedFiles.includes(file.id)) {
        emit('select-change', file.id, true)
      }
    })
  } else {
    // 取消选择所有文件 - 创建副本避免遍历时数组变化的问题
    const selectedFilesCopy = [...props.selectedFiles]
    selectedFilesCopy.forEach(fileId => {
      emit('select-change', fileId, false)
    })
  }
}

const handleSort = (field: string) => {
  emit('sort-change', field)
}

const handleDownload = (file: FileInfo) => {
  emit('download', file)
}

const handlePreview = (file: FileInfo) => {
  // 在新标签页打开文件
  const fileUrl = `/${file.path}`
  window.open(fileUrl, '_blank')
  emit('preview', file)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.file-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--n-card-color);
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 40px 1fr 120px 180px 120px;
  gap: 12px;
  padding: 12px 16px;
  background: var(--n-color-target);
  border-bottom: 1px solid var(--n-border-color);
  font-weight: 500;
  font-size: 14px;
  color: var(--n-text-color-2);
}

.header-cell {
  display: flex;
  align-items: center;
}

.list-body {
  flex: 1;
  overflow: auto;
}

.file-row {
  display: grid;
  grid-template-columns: 40px 1fr 120px 180px 120px;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.file-row:hover {
  background: var(--n-color-hover);
}

.file-row.selected {
  background: var(--n-color-pressed);
}

.select-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.file-icon {
  flex-shrink: 0;
  color: var(--n-text-color-2);
}

.file-name-info {
  min-width: 0;
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-path {
  font-size: 12px;
  color: var(--n-text-color-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.size-cell,
.date-cell {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--n-text-color-2);
}



.actions-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .list-header,
  .file-row {
    grid-template-columns: 40px 1fr 100px 120px 100px;
  }
}

@media (max-width: 768px) {
  .list-header,
  .file-row {
    grid-template-columns: 40px 1fr 80px 100px;
  }
  
  .date-cell {
    display: none;
  }
}
</style>