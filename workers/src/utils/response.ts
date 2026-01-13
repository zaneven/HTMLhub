import type { ApiResponse } from '../types'

/**
 * 添加 CORS 头部到响应
 */
export function addCORSHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Max-Age', '86400')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

/**
 * 处理 CORS 预检请求
 */
export function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}

/**
 * 返回 JSON 响应
 */
export function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
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
