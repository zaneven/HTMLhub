import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ThemeConfig, UserPreferences } from '../types'
import { ViewMode, SortOption } from '../types'

export const useSettingsStore = defineStore('settings', () => {
  // 默认主题配置
  const defaultTheme: ThemeConfig = {
    mode: 'auto',
    primaryColor: '#18a058',
    borderRadius: 6,
    fontSize: 14
  }
  
  // 默认用户偏好设置
  const defaultPreferences: UserPreferences = {
    theme: defaultTheme,
    defaultViewMode: ViewMode.GRID,
    defaultSortOption: SortOption.NAME_ASC,
    itemsPerPage: 20,
    showFileSize: true,
    showFileDate: true,
    showFileTags: true,
    autoRefresh: false,
    refreshInterval: 30000 // 30秒
  }
  
  // 状态
  const preferences = ref<UserPreferences>({ ...defaultPreferences })
  const isDarkMode = ref(false)
  
  // 计算属性
  const currentTheme = computed(() => preferences.value.theme)
  const effectiveThemeMode = computed(() => {
    if (preferences.value.theme.mode === 'auto') {
      return isDarkMode.value ? 'dark' : 'light'
    }
    return preferences.value.theme.mode
  })
  
  // 动作
  function loadPreferences() {
    try {
      const saved = localStorage.getItem('html-viewer-preferences')
      if (saved) {
        const parsed = JSON.parse(saved)
        preferences.value = { ...defaultPreferences, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
      preferences.value = { ...defaultPreferences }
    }
  }
  
  function savePreferences() {
    try {
      localStorage.setItem('html-viewer-preferences', JSON.stringify(preferences.value))
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  }
  
  function updateTheme(theme: Partial<ThemeConfig>) {
    preferences.value.theme = { ...preferences.value.theme, ...theme }
    savePreferences()
  }
  
  function setThemeMode(mode: 'light' | 'dark' | 'auto') {
    preferences.value.theme.mode = mode
    savePreferences()
  }
  
  function setPrimaryColor(color: string) {
    preferences.value.theme.primaryColor = color
    savePreferences()
  }
  
  function setBorderRadius(radius: number) {
    preferences.value.theme.borderRadius = radius
    savePreferences()
  }
  
  function setFontSize(size: number) {
    preferences.value.theme.fontSize = size
    savePreferences()
  }
  
  function setDefaultViewMode(mode: ViewMode) {
    preferences.value.defaultViewMode = mode
    savePreferences()
  }
  
  function setDefaultSortOption(sort: SortOption) {
    preferences.value.defaultSortOption = sort
    savePreferences()
  }
  
  function setItemsPerPage(count: number) {
    preferences.value.itemsPerPage = count
    savePreferences()
  }
  
  function setShowFileSize(show: boolean) {
    preferences.value.showFileSize = show
    savePreferences()
  }
  
  function setShowFileDate(show: boolean) {
    preferences.value.showFileDate = show
    savePreferences()
  }
  
  function setShowFileTags(show: boolean) {
    preferences.value.showFileTags = show
    savePreferences()
  }
  
  function setAutoRefresh(enabled: boolean) {
    preferences.value.autoRefresh = enabled
    savePreferences()
  }
  
  function setRefreshInterval(interval: number) {
    preferences.value.refreshInterval = interval
    savePreferences()
  }
  
  function resetToDefaults() {
    preferences.value = { ...defaultPreferences }
    savePreferences()
  }
  
  function exportSettings() {
    return JSON.stringify(preferences.value, null, 2)
  }
  
  function importSettings(settingsJson: string) {
    try {
      const imported = JSON.parse(settingsJson)
      preferences.value = { ...defaultPreferences, ...imported }
      savePreferences()
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }
  
  // 监听系统主题变化
  function initThemeDetection() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      isDarkMode.value = mediaQuery.matches
      
      mediaQuery.addEventListener('change', (e) => {
        isDarkMode.value = e.matches
      })
    }
  }
  
  // 监听偏好设置变化，自动保存
  watch(
    () => preferences.value,
    () => {
      savePreferences()
    },
    { deep: true }
  )
  
  return {
    // 状态
    preferences,
    isDarkMode,
    
    // 计算属性
    currentTheme,
    effectiveThemeMode,
    
    // 动作
    loadPreferences,
    savePreferences,
    updateTheme,
    setThemeMode,
    setPrimaryColor,
    setBorderRadius,
    setFontSize,
    setDefaultViewMode,
    setDefaultSortOption,
    setItemsPerPage,
    setShowFileSize,
    setShowFileDate,
    setShowFileTags,
    setAutoRefresh,
    setRefreshInterval,
    resetToDefaults,
    exportSettings,
    importSettings,
    initThemeDetection
  }
})