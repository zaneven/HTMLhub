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
  /** 项目来源：local=本地静态文件，cloud=R2云端文件 */
  source?: 'local' | 'cloud'
  /** 项目文件列表（本地静态项目或云端预置） */
  files?: Array<{
    name: string
    key: string
    size: number
    type: string
    modifiedAt: string
  }>
  /** 是否开启项目级访问密码 */
  protected?: boolean
  /** 分享是否已过期 */
  protectedExpired?: boolean
  /** 分享到期时间（秒级时间戳），0/undefined 表示永久 */
  shareExpiresAt?: number
}

/** 项目分享状态 */
export interface ShareStatus {
  enabled: boolean
  hasPassword: boolean
  indexPath?: string
  /** 到期时间（秒级时间戳），0 表示永久 */
  expiresAt?: number
  expired?: boolean
  version?: number
  hint?: string
  createdAt?: number
  updatedAt?: number
  lastUsedAt?: number
}

/** 分享链接信息 */
export interface ShareLinkInfo {
  /** 免密链接：密码以签名令牌内置 */
  link: string
  /** 需要输入密码的普通链接 */
  passwordLink: string
  /** 免密令牌到期时间（秒级时间戳） */
  tokenExpiresAt: number
  /** 分享到期时间（秒级时间戳），0 表示永久 */
  expiresAt: number
}

/** 创建 / 重置分享后的返回结果 */
export interface ShareCreateResult extends ShareLinkInfo {
  path: string
  indexPath: string
  /** 明文密码，仅在创建 / 重置时返回一次 */
  password: string
  generated: boolean
  version: number
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