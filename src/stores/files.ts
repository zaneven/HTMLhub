import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileInfo, IndexData } from '../types'
import { fetchIndexData, retry } from '../utils/api'

export const useFilesStore = defineStore('files', () => {
  // 状态
  const indexData = ref<IndexData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedFiles = ref<string[]>([])
  
  // 计算属性
  const files = computed(() => indexData.value?.files || [])
  const categories = computed(() => {
    const directoryCounts: Record<string, number> = {}
    
    // 基于文件路径统计目录分类
    files.value.forEach(file => {
      const pathParts = file.path.split('/')
      // 移除文件名，获取目录路径
      const directoryParts = pathParts.slice(0, -1)
      
      if (directoryParts.length > 0) {
        // 使用最后一级目录作为分类名
        const categoryName = directoryParts[directoryParts.length - 1]
        if (categoryName) {
          directoryCounts[categoryName] = (directoryCounts[categoryName] || 0) + 1
        }
      } else {
        // 根目录文件
        directoryCounts['根目录'] = (directoryCounts['根目录'] || 0) + 1
      }
    })
    
    return Object.entries(directoryCounts).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count) // 按文件数量排序
  })
  const totalFiles = computed(() => indexData.value?.stats?.totalFiles || 0)
  const lastUpdated = computed(() => indexData.value?.generatedAt)
  
  // 根据分类获取文件
  const getFilesByCategory = computed(() => (category: string) => {
    if (!category) return files.value
    
    // 基于目录路径过滤文件
    return files.value.filter(file => {
      const pathParts = file.path.split('/')
      const directoryParts = pathParts.slice(0, -1)
      
      if (category === '根目录') {
        return directoryParts.length === 0
      }
      
      if (directoryParts.length > 0) {
        const categoryName = directoryParts[directoryParts.length - 1]
        return categoryName === category
      }
      
      return false
    })
  })
  
  // 根据ID获取文件
  const getFileById = computed(() => (id: string) => {
    return files.value.find(file => file.id === id)
  })
  
  // 获取文件统计信息
  const getStats = computed(() => {
    const stats = {
      totalFiles: totalFiles.value,
      totalSize: 0,
      categoryCounts: {} as Record<string, number>,
      recentFiles: [] as FileInfo[]
    }
    
    files.value.forEach(file => {
      stats.totalSize += file.size || 0
      
      // 统计分类数量
      const category = file.category || '未分类'
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1
    })
    
    // 最近文件（按修改时间排序，取前10个）
    stats.recentFiles = [...files.value]
      .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
      .slice(0, 10)
    
    return stats
  })
  
  // 动作
  async function loadIndexData() {
    loading.value = true
    error.value = null
    
    try {
      const data = await retry(() => fetchIndexData(), 3)
      indexData.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载文件索引失败'
      console.error('Failed to load file index:', err)
    } finally {
      loading.value = false
    }
  }
  
  // 重新加载索引数据
  async function reloadIndexData() {
    await loadIndexData()
  }
  
  // 选择文件
  function selectFile(fileId: string) {
    if (!selectedFiles.value.includes(fileId)) {
      selectedFiles.value.push(fileId)
    }
  }
  
  // 取消选择文件
  function unselectFile(fileId: string) {
    const index = selectedFiles.value.indexOf(fileId)
    if (index > -1) {
      selectedFiles.value.splice(index, 1)
    }
  }
  
  // 切换文件选择状态
  function toggleFileSelection(fileId: string) {
    if (selectedFiles.value.includes(fileId)) {
      unselectFile(fileId)
    } else {
      selectFile(fileId)
    }
  }
  
  // 清空选择
  function clearSelection() {
    selectedFiles.value = []
  }
  
  // 全选当前显示的文件
  function selectAllFiles(fileIds: string[]) {
    selectedFiles.value = [...new Set([...selectedFiles.value, ...fileIds])]
  }
  
  return {
    // 状态
    indexData,
    loading,
    error,
    selectedFiles,
    
    // 计算属性
    files,
    categories,
    totalFiles,
    lastUpdated,
    getFilesByCategory,
    getFileById,
    getStats,
    
    // 动作
    loadIndexData,
    reloadIndexData,
    selectFile,
    unselectFile,
    toggleFileSelection,
    clearSelection,
    selectAllFiles
  }
})