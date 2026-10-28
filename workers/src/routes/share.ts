import type { Env, ProjectIndexData } from '../types'
import { json, unauthorized, badRequest, notFound, error } from '../utils/response'
import { verifyAuth } from '../utils/auth'
import { getAllowedOrigins } from '../utils/response'
import {
  DEFAULT_TTL_SECONDS,
  MIN_PASSWORD_LENGTH,
  PBKDF2_ITERATIONS,
  MAX_PASSWORD_LENGTH,
  PREVIEW_TOKEN_TTL_SECONDS,
  SESSION_MAX_AGE_SECONDS,
  SHARE_INDEX_KEY,
  SHARE_KEY_PREFIX,
  buildShareCookie,
  createSalt,
  escapeHtml,
  generatePassword,
  hashPassword,
  isExpired,
  isValidPassword,
  normalizePassword,
  normalizeProjectPath,
  nowSeconds,
  parseCookie,
  projectPathCandidates,
  shareCookieName,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
  type ShareConfig,
  type ShareEntry,
  type ShareIndexData,
} from '../utils/share'

/**
 * 项目分享访问控制
 *
 * 拦截点有两处，必须共用同一套判定：
 *   1. /r2/*        —— 分享出去的链接本身
 *   2. 内容类 API    —— /api/content、/api/project/download、/api/project/files
 */

// ---------------------------------------------------------------------------
// 分享索引（KV + isolate 内存缓存）
// ---------------------------------------------------------------------------

const INDEX_CACHE_TTL_MS = 20_000

let indexCache: { at: number; data: ShareIndexData } | null = null

async function loadShareIndex(env: Env, force = false): Promise<ShareIndexData> {
  if (!force && indexCache && Date.now() - indexCache.at < INDEX_CACHE_TTL_MS) {
    return indexCache.data
  }

  const stored = (await env.FILE_INDEX.get(SHARE_INDEX_KEY, 'json')) as ShareIndexData | null
  const data: ShareIndexData =
    stored && Array.isArray(stored.items) ? stored : { updatedAt: 0, items: [] }

  indexCache = { at: Date.now(), data }
  return data
}

async function saveShareIndex(env: Env, data: ShareIndexData): Promise<void> {
  data.updatedAt = nowSeconds()
  indexCache = { at: Date.now(), data }
  await env.FILE_INDEX.put(SHARE_INDEX_KEY, JSON.stringify(data))
}

async function upsertShareEntry(env: Env, entry: ShareEntry): Promise<void> {
  const index = await loadShareIndex(env, true)
  const items = index.items.filter((item) => item.path !== entry.path)
  items.push(entry)
  await saveShareIndex(env, { updatedAt: index.updatedAt, items })
}

async function removeShareEntry(env: Env, path: string): Promise<void> {
  const index = await loadShareIndex(env, true)
  await saveShareIndex(env, {
    updatedAt: index.updatedAt,
    items: index.items.filter((item) => item.path !== path),
  })
}

async function getShareConfig(env: Env, path: string): Promise<ShareConfig | null> {
  return (await env.FILE_INDEX.get(`${SHARE_KEY_PREFIX}${path}`, 'json')) as ShareConfig | null
}

async function getShareEntry(env: Env, path: string): Promise<ShareEntry | null> {
  const index = await loadShareIndex(env)
  return index.items.find((item) => item.path === path && item.enabled) ?? null
}

/**
 * 给 /api/files 的返回结果附加 protected 标记
 *
 * 注意：索引本身是公开的，绝不能把密码哈希写进去。
 */
export async function decorateIndexWithProtection(
  index: ProjectIndexData,
  env: Env,
): Promise<ProjectIndexData> {
  const shareIndex = await loadShareIndex(env)
  const map = new Map(
    shareIndex.items.filter((item) => item.enabled).map((item) => [item.path, item]),
  )

  return {
    ...index,
    projects: index.projects.map((project) => {
      const entry = map.get(project.path)
      if (!entry) return project
      return {
        ...project,
        protected: true,
        protectedExpired: isExpired(entry),
        shareExpiresAt: entry.expiresAt || undefined,
      }
    }),
  }
}

