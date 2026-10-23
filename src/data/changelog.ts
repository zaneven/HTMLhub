/**
 * HTMLhub 版本与更新日志
 * ------------------------------------------------------------------
 * 单一数据源：版本号、发布日期与每次迭代的变更内容都维护在这里。
 * 新增版本时，请在最顶部追加一条记录，并同步更新 package.json 的 version。
 *
 * 变更类型：
 *  feature  新功能      fix      问题修复    style    视觉与样式
 *  refactor 重构        perf     性能优化    security 安全加固
 *  docs     文档        chore    工程杂项
 */

export type ChangeType =
  | 'feature'
  | 'fix'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'security'
  | 'docs'
  | 'chore'

export interface ChangeItem {
  /** 变更类型 */
  type: ChangeType
  /** 变更说明，建议一句话讲清「改了什么 + 带来什么」 */
  content: string
  /** 影响范围，如 admin、workers、ui */
  scope?: string
}

export interface VersionRelease {
  /** 语义化版本号，如 1.1.0 */
  version: string
  /** 发布日期 YYYY-MM-DD */
  date: string
  /** 版本主题 */
  title: string
  /** 版本摘要 */
  summary?: string
  /** 是否为里程碑版本 */
  major?: boolean
  /** 本次版本的全部变更条目 */
  changes: ChangeItem[]
}

export interface ChangeTypeMeta {
  label: string
  /** 主色，用于徽标文字与描边 */
  color: string
  /** 浅色背景 */
  background: string
}

export const CHANGE_TYPE_META: Record<ChangeType, ChangeTypeMeta> = {
  feature: { label: '新功能', color: '#4f46e5', background: 'rgba(79, 70, 229, 0.10)' },
  fix: { label: '修复', color: '#dc2626', background: 'rgba(220, 38, 38, 0.10)' },
  style: { label: '视觉', color: '#db2777', background: 'rgba(219, 39, 119, 0.10)' },
  refactor: { label: '重构', color: '#0891b2', background: 'rgba(8, 145, 178, 0.10)' },
  perf: { label: '性能', color: '#d97706', background: 'rgba(217, 119, 6, 0.12)' },
  security: { label: '安全', color: '#059669', background: 'rgba(5, 150, 105, 0.10)' },
  docs: { label: '文档', color: '#475569', background: 'rgba(71, 85, 105, 0.10)' },
  chore: { label: '工程', color: '#64748b', background: 'rgba(100, 116, 139, 0.10)' },
}

