import type { Env, ProjectInfo, CategoryInfo, ProjectIndexData } from '../types'
import { json, success, error, unauthorized, badRequest, notFound, serverError } from '../utils/response'
import { verifyAuth } from '../utils/auth'
import { zipSync } from 'fflate'

/**
 * Base64 编码 (用于生成 ID)
 */
function toBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  )
}

/**
 * 从 R2 扫描文件生成索引
 */
async function scanR2Files(env: Env): Promise<ProjectIndexData> {
  const projects: ProjectInfo[] = []
  const categoryMap = new Map<string, number>()

  // 列出 R2 中所有文件
  let cursor: string | undefined
  do {
    const listed = await env.HTML_FILES.list({
      prefix: 'html-files/',
      cursor,
    })

    for (const object of listed.objects) {
      // 解析路径: html-files/{category}/{project}/index.html 或 html-files/{category}/{file}.html
      const parts = object.key.split('/')
      if (parts.length < 3) continue

      const category = parts[1]
      const projectNameInPath = parts[2]
      const fileName = parts[parts.length - 1]

      // 只处理 HTML 文件作为项目入口
      if (!isHtmlFile(fileName)) continue

      // 判断是目录项目还是单文件项目
      // 目录项目：html-files/{category}/{project}/...
      // 单文件项目：html-files/{category}/{file}.html
      const isDirectory = parts.length >= 4
      const projectName = isDirectory ? projectNameInPath : fileName.replace(/\.(html|htm)$/, '')
      const projectPath = isDirectory 
        ? parts.slice(0, 3).join('/') 
        : object.key

      // 避免重复添加同一个项目
      // 对于目录项目，我们优先使用根目录下的 index.html 作为入口
      const projectId = toBase64(projectPath)
      const existingProjectIndex = projects.findIndex((p) => p.id === projectId)
      
      if (existingProjectIndex !== -1) {
        // 如果已经有了，看当前文件是不是更好的入口（比如根目录下的 index.html）
        // 优先规则：1. 根目录下的 index.html > 2. 根目录下的其他 HTML > 3. 子目录下的 HTML
        const existingProject = projects[existingProjectIndex]
        const existingPathDepth = existingProject.indexPath.split('/').length
        const currentPathDepth = object.key.split('/').length
        
        const isCurrentRootIndex = currentPathDepth === 4 && fileName === 'index.html'
        const isExistingRootIndex = existingPathDepth === 4 && existingProject.indexPath.endsWith('index.html')

        if (isCurrentRootIndex && !isExistingRootIndex) {
          existingProject.indexPath = object.key
        } else if (currentPathDepth < existingPathDepth && !isExistingRootIndex) {
          // 如果当前文件更靠近根目录，且现有入口不是根目录 index.html，则更新
          existingProject.indexPath = object.key
        }
        continue
      }

      projects.push({
        id: projectId,
        name: projectName,
        category,
        path: projectPath,
        indexPath: object.key,
        type: isDirectory ? 'directory' : 'file',
        createdAt: object.uploaded.toISOString(),
        modifiedAt: object.uploaded.toISOString(),
      })

      // 统计分类
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    }

    cursor = listed.truncated ? listed.cursor : undefined
  } while (cursor)

  // 生成分类列表
  const categories: CategoryInfo[] = Array.from(categoryMap.entries()).map(([name, count]) => ({
    id: toBase64(name),
    name,
    projectCount: count,
  }))

  // 排序
  categories.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  projects.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

  return {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    stats: {
      totalCategories: categories.length,
      totalProjects: projects.length,
    },
    categories,
    projects,
  }
}

/**
 * 更新文件索引缓存
 */
async function updateFileIndex(env: Env): Promise<ProjectIndexData> {
  const index = await scanR2Files(env)
  await env.FILE_INDEX.put('index', JSON.stringify(index), {
    expirationTtl: 300, // 5分钟缓存
  })
  return index
}

/**
 * 获取文件列表
 */
