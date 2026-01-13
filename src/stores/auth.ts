import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppMode } from '@/composables/useAppMode'

/**
 * 认证状态管理 Store
 * 
 * 处理管理员登录/登出逻辑，使用 token 认证
 */
export const useAuthStore = defineStore('auth', () => {
  const { apiBaseUrl, isCloudMode } = useAppMode()
  
  // 状态
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => isCloudMode.value && !!token.value)

  /**
   * 登录
   */
  async function login(password: string): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法登录'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiBaseUrl.value}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        token.value = data.data.token
        localStorage.setItem('auth_token', data.data.token)
        return true
      } else {
        error.value = data.error || '登录失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '网络错误'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 登出
   */
  async function logout(): Promise<void> {
    if (token.value && isCloudMode.value) {
      try {
        await fetch(`${apiBaseUrl.value}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })
      } catch {
        // 忽略登出请求错误
      }
    }

    token.value = null
    localStorage.removeItem('auth_token')
    error.value = null
  }

  /**
   * 获取认证头部
   */
  function getAuthHeaders(): Record<string, string> {
    if (token.value) {
      return { 'Authorization': `Bearer ${token.value}` }
    }
    return {}
  }

  /**
   * 清除错误
   */
  function clearError() {
    error.value = null
  }

  return {
    // 状态
    token,
    loading,
    error,

    // 计算属性
    isAuthenticated,

    // 方法
    login,
    logout,
    getAuthHeaders,
    clearError
  }
})
