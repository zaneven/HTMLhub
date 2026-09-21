import type { FileInfo } from '@/types'

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays} 天前`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} 周前`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} 个月前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

/**
 * 获取文件扩展名对应的图标
 */
export function getFileIcon(extension: string): string {
  const iconMap: Record<string, string> = {
    '.html': 'document-text',
    '.htm': 'document-text',
    '.css': 'color-palette',
    '.js': 'logo-javascript',
    '.ts': 'logo-typescript',
    '.json': 'code-working',
    '.xml': 'code-working',
    '.md': 'document-text',
    '.txt': 'document-text',
    '.pdf': 'document',
    '.doc': 'document',
    '.docx': 'document',
    '.xls': 'grid',
    '.xlsx': 'grid',
    '.ppt': 'easel',
    '.pptx': 'easel',
    '.zip': 'archive',
    '.rar': 'archive',
    '.7z': 'archive',
    '.tar': 'archive',
    '.gz': 'archive',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.gif': 'image',
    '.svg': 'image',
    '.webp': 'image',
    '.mp4': 'videocam',
    '.avi': 'videocam',
    '.mov': 'videocam',
    '.wmv': 'videocam',
    '.mp3': 'musical-notes',
    '.wav': 'musical-notes',
    '.flac': 'musical-notes',
    '.aac': 'musical-notes'
  }
  
  return iconMap[extension.toLowerCase()] || 'document'
}

/**
 * 获取文件类型颜色
 */
export function getFileTypeColor(extension: string): string {
  const colorMap: Record<string, string> = {
    '.html': '#e34c26',
    '.htm': '#e34c26',
    '.css': '#1572b6',
    '.js': '#f7df1e',
    '.ts': '#3178c6',
    '.json': '#000000',
    '.xml': '#ff6600',
    '.md': '#083fa1',
    '.txt': '#666666',
    '.pdf': '#ff0000',
    '.doc': '#2b579a',
    '.docx': '#2b579a',
    '.xls': '#217346',
    '.xlsx': '#217346',
    '.ppt': '#d24726',
    '.pptx': '#d24726',
    '.zip': '#ffd700',
    '.rar': '#ffd700',
    '.7z': '#ffd700',
    '.tar': '#ffd700',
    '.gz': '#ffd700',
    '.jpg': '#ff69b4',
    '.jpeg': '#ff69b4',
    '.png': '#ff69b4',
    '.gif': '#ff69b4',
    '.svg': '#ff69b4',
    '.webp': '#ff69b4',
    '.mp4': '#ff4500',
    '.avi': '#ff4500',
    '.mov': '#ff4500',
    '.wmv': '#ff4500',
    '.mp3': '#9932cc',
    '.wav': '#9932cc',
    '.flac': '#9932cc',
    '.aac': '#9932cc'
  }
  
  return colorMap[extension.toLowerCase()] || '#666666'
}

/**
 * 生成文件预览URL
 */
export function getFilePreviewUrl(file: FileInfo): string {
  // 规范化路径：去掉开头的斜杠与public前缀
  let p = (file.path || '').replace(/^\//, '')
  if (p.startsWith('public/')) {
    p = p.substring('public/'.length)
  }

  // 基于部署的base路径构建完整URL
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${p}`
}

/**
 * 检查文件是否可以预览
 */
export function isPreviewable(file: FileInfo): boolean {
  const previewableExtensions = ['.html', '.htm', '.txt', '.md', '.json', '.xml', '.css', '.js', '.ts']
  return previewableExtensions.includes(file.extension.toLowerCase())
}

/**
 * 获取文件的面包屑路径
 */
export function getBreadcrumbs(filePath: string): Array<{ name: string; path: string }> {
  const parts = filePath.split('/').filter(part => part)
  const breadcrumbs: Array<{ name: string; path: string }> = []
  
  let currentPath = ''
  for (const part of parts) {
    currentPath += '/' + part
    breadcrumbs.push({
      name: part,
      path: currentPath
    })
  }
  
  return breadcrumbs
}

/**
 * 搜索高亮
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm) return text
  
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  
  return obj
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}