export async function listFiles(env: Env): Promise<Response> {
  try {
    // 优先从 KV 缓存读取
    const cached = (await env.FILE_INDEX.get('index', 'json')) as ProjectIndexData | null

    if (cached) {
      return json(cached)
    }

    // 从 R2 重新扫描
    const index = await updateFileIndex(env)
    return json(index)
  } catch (err) {
    console.error('Error listing files:', err)
    return serverError('获取文件列表失败')
  }
}

/**
 * 支持的静态资源文件扩展名
 */
const SUPPORTED_EXTENSIONS = [
  '.html',
  '.htm',
  '.js',
  '.css',
  '.json',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.md',
]

/**
 * 检查文件是否为支持的类型
 */
function isSupportedFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase()
  return SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

/**
 * 检查文件是否为 HTML 类型
 */
function isHtmlFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase()
  return lowerName.endsWith('.html') || lowerName.endsWith('.htm')
}

/**
 * 规范化并校验分类名称
 *
 * 分类名会成为 R2 key 的第二段（html-files/{分类}/...），而 scanR2Files 依赖
 * 「parts[1] = 分类名」这个约定，所以必须禁止路径分隔符与控制字符，
 * 否则路径段错位，项目会被索引到错误的分类或项目名下。
 *
 * @returns 规范化（已 trim）后的分类名；不合法时返回 null
 */
function resolveCategoryName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null

  const name = raw.trim()
  if (!name || name.length > 50) return null
  if (name === '.' || name === '..') return null
  // 禁止 / \ 与控制字符（控制字符会出现在 key 中且无法在 URL 里正常表达）
  if (/[/\\\u0000-\u001f]/.test(name)) return null

  return name
}

/**
 * 批量删除对象
 * R2 单次 delete 最多接受 1000 个 key，超过需分批
 */
async function deleteKeys(env: Env, keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 1000) {
    await env.HTML_FILES.delete(keys.slice(i, i + 1000))
  }
}

/**
 * 列出某个项目名下的全部对象（含分页）
 * - 目录项目：html-files/{分类}/{项目}/ 前缀下的所有对象
 * - 单文件项目：精确匹配该 key
 *
 * 注意：这里用 `${projectPath}/` 做前缀而不是直接用 projectPath，
 * 否则项目 demo 会误匹配到兄弟项目 demo2 的对象
 */
async function listProjectObjects(env: Env, projectPath: string): Promise<R2Object[]> {
  const objects: R2Object[] = []

  let cursor: string | undefined
  do {
    const listed = await env.HTML_FILES.list({ prefix: `${projectPath}/`, cursor })
    objects.push(...listed.objects)
    cursor = listed.truncated ? listed.cursor : undefined
  } while (cursor)

  // 没匹配到目录对象时，回退为单文件项目
  if (objects.length === 0) {
    const single = await env.HTML_FILES.head(projectPath)
    if (single) objects.push(single)
  }

  return objects
}

/**
 * 校验并规范化项目路径
 *
 * 只接受 html-files/{分类}/{项目}[/...] 形式，且不允许空段与 . / .. 段，
 * 避免通过构造路径把下载范围放大到整个分类或越出 html-files 前缀。
 */
function resolveProjectPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null

  const path = raw.trim().replace(/\/+$/, '')
  if (!path.startsWith('html-files/')) return null

  const segments = path.split('/')
  if (segments.length < 3) return null
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return null
  }

  return path
}

/**
 * 生成兼顾中文与旧浏览器的 Content-Disposition
 */
