<template>
  <n-card class="project-card" hoverable @click="handleClick">
    <template #header>
      <div class="card-header">
        <div class="icon-section">
          <div class="icon-blob" :style="{ backgroundColor: iconColor + '10' }">
            <n-icon size="24" :color="iconColor">
              <component :is="iconComponent" />
            </n-icon>
          </div>
          <div class="status-dot" :class="{ 'is-cloud': project.source === 'cloud' }"></div>
        </div>
        <div class="header-main">
          <span class="project-name" :title="project.name">{{ project.name }}</span>
          <div class="project-tags">
            <span class="tag-item category">{{ project.category }}</span>
            <span class="tag-divider">·</span>
            <span class="tag-item type">{{ project.type === 'directory' ? '项目' : '单页' }}</span>
          </div>
        </div>
      </div>
    </template>
    
    <template #header-extra>
      <div class="header-actions">
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="source-indicator">
              <n-icon v-if="project.source === 'cloud'" size="18"><CloudOutline /></n-icon>
              <n-icon v-else size="18"><DesktopOutline /></n-icon>
            </div>
          </template>
          {{ project.source === 'cloud' ? '已同步至云端' : '本地暂存资源' }}
        </n-tooltip>
      </div>
    </template>

    <div class="card-body">
      <div class="meta-info">
        <div class="meta-item">
          <n-icon size="14"><TimeOutline /></n-icon>
          <span>{{ formatDate(project.modifiedAt) }}</span>
        </div>
      </div>
    </div>

    <template #action>
      <div class="action-footer">
        <n-button type="primary" block @click.stop="handleClick" class="main-action">
          <template #icon>
            <n-icon><OpenOutline /></n-icon>
          </template>
          查看项目
        </n-button>
        
        <div class="admin-tools" v-if="project.source === 'cloud' && isAuthenticated">
          <n-button quaternary circle size="small" @click.stop="$emit('edit', project)">
            <template #icon>
              <n-icon><CreateOutline /></n-icon>
            </template>
          </n-button>
          
          <n-popconfirm @positive-click.stop="$emit('delete', project)" @click.stop>
            <template #trigger>
              <n-button quaternary circle size="small" type="error" @click.stop>
                <template #icon>
                  <n-icon><TrashOutline /></n-icon>
                </template>
              </n-button>
            </template>
            确定要永久删除此项目吗？
          </n-popconfirm>
        </div>
      </div>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NIcon, NButton, NPopconfirm, NTooltip } from 'naive-ui'
import {
  FolderOpenOutline,
  DocumentOutline,
  TimeOutline,
  OpenOutline,
  CloudOutline,
  DesktopOutline,
  CreateOutline,
  TrashOutline,
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

const iconComponent = computed(() => {
  return props.project.type === 'directory' ? FolderOpenOutline : DocumentOutline
})

const iconColor = computed(() => {
  return props.project.type === 'directory' ? '#8b5cf6' : '#06b6d4'
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function handleClick() {
  const url = filesStore.getFileUrl(props.project)
  window.open(url, '_blank')
}
</script>

<style scoped>
.project-card {
  position: relative;
  border: 1px solid var(--n-border-color);
  background: var(--n-card-color);
  transition: all 0.4s cubic-bezier(0.2, 0, 0, 1);
  overflow: hidden;
}

.project-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--n-primary-color), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.project-card:hover {
  transform: translateY(-6px);
  border-color: var(--n-primary-color);
}

.project-card:hover::before {
  opacity: 0.6;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.icon-section {
  position: relative;
}

.icon-blob {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.project-card:hover .icon-blob {
  transform: rotate(-4deg) scale(1.05);
}

.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
  border: 2px solid var(--n-card-color);
}

.status-dot.is-cloud {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.project-name {
  font-weight: 800;
  font-size: 15px;
  color: var(--n-text-color-1);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tag-divider {
  opacity: 0.3;
}

.source-indicator {
  color: var(--n-text-color-3);
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.project-card:hover .source-indicator {
  opacity: 1;
}

.card-body {
  margin-top: 2px;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--n-text-color-3);
  font-weight: 500;
}

.action-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-action {
  flex: 1;
  border-radius: 10px !important;
  font-weight: 700 !important;
}

.admin-tools {
  display: flex;
  gap: 4px;
  padding-left: 8px;
  border-left: 1px solid var(--n-border-color);
}

/* 动效 */
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.5); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}

.status-dot.is-cloud::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: inherit;
  animation: pulse 2s infinite;
}
</style>
