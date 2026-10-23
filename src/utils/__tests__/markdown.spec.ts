// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../markdown'

describe('renderMarkdown', () => {
  it('渲染基础 Markdown 结构', () => {
    const html = renderMarkdown('# 项目简介\n\n- 第一项\n- 第二项')

    expect(html).toContain('<h1')
    expect(html).toContain('项目简介')
    expect(html).toContain('<li>第一项</li>')
  })

  it('按 README 地址解析相对图片与链接', () => {
    const html = renderMarkdown('![logo](./logo.png)\n\n[文档](./docs/guide.html)', {
      baseUrl: 'https://api.example.com/r2/html-files/分类/演示/README.md',
    })

    const decodedHtml = decodeURIComponent(html)

    expect(decodedHtml).toContain(
      'src="https://api.example.com/r2/html-files/分类/演示/logo.png"',
    )
    expect(decodedHtml).toContain(
      'href="https://api.example.com/r2/html-files/分类/演示/docs/guide.html"',
    )
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('保留绝对链接并清洗危险内容', () => {
    const html = renderMarkdown(
      '[官网](https://example.com)\n\n<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">',
      { baseUrl: 'https://api.example.com/r2/html-files/分类/演示/README.md' },
    )

    expect(html).toContain('href="https://example.com"')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
  })
})
