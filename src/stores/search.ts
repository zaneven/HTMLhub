import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SearchFilter } from '../types'
import { SortOption, ViewMode } from '../types'

export const useSearchStore = defineStore('search', () => {
  // 状态
  const searchQuery = ref('')
  const searchFilter = ref<SearchFilter>({
    keyword: '',
    category: '',
    tags: [],
    dateRange: {
      start: undefined,
      end: undefined
    },
    sizeRange: {
      min: undefined,
      max: undefined
    }
  })
  const sortOption = ref<SortOption>(SortOption.NAME_ASC)
  const viewMode = ref<ViewMode>(ViewMode.GRID)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const searchHistory = ref<string[]>([])
  
  // 计算属性
  const hasActiveFilters = computed(() => {
    return searchQuery.value.trim() !== '' ||
           searchFilter.value.keyword.trim() !== '' ||
           searchFilter.value.category.trim() !== '' ||
           searchFilter.value.tags.length > 0 ||
           (searchFilter.value.dateRange.start && searchFilter.value.dateRange.end) ||
           (searchFilter.value.sizeRange.min !== undefined && searchFilter.value.sizeRange.max !== undefined)
  })
  
  const searchParams = computed(() => ({
    query: searchQuery.value,
    filter: searchFilter.value,
    sort: sortOption.value,
    page: currentPage.value,
    pageSize: pageSize.value
  }))
  
  // 动作
  function setSearchQuery(query: string) {
    searchQuery.value = query
    currentPage.value = 1 // 重置到第一页
    
    // 添加到搜索历史
    if (query.trim() && !searchHistory.value.includes(query.trim())) {
      searchHistory.value.unshift(query.trim())
      // 限制历史记录数量
      if (searchHistory.value.length > 10) {
        searchHistory.value = searchHistory.value.slice(0, 10)
      }
    }
  }
  
  function setSearchFilter(filter: Partial<SearchFilter>) {
    searchFilter.value = { ...searchFilter.value, ...filter }
    currentPage.value = 1 // 重置到第一页
  }
  
  function setSortOption(sort: SortOption) {
    sortOption.value = sort
    currentPage.value = 1 // 重置到第一页
  }
  
  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }
  
  function setCurrentPage(page: number) {
    currentPage.value = page
  }
  
  function setPageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1 // 重置到第一页
  }
  
  function clearSearch() {
    searchQuery.value = ''
    searchFilter.value = {
      keyword: '',
      category: '',
      tags: [],
      dateRange: {
        start: undefined,
        end: undefined
      },
      sizeRange: {
        min: undefined,
        max: undefined
      }
    }
    currentPage.value = 1
  }
  
  function clearSearchHistory() {
    searchHistory.value = []
  }
  
  function removeFromHistory(query: string) {
    const index = searchHistory.value.indexOf(query)
    if (index > -1) {
      searchHistory.value.splice(index, 1)
    }
  }
  
  // 设置分类筛选
  function setCategoryFilter(category: string) {
    searchFilter.value.category = category
    currentPage.value = 1
  }
  
  // 清除分类筛选
  function clearCategoryFilter() {
    searchFilter.value.category = ''
    currentPage.value = 1
  }
  
  // 添加标签筛选
  function addTagFilter(tag: string) {
    if (!searchFilter.value.tags.includes(tag)) {
      searchFilter.value.tags.push(tag)
      currentPage.value = 1
    }
  }
  
  // 移除标签筛选
  function removeTagFilter(tag: string) {
    const index = searchFilter.value.tags.indexOf(tag)
    if (index > -1) {
      searchFilter.value.tags.splice(index, 1)
      currentPage.value = 1
    }
  }
  
  // 设置日期范围筛选
  function setDateRangeFilter(start?: string, end?: string) {
    searchFilter.value.dateRange = { start, end }
    currentPage.value = 1
  }
  
  // 设置文件大小范围筛选
  function setSizeRangeFilter(min?: number, max?: number) {
    searchFilter.value.sizeRange = { min, max }
    currentPage.value = 1
  }
  
  return {
    // 状态
    searchQuery,
    searchFilter,
    sortOption,
    viewMode,
    currentPage,
    pageSize,
    searchHistory,
    
    // 计算属性
    hasActiveFilters,
    searchParams,
    
    // 动作
    setSearchQuery,
    setSearchFilter,
    setSortOption,
    setViewMode,
    setCurrentPage,
    setPageSize,
    clearSearch,
    clearSearchHistory,
    removeFromHistory,
    setCategoryFilter,
    clearCategoryFilter,
    addTagFilter,
    removeTagFilter,
    setDateRangeFilter,
    setSizeRangeFilter
  }
})