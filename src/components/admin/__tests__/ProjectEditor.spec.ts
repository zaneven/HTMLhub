// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ProjectEditor from '../ProjectEditor.vue'
import type { ProjectInfo } from '@/types'

const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}

const mockProject: ProjectInfo = {
  id: 'proj-1',
  name: 'demo',
  category: '工具',
  path: 'html-files/工具/demo',
  indexPath: 'html-files/工具/demo/index.html',
  type: 'directory',
  source: 'cloud',
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: '2026-01-01T00:00:00Z',
}

let currentFiles = [
  {
    name: 'index.html',
    key: 'html-files/工具/demo/index.html',
    size: 100,
    type: 'text/html',
    modifiedAt: '2026-01-01T00:00:00Z',
  },
]

const mockFilesStore = {
  projects: [mockProject] as ProjectInfo[],
  categories: [{ id: 'c1', name: '工具', projectCount: 1 }],
  selectedCategory: '',
  downloadingPath: null as string | null,
  error: null as string | null,
  getFileUrl: (p: ProjectInfo) => `https://api.test/r2/${p.indexPath}`,
  getProjectFileUrl: (k: string) => `https://api.test/r2/${k}`,
  listProjectFiles: vi.fn(async () => [...currentFiles]),
  deleteProjectFile: vi.fn(async (fileKey: string) => {
    currentFiles = currentFiles.filter((f) => f.key !== fileKey)
    mockFilesStore.projects = []
    return true
  }),
  addProjectFile: vi.fn(async (file: File, projectPath: string, relativePath?: string) => {
    const rel = relativePath || file.name
    currentFiles = [
      ...currentFiles,
      {
        name: rel,
        key: `${projectPath}/${rel}`,
        size: file.size,
        type: 'text/html',
        modifiedAt: new Date().toISOString(),
      },
    ]
    mockFilesStore.projects = [mockProject]
    return true
  }),
  getProjectsByCategory: () => mockFilesStore.projects,
  setSelectedCategory: vi.fn(),
  updateProjectCategory: vi.fn(),
  downloadProject: vi.fn(),
}

vi.mock('@/stores/files', () => ({
  useFilesStore: () => mockFilesStore,
}))

vi.mock('@/stores/share', () => ({
  useShareStore: () => ({
    revision: 0,
    buildPreviewUrl: vi.fn(async (p: ProjectInfo) => `https://api.test/r2/${p.indexPath}?k=tok`),
    open: vi.fn(),
  }),
}))

vi.mock('naive-ui', async () => {
  const stub = (name: string) =>
    defineComponent({
      name,
      setup(_, { slots, attrs }) {
        return () => h('div', attrs, [slots.trigger?.(), slots.default?.()])
      },
    })
  const NPopconfirm = defineComponent({
    name: 'NPopconfirm',
    emits: ['positiveClick'],
    setup(_, { slots, emit }) {
      return () =>
        h('div', { class: 'mock-popconfirm' }, [
          slots.trigger?.(),
          h('button', { class: 'mock-confirm-delete', onClick: () => emit('positiveClick') }, 'confirm'),
        ])
    },
  })
  return {
    NIcon: stub('NIcon'),
    NButton: defineComponent({
      name: 'NButton',
      props: { disabled: Boolean, loading: Boolean, size: String, type: String, secondary: Boolean, quaternary: Boolean, circle: Boolean },
      emits: ['click'],
      setup(props, { slots, attrs, emit }) {
        return () => h('button', { ...attrs, disabled: props.disabled, onClick: (e: Event) => emit('click', e) }, [slots.icon?.(), slots.default?.()])
      },
    }),
    NSpace: stub('NSpace'),
    NSpin: stub('NSpin'),
    NEmpty: stub('NEmpty'),
    NTag: stub('NTag'),
    NPopconfirm,
    NUpload: defineComponent({
      name: 'NUpload',
      props: { customRequest: Function },
      setup(_, { slots, attrs }) {
        return () => h('div', attrs, [slots.default?.()])
      },
    }),
    NUploadDragger: stub('NUploadDragger'),
    NInput: stub('NInput'),
    NSelect: stub('NSelect'),
    NTooltip: stub('NTooltip'),
    NModal: stub('NModal'),
    useMessage: () => mockMessage,
  }
})

describe('ProjectEditor preview lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentFiles = [
      {
        name: 'index.html',
        key: 'html-files/工具/demo/index.html',
        size: 100,
        type: 'text/html',
        modifiedAt: '2026-01-01T00:00:00Z',
      },
    ]
    mockFilesStore.projects = [mockProject]
    mockFilesStore.error = null
    globalThis.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver
  })

  it('hides iframe when index.html is deleted and restores with new cache-buster on re-upload', async () => {
    const wrapper = mount(ProjectEditor, {
      props: { project: mockProject },
    })

    await flushPromises()

    const initialIframe = wrapper.find('iframe.fullscreen-live-iframe')
    expect(initialIframe.exists()).toBe(true)
    const initialSrc = initialIframe.attributes('src') || ''
    expect(initialSrc).toContain('https://api.test/r2/html-files/工具/demo/index.html?_t=')

    // 删除 index.html
    await wrapper.find('.mock-confirm-delete').trigger('click')
    await flushPromises()

    expect(wrapper.find('iframe.fullscreen-live-iframe').exists()).toBe(false)
    expect(wrapper.find('.preview-missing-entry').exists()).toBe(true)

    // 模拟重新上传 index.html
    const uploadComp = wrapper.findComponent({ name: 'NUpload' })
    const customRequest = uploadComp.props('customRequest') as (opts: unknown) => Promise<void>
    await new Promise((r) => setTimeout(r, 5))
    await customRequest({
      file: {
        file: new File(['<h1>new</h1>'], 'index.html', { type: 'text/html' }),
      },
    })
    await flushPromises()

    const restoredIframe = wrapper.find('iframe.fullscreen-live-iframe')
    expect(restoredIframe.exists()).toBe(true)
    const restoredSrc = restoredIframe.attributes('src') || ''
    expect(restoredSrc).toContain('https://api.test/r2/html-files/工具/demo/index.html?_t=')
    expect(restoredSrc).not.toBe(initialSrc)
  })
})
