<template>
  <div class="project-card" @click="handleCardClick">
    <!-- 头部区域：图标 + 标题 + 来源标识 -->
    <div class="card-header">
      <div class="card-identity">
        <div class="card-file-icon" :class="iconColorClass">
          <n-icon size="16">
            <component :is="iconComponent" />
          </n-icon>
        </div>
        <div class="card-text-block">
          <div class="card-title" :title="project.name">
            {{ project.name }}
          </div>
          <div class="card-subpath">
            {{ project.category }} / {{ project.type === 'directory' ? 'project' : 'html' }}
          </div>
        </div>
      </div>

      <!-- 来源硬核微标 -->
      <div class="card-source-tag" :class="project.source === 'cloud' ? 'source-cloud' : 'source-local'">
        <n-icon size="12" class="source-icon">
          <CloudOutline v-if="project.source === 'cloud'" />
          <DesktopOutline v-else />
        </n-icon>
        <span>{{ project.source === 'cloud' ? '云端 R2' : '本地' }}</span>
      </div>
    </div>

    <!-- 核心元数据行：紧凑高信噪比单行排版，拒绝药丸标签堆砌 -->
    <div class="card-meta-line">
      <span class="meta-item">
        <n-icon size="12" class="meta-icon"><TimeOutline /></n-icon>
        <span class="meta-text">{{ formatRelativeTime(project.modifiedAt) }}</span>
      </span>
      <span class="meta-sep">·</span>
      <span class="meta-item">
        <span class="status-dot"></span>
        <span class="meta-text">{{ project.source === 'cloud' ? '已同步' : '就绪' }}</span>
      </span>
    </div>

    <!-- 底部操作条：极简工坊动作 -->
    <div class="card-footer" @click.stop>
      <div class="footer-actions">
        <!-- 复制直链 -->
        <button 
          class="icon-action-btn" 
          title="复制直链" 
          @click.stop="handleCopyLink"
        >
          <n-icon size="13"><CopyOutline /></n-icon>
        </button>

        <!-- 管理员专属工具 -->
        <template v-if="project.source === 'cloud' && isAuthenticated">
          <button 
            class="icon-action-btn" 
            title="管理项目与设置" 
            @click.stop="$emit('edit', project)"
          >
            <n-icon size="13"><CreateOutline /></n-icon>
          </button>
          
          <n-popconfirm @positive-click.stop="$emit('delete', project)" @click.stop>
            <template #trigger>
              <button 
                class="icon-action-btn btn-danger" 
                title="删除项目" 
                @click.stop
              >
                <n-icon size="13"><TrashOutline /></n-icon>
              </button>
            </template>
            确定要永久删除此项目吗？
          </n-popconfirm>
        </template>
      </div>

      <!-- 右侧：单一明确的在新标签页打开外部访问按钮 -->
      <button 
        class="open-external-btn" 
        title="在新窗口中独立访问"
        @click.stop="handleOpenExternal"
      >
        <span>访问</span>
        <n-icon size="12"><OpenOutline /></n-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NIcon, NPopconfirm, useMessage } from 'naive-ui'
import { 
  FolderOpenOutline, 
  DocumentTextOutline, 
  TimeOutline,
  OpenOutline,
  CloudOutline,
  DesktopOutline,
  CopyOutline,
  CreateOutline,
  TrashOutline
} from '@vicons/ionicons5'
import type { ProjectInfo } from '@/types'
import { useFilesStore } from '@/stores/files'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  project: ProjectInfo
}>()

const emit = defineEmits<{
  (e: 'edit', project: ProjectInfo): void
  (e: 'delete', project: ProjectInfo): void
}>()

const filesStore = useFilesStore()
const authStore = useAuthStore()
const message = useMessage()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const iconComponent = computed(() => {
  return props.project.type === 'directory' ? FolderOpenOutline : DocumentTextOutline
})

const iconColorClass = computed(() => {
  if (props.project.type === 'directory') {
    return 'icon-dir'
  }
  return 'icon-doc'
})

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return '刚刚'
    if (diffMin < 60) return `${diffMin}分钟前`
    if (diffHour < 24) return `${diffHour}小时前`
    if (diffDay < 30) return `${diffDay}天前`
    
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  } catch {
    return dateString
  }
}

function handleCardClick() {
  emit('edit', props.project)
}

function handleOpenExternal() {
  const url = filesStore.getFileUrl(props.project)
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function handleCopyLink() {
  const url = filesStore.getFileUrl(props.project)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    message?.success(`已复制直链: ${props.project.name}`)
  } catch {
    message?.error('复制直链失败')
  }
}
</script>

<style scoped>
.project-card {
  background: var(--n-card-color, #ffffff);
  border: 1px solid var(--n-border-color, #e2e8f0);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
  height: 100%;
}

.project-card:hover {
  border-color: #818cf8;
  box-shadow: 0 4px 14px -2px rgba(15, 23, 42, 0.06);
}

:root[data-theme='dark'] .project-card:hover,
.dark .project-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.4);
}

/* 头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.card-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.card-file-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-dir {
  background: rgba(79, 70, 229, 0.08);
  color: #4f46e5;
}

.icon-doc {
  background: rgba(2, 132, 199, 0.08);
  color: #0284c7;
}

:root[data-theme='dark'] .icon-dir,
.dark .icon-dir {
  background: rgba(129, 140, 248, 0.15);
  color: #a5b4fc;
}

:root[data-theme='dark'] .icon-doc,
.dark .icon-doc {
  background: rgba(56, 189, 248, 0.15);
  color: #7dd3fc;
}

.card-text-block {
  min-width: 0;
  flex: 1;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--n-text-color-1, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.card-subpath {
  font-size: 11px;
  color: var(--n-text-color-3, #64748b);
  font-family: monospace;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 来源微标 */
.card-source-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 6px;
  flex-shrink: 0;
}

.source-cloud {
  background: rgba(2, 132, 199, 0.08);
  color: #0284c7;
  border: 1px solid rgba(2, 132, 199, 0.2);
}

.source-local {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

:root[data-theme='dark'] .source-cloud,
.dark .source-cloud {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.25);
}

:root[data-theme='dark'] .source-local,
.dark .source-local {
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.25);
}

/* 单行纯净元数据 */
.card-meta-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--n-text-color-3, #64748b);
  margin-bottom: 14px;
  font-variant-numeric: tabular-nums;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-sep {
  opacity: 0.4;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

/* 底部操作 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(var(--n-text-color-rgb), 0.06);
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(var(--n-text-color-rgb), 0.04);
  border: 1px solid rgba(var(--n-text-color-rgb), 0.08);
  color: var(--n-text-color-2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-action-btn:hover {
  background: rgba(var(--n-text-color-rgb), 0.08);
  color: var(--n-text-color-1);
}

.icon-action-btn.btn-danger:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.open-external-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #4f46e5;
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.open-external-btn:hover {
  background: #4338ca;
}
</style>