function buildContentDisposition(filename: string): string {
  const fallback = filename
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_')

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

/** 单次打包下载的体积与文件数上限（避免 Worker 内存与 CPU 超限） */
const DOWNLOAD_MAX_TOTAL_SIZE = 50 * 1024 * 1024
const DOWNLOAD_MAX_FILES = 1000

/**
 * 下载云端项目
 *
 * - 单文件项目：直接回传原文件
 * - 多文件项目：打包为 ZIP，保留项目内相对目录结构
 *
 * 不校验登录态：/r2/ 下的静态内容本身已对公网开放预览，
 * 下载作为同等的读取能力处理，也方便浏览器直接通过链接下载。
 */
export async function downloadProject(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const projectPath = resolveProjectPath(url.searchParams.get('path'))

  if (!projectPath) {
    return badRequest('无效的项目路径')
  }

  try {
    const objects = await listProjectObjects(env, projectPath)

    if (objects.length === 0) {
      return notFound('项目不存在')
    }

    const projectName = projectPath.split('/').pop() || 'project'

    // 单文件项目：直接回传该文件（即使它存放在以项目名命名的目录里）
    if (objects.length === 1) {
      const onlyObject = objects[0]!
      const object = await env.HTML_FILES.get(onlyObject.key)
      if (!object) {
        return notFound('文件不存在')
      }

      const entryName = onlyObject.key.split('/').pop() || 'download'
      // 目录项目的入口通常固定叫 index.html，用项目名作为下载文件名更友好
      const fileName = entryName === 'index.html' ? `${projectName}.html` : entryName

      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || getMimeType(entryName),
          'Content-Length': String(object.size),
          'Content-Disposition': buildContentDisposition(fileName),
          'Cache-Control': 'no-store',
        },
      })
    }

    // 多文件项目：先做体积与数量保护，再读取内容打包
    if (objects.length > DOWNLOAD_MAX_FILES) {
      return error('项目文件数量过多，暂不支持打包下载', 413)
    }

    const totalSize = objects.reduce((sum, object) => sum + object.size, 0)
    if (totalSize > DOWNLOAD_MAX_TOTAL_SIZE) {
      return error('项目体积超过 50 MB，暂不支持打包下载', 413)
    }

    const files: Record<string, Uint8Array> = {}

    for (const object of objects) {
      const body = await env.HTML_FILES.get(object.key)
      if (!body) continue

      // 保留项目内的相对目录结构，并统一放进以项目名命名的根目录
      const relativePath = object.key.slice(projectPath.length + 1)
      files[`${projectName}/${relativePath}`] = new Uint8Array(await body.arrayBuffer())
    }

    if (Object.keys(files).length === 0) {
      return notFound('项目文件不存在')
    }

    // level: 0 为仅存储模式，避免在 Worker 里做压缩消耗 CPU
    const zip = zipSync(files, { level: 0 })
    const zipName = `${projectName}.zip`

    return new Response(zip, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': String(zip.byteLength),
        'Content-Disposition': buildContentDisposition(zipName),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Error downloading project:', err)
    return serverError('项目下载失败')
  }
}

/**
 * 上传文件
 */
export async function uploadFile(request: Request, env: Env): Promise<Response> {
  // 验证认证
  if (!(await verifyAuth(request, env))) {
    return unauthorized()
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const rawCategory = formData.get('category')
    const projectName = formData.get('projectName') as string | null

    if (!file) {
      return badRequest('未提供文件')
    }

    // 规范化并校验分类名称（未提供时沿用默认分类）
    const category = rawCategory ? resolveCategoryName(rawCategory) : '未分类'
    if (!category) {
      return badRequest('分类名称不合法')
    }

    // 验证文件类型
    const fileName = file.name
    if (!isSupportedFile(fileName)) {
      return badRequest('不支持的文件类型，支持: HTML, JS, CSS, JSON, Markdown, 图片, 字体文件')
    }

    // 生成存储路径
    // HTML 文件：如果提供了 projectName，作为目录项目存储 index.html
    // 其他文件（包括 JSON）：直接以原文件名存储
    let key: string
    if (isHtmlFile(fileName) && projectName) {
      key = `html-files/${category}/${projectName}/index.html`
    } else if (projectName) {
      // 非 HTML 文件带项目名，存储到项目目录下
      key = `html-files/${category}/${projectName}/${file.name}`
    } else {
      // 无项目名，直接存储
      key = `html-files/${category}/${file.name}`
    }

    // 上传到 R2
    await env.HTML_FILES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || getMimeType(fileName),
      },
      customMetadata: {
        category,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    })

    // 更新索引
    await updateFileIndex(env)

    return success({ key, category, projectName: projectName || file.name })
  } catch (err) {
    console.error('Error uploading file:', err)
    return serverError('文件上传失败')
  }
}

