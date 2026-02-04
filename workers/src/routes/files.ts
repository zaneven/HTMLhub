import type { Env, ProjectInfo, CategoryInfo, ProjectIndexData } from '../types'
import { json, success, unauthorized, badRequest, serverError } from '../utils/response'
import { verifyAuth } from '../utils/auth'

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
      const fileName = parts[parts.length - 1]

      // 只处理 HTML 文件
      if (!fileName.endsWith('.html') && !fileName.endsWith('.htm')) continue

      // 判断是目录项目还是单文件项目
      const isDirectory = parts.length === 4 && fileName === 'index.html'
      const projectName = isDirectory ? parts[2] : fileName.replace(/\.(html|htm)$/, '')
      const projectPath = isDirectory ? parts.slice(0, 3).join('/') : object.key

      // 避免重复添加同一个目录项目
      const projectId = toBase64(projectPath)
      if (projects.some((p) => p.id === projectId)) continue

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
    const category = (formData.get('category') as string) || '未分类'
    const projectName = formData.get('projectName') as string | null

    if (!file) {
      return badRequest('未提供文件')
    }

    // 验证文件类型
    const fileName = file.name
    if (!isSupportedFile(fileName)) {
      return badRequest('不支持的文件类型，支持: HTML, JS, CSS, JSON, 图片, 字体文件')
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
    const category = (formData.get('category') as string) || '未分类'
    const projectName = formData.get('projectName') as string | null

    if (!projectName) {
      return badRequest('多文件上传必须提供项目名称')
    }

    // 获取所有文件
    const files = formData.getAll('files') as unknown as File[]

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
    for (const file of files) {
      // 生成存储路径: html-files/{category}/{projectName}/{filename}
      const key = `html-files/${category}/${projectName}/${file.name}`

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

    // 如果是目录项目，需要删除整个目录
    const listed = await env.HTML_FILES.list({ prefix: key })

    if (listed.objects.length === 0) {
      // 尝试作为单个文件删除
      await env.HTML_FILES.delete(key)
    } else {
      // 删除目录下所有文件
      for (const object of listed.objects) {
        await env.HTML_FILES.delete(object.key)
      }
    }

    // 更新索引
    await updateFileIndex(env)

    return success({ deleted: key })
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
        const fileName = object.key.split('/').pop() || ''
        files.push({
          name: fileName,
          key: object.key,
          size: object.size,
          type: getMimeType(fileName),
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

    // 生成存储路径: {projectPath}/{filename}
    const key = projectPath.endsWith('/')
      ? `${projectPath}${file.name}`
      : `${projectPath}/${file.name}`

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
