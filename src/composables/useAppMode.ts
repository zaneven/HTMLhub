import { computed } from 'vue'

/**
 * 应用运行模式检测 composable
 * 
 * 根据环境变量 VITE_API_URL 判断当前是静态模式还是云端模式：
 * - 静态模式：不配置 VITE_API_URL，使用本地扫描的 file-index.json
 * - 云端模式：配置 VITE_API_URL，启用登录、上传、管理功能
 */
export function useAppMode() {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined

  /**
   * 是否为云端模式
   */
  const isCloudMode = computed(() => !!apiUrl && apiUrl.trim() !== '')

  /**
   * 是否为静态模式
   */
  const isStaticMode = computed(() => !isCloudMode.value)

  /**
   * API 基础 URL（云端模式使用）
   */
  const apiBaseUrl = computed(() => apiUrl?.trim() || '')

  return {
    isCloudMode,
    isStaticMode,
    apiBaseUrl
  }
}
