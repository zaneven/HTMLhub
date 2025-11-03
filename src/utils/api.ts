import type { IndexData } from '@/types'

/**
 * API基础配置
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const INDEX_DATA_PATH = '/data/file-index.json'

/**
 * 获取文件索引数据
 */
export async function fetchIndexData(): Promise<IndexData> {
  try {
    const response = await fetch(`${API_BASE_URL}${INDEX_DATA_PATH}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 验证数据结构
    if (!data || !data.files || !Array.isArray(data.files)) {
      throw new Error('Invalid index data structure')
    }
    
    return data as IndexData
  } catch (error) {
    console.error('Failed to fetch index data:', error)
    throw new Error('无法加载文件索引数据')
  }
}

/**
 * 获取文件内容
 */
export async function fetchFileContent(filePath: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}${filePath}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.text()
  } catch (error) {
    console.error('Failed to fetch file content:', error)
    throw new Error('无法加载文件内容')
  }
}

/**
 * 检查文件是否存在
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}${filePath}`, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.error('Failed to check file existence:', error)
    return false
  }
}

/**
 * 获取文件信息
 */
export async function getFileInfo(filePath: string): Promise<{
  size: number
  lastModified: string
  contentType: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}${filePath}`, { method: 'HEAD' })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const size = parseInt(response.headers.get('content-length') || '0')
    const lastModified = response.headers.get('last-modified') || new Date().toISOString()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    return {
      size,
      lastModified,
      contentType
    }
  } catch (error) {
    console.error('Failed to get file info:', error)
    throw new Error('无法获取文件信息')
  }
}

/**
 * 重新生成索引数据（开发模式）
 */
export async function regenerateIndex(): Promise<IndexData> {
  if (import.meta.env.PROD) {
    throw new Error('Index regeneration is only available in development mode')
  }
  
  try {
    const response = await fetch('/api/regenerate-index', { method: 'POST' })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to regenerate index:', error)
    throw new Error('无法重新生成索引')
  }
}

/**
 * 通用HTTP请求函数
 */
export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }
  
  const finalOptions = { ...defaultOptions, ...options }
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, finalOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    } else {
      return await response.text() as unknown as T
    }
  } catch (error) {
    console.error('Request failed:', error)
    throw error
  }
}

/**
 * 错误处理函数
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return '未知错误'
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxAttempts) {
        break
      }
      
      // 等待指定时间后重试
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError
}