// ---------------------------------------------------------------------------
// 访问判定
// ---------------------------------------------------------------------------

export type ShareAccess =
  | { kind: 'public' }
  | {
      kind: 'granted'
      via: 'cookie' | 'token' | 'admin'
      setCookie?: string
      redirectTo?: string
    }
  | {
      kind: 'locked'
      reason: 'password' | 'expired'
      entry: ShareEntry
      projectPath: string
      tokenRejected: boolean
    }

function tokenKind(token: string): 's' | 'a' | null {
  if (token.startsWith('v1.s.')) return 's'
  if (token.startsWith('v1.a.')) return 'a'
  return null
}

async function resolveAccessForProject(
  request: Request,
  env: Env,
  projectPath: string,
): Promise<ShareAccess> {
  const entry = await getShareEntry(env, projectPath)
  if (!entry) return { kind: 'public' }

  const url = new URL(request.url)
  const token = url.searchParams.get('k')
  const cookieName = shareCookieName(projectPath)
  const now = nowSeconds()

  if (token) {
    const valid = await verifyAccessToken(env, token, projectPath, {
      allowAdmin: true,
      expectedVersion: entry.version,
    })
    const kind = tokenKind(token)

    if (valid && kind === 'a') {
      // 管理员预览令牌：忽略分享有效期，仅用于工作台内自查
      return {
        kind: 'granted',
        via: 'admin',
        setCookie: buildShareCookie(
          cookieName,
          token,
          Math.max(60, Math.min(PREVIEW_TOKEN_TTL_SECONDS, 3600)),
        ),
        redirectTo: cleanUrl(url),
      }
    }

    if (valid && kind === 's') {
      if (isExpired(entry, now)) {
        return { kind: 'locked', reason: 'expired', entry, projectPath, tokenRejected: false }
      }
      const expiresAt = entry.expiresAt > 0 ? entry.expiresAt : now + SESSION_MAX_AGE_SECONDS
      return {
        kind: 'granted',
        via: 'token',
        setCookie: buildShareCookie(cookieName, token, Math.max(60, expiresAt - now)),
        redirectTo: cleanUrl(url),
      }
    }
  }

  const cookieToken = parseCookie(request.headers.get('Cookie'), cookieName)
  if (cookieToken) {
    const granted = await verifyAccessToken(env, cookieToken, projectPath, {
      allowAdmin: true,
      expectedVersion: entry.version,
    })
    const kind = tokenKind(cookieToken)
    // 管理员预览 Cookie 不受分享有效期约束；普通会话在分享过期后立即失效
    if (granted && (kind === 'a' || !isExpired(entry, now))) {
      return { kind: 'granted', via: kind === 'a' ? 'admin' : 'cookie' }
    }
  }

  if (isExpired(entry, now)) {
    return { kind: 'locked', reason: 'expired', entry, projectPath, tokenRejected: false }
  }

  return {
    kind: 'locked',
    reason: 'password',
    entry,
    projectPath,
    tokenRejected: Boolean(token),
  }
}

/**
 * 按 R2 对象 key 判定：可能命中目录项目，也可能是单文件项目
 */
export async function resolveAccessForKey(
  request: Request,
  env: Env,
  objectKey: string,
): Promise<ShareAccess> {
  let last: ShareAccess = { kind: 'public' }

  for (const candidate of projectPathCandidates(objectKey)) {
    const access = await resolveAccessForProject(request, env, candidate)
    if (access.kind !== 'public') return access
    last = access
  }

  return last
}

/**
 * 内容类 API 的闸门：未通过时返回 401 / 410 JSON
 */
export async function guardObjectKey(
  request: Request,
  env: Env,
  objectKey: string,
): Promise<Response | null> {
  return guardAccess(await resolveAccessForKey(request, env, objectKey))
}

export async function guardProjectPath(
  request: Request,
  env: Env,
  projectPath: string,
): Promise<Response | null> {
  return guardAccess(await resolveAccessForProject(request, env, projectPath))
}