/**
 * 获取文件的 MIME 类型
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const mimeTypes: Record<string, string> = {
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    md: 'text/markdown; charset=utf-8',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * 上传多个文件（用于包含 HTML/JS/CSS 的项目）
 */
export async function uploadMultipleFiles(request: Request, env: Env): Promise<Response> {
  // 验证认证
  if (!(await verifyAuth(request, env))) {
    return unauthorized()
  }

  try {
    const formData = await request.formData()
    const rawCategory = formData.get('category')
    const projectName = formData.get('projectName') as string | null

    if (!projectName) {
      return badRequest('多文件上传必须提供项目名称')
    }

    // 规范化并校验分类名称（未提供时沿用默认分类）
    const category = rawCategory ? resolveCategoryName(rawCategory) : '未分类'
    if (!category) {
      return badRequest('分类名称不合法')
    }

    // 获取所有文件和对应的路径
    const files = formData.getAll('files') as unknown as File[]
    const paths = formData.getAll('paths') as string[]

    if (files.length === 0) {
      return badRequest('未提供文件')
    }

    // 检查是否有 index.html 或 .html 文件
    const hasHtml = files.some((f) => {
      const name = f.name.toLowerCase()
      return name.endsWith('.html') || name.endsWith('.htm')
    })

    if (!hasHtml) {
      return badRequest('项目必须包含至少一个 HTML 文件')
    }

    // 上传所有文件
    const uploadedKeys: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const relativePath = paths[i] || file.name

      // 生成存储路径: html-files/{category}/{projectName}/{relativePath}
      const key = `html-files/${category}/${projectName}/${relativePath}`

      await env.HTML_FILES.put(key, file.stream(), {
        httpMetadata: {
          contentType: getMimeType(file.name),
        },
        customMetadata: {
          category,
          projectName,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      })

      uploadedKeys.push(key)
    }

    // 更新索引
    await updateFileIndex(env)

    return success({
      category,
      projectName,
      filesUploaded: files.length,
      keys: uploadedKeys,
    })
  } catch (err) {
    console.error('Error uploading multiple files:', err)
    return serverError('文件上传失败')
  }
}

/**
 * 删除文件
 */
export async function deleteFile(request: Request, env: Env): Promise<Response> {
  // 验证认证
  if (!(await verifyAuth(request, env))) {
    return unauthorized()
  }

  try {
    const url = new URL(request.url)
    const key = url.searchParams.get('key')

    if (!key) {
      return badRequest('未提供文件路径')
    }

    // 验证路径安全性
    if (!key.startsWith('html-files/')) {
      return badRequest('无效的文件路径')
    }

    // 目录项目删除整个目录，单文件项目删除该文件
    // 使用严格的 key 匹配（而非裸前缀），避免误删同前缀的兄弟项目（如 demo 与 demo2）
    const objects = await listProjectObjects(env, key)

    if (objects.length === 0) {
      return notFound('文件不存在')
    }

    await deleteKeys(
      env,
      objects.map((object) => object.key),
    )

    // 更新索引
    await updateFileIndex(env)

    return success({ deleted: key, deletedCount: objects.length })
  } catch (err) {
    console.error('Error deleting file:', err)
    return serverError('文件删除失败')
  }
}

/**
 * 刷新文件索引
 */
export async function refreshIndex(request: Request, env: Env): Promise<Response> {
  // 验证认证
  if (!(await verifyAuth(request, env))) {
    return unauthorized()
  }

  try {
    const index = await updateFileIndex(env)
    return success(index)
  } catch (err) {
    console.error('Error refreshing index:', err)
    return serverError('刷新索引失败')
  }
}

