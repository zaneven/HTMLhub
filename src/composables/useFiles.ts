import { computed, ref } from 'vue'
import { useFilesStore } from '@/stores/files'
import { useSearchStore } from '@/stores/search'
import type { FileInfo } from '@/types'

export function useFiles() {
  const filesStore = useFilesStore()
  const searchStore = useSearchStore()
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const files = computed(() => filesStore.files)
  const categories = computed(() => filesStore.categories)
  const totalFiles = computed(() => filesStore.totalFiles)
  const lastUpdated = computed(() => filesStore.lastUpdated)
  const stats = computed(() => filesStore.getStats)

  // 获取文件列表（带搜索和筛选）
  const getFilteredFiles = computed(() => {
    let result = files.value

    // 应用搜索筛选
    const filter = searchStore.searchFilter
    
    // 关键词搜索
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase()
      result = result.filter(file => 
        file.name.toLowerCase().includes(keyword) ||
        file.path.toLowerCase().includes(keyword) ||
        file.tags.some(tag => tag.toLowerCase().includes(keyword))
      )
    }

    // 分类筛选
    if (filter.category) {
      result = result.filter(file => {
        // 获取文件的目录分类
        const pathParts = file.path.split('/')
        const categoryName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '根目录'
        return categoryName === filter.category
      })
    }

    // 标签筛选
    if (filter.tags.length > 0) {
      result = result.filter(file => 
        filter.tags.some(tag => file.tags.includes(tag))
      )
    }

    // 日期范围筛选
    if (filter.dateRange.start || filter.dateRange.end) {
      result = result.filter(file => {
        const fileDate = new Date(file.modifiedAt)
        const start = filter.dateRange.start ? new Date(filter.dateRange.start) : null
        const end = filter.dateRange.end ? new Date(filter.dateRange.end) : null
        
        if (start && fileDate < start) return false
        if (end && fileDate > end) return false
        return true
      })
    }

    // 文件大小筛选
    if (filter.sizeRange.min !== undefined || filter.sizeRange.max !== undefined) {
      result = result.filter(file => {
        if (filter.sizeRange.min !== undefined && file.size < filter.sizeRange.min) return false
        if (filter.sizeRange.max !== undefined && file.size > filter.sizeRange.max) return false
        return true
      })
    }

    // 排序
    const sortOption = searchStore.sortOption
    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'date-asc':
          return new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime()
        case 'date-desc':
          return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
        case 'size-asc':
          return a.size - b.size
        case 'size-desc':
          return b.size - a.size
        default:
          return 0
      }
    })

    return result
  })

  // 分页后的文件列表
  const paginatedFiles = computed(() => {
    const start = (searchStore.currentPage - 1) * searchStore.pageSize
    const end = start + searchStore.pageSize
    return getFilteredFiles.value.slice(start, end)
  })

  // 总页数
  const totalPages = computed(() => {
    return Math.ceil(getFilteredFiles.value.length / searchStore.pageSize)
  })

  // 方法
  const loadFiles = async () => {
    loading.value = true
    error.value = null
    try {
      await filesStore.loadIndexData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载文件失败'
    } finally {
      loading.value = false
    }
  }

  const reloadFiles = async () => {
    loading.value = true
    error.value = null
    try {
      await filesStore.reloadIndexData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '重新加载文件失败'
    } finally {
      loading.value = false
    }
  }

  const getFileById = (id: string): FileInfo | undefined => {
    return filesStore.getFileById(id)
  }

  const getFilesByCategory = (category: string): FileInfo[] => {
    return filesStore.getFilesByCategory(category)
  }

  const selectFile = (file: FileInfo) => {
    filesStore.selectedFiles = [file.id]
  }

  const selectFiles = (files: FileInfo[]) => {
    filesStore.selectedFiles = files.map(f => f.id)
  }

  const clearSelection = () => {
    filesStore.selectedFiles = []
  }

  const isFileSelected = (fileId: string): boolean => {
    return filesStore.selectedFiles.includes(fileId)
  }

  return {
    // 状态
    loading,
    error,
    
    // 计算属性
    files,
    categories,
    totalFiles,
    lastUpdated,
    stats,
    getFilteredFiles,
    paginatedFiles,
    totalPages,
    
    // 方法
    loadFiles,
    reloadFiles,
    getFileById,
    getFilesByCategory,
    selectFile,
    selectFiles,
    clearSelection,
    isFileSelected
  }
}