function guardAccess(access: ShareAccess): Response | null {
  if (access.kind !== 'locked') return null

  const response =
    access.reason === 'expired'
      ? error('分享已结束', 410)
      : unauthorized('该项目受密码保护')
  response.headers.set('Cache-Control', 'no-store')
  return response
}

function cleanUrl(url: URL): string {
  const clean = new URL(url.toString())
  clean.searchParams.delete('k')
  return `${clean.pathname}${clean.search}`
}

// ---------------------------------------------------------------------------
// 密码页 / 过期页
// ---------------------------------------------------------------------------

function projectDisplayName(projectPath: string): string {
  const last = projectPath.split('/').pop() || projectPath
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

function frameAncestors(): string {
  return getAllowedOrigins().join(' ')
}

export function renderSharePage(access: Extract<ShareAccess, { kind: 'locked' }>): Response {
  const expired = access.reason === 'expired'
  const name = escapeHtml(projectDisplayName(access.projectPath))
  const hint = !expired && access.entry.hint ? escapeHtml(access.entry.hint) : ''
  const rejectedHint = access.tokenRejected
    ? '<p class="tip warn">链接中的访问凭证已失效，请输入密码继续。</p>'
    : ''

  const body = expired
    ? `<p class="desc">该分享链接已过期或被撤销。</p>
       <p class="tip">请联系分享者重新获取访问链接。</p>`
    : `<p class="desc">该项目已开启访问保护，请输入分享密码。</p>
       ${hint ? `<p class="tip">提示：${hint}</p>` : ''}
       ${rejectedHint}
       <form id="unlock-form" autocomplete="off">
         <input id="pwd" name="password" type="text" inputmode="latin" autocomplete="one-time-code"
                maxlength="${MAX_PASSWORD_LENGTH}" placeholder="请输入密码" required autofocus>
         <button id="submit" type="submit">进入</button>
       </form>
       <p id="msg" class="msg" role="status"></p>`

  const script = expired
    ? ''
    : `<script>
(function () {
  var form = document.getElementById('unlock-form');
  var input = document.getElementById('pwd');
  var button = document.getElementById('submit');
  var msg = document.getElementById('msg');
  var PATH = ${JSON.stringify(access.projectPath).replace(/</g, '\\u003c')};

  input.addEventListener('input', function () {
    input.value = input.value.toUpperCase();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    msg.className = 'msg';
    msg.textContent = '';
    button.disabled = true;

    fetch('/api/share/unlock', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: PATH, password: input.value })
    }).then(function (response) {
      if (response.ok) {
        var url = new URL(location.href);
        url.searchParams.delete('k');
        location.replace(url.toString());
        return;
      }
      return response.json().catch(function () { return {}; }).then(function (data) {
        msg.className = 'msg error';
        msg.textContent = data.error || '密码错误，请重试';
        input.select();
      });
    }).catch(function () {
      msg.className = 'msg error';
      msg.textContent = '网络错误，请稍后重试';
    }).finally(function () {
      button.disabled = false;
    });
  });
})();
</script>`

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${expired ? '分享已结束' : '需要访问密码'} · ${name}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 24px; background: #f5f6f8; color: #1f2329;
    font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  }
  .card {
    width: 100%; max-width: 380px; padding: 32px 28px; background: #fff;
    border-radius: 16px; box-shadow: 0 12px 40px rgba(15, 23, 42, .08);
    border: 1px solid rgba(15, 23, 42, .06); text-align: center;
  }
  .lock { font-size: 28px; line-height: 1; }
  h1 { margin: 14px 0 6px; font-size: 19px; font-weight: 600; word-break: break-all; }
  .desc { margin: 0 0 18px; color: #646a73; font-size: 14px; }
  .tip { margin: 0 0 14px; color: #8a6d1a; background: #fff7e6; border-radius: 8px; padding: 8px 10px; font-size: 13px; }
  .tip.warn { color: #9a3412; background: #fff1e7; }
  form { display: flex; gap: 10px; margin-top: 4px; }
  input {
    flex: 1; min-width: 0; height: 44px; padding: 0 14px; font-size: 18px; letter-spacing: 2px;
    text-align: center; text-transform: uppercase; border: 1px solid #d9dee5; border-radius: 10px;
    outline: none; transition: border-color .15s, box-shadow .15s; background: #fff; color: inherit;
  }
  input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, .15); }
  button {
    height: 44px; padding: 0 20px; border: 0; border-radius: 10px; background: #1f2329; color: #fff;
    font-size: 15px; cursor: pointer; transition: opacity .15s;
  }
  button:hover { opacity: .88; }
  button:disabled { opacity: .5; cursor: default; }
  .msg { min-height: 20px; margin: 12px 0 0; font-size: 13px; color: #646a73; }
  .msg.error { color: #d14343; }
  @media (prefers-color-scheme: dark) {
    body { background: #121417; color: #e5e7eb; }
    .card { background: #1a1d21; border-color: rgba(255,255,255,.08); box-shadow: none; }
    .desc, .msg { color: #9aa1ab; }
    input { background: #121417; border-color: #333a42; }
  }
</style>
</head>
<body>
  <main class="card">
    <div class="lock" aria-hidden="true">${expired ? '⏳' : '🔒'}</div>
    <h1>${name}</h1>
    ${body}
  </main>
  ${script}
</body>
</html>`

  return new Response(html, {
    status: expired ? 410 : 401,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': [
        "default-src 'none'",
        "style-src 'unsafe-inline'",
        "script-src 'unsafe-inline'",
        "connect-src 'self'",
        "img-src 'self' data:",
        "base-uri 'none'",
        "form-action 'self'",
        `frame-ancestors ${frameAncestors()}`,
      ].join('; '),
    },
  })
}

// ---------------------------------------------------------------------------
// 管理接口
// ---------------------------------------------------------------------------

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  if (await verifyAuth(request, env)) return null
  return unauthorized()
}

function normalizeTtl(raw: unknown): number {
  if (raw === 0 || raw === null) return 0
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return DEFAULT_TTL_SECONDS
  const seconds = Math.floor(raw)
  if (seconds <= 0) return 0
  return Math.min(seconds, 365 * 24 * 60 * 60)
}

function encodeKeyPath(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/')
}

function resolveIndexPath(raw: unknown, projectPath: string): string {
  const fallback = projectPath.toLowerCase().endsWith('.html')
    ? projectPath
    : `${projectPath}/index.html`

  if (typeof raw !== 'string') return fallback
  const value = raw.trim()
  if (!value.startsWith('html-files/')) return fallback
  if (value !== projectPath && !value.startsWith(`${projectPath}/`)) return fallback
  if (value.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return fallback
  }
  return value
}

/**
 * GET /api/share?path=...
 * 查看某个项目的分享状态（管理员）
 */
export async function getShareStatus(request: Request, env: Env): Promise<Response> {
  const denied = await requireAdmin(request, env)
  if (denied) return denied

  const url = new URL(request.url)
  const path = normalizeProjectPath(url.searchParams.get('path'))
  if (!path) return badRequest('无效的项目路径')

  const config = await getShareConfig(env, path)
  if (!config) {
    return json({ success: true, data: { enabled: false, hasPassword: false } })
  }

  return json({
    success: true,
    data: {
      enabled: config.enabled,
      hasPassword: Boolean(config.hash),
      indexPath: config.indexPath,
      expiresAt: config.expiresAt,
      expired: isExpired(config),
      version: config.version,
      hint: config.hint ?? '',
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      lastUsedAt: config.lastUsedAt ?? 0,
    },
  })
}

/**
 * PUT /api/share
 * 创建 / 重置分享密码（管理员）
 *
 * body: { path, indexPath?, password?, length?, ttlSeconds?, hint? }
 * 密码为空时自动生成；返回的密码只在这里出现一次。
 */
export async function upsertShare(request: Request, env: Env): Promise<Response> {
  const denied = await requireAdmin(request, env)
  if (denied) return denied

  const body = await readJson<Record<string, unknown>>(request)
  if (!body) return badRequest('请求格式错误')

  const path = normalizeProjectPath(body.path)
  if (!path) return badRequest('无效的项目路径')

  const existing = await getShareConfig(env, path)

  const length =
    typeof body.length === 'number'
      ? Math.min(Math.max(Math.floor(body.length), MIN_PASSWORD_LENGTH), MAX_PASSWORD_LENGTH)
      : undefined

  const rawPassword = typeof body.password === 'string' ? normalizePassword(body.password) : ''
  const generated = rawPassword.length === 0
  if (!generated && !isValidPassword(rawPassword)) {
    return badRequest(`密码需为 ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} 位字母或数字`)
  }

  const password = generated ? generatePassword(length) : rawPassword
  const ttl = normalizeTtl(body.ttlSeconds)
  const now = nowSeconds()
  const expiresAt = ttl > 0 ? now + ttl : 0
  const salt = createSalt()
  const hash = await hashPassword(env, password, salt)
  const version = (existing?.version ?? 0) + 1
  const indexPath = resolveIndexPath(body.indexPath, path)
  const hint =
    typeof body.hint === 'string' ? body.hint.trim().slice(0, 60) : (existing?.hint ?? '')

  const config: ShareConfig = {
    path,
    indexPath,
    enabled: true,
    salt,
    hash,
    iter: PBKDF2_ITERATIONS,
    version,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    expiresAt,
    hint: hint || undefined,
  }

  await env.FILE_INDEX.put(`${SHARE_KEY_PREFIX}${path}`, JSON.stringify(config))
  await upsertShareEntry(env, {
    path,
    indexPath,
    enabled: true,
    expiresAt,
    version,
    hint: hint || undefined,
  })

  const origin = new URL(request.url).origin
  const entryPath = encodeKeyPath(indexPath)
  const passwordLink = `${origin}/r2/${entryPath}`

  // 免密链接的令牌有效期：跟随分享有效期；永久分享默认给 7 天令牌
  const tokenExpiresAt = expiresAt > 0 ? expiresAt : now + SESSION_MAX_AGE_SECONDS
  const token = await signAccessToken(env, 's', path, tokenExpiresAt, version)

  return json({
    success: true,
    data: {
      path,
      indexPath,
      password,
      generated,
      version,
      expiresAt,
      tokenExpiresAt,
      link: `${passwordLink}?k=${encodeURIComponent(token)}`,
      passwordLink,
    },
  })
}

/**
 * POST /api/share/link
 * 为已开启分享的项目重新签发免密链接（管理员）
 *
 * 不改变密码与版本，仅按当前有效期重新生成令牌，便于分享面板随时展示。
 */
export async function createShareLink(request: Request, env: Env): Promise<Response> {
  const denied = await requireAdmin(request, env)
  if (denied) return denied

  const body = await readJson<{ path?: unknown }>(request)
  const path = normalizeProjectPath(body?.path)
  if (!path) return badRequest('无效的项目路径')

  const config = await getShareConfig(env, path)
  if (!config || !config.enabled) {
    return notFound('该项目未开启分享保护')
  }
  if (isExpired(config)) {
    return error('分享已结束', 410)
  }

  const now = nowSeconds()
  const tokenExpiresAt = config.expiresAt > 0 ? config.expiresAt : now + SESSION_MAX_AGE_SECONDS
  const token = await signAccessToken(env, 's', path, tokenExpiresAt, config.version)
  const origin = new URL(request.url).origin
  const entryPath = encodeKeyPath(config.indexPath)

  return json({
    success: true,
    data: {
      link: `${origin}/r2/${entryPath}?k=${encodeURIComponent(token)}`,
      passwordLink: `${origin}/r2/${entryPath}`,
      tokenExpiresAt,
      expiresAt: config.expiresAt,
    },
  })
}

/**
 * DELETE /api/share?path=...
 * 撤销分享（管理员），项目恢复公开访问
 */
export async function deleteShare(request: Request, env: Env): Promise<Response> {
  const denied = await requireAdmin(request, env)
  if (denied) return denied

  const url = new URL(request.url)
  const path = normalizeProjectPath(url.searchParams.get('path'))
  if (!path) return badRequest('无效的项目路径')

  await env.FILE_INDEX.delete(`${SHARE_KEY_PREFIX}${path}`)
  await removeShareEntry(env, path)

  return json({ success: true })
}

/**
 * POST /api/share/preview
 * 管理员在工作台内预览受保护项目时，签发 5 分钟免密令牌
 */
export async function createPreviewToken(request: Request, env: Env): Promise<Response> {
  const denied = await requireAdmin(request, env)
  if (denied) return denied

  const body = await readJson<{ path?: unknown }>(request)
  const path = normalizeProjectPath(body?.path)
  if (!path) return badRequest('无效的项目路径')

  const config = await getShareConfig(env, path)
  if (!config || !config.enabled) {
    return notFound('该项目未开启分享保护')
  }

  const now = nowSeconds()
  const expiresAt = now + PREVIEW_TOKEN_TTL_SECONDS
  const token = await signAccessToken(env, 'a', path, expiresAt, config.version)

  return json({ success: true, data: { k: token, expiresAt } })
}

// ---------------------------------------------------------------------------
// 解锁（公开接口）
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_SECONDS = 600
const RATE_LIMIT_PER_IP = 10
const RATE_LIMIT_PER_PROJECT = 30

async function counter(env: Env, key: string): Promise<number> {
  const raw = await env.FILE_INDEX.get(key)
  const value = raw ? Number.parseInt(raw, 10) : 0
  return Number.isFinite(value) ? value : 0
}

async function bump(env: Env, key: string, value: number): Promise<void> {
  await env.FILE_INDEX.put(key, String(value), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
  })
}

/**
 * POST /api/share/unlock
 * body: { path, password }
 */
export async function unlockShare(request: Request, env: Env): Promise<Response> {
  const body = await readJson<{ path?: unknown; password?: unknown }>(request)
  if (!body) return badRequest('请求格式错误')

  const path = normalizeProjectPath(body.path)
  const password = typeof body.password === 'string' ? normalizePassword(body.password) : ''
  if (!path || !password) return badRequest('密码不能为空')

  const entry = await getShareEntry(env, path)
  if (!entry) return unauthorized('密码错误')

  if (isExpired(entry)) {
    return error('分享已结束', 410)
  }

  const projectKey = `rl:share:${shareCookieName(path)}`
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const ipKey = `rl:ip:${ip}:${shareCookieName(path)}`

  const [ipCount, projectCount] = await Promise.all([
    counter(env, ipKey),
    counter(env, projectKey),
  ])

  if (ipCount >= RATE_LIMIT_PER_IP || projectCount >= RATE_LIMIT_PER_PROJECT) {
    const response = error('尝试次数过多，请稍后再试', 429)
    response.headers.set('Retry-After', String(RATE_LIMIT_WINDOW_SECONDS))
    return response
  }

  const config = await getShareConfig(env, path)
  if (!config || !config.enabled) return unauthorized('密码错误')

  const passed = await verifyPassword(env, password, config)

  if (!passed) {
    await Promise.all([bump(env, ipKey, ipCount + 1), bump(env, projectKey, projectCount + 1)])
    return unauthorized('密码错误')
  }

  const now = nowSeconds()
  const expiresAt =
    entry.expiresAt > 0
      ? Math.min(now + SESSION_MAX_AGE_SECONDS, entry.expiresAt)
      : now + SESSION_MAX_AGE_SECONDS

  const token = await signAccessToken(env, 's', path, expiresAt, entry.version)
  const cookie = buildShareCookie(shareCookieName(path), token, Math.max(60, expiresAt - now))

  // 尽力记录最近一次成功访问，不影响主流程
  await env.FILE_INDEX
    .put(`${SHARE_KEY_PREFIX}${path}`, JSON.stringify({ ...config, lastUsedAt: now }))
    .catch(() => undefined)

  const response = json({
    success: true,
    data: { expiresAt, project: path },
  })
  response.headers.set('Set-Cookie', cookie)
  response.headers.set('Cache-Control', 'no-store')
  return response
}