/** 版本记录（倒序：最新版本在最前） */
export const CHANGELOG: VersionRelease[] = [
  {
    version: '1.2.0',
    date: '2026-10-23',
    title: '项目简介与 README 渲染',
    summary: '每个项目都能带上一份 README：默认展示项目简介，随时切回文件管理。',
    changes: [
      {
        type: 'feature',
        scope: '项目简介',
        content:
          '支持在项目根目录放置 README.md / readme.md，并在预览工作台左侧渲染为项目简介',
      },
      {
        type: 'feature',
        scope: '界面',
        content:
          '工作台左侧新增「项目简介 / 项目文件」切换，有 README 时默认展示简介，无 README 时回到文件列表',
      },
      {
        type: 'feature',
        scope: '上传',
        content:
          '上传项目或增量添加文件时支持 .md 文档，识别到根目录 README 后自动切换到简介视图',
      },
      {
        type: 'security',
        scope: '渲染',
        content: 'Markdown 经 DOMPurify 清洗后渲染，并自动补全 README 中的相对图片与链接地址',
      },
      {
        type: 'docs',
        scope: '文档',
        content: 'README 补充项目简介与 README.md 使用说明',
      },
    ],
  },
  {
    version: '1.1.2',
    date: '2026-10-22',
    title: '导航体验修复',
    summary: '版本入口只留一处，切换项目目录时不再被更新日志页面「卡住」。',
    changes: [
      {
        type: 'fix',
        scope: '导航',
        content: '在更新日志等页面切换左侧项目目录时，自动回到项目列表，不再停留在当前页面',
      },
      {
        type: 'style',
        scope: '界面',
        content: '移除顶部导航重复的版本号，版本与更新日志入口统一收敛到左侧栏底部',
      },
    ],
  },
  {
    version: '1.1.1',
    date: '2026-10-22',
    title: '云端项目下载',
    summary: '云端项目终于可以带走了：单文件直接下载原文件，多文件自动打包为 ZIP。',
    changes: [
      {
        type: 'feature',
        scope: '下载',
        content: '按项目实际文件数自动选择下载方式：单文件直接下载原 HTML，多文件打包为 ZIP',
      },
      {
        type: 'feature',
        scope: '下载',
        content: '云端多文件项目支持打包为 ZIP 下载，完整保留 CSS / JS / 图片等相对目录结构',
      },
      {
        type: 'feature',
        scope: '界面',
        content: '项目卡片与全屏工作台新增下载入口，下载中显示旋转状态并给出结果提示',
      },
      {
        type: 'feature',
        scope: 'workers',
        content:
          '新增 /api/project/download 接口，单文件直传、多文件统一打包，并对文件数量与体积设置保护上限',
      },
      {
        type: 'docs',
        scope: '文档',
        content: 'README 补充云端项目下载能力说明',
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-10-22',
    title: '版本系统上线',
    summary: '平台首次引入版本号与更新日志，每一次迭代都有迹可循。',
    major: true,
    changes: [
      {
        type: 'feature',
        scope: '版本系统',
        content: '新增集中式版本清单，统一维护版本号、发布日期与全部变更条目',
      },
      {
        type: 'feature',
        scope: '更新日志',
        content: '新增「更新日志」页面，按版本倒序展示变更，并支持按类型筛选',
      },
      {
        type: 'feature',
        scope: '界面入口',
        content: '侧边栏与设置页展示当前版本，存在新版本时显示未读提示',
      },
      {
        type: 'feature',
        scope: 'admin',
        content: '项目工作台支持直接修改项目分类，无需重新上传',
      },
      {
        type: 'feature',
        scope: 'workers',
        content: '新增修改项目分类接口，/r2/ 预览改用 CSP frame-ancestors',
      },
      {
        type: 'fix',
        scope: '排序',
        content: '列表默认最新上传在前，修复导航栏排序选项不生效的问题',
      },
      {
        type: 'docs',
        scope: '文档',
        content: 'README 增补版本维护说明，规范后续版本记录流程',
      },
    ],
  },
  {
    version: '1.0.1',
    date: '2026-09-24',
    title: '排序与布局修复',
    summary: '修复排序失效，补齐主内容区滚动与留白细节。',
    changes: [
      {
        type: 'fix',
        scope: '排序',
        content: '修复导航栏排序选项不生效，列表回归最新上传在前',
      },
      {
        type: 'style',
        scope: '布局',
        content: '主内容区补充 min-height、overflow-y 与内边距，滚动更自然',
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-09-21',
    title: 'HTMLhub 正式更名与视觉重构',
    summary: '品牌焕新、扁平化设计落地，Studio 全屏工作台与本地只读保护成型。',
    major: true,
    changes: [
      {
        type: 'feature',
        scope: '品牌',
        content: '正式更名为 HTMLhub，启用扁平化「Flat Code Squircle」Logo 与透明 Favicon',
      },
      {
        type: 'feature',
        scope: '设计系统',
        content: '极简扁平化视觉落地，统一卡片、侧边栏选中态与高对比度图标',
      },
      {
        type: 'feature',
        scope: '工作台',
        content: 'Studio 全屏视口工坊重构，支持多端比例缩放与固定入口预览',
      },
      {
        type: 'feature',
        scope: '本地项目',
        content: '支持本地文件目录展示与只读保护，避免在线误删磁盘资源',
      },
      {
        type: 'fix',
        scope: '深色模式',
        content: '修复卡片与主工作区背景未变深、登录页文字对比度不足的问题',
      },
      {
        type: 'security',
        scope: '安全',
        content: '移除 Git 追踪中的 .env，脱敏私有域名与 KV ID，完善 .gitignore',
      },
      {
        type: 'docs',
        scope: '文档',
        content: '完善双通道部署 README 与 wrangler 通用配置模板',
      },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-09-20',
    title: '设计系统与卡片 UI',
    summary: '建立高信噪比卡片视觉，统一浅色模式表现。',
    changes: [
      {
        type: 'feature',
        scope: '卡片',
        content: '高信噪比项目卡片上线，合并重复打开按钮，点击直达全屏预览',
      },
      {
        type: 'fix',
        scope: '主题',
        content: '修复浅色模式卡片背景色异常，移除侧边栏激活状态卡片',
      },
    ],
  },
  {
    version: '0.8.0',
    date: '2026-05-07',
    title: '目录上传增强',
    summary: '完善整目录上传体验，只保留网页必要资源。',
    changes: [
      {
        type: 'feature',
        scope: '上传',
        content: '支持整目录批量上传，编辑器完整保留 CSS / JS 相对路径结构',
      },
      {
        type: 'feature',
        scope: '上传',
        content: '目录上传限制为 HTML / JS / CSS 文件，避免冗余资源入库',
      },
    ],
  },
  {
    version: '0.7.0',
    date: '2026-05-06',
    title: '多文件站点与路径展示',
    summary: '多文件站点成为一等公民，前后端文件元数据统一。',
    changes: [
      {
        type: 'feature',
        scope: '上传',
        content: '目录上传支持，文件列表展示相对路径',
      },
      {
        type: 'refactor',
        scope: 'workers',
        content: '文件元数据 schema 与前后端同步逻辑统一，减少字段漂移',
      },
      {
        type: 'chore',
        scope: '工程',
        content: '升级 wrangler 至 v4.88.0，跟进新版命令与部署行为',
      },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-04-29',
    title: 'Header 现代化与移动端支持',
    summary: '顶部导航重构，补齐移动端与主题切换能力。',
    changes: [
      {
        type: 'refactor',
        scope: 'ui',
        content: '重构顶部导航，简化搜索控件并适配移动端布局',
      },
      {
        type: 'feature',
        scope: 'ui',
        content: '新增明暗主题切换入口',
      },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-02-04',
    title: '项目文件管理工作台',
    summary: '从「只能预览」走向「可管理」，项目文件有了专属工作台。',
    changes: [
      {
        type: 'feature',
        scope: 'admin',
        content: '新增项目文件管理编辑器和配套 Worker 接口',
      },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-01-16',
    title: '登录与权限体系',
    summary: '补齐登录页、路由守卫与 Token 校验，管理模式更安全。',
    changes: [
      {
        type: 'feature',
        scope: 'auth',
        content: '新增独立登录页，重构全局鉴权逻辑与路由守卫',
      },
      {
        type: 'feature',
        scope: 'auth',
        content: '实现客户端 Token 校验与刷新，管理模式登录态更可靠',
      },
      {
        type: 'feature',
        scope: 'ui',
        content: '全屏页面条件布局，登录页采用沉浸式深色背景',
      },
      {
        type: 'feature',
        scope: '上传',
        content: '文件上传 UI 与状态管理落地，默认支持目录选择',
      },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-01-13',
    title: 'Cloudflare 云端接入',
    summary: 'R2 + Workers 双通道架构打通，支持在线托管。',
    changes: [
      {
        type: 'feature',
        scope: 'workers',
        content: '接入 Cloudflare R2 + Workers，支持在线上传与托管',
      },
      {
        type: 'fix',
        scope: 'workers',
        content: '修复跨域与远程接口不可访问问题',
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2025-11-03',
    title: '项目起点',
    summary: '静态 HTML 目录浏览与预览的雏形。',
    changes: [
      {
        type: 'feature',
        scope: 'core',
        content: '首次提交：完成静态 HTML 资源聚合、目录浏览与预览',
      },
    ],
  },
]

/** 最新版本记录（数组首项，始终存在） */
export const LATEST_RELEASE: VersionRelease = CHANGELOG[0]!

/** 当前版本 = 最新一条版本记录 */
export const APP_VERSION = LATEST_RELEASE.version

/** 最近一次更新日期 */
export const LAST_UPDATED_AT = LATEST_RELEASE.date

/** 更新日志统计信息 */
export function getChangelogStats() {
  return {
    totalReleases: CHANGELOG.length,
    totalChanges: CHANGELOG.reduce((sum, release) => sum + release.changes.length, 0),
    firstVersion: CHANGELOG[CHANGELOG.length - 1]!.version,
    latestDate: LAST_UPDATED_AT,
  }
}

/** 统计某一变更类型的条目数 */
export function countChangesByType(type: ChangeType): number {
  return CHANGELOG.reduce(
    (sum, release) => sum + release.changes.filter((change) => change.type === type).length,
    0,
  )
}
