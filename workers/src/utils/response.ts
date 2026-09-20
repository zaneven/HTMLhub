import type { ApiResponse } from '../types'

/**
 * 允许的 CORS 域名列表
 * 优先从环境变量 ALLOWED_ORIGINS 读取（逗号分隔），否则使用默认值
 */
function getAllowedOrigins(): string[] {
  // Cloudflare Workers 不支持 import.meta.env，需要从全局或 env 传入
  // 回退到默认开发/生产域名列表
  return [
    'https://html.getprompt.top',
    'https://htmlmanager.pages.dev',
    'http://localhost:5173',
    'http://localhost:4173',
  ]
}

const ALLOWED_ORIGINS: string[] = getAllowedOrigins()

/**
 * 获取 CORS 头
 */
function getCORSHeaders(origin: string | null): Record<string, string> {
  // 检查是否在允许列表中
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : '*'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * 添加 CORS 头部到响应
 */
export function addCORSHeaders(response: Response, requestOrigin?: string | null): Response {
  const corsHeaders = getCORSHeaders(requestOrigin || null)
  const securityHeaders = getSecurityHeaders()
  const headers = new Headers(response.headers)

  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value)
  }
  for (const [key, value] of Object.entries(securityHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value)
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * 获取通用安全头
 */
function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

/**
 * 合并多个 headers 对象
 */
function mergeHeaders(...sources: Record<string, string>[]): Headers {
  const headers = new Headers()
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      headers.set(key, value)
    }
  }
  return headers
}

/**
 * 处理 CORS 预检请求
 */
export function handleCORS(requestOrigin?: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: mergeHeaders(getCORSHeaders(requestOrigin || null), getSecurityHeaders()),
  })
}

/**
 * 返回 JSON 响应（含安全头）
 */
export function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: mergeHeaders(
      { 'Content-Type': 'application/json' },
      getSecurityHeaders(),
    ),
  })
}

/**
 * 返回成功响应
 */
export function success<T>(data?: T): Response {
  const response: ApiResponse<T> = { success: true, data }
  return json(response)
}

/**
 * 返回错误响应
 */
export function error(message: string, status = 400): Response {
  const response: ApiResponse = { success: false, error: message }
  return json(response, status)
}

/**
 * 401 未授权响应
 */
export function unauthorized(message = '未授权访问'): Response {
  return error(message, 401)
}

/**
 * 404 未找到响应
 */
export function notFound(message = '资源未找到'): Response {
  return error(message, 404)
}

/**
 * 400 错误请求响应
 */
export function badRequest(message: string): Response {
  return error(message, 400)
}

/**
 * 500 服务器错误响应
 */
export function serverError(message = '服务器内部错误'): Response {
  return error(message, 500)
}
