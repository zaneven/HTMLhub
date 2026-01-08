import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import type { ProjectInfo, CategoryInfo, ProjectIndexData } from '../types'
import { retry } from '../utils/api'
import { useSearchStore } from './search'

export const useFilesStore = defineStore('files', () => {
  // 状态
  const indexData = ref<ProjectIndexData | null>(null)
  const loading = ref(false)
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

  // 从 JSON 文件获取项目索引数据
  async function fetchProjectIndexData(): Promise<ProjectIndexData> {
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

  return {
    // 状态
    indexData,
    loading,
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
    setSelectedCategory
  }
})