/**
 * 获取文件内容 (用于前端预览 R2 中的文件)
 */
export async function getFileContent(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const key = url.searchParams.get('key')

  if (!key) {
    return badRequest('未提供文件路径')
  }

  // 验证路径安全性
  if (!key.startsWith('html-files/')) {
    return badRequest('无效的文件路径')
  }

  try {
    const object = await env.HTML_FILES.get(key)

    if (!object) {
      return json({ success: false, error: '文件不存在' }, 404)
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('Error getting file content:', err)
    return serverError('获取文件内容失败')
  }
}

/**
 * 直接通过路径提供 R2 文件（支持相对路径资源加载）
 * 路径格式: html-files/{category}/{project}/{filename}
 */
export async function serveR2File(key: string, env: Env): Promise<Response> {
  // 验证路径安全性
  if (!key.startsWith('html-files/')) {
    return badRequest('无效的文件路径')
  }

  // 解码 URL 编码的路径（处理中文等）
  const decodedKey = decodeURIComponent(key)

  try {
    const object = await env.HTML_FILES.get(decodedKey)

    if (!object) {
      return json({ success: false, error: '文件不存在' }, 404)
    }

    // 根据文件扩展名确定 MIME 类型
    const contentType =
      object.httpMetadata?.contentType || getMimeType(decodedKey.split('/').pop() || '')

    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        // CORS 头，允许跨域访问资源
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (err) {
    console.error('Error serving R2 file:', err)
    return serverError('获取文件失败')
  }
}

/**
 * 项目文件信息接口
 */
interface ProjectFileInfo {
  name: string
  key: string
  size: number
  type: string
  modifiedAt: string
}

/**
 * 获取项目的文件列表
 * 用于编辑项目时展示所有文件
 */
export async function listProjectFiles(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const projectPath = url.searchParams.get('path')

  if (!projectPath) {
    return badRequest('未提供项目路径')
  }

  // 验证路径安全性
  if (!projectPath.startsWith('html-files/')) {
    return badRequest('无效的项目路径')
  }

  try {
    const files: ProjectFileInfo[] = []

    // 列出项目目录下所有文件
    let cursor: string | undefined
    do {
      const listed = await env.HTML_FILES.list({
        prefix: projectPath.endsWith('/') ? projectPath : projectPath + '/',
        cursor,
      })

      for (const object of listed.objects) {
        // 计算相对于项目根目录的路径
        const relativePath = object.key.slice(projectPath.endsWith('/') ? projectPath.length : projectPath.length + 1)
        files.push({
          name: relativePath,
          key: object.key,
          size: object.size,
          type: getMimeType(relativePath.split('/').pop() || ''),
          modifiedAt: object.uploaded.toISOString(),
        })
      }

      cursor = listed.truncated ? listed.cursor : undefined
    } while (cursor)

    // 如果没有找到文件，可能是单文件项目
    if (files.length === 0) {
      const object = await env.HTML_FILES.head(projectPath)
      if (object) {
        const fileName = projectPath.split('/').pop() || ''
        files.push({
          name: fileName,
          key: projectPath,
          size: object.size,
          type: getMimeType(fileName),
          modifiedAt: object.uploaded.toISOString(),
        })
      }
    }

    return json({
      success: true,
      projectPath,
      files,
    })
  } catch (err) {
    console.error('Error listing project files:', err)
    return serverError('获取项目文件列表失败')
  }
}

/**
 * 删除项目内的单个文件
 */
export async function deleteProjectFile(request: Request, env: Env): Promise<Response> {
  // 验证认证
  if (!(await verifyAuth(request, env))) {
    return unauthorized()
  }

  const url = new URL(request.url)
  const key = url.searchParams.get('key')

  if (!key) {
    return badRequest('未提供文件路径')
  }

  // 验证路径安全性
  if (!key.startsWith('html-files/')) {
    return badRequest('无效的文件路径')
  }

  // 解码路径
  const decodedKey = decodeURIComponent(key)

  try {
    // 检查文件是否存在
    const existing = await env.HTML_FILES.head(decodedKey)
    if (!existing) {
      return json({ success: false, error: '文件不存在' }, 404)
    }

    // 删除文件
    await env.HTML_FILES.delete(decodedKey)

    return success({
      deleted: decodedKey,
      name: decodedKey.split('/').pop() || '',
    })
  } catch (err) {
    console.error('Error deleting project file:', err)
    return serverError('删除文件失败')
  }
}

/**
 * 向项目添加文件
 */
export async function addProjectFile(request: Request, env: Env): Promise<Response> {
  // 验证认证
  if (!(await verifyAuth(request, env))) {
    return unauthorized()
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectPath = formData.get('projectPath') as string | null

    if (!file) {
      return badRequest('未提供文件')
    }

    if (!projectPath) {
      return badRequest('未提供项目路径')
    }

    // 验证项目路径安全性
    if (!projectPath.startsWith('html-files/')) {
      return badRequest('无效的项目路径')
    }

    // 验证文件类型
    const fileName = file.name
    if (!isSupportedFile(fileName)) {
      return badRequest('不支持的文件类型')
    }

    // 获取相对路径并处理 (如果是从文件夹上传的)
    const relativePath = (formData.get('path') as string) || file.name

    // 生成存储路径: {projectPath}/{relativePath}
    const key = projectPath.endsWith('/')
      ? `${projectPath}${relativePath}`
      : `${projectPath}/${relativePath}`

    // 上传到 R2
    await env.HTML_FILES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || getMimeType(fileName),
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    })

    return success({
      key,
      name: file.name,
      size: file.size,
      type: getMimeType(fileName),
    })
  } catch (err) {
    console.error('Error adding project file:', err)
    return serverError('添加文件失败')
  }
}

