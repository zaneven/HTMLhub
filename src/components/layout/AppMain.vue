<template>
  <div class="app-main">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="category-info" v-if="selectedCategory">
          <div class="category-icon">
            <n-icon size="20">
              <FolderOpenOutline />
            </n-icon>
          </div>
          <div class="category-text">
            <span class="category-label">当前目录</span>
            <span class="category-value">{{ selectedCategory }}</span>
          </div>
        </div>
        <div class="all-projects-info" v-else>
          <span class="all-projects-label">所有项目</span>
        </div>
        <n-divider vertical />
        <div class="stats-badge">
          <span class="count-number">{{ filteredProjects.length }}</span>
          <span class="count-label">个项目</span>
        </div>
      </div>

      <div class="toolbar-right">
        <n-space size="small">
          <n-button v-if="isCloudMode && isAuthenticated" :loading="loading" secondary circle @click="handleRefresh">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
          </n-button>
          <n-button v-if="isCloudMode && isAuthenticated" type="primary" class="upload-btn" @click="showUploadModal = true">
            <template #icon>
              <n-icon><CloudUploadOutline /></n-icon>
            </template>
            上传项目
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 加载状态 -->
      <div v-if="loading && filteredProjects.length === 0" class="loading-container">
        <n-spin size="large">
          <template #description>
            <span class="loading-text">正在检索项目资源...</span>
          </template>
        </n-spin>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <n-result status="error" title="加载失败" :description="error">
          <template #footer>
            <n-button @click="handleRefresh">重试</n-button>
          </template>
        </n-result>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredProjects.length === 0" class="empty-container">
        <n-empty description="此目录下暂无项目" size="large">
          <template #icon>
            <n-icon><FolderOpenOutline /></n-icon>
          </template>
          <template #extra>
            <n-space vertical align="center" size="large">
              <p class="empty-hint">您可以尝试切换分类或上传新项目</p>
              <n-space>
                <n-button secondary @click="clearCategory" v-if="selectedCategory">
                  返回全部项目
                </n-button>
                <n-button
                  v-if="isCloudMode && isAuthenticated"
                  type="primary"
                  @click="showUploadModal = true"
                >
                  立即上传
                </n-button>
              </n-space>
            </n-space>
          </template>
        </n-empty>
      </div>

      <!-- 项目卡片网格 -->
      <div v-else class="projects-grid">
        <ProjectCard
          v-for="project in filteredProjects"
          :key="project.id"
          :project="project"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </div>
    </div>
  </div>

  <!-- 上传弹窗 -->
  <n-modal
    v-model:show="showUploadModal"
    preset="card"
    title="上传静态项目"
    style="width: 580px; max-width: 92vw"
    :mask-closable="false"
  >
    <FileUpload @success="handleUploadSuccess" />
  </n-modal>

  <!-- 编辑弹窗 (静态网站管理工作台) -->
  <n-modal
    v-model:show="showEditModal"
    style="width: 94vw; max-width: 1380px"
    :mask-closable="false"
    @after-leave="editingProject = null"
  >
    <ProjectEditor
      v-if="editingProject"
      :project="editingProject"
      @close="handleEditClose"
      @saved="handleEditSaved"
    />
  </n-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  NButton, 
  NEmpty, 
  NSpin, 
  NIcon, 
  NDivider, 
  NSpace, 
  NModal, 
  NResult,
  useMessage 
} from 'naive-ui'
import {
  FolderOpenOutline,
  CloudUploadOutline,
  RefreshOutline,
} from '@vicons/ionicons5'
import { useFilesStore } from '@/stores/files'
import { useAuthStore } from '@/stores/auth'
import { useAppMode } from '@/composables/useAppMode'
import ProjectCard from '@/components/files/ProjectCard.vue'
import FileUpload from '@/components/admin/FileUpload.vue'
import ProjectEditor from '@/components/admin/ProjectEditor.vue'
import type { ProjectInfo } from '@/types'

// Store
const filesStore = useFilesStore()
const authStore = useAuthStore()
const { isCloudMode } = useAppMode()
const message = useMessage()

// 响应式状态
const showUploadModal = ref(false)
const showEditModal = ref(false)
const editingProject = ref<ProjectInfo | null>(null)

// 计算属性
const loading = computed(() => filesStore.loading)
const error = computed(() => filesStore.error)
const selectedCategory = computed(() => filesStore.selectedCategory)
const filteredProjects = computed(() => filesStore.filteredProjects)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 方法
function clearCategory() {
  filesStore.setSelectedCategory('')
}

// 刷新索引
async function handleRefresh() {
  const success = await filesStore.refreshIndex()
  if (success) {
    message.success('索引刷新成功')
  } else {
    message.error(filesStore.error || '刷新失败')
  }
}

// 处理上传成功
function handleUploadSuccess() {
  showUploadModal.value = false
  message.success('上传成功')
}

// 处理编辑
function handleEdit(project: ProjectInfo) {
  editingProject.value = project
  showEditModal.value = true
}

// 关闭编辑
function handleEditClose() {
  showEditModal.value = false
  editingProject.value = null
}

// 保存编辑
function handleEditSaved() {
  message.success('项目已更新')
}

// 处理删除
async function handleDelete(project: ProjectInfo) {
  const success = await filesStore.deleteProject(project)
  if (success) {
    message.success('删除成功')
  } else {
    message.error(filesStore.error || '删除失败')
  }
}
</script>

<style scoped>
.app-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  background-color: var(--n-color);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background-color: var(--n-card-color);
  border-radius: 20px;
  border: 1px solid var(--n-border-color);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 40px;
  height: 40px;
  background-color: var(--n-primary-color-hover);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--n-primary-color);
}

.category-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.category-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-value {
  font-size: 16px;
  font-weight: 800;
  color: var(--n-text-color);
}

.all-projects-label {
  font-size: 18px;
  font-weight: 800;
  color: var(--n-text-color);
  letter-spacing: -0.5px;
}

.stats-badge {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.count-number {
  font-size: 18px;
  font-weight: 800;
  color: var(--n-primary-color);
}

.count-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color-3);
}

.upload-btn {
  font-weight: 700;
  padding: 0 20px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-text {
  font-weight: 600;
  color: var(--n-text-color-3);
}

.empty-hint {
  color: var(--n-text-color-3);
  font-size: 14px;
}

.projects-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

  /* 响应式适配 */
  @media (max-width: 767px) {
    .app-main {
      padding: 12px;
    }

    .toolbar {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
      padding: 16px;
    }

    .toolbar-left {
      justify-content: space-between;
    }

    .toolbar-right {
      display: flex;
      justify-content: flex-end;
    }

    .projects-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  /* 大屏幕优化 */
  @media (min-width: 1440px) {
    .projects-grid {
      gap: 32px;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }
  }
</style>