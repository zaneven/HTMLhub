import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ProjectInfo, CategoryInfo, ProjectIndexData } from '../types'
import { SortOption } from '../types'
import { retry } from '../utils/api'
import { useSearchStore } from './search'
import { useAppMode } from '@/composables/useAppMode'
import { useAuthStore } from './auth'

export const useFilesStore = defineStore('files', () => {
  const { isCloudMode, apiBaseUrl } = useAppMode()

  /**
   * 处理未授权响应（token 过期或无效）
   * 清除 token 并返回错误信息
   */
  async function handleUnauthorized(): Promise<void> {
    const authStore = useAuthStore()
    await authStore.logout()
    error.value = '登录已过期，请重新登录'
  }

  // 状态
  const indexData = ref<ProjectIndexData | null>(null)
  const loading = ref(false)
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const selectedCategory = ref<string>('')
  const showUploadModal = ref(false)
  /** 正在下载的项目路径（为空表示空闲） */
  const downloadingPath = ref<string | null>(null)

  // 计算属性
  const projects = computed(() => indexData.value?.projects || [])
  const categories = computed(() => indexData.value?.categories || [])
  const totalProjects = computed(() => indexData.value?.stats?.totalProjects || 0)
  const totalCategories = computed(() => indexData.value?.stats?.totalCategories || 0)
  const lastUpdated = computed(() => indexData.value?.generatedAt)

  // 根据分类获取项目
  const getProjectsByCategory = computed(() => (category: string): ProjectInfo[] => {
    if (!category) return projects.value
    return projects.value.filter((project) => project.category === category)
  })

  // 项目排序：默认最新上传在前，支持导航栏选择的排序方式
  function projectSize(project: ProjectInfo): number {
    if (!project.files || project.files.length === 0) return 0
    return project.files.reduce((sum, file) => sum + (file.size || 0), 0)
  }

  function projectTime(project: ProjectInfo): number {
    return Date.parse(project.createdAt) || Date.parse(project.modifiedAt) || 0
  }

  function compareProjects(a: ProjectInfo, b: ProjectInfo, sort: SortOption): number {
    switch (sort) {
      case SortOption.NAME_ASC:
        return a.name.localeCompare(b.name, 'zh-CN')
      case SortOption.NAME_DESC:
        return b.name.localeCompare(a.name, 'zh-CN')
      case SortOption.SIZE_ASC:
        return projectSize(a) - projectSize(b)
      case SortOption.SIZE_DESC:
        return projectSize(b) - projectSize(a)
      case SortOption.DATE_ASC:
        return projectTime(a) - projectTime(b)
      case SortOption.CATEGORY:
        return (
          a.category.localeCompare(b.category, 'zh-CN') ||
          a.name.localeCompare(b.name, 'zh-CN')
        )
      case SortOption.DATE_DESC:
      default:
        return projectTime(b) - projectTime(a)
    }
  }

  // 当前显示的项目（根据选中分类和搜索关键词过滤，并按排序选项排列）
  const filteredProjects = computed(() => {
    const searchStore = useSearchStore()
    const searchQuery = searchStore.searchQuery.toLowerCase().trim()
    const sort = searchStore.sortOption

    let result = projects.value

    // 按分类过滤
    if (selectedCategory.value) {
      result = result.filter((project) => project.category === selectedCategory.value)
    }

    // 按搜索关键词过滤
    if (searchQuery) {
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery) ||
          project.category.toLowerCase().includes(searchQuery),
      )
    }

    return [...result].sort((a, b) => compareProjects(a, b, sort))
  })

  // 获取项目统计信息
  const getStats = computed(() => {
    const stats = {
      totalProjects: totalProjects.value,
      totalCategories: totalCategories.value,
      totalSize: 0,
    }
    return stats
  })

  // 动作
  async function loadIndexData() {
    loading.value = true
    error.value = null

    try {
      const data = await retry(() => fetchProjectIndexData(), 3)
      indexData.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载项目索引失败'
      console.error('Failed to load project index:', err)
    } finally {
      loading.value = false
    }
  }

  // 根据模式获取项目索引数据
  async function fetchProjectIndexData(): Promise<ProjectIndexData> {
    // 静态模式：仅从本地 JSON 文件获取
    if (!isCloudMode.value) {
      const response = await fetch('/data/file-index.json')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    }

    // 云端模式：合并本地静态文件和 R2 云端文件
    const [localData, cloudData] = await Promise.all([
      // 获取本地静态文件索引
      fetch('/data/file-index.json')
        .then((res) => (res.ok ? (res.json() as Promise<ProjectIndexData>) : null))
        .catch(() => null),
      // 获取 R2 云端文件索引
      fetch(`${apiBaseUrl.value}/api/files`)
        .then((res) => (res.ok ? (res.json() as Promise<ProjectIndexData>) : null))
        .catch(() => null),
    ])

    // 合并数据
    const allProjects: ProjectInfo[] = []
    const categoryMap = new Map<string, number>()

    // 添加本地项目（标记来源）
    if (localData?.projects) {
      for (const project of localData.projects) {
        allProjects.push({ ...project, source: 'local' } as ProjectInfo & { source: string })
        categoryMap.set(project.category, (categoryMap.get(project.category) || 0) + 1)
      }
    }

    // 添加云端项目（标记来源，避免重复）
    if (cloudData?.projects) {
      for (const project of cloudData.projects) {
        // 检查是否已存在同名同分类的项目
        const exists = allProjects.some(
          (p) => p.name === project.name && p.category === project.category,
        )
        if (!exists) {
          allProjects.push({ ...project, source: 'cloud' } as ProjectInfo & { source: string })
          categoryMap.set(project.category, (categoryMap.get(project.category) || 0) + 1)
        }
      }
    }

    // 生成合并后的分类列表
    const allCategories: CategoryInfo[] = Array.from(categoryMap.entries()).map(
      ([name, count]) => ({
        id: btoa(encodeURIComponent(name)),
        name,
        projectCount: count,
      }),
    )

    // 排序：分类按名称，项目默认最新上传在前
    allCategories.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    allProjects.sort((a, b) => projectTime(b) - projectTime(a))

    return {
      version: '2.0.0',
      generatedAt: new Date().toISOString(),
      stats: {
        totalCategories: allCategories.length,
        totalProjects: allProjects.length,
      },
      categories: allCategories,
      projects: allProjects,
    }
  }

  // 重新加载索引数据
  async function reloadIndexData() {
    await loadIndexData()
  }

  // 设置选中分类
  function setSelectedCategory(category: string) {
    selectedCategory.value = category
  }

  /**
   * 上传文件 (仅云端模式)
   */
  async function uploadFile(file: File, category: string, projectName?: string): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法上传文件'
      return false
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return false
    }

    uploading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      if (projectName) {
        formData.append('projectName', projectName)
      }

      const response = await fetch(`${apiBaseUrl.value}/api/upload`, {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 刷新索引
        await reloadIndexData()
        return true
      } else if (response.status === 401) {
        await handleUnauthorized()
        return false
      } else {
        error.value = data.error || '上传失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '上传失败'
      return false
    } finally {
      uploading.value = false
    }
  }

  /**
   * 上传多个文件 (仅云端模式)
   * 用于上传包含 HTML/JS/CSS 等多个文件的项目
   */
  async function uploadFiles(
    files: File[],
    category: string,
    projectName?: string,
  ): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法上传文件'
      return false
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return false
    }

    // 单文件直接调用 uploadFile
    if (files.length === 1) {
      const file = files[0]
      if (!file) {
        error.value = '文件无效'
        return false
      }
      return uploadFile(file, category, projectName)
    }

    // 多文件必须有项目名
    if (!projectName) {
      error.value = '多文件项目必须指定项目名称'
      return false
    }

    uploading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('category', category)
      formData.append('projectName', projectName)

      // 添加所有文件及其相对路径
      for (const file of files) {
        formData.append('files', file)
        
        let relativePath = file.webkitRelativePath || file.name
        
        // 如果是通过文件夹上传的，webkitRelativePath 会包含文件夹名作为第一级
        // 我们需要移除它，以保持项目内部的相对路径正确
        if (relativePath.includes('/')) {
          const parts = relativePath.split('/')
          if (parts.length > 1) {
            // 移除第一级目录名（通常是上传的文件夹名）
            relativePath = parts.slice(1).join('/')
          }
        }
        
        formData.append('paths', relativePath)
      }

      const response = await fetch(`${apiBaseUrl.value}/api/upload-multiple`, {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 刷新索引
        await reloadIndexData()
        return true
      } else if (response.status === 401) {
        await handleUnauthorized()
        return false
      } else {
        error.value = data.error || '上传失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '上传失败'
      return false
    } finally {
      uploading.value = false
    }
  }

  /**
   * 删除项目 (仅云端模式)
   */
  async function deleteProject(project: ProjectInfo): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法删除项目'
      return false
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return false
    }

    error.value = null

    try {
      const response = await fetch(
        `${apiBaseUrl.value}/api/files?key=${encodeURIComponent(project.path)}`,
        {
          method: 'DELETE',
          headers: authStore.getAuthHeaders(),
        },
      )

      const data = await response.json()

      if (response.ok && data.success) {
        // 刷新索引
        await reloadIndexData()
        return true
      } else if (response.status === 401) {
        await handleUnauthorized()
        return false
      } else {
        error.value = data.error || '删除失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除失败'
      return false
    }
  }

  /**
   * 修改项目所属分类 (仅云端模式)
   *
   * 分类由 R2 路径推导，迁移后项目的 id/path/indexPath 全部变化，
   * 因此成功后返回新的项目对象供调用方重新指向；失败返回 null。
   */
  async function updateProjectCategory(
    project: ProjectInfo,
    newCategory: string,
  ): Promise<ProjectInfo | null> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法修改项目分类'
      return null
    }

    if (project.source !== 'cloud') {
      error.value = '本地静态项目不支持修改分类'
      return null
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return null
    }

    error.value = null

    try {
      const response = await fetch(`${apiBaseUrl.value}/api/project/category`, {
        method: 'POST',
        headers: {
          ...authStore.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: project.path, newCategory }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 刷新索引：侧边栏分类列表与各分类计数需要随之更新
        await reloadIndexData()

        const moved =
          (data.data?.project as ProjectInfo | undefined) ||
          projects.value.find((p) => p.path === data.data?.newPath)

        // 服务端返回的 ProjectInfo 不含 source 字段，必须补上，
        // 否则 getFileUrl 会走本地路径分支，预览地址会拼错
        return moved ? { ...moved, source: 'cloud' } : null
      } else if (response.status === 401) {
        await handleUnauthorized()
        return null
      } else {
        error.value = data.error || '修改分类失败'
        return null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '修改分类失败'
      return null
    }
  }

  /**
   * 刷新索引 (仅云端模式，强制重新扫描 R2)
   */
  async function refreshIndex(): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式'
      return false
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiBaseUrl.value}/api/refresh`, {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 刷新成功后重新加载合并数据（API 只返回云端数据，需要与本地合并）
        await reloadIndexData()
        return true
      } else if (response.status === 401) {
        await handleUnauthorized()
        return false
      } else {
        error.value = data.error || '刷新失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取文件内容 URL
   * - 本地项目(source=local): 使用本地路径，移除 public/ 前缀
   * - 云端项目(source=cloud): 使用 /r2/ 路径格式，支持相对资源加载
   */
  function getFileUrl(project: ProjectInfo): string {
    // 云端项目通过 /r2/ 路径访问（支持相对路径的 CSS/JS 加载）
    if (project.source === 'cloud') {
      // 路径格式: {api_base}/r2/{indexPath}
      // 例如: https://api.example.com/r2/html-files/工具/测试项目/index.html
      return `${apiBaseUrl.value}/r2/${project.indexPath}`
    }
    // 本地项目或静态模式：直接返回本地路径
    // 需要移除 public/ 前缀，因为 Vite 会将 public 目录内容复制到根目录
    const path = project.indexPath.replace(/^public\//, '')
    return `/${path}`
  }

  /**
   * 从 Content-Disposition 解析文件名（优先 RFC 5987 的 UTF-8 形式）
   */
  function parseDownloadFilename(header: string | null, fallback: string): string {
    if (!header) return fallback

    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header)
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].replace(/^"|"$/g, ''))
      } catch {
        // 解析失败时回退到普通 filename
      }
    }

    const plainMatch = /filename="?([^";]+)"?/i.exec(header)
    return plainMatch?.[1] || fallback
  }

  /**
   * 用 Blob 触发浏览器下载
   */
  function triggerBrowserDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
    // 等待浏览器接管下载后再释放内存
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  /**
   * 下载云端项目
   * - 单文件项目：直接下载原文件
   * - 多文件项目：服务端打包为 ZIP（保留相对目录结构）
   */
  async function downloadProject(project: ProjectInfo): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法下载云端项目'
      return false
    }

    if (project.source !== 'cloud') {
      error.value = '仅云端项目支持下载'
      return false
    }

    if (downloadingPath.value) {
      return false
    }

    downloadingPath.value = project.path
    error.value = null

    try {
      const response = await fetch(
        `${apiBaseUrl.value}/api/project/download?path=${encodeURIComponent(project.path)}`,
      )

      if (!response.ok) {
        let message = response.status === 413 ? '项目过大，暂不支持打包下载' : '下载失败'
        try {
          const data = await response.json()
          if (typeof data?.error === 'string' && data.error) {
            message = data.error
          }
        } catch {
          // 非 JSON 错误响应时沿用默认提示
        }
        error.value = message
        return false
      }

      const blob = await response.blob()
      const entryFileName = project.indexPath.split('/').pop() || ''
      const fallback =
        project.type === 'file'
          ? entryFileName || `${project.name}.html`
          : `${project.name}.zip`

      const filename = parseDownloadFilename(
        response.headers.get('Content-Disposition'),
        fallback,
      )

      triggerBrowserDownload(blob, filename)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '下载失败'
      return false
    } finally {
      downloadingPath.value = null
    }
  }

  /**
   * 项目文件信息接口
   */
  interface ProjectFileInfo {
    name: string
    key: string
    size: number
    type: string
    modifiedAt: string
  }

  /**
   * 获取项目的文件列表 (支持本地静态项目与云端 R2 项目)
   */
  async function listProjectFiles(
    projectPath: string,
    project?: ProjectInfo,
  ): Promise<ProjectFileInfo[]> {
    // 优先匹配传入的 project，或从已有索引项目列表中查找
    const targetProject =
      project ||
      indexData.value?.projects.find(
        (p) => p.path === projectPath || p.id === projectPath || p.indexPath === projectPath,
      )

    // 本地项目直接返回本地静态扫描的文件列表
    if (targetProject?.source === 'local') {
      if (targetProject.files && targetProject.files.length > 0) {
        return targetProject.files.map((f) => ({
          name: f.name,
          key: f.key,
          size: f.size,
          type: f.type,
          modifiedAt: f.modifiedAt,
        }))
      }
      // 兜底返回主入口文件
      const fileName =
        targetProject.type === 'file'
          ? `${targetProject.name}.html`
          : 'index.html'
      return [
        {
          name: fileName,
          key: targetProject.indexPath || targetProject.path,
          size: 0,
          type: 'text/html',
          modifiedAt: targetProject.modifiedAt || targetProject.createdAt,
        },
      ]
    }

    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法获取项目文件'
      return []
    }

    try {
      const response = await fetch(
        `${apiBaseUrl.value}/api/project/files?path=${encodeURIComponent(projectPath)}`,
      )

      const data = await response.json()

      if (response.ok && data.success) {
        return data.files || []
      } else {
        error.value = data.error || '获取项目文件列表失败'
        return []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取项目文件列表失败'
      return []
    }
  }

  /**
   * 删除项目内的单个文件 (仅云端模式)
   */
  async function deleteProjectFile(fileKey: string): Promise<boolean> {
    if (fileKey.startsWith('public/html-files/')) {
      error.value = '本地项目文件不支持在线删除'
      return false
    }

    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法删除文件'
      return false
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return false
    }

    try {
      const response = await fetch(
        `${apiBaseUrl.value}/api/project/file?key=${encodeURIComponent(fileKey)}`,
        {
          method: 'DELETE',
          headers: authStore.getAuthHeaders(),
        },
      )

      const data = await response.json()

      if (response.ok && data.success) {
        return true
      } else if (response.status === 401) {
        await handleUnauthorized()
        return false
      } else {
        error.value = data.error || '删除文件失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除文件失败'
      return false
    }
  }

  /**
   * 向项目添加文件 (仅云端模式)
   */
  async function addProjectFile(file: File, projectPath: string, path?: string): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法添加文件'
      return false
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return false
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectPath', projectPath)
      if (path) {
        formData.append('path', path)
      }

      const response = await fetch(`${apiBaseUrl.value}/api/project/file`, {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return true
      } else if (response.status === 401) {
        await handleUnauthorized()
        return false
      } else {
        error.value = data.error || '添加文件失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加文件失败'
      return false
    }
  }

  /**
   * 向项目添加多个文件 (仅云端模式，支持文件夹结构)
   */
  async function addProjectFiles(files: File[], projectPath: string): Promise<boolean> {
    if (!isCloudMode.value) {
      error.value = '当前为静态模式，无法添加文件'
      return false
    }

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      error.value = '请先登录'
      return false
    }

    try {
      const formData = new FormData()
      formData.append('projectPath', projectPath)

      // 添加所有文件及其相对路径
      for (const file of files) {
        formData.append('files', file)
        const relativePath = file.webkitRelativePath || file.name
        formData.append('paths', relativePath)
      }

      const response = await fetch(`${apiBaseUrl.value}/api/project/files`, {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return true
      } else if (response.status === 401) {
        await handleUnauthorized()
        return false
      } else {
        error.value = data.error || '添加文件失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加文件失败'
      return false
    }
  }

  return {
    // 状态
    indexData,
    loading,
    uploading,
    error,
    selectedCategory,
    showUploadModal,
    downloadingPath,

    // 计算属性
    projects,
    categories,
    totalProjects,
    totalCategories,
    lastUpdated,
    getProjectsByCategory,
    filteredProjects,
    getStats,

    // 动作
    loadIndexData,
    reloadIndexData,
    setSelectedCategory,
    uploadFile,
    uploadFiles,
    deleteProject,
    updateProjectCategory,
    refreshIndex,
    getFileUrl,
    downloadProject,
    listProjectFiles,
    deleteProjectFile,
    addProjectFile,
    addProjectFiles,
  }
})
