import type { Env } from '../types'

/**
 * 分享访问控制的基础能力
 *
 * 这里只放「与路由无关」的原语：密码哈希、会话签名、Cookie、限流键、路径解析。
 * 具体路由与拦截逻辑见 routes/share.ts。
 *
 * 安全模型：
 *   - 密码只存 PBKDF2 哈希，且以 AUTH_SECRET 作为 pepper 参与派生；
 *     即使 KV 数据泄露，没有 Worker secret 也无法离线穷举 4 位短码。
 *   - 会话/免密链接是 HMAC 签名串，包含项目路径、过期时间与版本号；
 *     撤销或重置密码时版本号 +1，旧签名立即全部失效。
 */

export const SHARE_KEY_PREFIX = 'share:'
export const SHARE_INDEX_KEY = 'share:index'

/** 去除易混字符（0/O、1/I/L）后的 32 字符集，4 位约 105 万组合 */
export const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const DEFAULT_PASSWORD_LENGTH = 4
export const MIN_PASSWORD_LENGTH = 4
export const MAX_PASSWORD_LENGTH = 32

/** 未指定有效期时的默认值（7 天） */
export const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60
/** 单次会话最长有效期 */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
/** 管理员预览令牌有效期 */
export const PREVIEW_TOKEN_TTL_SECONDS = 5 * 60

const PBKDF2_ITERATIONS = 20_000
const TOKEN_VERSION = 'v1'
const SALT_BYTES = 16

export interface ShareConfig {
  /** 项目路径，目录项目为 html-files/{分类}/{项目}，单文件项目为完整对象 key */
  path: string
  /** 入口文件 key */
  indexPath: string
  enabled: boolean
  salt: string
  hash: string
  iter: number
  /** 撤销 / 重置密码时递增 */
  version: number
  createdAt: number
  updatedAt: number
  /** 0 表示永久 */
  expiresAt: number
  hint?: string
  lastUsedAt?: number
}

export interface ShareEntry {
  path: string
  indexPath: string
  enabled: boolean
  expiresAt: number
  version: number
  hint?: string
}

export interface ShareIndexData {
  updatedAt: number
  items: ShareEntry[]
}

// ---------------------------------------------------------------------------
// 基础工具
// ---------------------------------------------------------------------------

const encoder = new TextEncoder()

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * 签名与哈希使用的服务端密钥
 *
 * 生产环境应通过 `wrangler secret put AUTH_SECRET` 单独设置；
 * 未设置时回退到 ADMIN_PASSWORD，保证最小可用（改管理员密码会使旧分享失效）。
 */
