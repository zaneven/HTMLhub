<script setup lang="ts">
import { computed } from 'vue'
import {
  NLayout,
  NLayoutContent,
  NCard,
  NPageHeader,
  NGrid,
  NGridItem,
  NStatistic,
  NButton,
  NIcon,
  NDataTable,
  NPopconfirm,
  NSpace,
  NTag,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import {
  RefreshOutline,
  LogOutOutline,
  TrashOutline,
  FolderOutline,
  DocumentOutline
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

// 统计数据
const stats = computed(() => ({
  totalProjects: filesStore.totalProjects,
  totalCategories: filesStore.totalCategories,
  lastUpdated: filesStore.lastUpdated
    ? new Date(filesStore.lastUpdated).toLocaleString('zh-CN')
    : '-'
}))

// 表格列定义
const columns: DataTableColumns<ProjectInfo> = [
  {
    title: '项目名称',
    key: 'name',
    ellipsis: { tooltip: true }
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
          row.type === 'directory' ? '目录' : '文件'
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
    width: 100,
    fixed: 'right',
    render(row) {
      return h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDelete(row)
        },
        {
          trigger: () => h(
            NButton,
            {
              size: 'small',
              quaternary: true,
              type: 'error'
            },
            {
              icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
              default: () => '删除'
            }
          ),
          default: () => `确定要删除 "${row.name}" 吗？`
        }
      )
    }
  }
]

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

// 需要引入 h 函数
import { h } from 'vue'
</script>

<template>
  <n-layout style="min-height: 100vh">
    <n-layout-content style="padding: 24px">
      <n-page-header
        title="项目管理"
        subtitle="管理上传的 HTML 项目"
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
        <n-grid :cols="3" :x-gap="16" :y-gap="16" style="margin-bottom: 24px">
          <n-grid-item>
            <n-card>
              <n-statistic label="项目总数" :value="stats.totalProjects" />
            </n-card>
          </n-grid-item>
          <n-grid-item>
            <n-card>
              <n-statistic label="分类数量" :value="stats.totalCategories" />
            </n-card>
          </n-grid-item>
          <n-grid-item>
            <n-card>
              <n-statistic label="最后更新">
                <template #default>
                  <span style="font-size: 14px">{{ stats.lastUpdated }}</span>
                </template>
              </n-statistic>
            </n-card>
          </n-grid-item>
        </n-grid>

        <n-grid :cols="2" :x-gap="24">
          <!-- 上传区域 -->
          <n-grid-item>
            <FileUpload />
          </n-grid-item>

          <!-- 项目列表 -->
          <n-grid-item>
            <n-card title="项目列表">
              <n-data-table
                :columns="columns"
                :data="filesStore.projects"
                :loading="filesStore.loading"
                :bordered="false"
                striped
                size="small"
                :pagination="{
                  pageSize: 10,
                  showSizePicker: true,
                  pageSizes: [10, 20, 50]
                }"
                :scroll-x="600"
              />
            </n-card>
          </n-grid-item>
        </n-grid>
      </div>
    </n-layout-content>
  </n-layout>
</template>
