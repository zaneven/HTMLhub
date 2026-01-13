/**
 * 环境变量类型定义
 */
export interface Env {
  HTML_FILES: R2Bucket
  FILE_INDEX: KVNamespace
  ADMIN_PASSWORD: string
}

/**
 * 项目信息接口 - 与前端类型保持一致
 */
export interface ProjectInfo {
  id: string
  name: string
  category: string
  path: string
  indexPath: string
  type: 'directory' | 'file'
  createdAt: string
  modifiedAt: string
}

/**
 * 分类信息接口
 */
export interface CategoryInfo {
  id: string
  name: string
  projectCount: number
}

/**
 * 项目索引数据接口
 */
export interface ProjectIndexData {
  version: string
  generatedAt: string
  stats: {
    totalCategories: number
    totalProjects: number
  }
  categories: CategoryInfo[]
  projects: ProjectInfo[]
}

/**
 * API 响应接口
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 认证请求体
 */
export interface AuthRequest {
  password: string
}

/**
 * 认证响应
 */
export interface AuthResponse {
  token: string
  expiresAt: string
}
