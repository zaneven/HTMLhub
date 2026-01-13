import type { Env } from './types'
import { handleCORS, addCORSHeaders, notFound } from './utils/response'
import { authenticate, logout } from './utils/auth'
import { listFiles, uploadFile, uploadMultipleFiles, deleteFile, refreshIndex, getFileContent } from './routes/files'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }

    // 路由分发
    let response: Response

    try {
      switch (true) {
        // 认证相关
        case request.method === 'POST' && path === '/api/auth':
          response = await authenticate(request, env)
          break

        case request.method === 'POST' && path === '/api/logout':
          response = await logout(request, env)
          break

        // 文件操作
        case request.method === 'GET' && path === '/api/files':
          response = await listFiles(env)
          break

        case request.method === 'POST' && path === '/api/upload':
          response = await uploadFile(request, env)
          break

        case request.method === 'POST' && path === '/api/upload-multiple':
          response = await uploadMultipleFiles(request, env)
          break

        case request.method === 'DELETE' && path === '/api/files':
          response = await deleteFile(request, env)
          break

        case request.method === 'POST' && path === '/api/refresh':
          response = await refreshIndex(request, env)
          break

        // 文件内容获取 (用于预览)
        case request.method === 'GET' && path === '/api/content':
          response = await getFileContent(request, env)
          break

        // 健康检查
        case request.method === 'GET' && path === '/api/health':
          response = new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
            headers: { 'Content-Type': 'application/json' }
          })
          break

        default:
          response = notFound('API 接口不存在')
      }
    } catch (error) {
      console.error('Unhandled error:', error)
      response = new Response(JSON.stringify({ success: false, error: '服务器内部错误' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return addCORSHeaders(response)
  }
}
