// 项目信息接口
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

// 分类信息接口
export interface CategoryInfo {
  id: string
  name: string
  projectCount: number
}

// 项目索引数据接口
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

// 文件信息接口
export interface FileInfo {
  id: string
  name: string
  nameWithoutExt: string
  path: string
  absolutePath: string
  extension: string
  size: number
  createdAt: string
  modifiedAt: string
  category: string
  tags: string[]
}

// 统计信息接口
export interface Stats {
  totalFiles: number
  totalSize: number
  categories: Record<string, number>
  extensions: Record<string, number>
  lastScan: string
}

// 索引数据接口
export interface IndexData {
  version: string
  generatedAt: string
  stats: Stats
  files: FileInfo[]
}

// 文件分类枚举
export enum FileCategory {
  INDEX = 'index',
  MAIN = 'main',
  ABOUT = 'about',
  CONTACT = 'contact',
  BLOG = 'blog',
  PRODUCT = 'product',
  SERVICE = 'service',
  PORTFOLIO = 'portfolio',
  GALLERY = 'gallery',
  NEWS = 'news',
  DOCUMENTATION = 'documentation',
  AUTH = 'auth',
  ADMIN = 'admin',
  ERROR = 'error',
  EXAMPLE = 'example',
  TEMPLATE = 'template',
  COMPONENT = 'component',
  OTHER = 'other'
}

// 视图模式枚举
export enum ViewMode {
  LIST = 'list',
  CARD = 'card',
  GRID = 'grid'
}

// 排序选项枚举
export enum SortOption {
  NAME_ASC = 'name-asc',
  NAME_DESC = 'name-desc',
  SIZE_ASC = 'size-asc',
  SIZE_DESC = 'size-desc',
  DATE_ASC = 'date-asc',
  DATE_DESC = 'date-desc',
  CATEGORY = 'category'
}

// 搜索过滤器接口
export interface SearchFilter {
  keyword: string
  category: string
  tags: string[]
  dateRange: {
    start?: string
    end?: string
  }
  sizeRange: {
    min?: number
    max?: number
  }
}

// 应用状态接口
export interface AppState {
  files: FileInfo[]
  filteredFiles: FileInfo[]
  stats: Stats | null
  loading: boolean
  error: string | null
  viewMode: ViewMode
  sortOption: SortOption
  searchFilter: SearchFilter
  selectedFile: FileInfo | null
  showPreview: boolean
}

// 主题配置接口
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto'
  primaryColor: string
  borderRadius: number
  fontSize: number
}

// 用户偏好设置接口
export interface UserPreferences {
  theme: ThemeConfig
  defaultViewMode: ViewMode
  defaultSortOption: SortOption
  itemsPerPage: number
  showFileSize: boolean
  showFileDate: boolean
  showFileTags: boolean
  autoRefresh: boolean
  refreshInterval: number
}