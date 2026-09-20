<template>
  <div class="project-card-demo" @click="handleClick">
    <!-- 顶部品牌渐变流光掠影 -->
    <div class="card-top-glow"></div>

    <!-- 头部区域 -->
    <div class="card-header-area">
      <div class="card-title-group">
        <div class="card-file-icon" :class="iconColorClass">
          <n-icon size="18">
            <component :is="iconComponent" />
          </n-icon>
        </div>
        <div class="card-title-info">
          <div class="card-title-text" :title="project.name">
            {{ project.name }}
          </div>
          <div class="card-subtitle-path">
            {{ project.category }} / {{ project.type === 'directory' ? 'project' : 'html' }}
          </div>
        </div>
      </div>

      <div class="card-header-badges">
        <!-- 双通道来源标签 -->
        <span 
          class="badge-pill" 
          :class="project.source === 'cloud' ? 'badge-cloud' : 'badge-local'"
        >
          <n-icon size="12" style="margin-right: 3px;">
            <CloudOutline v-if="project.source === 'cloud'" />
            <DesktopOutline v-else />
          </n-icon>
          {{ project.source === 'cloud' ? '云端 R2' : '本地静态' }}
        </span>
      </div>
    </div>

    <!-- 核心元信息区域 (高信噪比技术芯片，取代冗余代码剪影) -->
    <div class="card-body-meta">
      <div class="card-meta-chips">
        <!-- 分类路径 -->
        <span class="meta-chip">
          <n-icon size="12" class="chip-icon"><FolderOutline /></n-icon>
          <span>{{ project.category }}</span>
        </span>

        <!-- 相对更新时间 -->
        <span class="meta-chip">
          <n-icon size="12" class="chip-icon"><TimeOutline /></n-icon>
          <span>{{ formatRelativeTime(project.modifiedAt) }}</span>
        </span>

        <!-- 状态指示小绿点 -->
        <span class="meta-chip status-chip">
          <span class="status-indicator-dot"></span>
          <span>{{ project.source === 'cloud' ? '已同步' : '就绪' }}</span>
        </span>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="card-meta-footer" @click.stop>
      <!-- 左侧：一键复制直链与管理员工具 -->
      <div class="footer-actions-left">
        <button 
          class="card-btn-action" 
          title="复制直链" 
          @click.stop="handleCopyLink"
        >
          <n-icon size="14"><CopyOutline /></n-icon>
        </button>

        <!-- 管理员工具：编辑与删除 -->
        <template v-if="project.source === 'cloud' && isAuthenticated">
          <button 
            class="card-btn-action btn-edit" 
            title="管理项目文件" 
            @click.stop="$emit('edit', project)"
          >
            <n-icon size="14"><CreateOutline /></n-icon>
          </button>
          
          <n-popconfirm @positive-click.stop="$emit('delete', project)" @click.stop>
            <template #trigger>
              <button 
                class="card-btn-action btn-danger" 
                title="删除项目" 
                @click.stop
              >
                <n-icon size="14"><TrashOutline /></n-icon>
              </button>
            </template>
            确定要永久删除此项目吗？
          </n-popconfirm>
        </template>
      </div>

      <!-- 右侧动作组 -->
      <div class="footer-actions-right">
        <button 
          class="card-btn-action" 
          title="外部新窗口打开" 
          @click.stop="handleOpenExternal"
        >
          <n-icon size="14"><OpenOutline /></n-icon>
        </button>
        <button 
          class="card-btn-primary" 
          @click.stop="handleClick"
        >
          <n-icon size="14" style="margin-right: 4px;"><EyeOutline /></n-icon>
          打开
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NIcon, NPopconfirm, useMessage } from 'naive-ui'
import { 
  FolderOpenOutline, 
  DocumentTextOutline, 
  FolderOutline,
  TimeOutline,
  EyeOutline,
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

defineEmits<{
  (e: 'edit', project: ProjectInfo): void
  (e: 'delete', project: ProjectInfo): void
}>()

const filesStore = useFilesStore()
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

let message: ReturnType<typeof useMessage> | null = null
try {
  message = useMessage()
} catch {
  message = null
}

const iconComponent = computed(() => {
  if (props.project.source === 'cloud') {
    return CloudOutline
  }
  return props.project.type === 'directory' ? FolderOpenOutline : DocumentTextOutline
})

const iconColorClass = computed(() => {
  if (props.project.source === 'cloud') {
    return 'icon-cyan'
  }
  return props.project.type === 'directory' ? 'icon-green' : 'icon-blue'
})

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '刚刚'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 60) return '刚刚'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)} 天前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function handleClick() {
  const url = filesStore.getFileUrl(props.project)
  window.open(url, '_blank')
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
    if (message) {
      message.success(`已复制直链: ${props.project.name}`)
    }
  } catch {
    if (message) {
      message.error('复制直链失败')
    }
  }
}
</script>

