import { marked } from 'marked'
import DOMPurify from 'dompurify'

export interface RenderMarkdownOptions {
  /** 当前 Markdown 文件的访问地址，用于解析相对图片与链接 */
  baseUrl?: string
}

/**
 * 解析 Markdown 中的相对地址
 *
 * 绝对 URL、协议相对地址与页内锚点保持原样，其余按 Markdown 文件所在位置解析，
 * 这样 README 里的 ./screenshot.png 能正确指向项目内的图片。
 */
function resolveUrl(url: string, baseUrl: string): string {
  if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) return url

  try {
    return new URL(url, baseUrl).toString()
  } catch {
    return url
  }
}

/**
 * 将 Markdown 渲染为安全的 HTML
 *
 * - 使用 marked 支持 GFM（表格、任务列表等）
 * - 使用 DOMPurify 清洗内容，避免 README 中的脚本注入到宿主页面
 * - 相对链接与图片按 README 地址补全，外链统一新窗口打开
 */
export function renderMarkdown(source: string, options: RenderMarkdownOptions = {}): string {
  if (!source.trim()) return ''

  const rawHtml = marked.parse(source, {
    async: false,
    gfm: true,
    breaks: false,
  }) as string

  const container = document.createElement('div')
  container.innerHTML = rawHtml

  if (options.baseUrl) {
    const baseUrl = options.baseUrl

    container.querySelectorAll<HTMLImageElement>('img[src]').forEach((image) => {
      image.setAttribute('src', resolveUrl(image.getAttribute('src') || '', baseUrl))
      image.setAttribute('loading', 'lazy')
    })

    container.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
      link.setAttribute('href', resolveUrl(link.getAttribute('href') || '', baseUrl))
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')
    })
  }

  return DOMPurify.sanitize(container.innerHTML, {
    ADD_ATTR: ['target', 'loading'],
  })
}
