import { computed, ref, watch } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useRouter } from 'vue-router'
import type { SearchFilter } from '@/types'
import { SortOption, ViewMode } from '@/types'

export function useSearch() {
  const searchStore = useSearchStore()
  const router = useRouter()
  
  const searchInput = ref('')
  
  // 计算属性
  const searchQuery = computed({
    get: () => searchStore.searchQuery,
    set: (value: string) => searchStore.setSearchQuery(value)
  })
  
  const searchFilter = computed({
    get: () => searchStore.searchFilter,
    set: (value: SearchFilter) => searchStore.setSearchFilter(value)
  })
  
  const sortOption = computed({
    get: () => searchStore.sortOption,
    set: (value: SortOption) => searchStore.setSortOption(value)
  })
  
  const viewMode = computed({
    get: () => searchStore.viewMode,
    set: (value: ViewMode) => searchStore.setViewMode(value)
  })
  
  const currentPage = computed({
    get: () => searchStore.currentPage,
    set: (value: number) => searchStore.setCurrentPage(value)
  })
  
  const pageSize = computed({
    get: () => searchStore.pageSize,
    set: (value: number) => searchStore.setPageSize(value)
  })
  
  const searchHistory = computed(() => searchStore.searchHistory)
  const hasActiveFilters = computed(() => searchStore.hasActiveFilters)
  const searchParams = computed(() => searchStore.searchParams)
  
  // 搜索方法
  const performSearch = (query: string) => {
    searchStore.setSearchQuery(query)
    // 添加到历史记录（需要手动实现）
    if (query && !searchStore.searchHistory.includes(query)) {
      searchStore.searchHistory.unshift(query)
      if (searchStore.searchHistory.length > 10) {
        searchStore.searchHistory.pop()
      }
    }
    searchStore.setCurrentPage(1) // 重置到第一页
    
    // 更新URL
    updateURL()
  }
  
  const clearSearch = () => {
    searchStore.clearSearch()
    searchInput.value = ''
    
    // 更新URL
    updateURL()
  }
  
  const applyFilter = (filter: Partial<SearchFilter>) => {
    const newFilter = { ...searchStore.searchFilter, ...filter }
    searchStore.setSearchFilter(newFilter)
    searchStore.setCurrentPage(1) // 重置到第一页
    
    // 更新URL
    updateURL()
  }
  
  const clearFilter = () => {
    searchStore.clearSearch()
    searchStore.setCurrentPage(1)
    
    // 更新URL
    updateURL()
  }
  
  const toggleViewMode = () => {
    const newMode = viewMode.value === ViewMode.LIST ? ViewMode.CARD : ViewMode.LIST
    searchStore.setViewMode(newMode)
  }
  
  const goToPage = (page: number) => {
    searchStore.setCurrentPage(page)
    
    // 更新URL
    updateURL()
  }
  
  const nextPage = () => {
    searchStore.setCurrentPage(currentPage.value + 1)
    updateURL()
  }
  
  const prevPage = () => {
    if (currentPage.value > 1) {
      searchStore.setCurrentPage(currentPage.value - 1)
      updateURL()
    }
  }
  
  // URL同步
  const updateURL = () => {
    const params = new URLSearchParams()
    
    if (searchQuery.value) {
      params.set('q', searchQuery.value)
    }
    
    if (searchFilter.value.category) {
      params.set('category', searchFilter.value.category)
    }
    
    if (searchFilter.value.tags.length > 0) {
      params.set('tags', searchFilter.value.tags.join(','))
    }
    
    if (searchFilter.value.dateRange.start) {
      params.set('dateStart', searchFilter.value.dateRange.start)
    }
    
    if (searchFilter.value.dateRange.end) {
      params.set('dateEnd', searchFilter.value.dateRange.end)
    }
    
    if (searchFilter.value.sizeRange.min !== undefined) {
      params.set('sizeMin', searchFilter.value.sizeRange.min.toString())
    }
    
    if (searchFilter.value.sizeRange.max !== undefined) {
      params.set('sizeMax', searchFilter.value.sizeRange.max.toString())
    }
    
    if (sortOption.value !== SortOption.DATE_DESC) {
      params.set('sort', sortOption.value)
    }
    
    if (viewMode.value !== 'list') {
      params.set('view', viewMode.value)
    }
    
    if (currentPage.value > 1) {
      params.set('page', currentPage.value.toString())
    }
    
    if (pageSize.value !== 20) {
      params.set('size', pageSize.value.toString())
    }
    
    // 更新URL但不触发导航
    const currentPath = router.currentRoute.value.path
    router.replace({ path: currentPath, query: Object.fromEntries(params) })
  }
  
  // 从URL恢复搜索状态
  const restoreFromURL = () => {
    const query = router.currentRoute.value.query
    
    if (query.q && typeof query.q === 'string') {
      searchStore.setSearchQuery(query.q)
      searchInput.value = query.q
    }
    
    const filter: Partial<SearchFilter> = {}
    
    if (query.category && typeof query.category === 'string') {
      filter.category = query.category
    }
    
    if (query.tags && typeof query.tags === 'string') {
      filter.tags = query.tags.split(',')
    }
    
    if (query.dateStart && typeof query.dateStart === 'string') {
      filter.dateRange = { ...searchFilter.value.dateRange, start: query.dateStart }
    }
    
    if (query.dateEnd && typeof query.dateEnd === 'string') {
      filter.dateRange = { ...searchFilter.value.dateRange, end: query.dateEnd }
    }
    
    if (query.sizeMin && typeof query.sizeMin === 'string') {
      const min = parseInt(query.sizeMin)
      if (!isNaN(min)) {
        filter.sizeRange = { ...searchFilter.value.sizeRange, min }
      }
    }
    
    if (query.sizeMax && typeof query.sizeMax === 'string') {
      const max = parseInt(query.sizeMax)
      if (!isNaN(max)) {
        filter.sizeRange = { ...searchFilter.value.sizeRange, max }
      }
    }
    
    if (Object.keys(filter).length > 0) {
      searchStore.setSearchFilter({ ...searchFilter.value, ...filter })
    }
    
    if (query.sort && typeof query.sort === 'string') {
      searchStore.setSortOption(query.sort as SortOption)
    }
    
    if (query.view && typeof query.view === 'string') {
      searchStore.setViewMode(query.view as ViewMode)
    }
    
    if (query.page && typeof query.page === 'string') {
      const page = parseInt(query.page)
      if (!isNaN(page) && page > 0) {
        searchStore.setCurrentPage(page)
      }
    }
    
    if (query.size && typeof query.size === 'string') {
      const size = parseInt(query.size)
      if (!isNaN(size) && size > 0) {
        searchStore.setPageSize(size)
      }
    }
  }
  
  // 搜索建议
  const getSearchSuggestions = (input: string): string[] => {
    if (!input || input.length < 2) return []
    
    const suggestions = new Set<string>()
    const inputLower = input.toLowerCase()
    
    // 从历史记录中获取建议
    searchHistory.value.forEach(item => {
      if (item.toLowerCase().includes(inputLower)) {
        suggestions.add(item)
      }
    })
    
    return Array.from(suggestions).slice(0, 5)
  }
  
  // 监听路由变化
  watch(() => router.currentRoute.value.query, () => {
    restoreFromURL()
  }, { immediate: true })
  
  return {
    // 响应式状态
    searchInput,
    searchQuery,
    searchFilter,
    sortOption,
    viewMode,
    currentPage,
    pageSize,
    searchHistory,
    hasActiveFilters,
    searchParams,
    
    // 方法
    performSearch,
    clearSearch,
    applyFilter,
    clearFilter,
    toggleViewMode,
    goToPage,
    nextPage,
    prevPage,
    updateURL,
    restoreFromURL,
    getSearchSuggestions
  }
}