/**
 * 向项目添加多个文件 (支持文件夹结构)
 */
export async function addProjectFiles(request: Request, env: Env): Promise<Response> {
  // 验证认证
  if (!(await verifyAuth(request, env))) {
    return unauthorized()
  }

  try {
    const formData = await request.formData()
    const projectPath = formData.get('projectPath') as string | null
    const files = formData.getAll('files') as unknown as File[]
    const paths = formData.getAll('paths') as string[]

    if (!projectPath) {
      return badRequest('未提供项目路径')
    }

    if (files.length === 0) {
      return badRequest('未提供文件')
    }

    // 验证项目路径安全性
    if (!projectPath.startsWith('html-files/')) {
      return badRequest('无效的项目路径')
    }

    // 上传所有文件
    const uploadedKeys: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const relativePath = paths[i] || file.name

      // 生成存储路径: {projectPath}/{relativePath}
      const key = projectPath.endsWith('/')
        ? `${projectPath}${relativePath}`
        : `${projectPath}/${relativePath}`

      await env.HTML_FILES.put(key, file.stream(), {
        httpMetadata: {
          contentType: getMimeType(file.name),
        },
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      })

      uploadedKeys.push(key)
    }

    return success({
      projectPath,
      filesUploaded: files.length,
      keys: uploadedKeys,
    })
  } catch (err) {
    console.error('Error adding multiple project files:', err)
    return serverError('添加文件失败')
  }
}

/**
 * 修改项目所属分类
 *
 * 分类完全由 R2 key 的第二段推导，没有独立元数据，所以「改分类」这个动作
 * 在存储层就是：把项目下的对象整体复制到新分类前缀，再删除旧前缀。
 * R2 没有服务端 copy / rename，只能逐个 get + put。
 *
 * 采用「先全量复制、再删除」，保证任何时刻至少存在一份完整数据；
 * 复制阶段失败会回滚已写入的目标对象，使操作可以安全重试。
 */
