<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NLayout,
  NLayoutContent,
  NCard,
  NPageHeader,
  NButton,
  NIcon,
  NDataTable,
  NPopconfirm,
  NSpace,
  NTag,
  NModal,
  NEmpty,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import {
  RefreshOutline,
  LogOutOutline,
  TrashOutline,
  FolderOutline,
  DocumentOutline,
  CloudUploadOutline,
  OpenOutline
} from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import { useFilesStore } from '@/stores/files'
import { useAuthStore } from '@/stores/auth'
import { useAppMode } from '@/composables/useAppMode'
import FileUpload from '@/components/admin/FileUpload.vue'
import type { ProjectInfo } from '@/types'

const router = useRouter()
const filesStore = useFilesStore()
const authStore = useAuthStore()
const { isCloudMode } = useAppMode()
const message = useMessage()

// 上传弹窗状态
const showUploadModal = ref(false)

// 只显示云端项目
const cloudProjects = computed(() => {
  return filesStore.projects.filter(p => p.source === 'cloud')
})

// 云端项目数量
const cloudProjectCount = computed(() => cloudProjects.value.length)

// 表格列定义
const columns: DataTableColumns<ProjectInfo> = [
  {
    title: '项目名称',
    key: 'name',
    ellipsis: { tooltip: true },
    render(row) {
      return h('span', { style: { fontWeight: '500' } }, row.name)
    }
  },
  {
    title: '分类',
    key: 'category',
    width: 120,
    render(row) {
      return h(NTag, { type: 'info', size: 'small' }, { default: () => row.category })
    }
  },
  {
    title: '类型',
    key: 'type',
    width: 80,
    render(row) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { size: 16 }, {
            default: () => h(row.type === 'directory' ? FolderOutline : DocumentOutline)
          }),
          row.type === 'directory' ? '项目' : '文件'
        ]
      })
    }
  },
  {
    title: '更新时间',
    key: 'modifiedAt',
    width: 160,
    render(row) {
      return new Date(row.modifiedAt).toLocaleString('zh-CN')
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    fixed: 'right',
    render(row) {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          // 打开按钮
          h(NButton, {
            size: 'small',
            quaternary: true,
            type: 'primary',
            onClick: () => handleOpen(row)
          }, {
            icon: () => h(NIcon, null, { default: () => h(OpenOutline) }),
            default: () => '打开'
          }),
          // 删除按钮
          h(NPopconfirm, {
            onPositiveClick: () => handleDelete(row)
          }, {
            trigger: () => h(NButton, {
              size: 'small',
              quaternary: true,
              type: 'error'
            }, {
              icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
              default: () => '删除'
            }),
            default: () => `确定要删除 "${row.name}" 吗？`
          })
        ]
      })
    }
  }
]

// 打开项目
function handleOpen(project: ProjectInfo) {
  const url = filesStore.getFileUrl(project)
  window.open(url, '_blank')
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

// 删除项目
async function handleDelete(project: ProjectInfo) {
  const success = await filesStore.deleteProject(project)
  if (success) {
    message.success('删除成功')
  } else {
    message.error(filesStore.error || '删除失败')
  }
}

// 登出
async function handleLogout() {
  await authStore.logout()
  message.success('已退出登录')
  router.push('/')
}

// 返回首页
function handleBack() {
  router.push('/')
}

// 上传成功后关闭弹窗
function handleUploadSuccess() {
  showUploadModal.value = false
}
</script>

<template>
  <n-layout style="min-height: 100vh">
    <n-layout-content style="padding: 24px; max-width: 1200px; margin: 0 auto">
      <n-page-header
        title="项目管理"
        subtitle="管理云端上传的 HTML 项目"
        @back="handleBack"
      >
        <template #extra>
          <n-space>
            <n-button
              v-if="isCloudMode"
              :loading="filesStore.loading"
              @click="handleRefresh"
            >
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
              刷新索引
            </n-button>
            <n-button type="error" @click="handleLogout">
              <template #icon>
                <n-icon><LogOutOutline /></n-icon>
              </template>
              退出登录
            </n-button>
          </n-space>
        </template>
      </n-page-header>

      <div style="margin-top: 24px">
        <n-card>
          <!-- 操作栏 -->
          <template #header>
            <n-space justify="space-between" align="center" style="width: 100%">
              <span>
                云端项目
                <n-tag type="info" size="small" round style="margin-left: 8px">
                  {{ cloudProjectCount }}
                </n-tag>
              </span>
              <n-button type="primary" @click="showUploadModal = true">
                <template #icon>
                  <n-icon><CloudUploadOutline /></n-icon>
                </template>
                上传项目
              </n-button>
            </n-space>
          </template>

          <!-- 项目列表 -->
          <n-data-table
            v-if="cloudProjects.length > 0"
            :columns="columns"
            :data="cloudProjects"
            :loading="filesStore.loading"
            :bordered="false"
            striped
            size="small"
            :pagination="{
              pageSize: 15,
              showSizePicker: true,
              pageSizes: [10, 15, 20, 50]
            }"
            :scroll-x="700"
          />

          <!-- 空状态 -->
          <n-empty
            v-else
            description="暂无云端项目"
            style="padding: 60px 0"
          >
            <template #extra>
              <n-button type="primary" @click="showUploadModal = true">
                <template #icon>
                  <n-icon><CloudUploadOutline /></n-icon>
                </template>
                上传第一个项目
              </n-button>
            </template>
          </n-empty>
        </n-card>
      </div>
    </n-layout-content>
  </n-layout>

  <!-- 上传弹窗 -->
  <n-modal
    v-model:show="showUploadModal"
    preset="card"
    title="上传项目"
    style="width: 500px; max-width: 90vw"
    :mask-closable="false"
  >
    <FileUpload @success="handleUploadSuccess" />
  </n-modal>
</template>
