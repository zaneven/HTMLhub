import { computed, ref } from 'vue'
import { APP_VERSION } from '@/data/changelog'

const STORAGE_KEY = 'htmlhub_last_seen_version'

/**
 * 已读版本号（模块级单例，保证侧边栏、设置页与更新日志页状态同步）
 */
const lastSeenVersion = ref<string>(readLastSeenVersion())

function readLastSeenVersion(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

/** 是否存在尚未查看的新版本 */
export const hasUnseenRelease = computed(() => lastSeenVersion.value !== APP_VERSION)

/**
 * 将当前版本标记为已读
 */
export function markVersionSeen(): void {
  lastSeenVersion.value = APP_VERSION
  try {
    localStorage.setItem(STORAGE_KEY, APP_VERSION)
  } catch {
    // 隐私模式下 localStorage 不可用时静默降级
  }
}

export function useVersion() {
  return {
    version: APP_VERSION,
    lastSeenVersion,
    hasUnseenRelease,
    markVersionSeen,
  }
}