export async function moveProjectCategory(request: Request, env: Env): Promise<Response> {
  // 验证认证
  if (!(await verifyAuth(request, env))) {
    return unauthorized()
  }

  let body: { path?: unknown; newCategory?: unknown }
  try {
    body = (await request.json()) as { path?: unknown; newCategory?: unknown }
  } catch {
    return badRequest('请求格式错误')
  }

  const projectPath = typeof body.path === 'string' ? body.path.trim() : ''
  const newCategory = resolveCategoryName(body.newCategory)

  if (!projectPath.startsWith('html-files/')) {
    return badRequest('无效的项目路径')
  }
  if (!newCategory) {
    return badRequest('分类名称不合法')
  }

  // 从 html-files/{旧分类}/{项目后缀} 推导目标路径
  const [, oldCategory, ...suffixSegments] = projectPath.split('/')
  if (
    !oldCategory ||
    suffixSegments.length === 0 ||
    suffixSegments.some((segment) => segment === '')
  ) {
    return badRequest('无效的项目路径')
  }

  const targetPath = `html-files/${newCategory}/${suffixSegments.join('/')}`

  if (oldCategory === newCategory) {
    return badRequest('分类未发生变化')
  }

  try {
    // 1. 收集源对象（严格匹配，避免误伤 demo2 这类同前缀项目）
    const sourceObjects = await listProjectObjects(env, projectPath)
    if (sourceObjects.length === 0) {
      return notFound('项目不存在')
    }

    // 2. 目标冲突检测
    //    必须拦住：否则前端的 name + category 去重会让迁移后的项目在列表里静默消失
    const conflictObjects = await listProjectObjects(env, targetPath)
    if (conflictObjects.length > 0) {
      return error('目标分类下已存在同名项目', 409)
    }

    // 3. 全量复制（流式透传，不把文件读进内存）
    const copiedKeys: string[] = []
    try {
      for (const source of sourceObjects) {
        const object = await env.HTML_FILES.get(source.key)
        if (!object) {
          throw new Error(`源对象读取失败: ${source.key}`)
        }

        // 目标 key = 目标项目路径 + 相对项目根目录的剩余部分
        // 目录项目: .../demo + /assets/a.css ；单文件项目: .../demo.html + ''
        const newKey = targetPath + source.key.slice(projectPath.length)

        await env.HTML_FILES.put(newKey, object.body, {
          httpMetadata: object.httpMetadata,
          customMetadata: { ...object.customMetadata, category: newCategory },
        })
        copiedKeys.push(newKey)
      }
    } catch (err) {
      // 复制阶段失败：源项目完好，回滚已写入的目标对象，保证可以干净重试
      console.error('Error copying project objects:', err)

      let rollbackFailed = false
      if (copiedKeys.length > 0) {
        try {
          await deleteKeys(env, copiedKeys)
        } catch (rollbackErr) {
          rollbackFailed = true
          console.error('Error rolling back copied objects:', rollbackErr)
        }
      }

      return serverError(
        rollbackFailed
          ? '迁移失败，且回滚未完成，新分类下可能残留部分文件，请检查后重试'
          : '迁移失败，原项目保持不变，请重试',
      )
    }

    // 4. 复制全部成功后再删除源对象
    try {
      await deleteKeys(
        env,
        sourceObjects.map((object) => object.key),
      )
    } catch (err) {
      console.error('Error deleting source objects:', err)
      await updateFileIndex(env).catch(() => {})
      return serverError('文件已复制到新分类，但旧文件清理失败，请刷新后检查是否有重复项目')
    }

    // 5. 重建索引缓存
    const index = await updateFileIndex(env)
    const project = index.projects.find((item) => item.path === targetPath) || null

    return success({
      oldPath: projectPath,
      newPath: targetPath,
      oldCategory,
      newCategory,
      movedObjects: copiedKeys.length,
      // 顺带把新的项目对象返回给前端：改分类后 id/path/indexPath 全变了，
      // 前端据此重新指向，避免依赖可能滞后的 KV 索引读取
      project,
    })
  } catch (err) {
    console.error('Error moving project category:', err)
    return serverError('修改分类失败')
  }
}
