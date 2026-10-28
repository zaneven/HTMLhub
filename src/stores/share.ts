import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  ProjectInfo,
  ShareCreateResult,
  ShareLinkInfo,
  ShareStatus,
} from '@/types'
import { useAppMode } from '@/composables/useAppMode'
import { useAuthStore } from './auth'
import { useFilesStore } from './files'

export interface ShareSaveInput {
  /** auto=服务端随机生成；custom=使用 password */
  mode: 'auto' | 'custom'
  password?: string
  length?: number
  /** 0 表示永久 */
  ttlSeconds: number
  hint?: string
}

interface PreviewToken {
  k: string
  expiresAt: number
}

/**
 * 项目分享状态管理
 *
 * 负责分享面板的开合、状态读取、创建 / 重置 / 撤销，
 * 以及管理员预览时使用的临时免密令牌。
 */
export const useShareStore = defineStore('share', () => {
  const { isCloudMode, apiBaseUrl } = useAppMode()

  const showDialog = ref(false)
  const project = ref<ProjectInfo | null>(null)
  const status = ref<ShareStatus | null>(null)
  const links = ref<ShareLinkInfo | null>(null)
  /** 创建 / 重置后返回的明文密码，仅保存在内存中 */
  const created = ref<ShareCreateResult | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  /** 配置变更计数，工作台据此刷新预览令牌 */
  const revision = ref(0)

  const isEnabled = computed(() => Boolean(status.value?.enabled))
  const isExpired = computed(() => Boolean(status.value?.expired))

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const authStore = useAuthStore()
    const response = await fetch(`${apiBaseUrl.value}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...authStore.getAuthHeaders(),
        ...(init.headers as Record<string, string> | undefined),
      },
    })

    if (response.status === 401) {
      await authStore.logout()
      throw new Error('登录已过期，请重新登录')
    }

    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error || `请求失败 (${response.status})`)
    }

    return (payload.data ?? payload) as T
  }

  function resetState() {
    status.value = null
    links.value = null
    created.value = null
    error.value = null
    loading.value = false
    saving.value = false
  }

  async function refresh(): Promise<void> {
    if (!project.value || !isCloudMode.value) return

    loading.value = true
    error.value = null

    try {
      const path = project.value.path
      const nextStatus = await request<ShareStatus>(
        `/api/share?path=${encodeURIComponent(path)}`,
      )
      status.value = nextStatus

      if (nextStatus.enabled && !nextStatus.expired) {
        links.value = await request<ShareLinkInfo>('/api/share/link', {
          method: 'POST',
          body: JSON.stringify({ path }),
        })
      } else {
        links.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '读取分享状态失败'
    } finally {
      loading.value = false
    }
  }

  async function open(target: ProjectInfo): Promise<void> {
    if (!isCloudMode.value || target.source !== 'cloud') return

    project.value = target
    showDialog.value = true
    resetState()
    await refresh()
  }

  function close(): void {
    showDialog.value = false
    // 关闭后立即丢弃明文密码，避免长时间驻留内存
    created.value = null
  }

  async function refreshProjectIndex(): Promise<void> {
    const filesStore = useFilesStore()
    await filesStore.reloadIndexData()
  }

  async function save(input: ShareSaveInput): Promise<boolean> {
    if (!project.value) return false

    saving.value = true
    error.value = null

    try {
      const result = await request<ShareCreateResult>('/api/share', {
        method: 'PUT',
        body: JSON.stringify({
          path: project.value.path,
          indexPath: project.value.indexPath,
          password: input.mode === 'custom' ? input.password?.trim() ?? '' : '',
          length: input.length,
          ttlSeconds: input.ttlSeconds,
          hint: input.hint ?? '',
        }),
      })

      created.value = result
      links.value = {
        link: result.link,
        passwordLink: result.passwordLink,
        tokenExpiresAt: result.tokenExpiresAt,
        expiresAt: result.expiresAt,
      }
      status.value = {
        ...(status.value ?? {}),
        enabled: true,
        hasPassword: true,
        indexPath: result.indexPath,
        expiresAt: result.expiresAt,
        expired: false,
        version: result.version,
      }

      revision.value += 1
      await refreshProjectIndex()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存分享设置失败'
      return false
    } finally {
      saving.value = false
    }
  }

  async function revoke(): Promise<boolean> {
    if (!project.value) return false

    saving.value = true
    error.value = null

    try {
      await request<unknown>(`/api/share?path=${encodeURIComponent(project.value.path)}`, {
        method: 'DELETE',
      })

      status.value = { enabled: false, hasPassword: false }
      links.value = null
      created.value = null
      revision.value += 1
      await refreshProjectIndex()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '撤销分享失败'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * 管理员预览令牌（5 分钟），仅用于工作台内预览
   * 未开启分享的项目返回 null
   */
  async function getPreviewToken(target: ProjectInfo): Promise<PreviewToken | null> {
    if (!isCloudMode.value || target.source !== 'cloud') return null

    try {
      return await request<PreviewToken>('/api/share/preview', {
        method: 'POST',
        body: JSON.stringify({ path: target.path }),
      })
    } catch {
      return null
    }
  }

  function appendPreviewToken(url: string, token?: string | null): string {
    if (!token) return url
    return `${url}${url.includes('?') ? '&' : '?'}k=${encodeURIComponent(token)}`
  }

  /**
   * 生成管理员可直接打开的预览地址（受保护项目自动带上临时令牌）
   */
  async function buildPreviewUrl(target: ProjectInfo): Promise<string> {
    const filesStore = useFilesStore()
    const url = filesStore.getFileUrl(target)
    if (!target.protected) return url
    const token = await getPreviewToken(target)
    return appendPreviewToken(url, token?.k)
  }

  async function openPreviewWindow(target: ProjectInfo): Promise<void> {
    const url = await buildPreviewUrl(target)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return {
    // 状态
    showDialog,
    project,
    status,
    links,
    created,
    loading,
    saving,
    error,
    revision,

    // 计算属性
    isEnabled,
    isExpired,

    // 动作
    open,
    close,
    refresh,
    save,
    revoke,
    getPreviewToken,
    appendPreviewToken,
    buildPreviewUrl,
    openPreviewWindow,
  }
})
