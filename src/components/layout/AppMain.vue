<template>
  <div class="app-main">
    <!-- 主内容区：直接呈现纯净高效的项目资产面板 -->
    <div class="main-content">
      <!-- 加载状态 -->
      <div v-if="loading && filteredProjects.length === 0" class="loading-container">
        <n-spin size="large">
          <template #description>
            <span class="loading-text">正在检索项目索引...</span>
          </template>
        </n-spin>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <n-result status="error" title="索引加载遇到问题" :description="error">
          <template #footer>
            <n-button type="primary" @click="handleRefresh">重新加载索引</n-button>
          </template>
        </n-result>
      </div>

      <!-- 空状态：指向明确行动的方向性引导 -->
      <div v-else-if="filteredProjects.length === 0" class="empty-container">
        <div class="empty-box">
          <div class="empty-icon-wrap">
            <n-icon size="36" class="empty-icon"><FolderOpenOutline /></n-icon>
          </div>
          <h3 class="empty-title">当前视图未检索到项目</h3>
          <p class="empty-desc">
            {{ selectedCategory ? `分类「${selectedCategory}」下暂无 HTML 资源` : '尚未扫描到任何本地静态网页或云端部署项目' }}
          </p>
          <div class="empty-actions">
            <n-button v-if="selectedCategory" secondary @click="clearCategory">
              查看全部项目
            </n-button>
            <n-button
              v-if="isCloudMode && isAuthenticated"
              type="primary"
              @click="filesStore.showUploadModal = true"
            >
              上传首个项目
            </n-button>
          </div>
        </div>
      </div>

      <!-- 项目卡片网格：工坊级高信噪比排版 -->
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

  <!-- 全局上传弹窗 -->
  <n-modal
    v-model:show="filesStore.showUploadModal"
    preset="card"
    title="上传 HTML 项目"
    style="width: 580px; max-width: 92vw; border-radius: 12px;"
    :mask-closable="false"
  >
    <FileUpload @success="handleUploadSuccess" />
  </n-modal>

  <!-- 全屏工作台 (多设备视口全屏预览与文件管理工作台) -->
  <n-modal
    v-model:show="showEditModal"
    style="width: 98vw; height: 96vh; max-width: none; margin: 2vh auto; border-radius: 14px;"
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
  NSpin, 
  NIcon, 
  NModal, 
  NResult,
  useMessage 
} from 'naive-ui'
import { FolderOpenOutline } from '@vicons/ionicons5'
import { useFilesStore } from '@/stores/files'
import { useAuthStore } from '@/stores/auth'
import { useAppMode } from '@/composables/useAppMode'
import ProjectCard from '@/components/files/ProjectCard.vue'
import FileUpload from '@/components/admin/FileUpload.vue'
import ProjectEditor from '@/components/admin/ProjectEditor.vue'
import type { ProjectInfo } from '@/types'

const filesStore = useFilesStore()
const authStore = useAuthStore()
const { isCloudMode } = useAppMode()
const message = useMessage()

// 编辑工作台状态
const showEditModal = ref(false)
const editingProject = ref<ProjectInfo | null>(null)

const loading = computed(() => filesStore.loading)
const error = computed(() => filesStore.error)
const filteredProjects = computed(() => filesStore.filteredProjects)
const selectedCategory = computed(() => filesStore.selectedCategory)
const isAuthenticated = computed(() => authStore.isAuthenticated)

function handleRefresh() {
  filesStore.reloadIndexData()
}

function clearCategory() {
  filesStore.setSelectedCategory('')
}

function handleEdit(project: ProjectInfo) {
  editingProject.value = project
  showEditModal.value = true
}

function handleEditClose() {
  showEditModal.value = false
  editingProject.value = null
}

function handleEditSaved() {
  filesStore.reloadIndexData()
}

async function handleDelete(project: ProjectInfo) {
  const success = await filesStore.deleteProject(project)
  if (success) {
    message.success(`已删除项目: ${project.name}`)
  } else {
    message.error(filesStore.error || '删除失败')
  }
}

function handleUploadSuccess() {
  filesStore.showUploadModal = false
  message.success('上传成功并同步完成')
}
</script>

<style scoped>
.app-main {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

/* 工坊级响应式网格布局 */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  align-items: stretch;
}

/* 状态容器 */
.loading-container,
.error-container,
.empty-container {
  min-height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  font-size: 13px;
  color: var(--n-text-color-3);
  margin-top: 8px;
}

/* 方向性空状态 */
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 360px;
  padding: 32px 16px;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(var(--n-text-color-rgb), 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon {
  color: var(--n-text-color-3);
}

.empty-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--n-text-color-1);
}

.empty-desc {
  margin: 0 0 20px;
  font-size: 13px;
  color: var(--n-text-color-3);
  line-height: 1.5;
}

.empty-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 640px) {
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>