<template>
  <n-card class="project-card" hoverable @click="handleClick">
    <template #header>
      <div class="card-header">
        <n-icon size="24" :color="iconColor">
          <component :is="iconComponent" />
        </n-icon>
        <span class="project-name">{{ project.name }}</span>
      </div>
    </template>
    
    <template #header-extra>
      <n-tag :type="project.type === 'directory' ? 'info' : 'success'" size="small">
        {{ project.type === 'directory' ? '项目' : '文件' }}
      </n-tag>
    </template>

    <div class="card-content">
      <div class="meta-item">
        <n-icon size="14">
          <FolderOutline />
        </n-icon>
        <span>{{ project.category }}</span>
      </div>
      <div class="meta-item">
        <n-icon size="14">
          <TimeOutline />
        </n-icon>
        <span>{{ formatDate(project.modifiedAt) }}</span>
      </div>
    </div>

    <template #action>
      <n-button type="primary" ghost block @click.stop="handleClick">
        <template #icon>
          <n-icon><OpenOutline /></n-icon>
        </template>
        打开
      </n-button>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NIcon, NTag, NButton } from 'naive-ui'
import { 
  FolderOpenOutline, 
  DocumentOutline, 
  FolderOutline,
  TimeOutline,
  OpenOutline
} from '@vicons/ionicons5'
import type { ProjectInfo } from '@/types'

const props = defineProps<{
  project: ProjectInfo
}>()

const iconComponent = computed(() => {
  return props.project.type === 'directory' ? FolderOpenOutline : DocumentOutline
})

const iconColor = computed(() => {
  return props.project.type === 'directory' ? '#18a058' : '#2080f0'
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function handleClick() {
  // 构建预览 URL，移除开头的 public/ 前缀
  const previewPath = props.project.indexPath.replace(/^public\//, '/')
  window.open(previewPath, '_blank')
}
</script>

<style scoped>
.project-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.project-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--n-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--n-text-color-3);
}

/* 深色模式优化 */
@media (prefers-color-scheme: dark) {
  .project-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
}
</style>
