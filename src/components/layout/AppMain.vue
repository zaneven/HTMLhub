<template>
  <div class="app-main">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="category-title" v-if="selectedCategory">
          <n-icon size="20">
            <FolderOpenOutline />
          </n-icon>
          <span>{{ selectedCategory }}</span>
        </div>
        <div class="file-stats" v-else>
          <span>全部项目</span>
        </div>
        <n-divider vertical />
        <span class="project-count">共 {{ filteredProjects.length }} 个项目</span>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <n-spin size="large">
          <template #description>
            正在加载项目列表...
          </template>
        </n-spin>
      </div>

      <!-- 错误状态 -->
      <n-alert
        v-else-if="error"
        type="error"
        title="加载失败"
        :description="error"
        show-icon
      />

      <!-- 空状态 -->
      <n-empty
        v-else-if="filteredProjects.length === 0"
        description="没有找到项目"
        size="large"
      >
        <template #icon>
          <n-icon><folder-open-outline /></n-icon>
        </template>
        <template #extra>
          <n-button @click="clearCategory" v-if="selectedCategory">
            查看全部项目
          </n-button>
        </template>
      </n-empty>

      <!-- 项目卡片网格 -->
      <div v-else class="projects-grid">
        <ProjectCard
          v-for="project in filteredProjects"
          :key="project.id"
          :project="project"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NButton,
  NEmpty,
  NSpin,
  NAlert,
  NIcon,
  NDivider
} from 'naive-ui'
import {
  FolderOpenOutline
} from '@vicons/ionicons5'
import { useFilesStore } from '@/stores/files'
import ProjectCard from '@/components/files/ProjectCard.vue'

// Store
const filesStore = useFilesStore()

// 计算属性
const loading = computed(() => filesStore.loading)
const error = computed(() => filesStore.error)
const selectedCategory = computed(() => filesStore.selectedCategory)
const filteredProjects = computed(() => filesStore.filteredProjects)

// 方法
function clearCategory() {
  filesStore.setSelectedCategory('')
}
</script>

<style scoped>
.app-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--n-card-color);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: var(--n-text-color);
}

.file-stats {
  font-weight: 600;
  font-size: 16px;
  color: var(--n-text-color);
}

.project-count {
  color: var(--n-text-color-3);
  font-size: 14px;
}

.main-content {
  flex: 1;
  overflow: auto;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.projects-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* 平板端适配 */
@media (max-width: 1023px) {
  .app-main {
    padding: 12px;
  }

  .projects-grid {
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

/* 移动端适配 */
@media (max-width: 767px) {
  .app-main {
    padding: 8px;
  }

  .toolbar {
    padding: 10px 12px;
  }

  .category-title {
    font-size: 14px;
  }

  .file-stats {
    font-size: 14px;
  }

  .project-count {
    font-size: 12px;
  }

  .projects-grid {
    gap: 10px;
    grid-template-columns: 1fr;
  }
}

/* 大屏幕优化 */
@media (min-width: 1440px) {
  .projects-grid {
    gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}
</style>