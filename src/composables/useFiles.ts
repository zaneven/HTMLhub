import { computed } from 'vue'
import { useFilesStore } from '@/stores/files'
import { useSearchStore } from '@/stores/search'
import type { ProjectInfo } from '@/types'

export function useFiles() {
  const filesStore = useFilesStore()
  const searchStore = useSearchStore()
  
  const loading = computed(() => filesStore.loading)
  const error = computed(() => filesStore.error)

  // 计算属性
  const projects = computed(() => filesStore.projects)
  const categories = computed(() => filesStore.categories)
  const totalProjects = computed(() => filesStore.totalProjects)
  const lastUpdated = computed(() => filesStore.lastUpdated)
  const stats = computed(() => filesStore.getStats)

  // 获取过滤后的项目列表
  const filteredProjects = computed(() => filesStore.filteredProjects)

  // 分页后的项目列表
  const paginatedFiles = computed(() => {
    const start = (searchStore.currentPage - 1) * searchStore.pageSize
    const end = start + searchStore.pageSize
    return filteredProjects.value.slice(start, end)
  })

  // 总页数
  const totalPages = computed(() => {
    return Math.ceil(filteredProjects.value.length / searchStore.pageSize)
  })

  // 兼容旧 API - 返回项目作为文件
  const files = computed(() => filteredProjects.value)
  const totalFiles = computed(() => totalProjects.value)

  // 方法
  const loadFiles = async () => {
    await filesStore.loadIndexData()
  }

  const reloadFiles = async () => {
    await filesStore.reloadIndexData()
  }

  const getProjectsByCategory = (category: string): ProjectInfo[] => {
    return filesStore.getProjectsByCategory(category)
  }

  return {
    // 状态
    loading,
    error,
    
    // 计算属性
    projects,
    categories,
    totalProjects,
    lastUpdated,
    stats,
    filteredProjects,
    paginatedFiles,
    totalPages,
    
    // 兼容旧 API
    files,
    totalFiles,
    
    // 方法
    loadFiles,
    reloadFiles,
    getProjectsByCategory
  }
}