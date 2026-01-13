import type { Env, AuthRequest, AuthResponse } from '../types'
import { json, unauthorized, badRequest } from './response'

/**
 * 生成简单的 token (生产环境建议使用 JWT)
 */
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Token 过期时间 (24小时)
 */
const TOKEN_EXPIRY_HOURS = 24

/**
 * 处理认证请求
 */
export async function authenticate(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as AuthRequest

    if (!body.password) {
      return badRequest('密码不能为空')
    }

    // 验证密码
    if (body.password !== env.ADMIN_PASSWORD) {
      return unauthorized('密码错误')
    }

    // 生成 token
    const token = generateToken()
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()

    // 将 token 存储到 KV (用于验证)
    await env.FILE_INDEX.put(`token:${token}`, JSON.stringify({ expiresAt }), {
      expirationTtl: TOKEN_EXPIRY_HOURS * 60 * 60
    })

    const response: AuthResponse = { token, expiresAt }
    return json({ success: true, data: response })
  } catch {
    return badRequest('请求格式错误')
  }
}

/**
 * 验证请求中的 token
 */
export async function verifyAuth(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.slice(7)

  // 从 KV 中验证 token
  const tokenData = await env.FILE_INDEX.get(`token:${token}`)

  if (!tokenData) {
    return false
  }

  try {
    const { expiresAt } = JSON.parse(tokenData) as { expiresAt: string }
    return new Date(expiresAt) > new Date()
  } catch {
    return false
  }
}

/**
 * 处理登出请求
 */
export async function logout(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    await env.FILE_INDEX.delete(`token:${token}`)
  }

  return json({ success: true })
}
