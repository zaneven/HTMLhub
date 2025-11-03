<template>
  <div class="app-main">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="selection-info" v-if="selectedCount > 0">
          已选择 {{ selectedCount }} 个文件
        </div>
        <div class="file-stats" v-else>
          共 {{ totalFiles }} 个文件，总大小 {{ formatFileSize(totalSize) }}
        </div>
      </div>
      
      <div class="toolbar-right">
        <!-- 批量操作 -->
        <n-dropdown
          v-if="selectedCount > 0"
          :options="batchActions"
          @select="handleBatchAction"
        >
          <n-button>
            批量操作
            <template #icon>
              <n-icon><chevron-down-outline /></n-icon>
            </template>
          </n-button>
        </n-dropdown>
        
        <!-- 视图切换 -->
        <n-button-group>
          <n-button
            :type="viewMode === 'list' ? 'primary' : 'default'"
            @click="setViewMode('list')"
          >
            <template #icon>
              <n-icon><list-outline /></n-icon>
            </template>
          </n-button>
          <n-button
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            @click="setViewMode('grid')"
          >
            <template #icon>
              <n-icon><grid-outline /></n-icon>
            </template>
          </n-button>
        </n-button-group>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <n-spin size="large">
          <template #description>
            正在加载文件列表...
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

      <!-- 空状态 -->
      <n-empty
        v-else-if="paginatedFiles.length === 0"
        description="没有找到文件"
        size="large"
      >
        <template #icon>
          <n-icon><folder-open-outline /></n-icon>
        </template>
      </n-empty>

      <!-- 文件视图 -->
      <div v-else class="file-view">
        <!-- 列表视图 -->
        <file-list-view
          v-if="viewMode === 'list'"
          :files="paginatedFiles"
          :selected-files="selectedFiles"
          :sort-by="sortBy"
          :sort-order="sortOrder"
          @file-click="handleFileClick"
          @file-double-click="handleFileDoubleClick"
          @select-change="handleSelectChange"
          @sort-change="handleSortChange"
          @preview="handlePreview"
          @download="handleDownload"
          @action="handleFileAction"
        />
        
        <!-- 网格视图 -->
        <file-grid-view
          v-else
          :files="paginatedFiles"
          :selected-files="selectedFiles"
          @file-click="handleFileClick"
          @file-double-click="handleFileDoubleClick"
          @select-change="handleSelectChange"
          @preview="handlePreview"
          @download="handleDownload"
          @action="handleFileAction"
        />
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="totalPages > 1">
      <n-pagination
        v-model:page="currentPage"
        :page-count="totalPages"
        :page-size="pageSize"
        show-size-picker
        :page-sizes="[10, 20, 50, 100]"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NButton,
  NButtonGroup,
  NDropdown,
  NPagination,
  NEmpty,
  NSpin,
  NAlert,
  NIcon,
  type DropdownOption
} from 'naive-ui'
import {
  FolderOpenOutline,
  ChevronDownOutline,
  ListOutline,
  GridOutline
} from '@vicons/ionicons5'
import { useFiles } from '@/composables/useFiles'
import { useSearchStore } from '@/stores/search'
import { formatFileSize } from '@/utils/fileUtils'
import type { FileInfo } from '@/types'
import { ViewMode, SortOption } from '@/types'
import FileListView from '@/components/files/FileListView.vue'
import FileGridView from '@/components/files/FileGridView.vue'

// Composables
const {
  loading,
  error,
  files,
  paginatedFiles,
  totalPages,
  totalFiles
} = useFiles()

const searchStore = useSearchStore()

// 响应式状态
const selectedFiles = ref<string[]>([])
const sortBy = ref('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 计算属性
const selectedCount = computed(() => selectedFiles.value.length)
const totalSize = computed(() => {
  return paginatedFiles.value.reduce((total: number, file: FileInfo) => total + (file.size || 0), 0)
})
const viewMode = computed(() => searchStore.viewMode)
const currentPage = computed({
  get: () => searchStore.currentPage,
  set: (value: number) => searchStore.currentPage = value
})
const pageSize = computed(() => searchStore.pageSize)

// 批量操作选项
const batchActions: DropdownOption[] = [
  {
    label: '下载',
    key: 'download'
  }
]

// 方法
const setViewMode = (mode: string) => {
  searchStore.viewMode = mode === 'list' ? ViewMode.LIST : ViewMode.GRID
}

// 文件操作方法
const handleFileDoubleClick = (file: FileInfo) => {
  console.log('Double click file:', file)
  // TODO: 实现文件预览功能
}

const handleSelectChange = (fileId: string, selected: boolean) => {
  if (selected) {
    if (!selectedFiles.value.includes(fileId)) {
      selectedFiles.value.push(fileId)
    }
  } else {
    const index = selectedFiles.value.indexOf(fileId)
    if (index > -1) {
      selectedFiles.value.splice(index, 1)
    }
  }
}

const handleSortChange = (field: string) => {
  // 获取当前排序选项
  const currentSortOption = searchStore.sortOption
  
  // 根据字段名映射到SortOption枚举
  let newSortOption: SortOption
  
  if (field === 'name') {
    newSortOption = currentSortOption === SortOption.NAME_ASC ? SortOption.NAME_DESC : SortOption.NAME_ASC
  } else if (field === 'size') {
    newSortOption = currentSortOption === SortOption.SIZE_ASC ? SortOption.SIZE_DESC : SortOption.SIZE_ASC
  } else if (field === 'date') {
    newSortOption = currentSortOption === SortOption.DATE_ASC ? SortOption.DATE_DESC : SortOption.DATE_ASC
  } else {
    newSortOption = SortOption.NAME_ASC
  }
  
  // 更新搜索store中的排序选项
  searchStore.setSortOption(newSortOption)
  
  // 同时更新本地状态以便UI显示
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'asc'
  }
}

const handlePreview = (file: FileInfo) => {
  // 直接在新标签页打开文件，而不是显示预览弹窗
  const previewUrl = `/${file.path.replace(/^\//, '')}`
  window.open(previewUrl, '_blank')
}

const handleDownload = (file: FileInfo) => {
  // 创建下载链接
  const downloadUrl = `/api/files/download?path=${encodeURIComponent(file.path)}`
  
  // 创建临时链接并触发下载
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = file.name
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleFileAction = (action: string, file: FileInfo) => {
  console.log('File action:', action, file)
  // TODO: 实现文件操作功能
}

const handleBatchAction = (key: string) => {
  console.log('批量操作:', key)
  
  if (key === 'download') {
    // 批量下载选中的文件
    const selectedFileObjects = selectedFiles.value.map(fileId => 
      files.value.find(f => f.id === fileId)
    ).filter(Boolean)
    
    selectedFileObjects.forEach(file => {
      if (file) {
        handleDownload(file)
      }
    })
    
    console.log(`开始下载 ${selectedFileObjects.length} 个文件`)
  }
}

const handleFileClick = (file: FileInfo) => {
  console.log('点击文件:', file)
}

const handlePageSizeChange = (size: number) => {
  searchStore.pageSize = size
}
</script>

<style scoped>
.app-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--n-card-color);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selection-info {
  font-weight: 500;
  color: var(--n-text-color);
}

.file-stats {
  color: var(--n-text-color-2);
  font-size: 14px;
}

.main-content {
  flex: 1;
  overflow: auto;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.file-list {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}



.file-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-name {
  font-weight: 500;
  font-size: 16px;
  color: var(--n-text-color);
  word-break: break-all;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--n-text-color-2);
}

.file-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding: 16px;
}
</style>