function getSecret(env: Env): string {
  const secret = env.AUTH_SECRET || env.ADMIN_PASSWORD
  if (!secret) {
    throw new Error('未配置 AUTH_SECRET / ADMIN_PASSWORD，无法启用分享访问控制')
  }
  return secret
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2)
  for (let i = 0; i < result.length; i++) {
    result[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return result
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

async function hmacSha256(env: Env, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret(env)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return new Uint8Array(signature)
}

// ---------------------------------------------------------------------------
// 密码
// ---------------------------------------------------------------------------

export function generatePassword(length = DEFAULT_PASSWORD_LENGTH): string {
  const size = Math.min(Math.max(length, MIN_PASSWORD_LENGTH), MAX_PASSWORD_LENGTH)
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  // PASSWORD_ALPHABET 长度恰好为 32，256 % 32 === 0，不存在取模偏差
  return Array.from(bytes, (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length]).join('')
}

export function normalizePassword(password: string): string {
  return password.trim().toUpperCase()
}

export function isValidPassword(password: string): boolean {
  return /^[A-Z0-9]{4,32}$/.test(normalizePassword(password))
}

export function createSalt(): string {
  const bytes = new Uint8Array(SALT_BYTES)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

export async function hashPassword(
  env: Env,
  password: string,
  salt: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<string> {
  const material = encoder.encode(`${getSecret(env)}:${normalizePassword(password)}`)
  const key = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(salt),
      iterations,
      hash: 'SHA-256',
    },
    key,
    256,
  )
  return toHex(new Uint8Array(bits))
}

export async function verifyPassword(
  env: Env,
  password: string,
  config: Pick<ShareConfig, 'salt' | 'hash' | 'iter'>,
): Promise<boolean> {
  const candidate = await hashPassword(
    env,
    password,
    config.salt,
    config.iter || PBKDF2_ITERATIONS,
  )
  return timingSafeEqual(candidate, config.hash)
}

export { PBKDF2_ITERATIONS }

// ---------------------------------------------------------------------------
// 会话 / 免密链接令牌
// ---------------------------------------------------------------------------

export type AccessKind = 's' | 'a'

/**
 * 生成访问令牌
 *
 * @param kind 's' 分享令牌（受项目版本与有效期约束），'a' 管理员预览令牌（忽略有效期）
 */
export async function signAccessToken(
  env: Env,
  kind: AccessKind,
  projectPath: string,
  expiresAt: number,
  version: number,
): Promise<string> {
  const signature = await hmacSha256(
    env,
    `${kind}\n${projectPath}\n${expiresAt}\n${version}`,
  )
  return `${TOKEN_VERSION}.${kind}.${expiresAt.toString(36)}.${version.toString(36)}.${toBase64Url(signature)}`
}

interface ParsedToken {
  kind: AccessKind
  expiresAt: number
  version: number
}

function parseAccessToken(token: string): ParsedToken | null {
  const parts = token.split('.')
  if (parts.length !== 5 || parts[0] !== TOKEN_VERSION) return null
  const kind = parts[1]
  if (kind !== 's' && kind !== 'a') return null

  const expiresAt = Number.parseInt(parts[2]!, 36)
  const version = Number.parseInt(parts[3]!, 36)
  if (!Number.isFinite(expiresAt) || !Number.isFinite(version)) return null

  return { kind, expiresAt, version }
}

export async function verifyAccessToken(
  env: Env,
  token: string,
  projectPath: string,
  options: { allowAdmin: boolean; expectedVersion?: number },
): Promise<boolean> {
  const parsed = parseAccessToken(token)
  if (!parsed) return false
  if (parsed.expiresAt <= nowSeconds()) return false
  if (parsed.kind === 'a' && !options.allowAdmin) return false
  if (
    parsed.kind === 's' &&
    options.expectedVersion !== undefined &&
    parsed.version !== options.expectedVersion
  ) {
    return false
  }

  const expected = await signAccessToken(
    env,
    parsed.kind,
    projectPath,
    parsed.expiresAt,
    parsed.version,
  )
  return timingSafeEqual(expected, token)
}

// ---------------------------------------------------------------------------
// Cookie
// ---------------------------------------------------------------------------

/**
 * Cookie 名由项目路径哈希得到
 *
 * 中文路径做 Cookie Path 会因百分号编码对不上，因此统一 Path=/，
 * 再用「每项目一个 Cookie 名」隔离；同时让 /api/content、下载等
 * 内容接口能复用同一份会话。
 */
export function shareCookieName(projectPath: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < projectPath.length; i++) {
    hash ^= projectPath.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `hp_${hash.toString(36)}`
}

export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() !== name) continue
    try {
      return decodeURIComponent(part.slice(index + 1).trim())
    } catch {
      return part.slice(index + 1).trim()
    }
  }
  return null
}

export function buildShareCookie(name: string, value: string, maxAge: number): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ].join('; ')
}

// ---------------------------------------------------------------------------
// 请求 / 路径
// ---------------------------------------------------------------------------

export function isDocumentRequest(request: Request): boolean {
  if (request.method !== 'GET') return false
  const destination = request.headers.get('Sec-Fetch-Dest')
  if (destination) {
    return destination === 'document' || destination === 'iframe' || destination === 'frame'
  }
  return (request.headers.get('Accept') || '').includes('text/html')
}

/**
 * 校验并规范化项目路径，规则与 routes/files.ts 的 resolveProjectPath 保持一致
 */
export function normalizeProjectPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const path = raw.trim().replace(/\/+$/, '')
  if (!path.startsWith('html-files/') || path.length > 512) return null

  const segments = path.split('/')
  if (segments.length < 3) return null
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return null
  }
  return path
}

/**
 * 把一个 R2 对象 key 映射为可能的项目路径
 *
 * - 目录项目：html-files/{分类}/{项目}/...
 * - 单文件项目：html-files/{分类}/{项目}.html
 */
export function projectPathCandidates(objectKey: string): string[] {
  const segments = objectKey.split('/')
  if (segments.length < 3) return []

  if (segments.length === 3) {
    return [objectKey]
  }
  return [segments.slice(0, 3).join('/')]
}

export function isExpired(entry: Pick<ShareEntry, 'expiresAt'>, now = nowSeconds()): boolean {
  return entry.expiresAt > 0 && entry.expiresAt <= now
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
