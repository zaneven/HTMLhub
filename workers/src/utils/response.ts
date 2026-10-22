import type { ApiResponse } from '../types'

/**
 * 允许的 CORS 域名列表
 *
 * 这一份列表同时承担两个职责：
 *   1. 决定哪些前端源可以拿到「回显自身」的 CORS 头；
 *   2. 决定哪些前端源可以以 iframe 嵌入 /r2/ 下的静态原型（见 getSecurityHeaders）。
 * 新增前端域名时改这一处即可。
 */
export function getAllowedOrigins(): string[] {
  return [
    'https://htmlhub.pages.dev',
    'https://htmlmanager.pages.dev',
    'https://html.getprompt.top',
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
    // 允许前端读取下载文件名（跨域下 Content-Disposition 默认不可见）
    'Access-Control-Expose-Headers': 'Content-Disposition',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * 添加 CORS 头部到响应
 *
 * @param allowFramingBy 传入源列表时，该响应允许被这些源以 iframe 嵌入（见 getSecurityHeaders）
 */
export function addCORSHeaders(
  response: Response,
  requestOrigin?: string | null,
  allowFramingBy?: string[],
): Response {
  const corsHeaders = getCORSHeaders(requestOrigin || null)
  const securityHeaders = getSecurityHeaders(allowFramingBy)
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
 *
 * @param allowFramingBy 传入源列表时，改用 CSP frame-ancestors 显式列出允许嵌入的源，
 *   并省略 X-Frame-Options —— 后者只有 DENY / SAMEORIGIN 两个可用值，
 *   表达不了「允许这几个跨域前端嵌入」。
 *   /r2/ 下是用户上传的静态原型，前端工作台需要用 iframe 预览，因此走这个分支。
 */
function getSecurityHeaders(allowFramingBy?: string[]): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }

  if (allowFramingBy && allowFramingBy.length > 0) {
    headers['Content-Security-Policy'] = `frame-ancestors ${allowFramingBy.join(' ')}`
  } else {
    headers['X-Frame-Options'] = 'SAMEORIGIN'
  }

  return headers
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
