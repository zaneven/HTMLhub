import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ProjectInfo, CategoryInfo, ProjectIndexData } from '../types'
import { retry } from '../utils/api'
import { useSearchStore } from './search'
import { useAppMode } from '@/composables/useAppMode'
import { useAuthStore } from './auth'

export const useFilesStore = defineStore('files', () => {
  const { isCloudMode, apiBaseUrl } = useAppMode()

  // 状态
  const indexData = ref<ProjectIndexData | null>(null)
  const loading = ref(false)
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const selectedCategory = ref<string>('')

  // 计算属性
  const projects = computed(() => indexData.value?.projects || [])
  const categories = computed(() => indexData.value?.categories || [])
  const totalProjects = computed(() => indexData.value?.stats?.totalProjects || 0)
  const totalCategories = computed(() => indexData.value?.stats?.totalCategories || 0)
  const lastUpdated = computed(() => indexData.value?.generatedAt)

  // 根据分类获取项目
  const getProjectsByCategory = computed(() => (category: string): ProjectInfo[] => {
    if (!category) return projects.value
    return projects.value.filter(project => project.category === category)
  })

  // 当前显示的项目（根据选中分类和搜索关键词过滤）
  const filteredProjects = computed(() => {
    const searchStore = useSearchStore()
    const searchQuery = searchStore.searchQuery.toLowerCase().trim()
    
    let result = projects.value
    
    // 按分类过滤
    if (selectedCategory.value) {
      result = result.filter(project => project.category === selectedCategory.value)
    }
    
    // 按搜索关键词过滤
    if (searchQuery) {
      result = result.filter(project => 
        project.name.toLowerCase().includes(searchQuery) ||
        project.category.toLowerCase().includes(searchQuery)
      )
    }
    
    return result
  })

  // 获取项目统计信息
  const getStats = computed(() => {
    const stats = {
      totalProjects: totalProjects.value,
      totalCategories: totalCategories.value,
      totalSize: 0
    }
    return stats
  })

  // 动作
  async function loadIndexData() {
    loading.value = true
    error.value = null

    try {
      const data = await retry(() => fetchProjectIndexData(), 3)
      indexData.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载项目索引失败'
      console.error('Failed to load project index:', err)
    } finally {
      loading.value = false
    }
  }

  // 根据模式获取项目索引数据
  async function fetchProjectIndexData(): Promise<ProjectIndexData> {
    // 云端模式：从 Worker API 获取
    if (isCloudMode.value) {
      const response = await fetch(`${apiBaseUrl.value}/api/files`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    }
    
    // 静态模式：从本地 JSON 文件获取
    const response = await fetch('/data/file-index.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  // 重新加载索引数据
  async function reloadIndexData() {
    await loadIndexData()
  }

  // 设置选中分类
  function setSelectedCategory(category: string) {
    selectedCategory.value = category
  }

  /**
   * 上传文件 (仅云端模式)
   */
  async function uploadFile(file: File, category: string, projectName?: string): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法上传文件'
      return false
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return false
    }

    uploading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      if (projectName) {
        formData.append('projectName', projectName)
      }

      const response = await fetch(`${apiBaseUrl.value}/api/upload`, {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 刷新索引
        await reloadIndexData()
        return true
      } else {
        error.value = data.error || '上传失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '上传失败'
      return false
    } finally {
      uploading.value = false
    }
  }

  /**
   * 删除项目 (仅云端模式)
   */
  async function deleteProject(project: ProjectInfo): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法删除项目'
      return false
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return false
    }

    error.value = null

    try {
      const response = await fetch(`${apiBaseUrl.value}/api/files?key=${encodeURIComponent(project.path)}`, {
        method: 'DELETE',
        headers: authStore.getAuthHeaders()
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 刷新索引
        await reloadIndexData()
        return true
      } else {
        error.value = data.error || '删除失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除失败'
      return false
    }
  }

  /**
   * 刷新索引 (仅云端模式，强制重新扫描 R2)
   */
  async function refreshIndex(): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式'
      return false
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiBaseUrl.value}/api/refresh`, {
        method: 'POST',
        headers: authStore.getAuthHeaders()
      })

      const data = await response.json()

      if (response.ok && data.success) {
        indexData.value = data.data
        return true
      } else {
        error.value = data.error || '刷新失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取文件内容 URL (云端模式返回 API URL，静态模式返回本地路径)
   */
  function getFileUrl(project: ProjectInfo): string {
    if (isCloudMode.value) {
      return `${apiBaseUrl.value}/api/content?key=${encodeURIComponent(project.indexPath)}`
    }
    // 静态模式：直接返回本地路径
    return `/${project.indexPath}`
  }

  return {
    // 状态
    indexData,
    loading,
    uploading,
    error,
    selectedCategory,

    // 计算属性
    projects,
    categories,
    totalProjects,
    totalCategories,
    lastUpdated,
    getProjectsByCategory,
    filteredProjects,
    getStats,

    // 动作
    loadIndexData,
    reloadIndexData,
    setSelectedCategory,
    uploadFile,
    deleteProject,
    refreshIndex,
    getFileUrl
  }
})