<style scoped lang="scss">
.project-card-demo {
  background: var(--bg-surface, #111827);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 12px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all var(--transition-normal, 0.25s ease);
  position: relative;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.2));
  cursor: pointer;
  height: 100%;
}

.project-card-demo:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg, 0 12px 28px -4px rgba(0, 0, 0, 0.5));
  border-color: rgba(99, 102, 241, 0.4);
}

.card-top-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-brand, linear-gradient(135deg, #6366f1 0%, #06b6d4 100%));
  opacity: 0;
  transition: opacity var(--transition-normal, 0.25s ease);
}

.project-card-demo:hover .card-top-glow {
  opacity: 1;
}

.card-header-area {
  padding: 16px 16px 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.card-file-icon {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.project-card-demo:hover .card-file-icon {
  transform: scale(1.05);
}

.card-file-icon.icon-blue {
  background: rgba(99, 102, 241, 0.12);
  color: var(--color-primary, #6366f1);
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.card-file-icon.icon-cyan {
  background: rgba(14, 165, 233, 0.12);
  color: #0ea5e9;
  border: 1px solid rgba(14, 165, 233, 0.25);
}

.card-file-icon.icon-green {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.card-title-info {
  min-width: 0;
  flex: 1;
}

.card-title-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main, #f8fafc);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.card-subtitle-path {
  font-size: 11px;
  color: var(--text-muted, #64748b);
  font-family: var(--font-mono, monospace);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-header-badges {
  flex-shrink: 0;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 9999px;
  line-height: 1;
}

.badge-cloud {
  background: var(--color-cloud-bg, rgba(14, 165, 233, 0.12));
  color: var(--color-cloud, #0ea5e9);
  border: 1px solid var(--color-cloud-border, rgba(14, 165, 233, 0.3));
}

.badge-local {
  background: var(--color-local-bg, rgba(16, 185, 129, 0.12));
  color: var(--color-local, #10b981);
  border: 1px solid var(--color-local-border, rgba(16, 185, 129, 0.3));
}

/* 核心元信息区域 */
.card-body-meta {
  padding: 0 16px 14px;
  flex: 1;
}

.card-meta-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 3px 7px;
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-surface-elevated, #1e293b);
  color: var(--text-secondary, #94a3b8);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  white-space: nowrap;
}

.meta-chip .chip-icon {
  color: var(--text-muted, #64748b);
}

.meta-chip.status-chip {
  color: var(--color-success, #10b981);
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
}

.status-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success, #10b981);
  box-shadow: 0 0 6px var(--color-success, #10b981);
}

/* 底部操作区 */
.card-meta-footer {
  padding: 10px 16px 12px;
  margin-top: auto;
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.footer-actions-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-btn-action {
  background: var(--bg-surface-elevated, #1e293b);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--text-secondary, #94a3b8);
  border-radius: var(--radius-sm, 6px);
  padding: 5px 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-btn-action:hover {
  background: var(--bg-surface-subtle, rgba(255, 255, 255, 0.1));
  color: var(--text-main, #f8fafc);
  border-color: rgba(255, 255, 255, 0.2);
}

.card-btn-action.btn-danger:hover {
  color: var(--color-danger, #ef4444);
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.1);
}

.card-btn-action.btn-edit:hover {
  color: var(--color-primary, #6366f1);
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(99, 102, 241, 0.1);
}

.footer-actions-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-btn-primary {
  background: var(--color-primary, #6366f1);
  border: 1px solid transparent;
  color: #ffffff;
  border-radius: var(--radius-sm, 6px);
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.card-btn-primary:hover {
  background: var(--color-primary-hover, #818cf8);
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
}
</style>
