import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('fflate', () => ({
  zipSync: vi.fn(() => new Uint8Array()),
}))

import {
  serveR2File,
  deleteProjectFile,
  addProjectFile,
} from '../../../workers/src/routes/files'
import type { Env, ProjectIndexData } from '../../../workers/src/types'

interface StoredObject {
  body: string
  contentType: string
  httpEtag: string
  uploaded: Date
}

function createMockEnv(initialFiles: Record<string, StoredObject> = {}): {
  env: Env
  files: Map<string, StoredObject>
  kv: Map<string, string>
} {
  const files = new Map<string, StoredObject>(Object.entries(initialFiles))
  const kv = new Map<string, string>()
  kv.set('token:valid-token', JSON.stringify({ expiresAt: new Date(Date.now() + 60_000).toISOString() }))

  const env = {
    ADMIN_PASSWORD: 'test-password',
    AUTH_SECRET: 'test-secret',
    HTML_FILES: {
      async get(key: string) {
        const entry = files.get(key)
        if (!entry) return null
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(entry.body))
            controller.close()
          },
        })
        return {
          key,
          size: entry.body.length,
          httpEtag: entry.httpEtag,
          uploaded: entry.uploaded,
          httpMetadata: { contentType: entry.contentType },
          body: stream,
        }
      },
      async head(key: string) {
        const entry = files.get(key)
        if (!entry) return null
        return {
          key,
          size: entry.body.length,
          httpEtag: entry.httpEtag,
          uploaded: entry.uploaded,
          httpMetadata: { contentType: entry.contentType },
        }
      },
      async put(key: string, value: ReadableStream | string, opts?: { httpMetadata?: { contentType?: string } }) {
        let bodyText = ''
        if (typeof value === 'string') {
          bodyText = value
        } else {
          const reader = value.getReader()
          const chunks: Uint8Array[] = []
          while (true) {
            const { done, value: chunk } = await reader.read()
            if (done) break
            if (chunk) chunks.push(chunk)
          }
          const merged = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0))
          let offset = 0
          for (const c of chunks) {
            merged.set(c, offset)
            offset += c.length
          }
          bodyText = new TextDecoder().decode(merged)
        }
        files.set(key, {
          body: bodyText,
          contentType: opts?.httpMetadata?.contentType || 'text/html',
          httpEtag: `"etag-${Date.now()}-${Math.random()}"`,
          uploaded: new Date(),
        })
      },
      async delete(key: string | string[]) {
        if (Array.isArray(key)) {
          key.forEach((k) => files.delete(k))
        } else {
          files.delete(key)
        }
      },
      async list(opts?: { prefix?: string }) {
        const prefix = opts?.prefix || ''
        const objects = Array.from(files.entries())
          .filter(([k]) => k.startsWith(prefix))
          .map(([k, entry]) => ({
            key: k,
            size: entry.body.length,
            httpEtag: entry.httpEtag,
            uploaded: entry.uploaded,
          }))
        return { objects, truncated: false }
      },
    } as unknown as R2Bucket,
    FILE_INDEX: {
      async get(key: string, type?: string) {
        const val = kv.get(key) ?? null
        if (val && type === 'json') return JSON.parse(val)
        return val
      },
      async put(key: string, value: string) {
        kv.set(key, value)
      },
      async delete(key: string) {
        kv.delete(key)
      },
    } as unknown as KVNamespace,
  } satisfies Env

  return { env, files, kv }
}

describe('workers files route cache & index behavior', () => {
  const indexKey = 'html-files/工具/demo/index.html'

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('serves public /r2/ files with Cache-Control: no-cache and ETag, and supports 304 + 404 no-store', async () => {
    const { env, files } = createMockEnv({
      [indexKey]: {
        body: '<h1>v1</h1>',
        contentType: 'text/html',
        httpEtag: '"v1-etag"',
        uploaded: new Date('2026-01-01T00:00:00Z'),
      },
    })

    // 1. 首次请求返回 v1 与 no-cache + ETag
    const res1 = await serveR2File(new Request(`https://api.test/r2/${indexKey}`), indexKey, env)
    expect(res1.status).toBe(200)
    expect(res1.headers.get('Cache-Control')).toBe('no-cache')
    expect(res1.headers.get('ETag')).toBe('"v1-etag"')
    expect(await res1.text()).toBe('<h1>v1</h1>')

    // 2. 带相同 ETag 条件请求返回 304
    const res304 = await serveR2File(
      new Request(`https://api.test/r2/${indexKey}`, {
        headers: { 'If-None-Match': '"v1-etag"' },
      }),
      indexKey,
      env,
    )
    expect(res304.status).toBe(304)
    expect(res304.headers.get('Cache-Control')).toBe('no-cache')

    // 3. 删除后即使带旧 If-None-Match 也必须返回 404 且禁止缓存
    files.delete(indexKey)
    const res404 = await serveR2File(
      new Request(`https://api.test/r2/${indexKey}`, {
        headers: { 'If-None-Match': '"v1-etag"' },
      }),
      indexKey,
      env,
    )
    expect(res404.status).toBe(404)
    expect(res404.headers.get('Cache-Control')).toBe('no-store')
  })

  it('rebuilds FILE_INDEX on deleteProjectFile and addProjectFile', async () => {
    const { env, kv } = createMockEnv({
      [indexKey]: {
        body: '<h1>v1</h1>',
        contentType: 'text/html',
        httpEtag: '"v1-etag"',
        uploaded: new Date('2026-01-01T00:00:00Z'),
      },
      'html-files/工具/demo/sub.html': {
        body: '<h1>sub</h1>',
        contentType: 'text/html',
        httpEtag: '"sub-etag"',
        uploaded: new Date('2026-01-01T00:00:00Z'),
      },
    })

    // 删除 index.html 后，索引入口应切换为 sub.html
    const delReq = new Request(
      `https://api.test/api/project/file?key=${encodeURIComponent(indexKey)}`,
      {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      },
    )
    const delRes = await deleteProjectFile(delReq, env)
    expect(delRes.status).toBe(200)

    const afterDeleteIndex = JSON.parse(kv.get('index') || '{}') as ProjectIndexData
    expect(afterDeleteIndex.projects[0]?.indexPath).toBe('html-files/工具/demo/sub.html')

    // 重新上传 index.html 后，索引入口应恢复为 index.html
    const formData = new FormData()
    formData.append('projectPath', 'html-files/工具/demo')
    formData.append('path', 'index.html')
    formData.append('file', new File(['<h1>v2</h1>'], 'index.html', { type: 'text/html' }))

    const addReq = new Request('https://api.test/api/project/file', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: formData,
    })
    const addRes = await addProjectFile(addReq, env)
    expect(addRes.status).toBe(200)

    const afterAddIndex = JSON.parse(kv.get('index') || '{}') as ProjectIndexData
    expect(afterAddIndex.projects[0]?.indexPath).toBe(indexKey)

    // 再次请求 /r2/ 必须返回新内容 v2
    const resV2 = await serveR2File(
      new Request(`https://api.test/r2/${indexKey}`, {
        headers: { 'If-None-Match': '"v1-etag"' },
      }),
      indexKey,
      env,
    )
    expect(resV2.status).toBe(200)
    expect(await resV2.text()).toBe('<h1>v2</h1>')
  })
})
