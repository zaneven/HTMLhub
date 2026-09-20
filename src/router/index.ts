import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: {
      title: 'HTML Manager - 登录',
      public: true, // 不需要登录
    },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: {
      title: 'HTML Manager - 首页',
    },
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/SearchView.vue'),
    meta: {
      title: 'HTML Manager - 搜索',
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: {
      title: 'HTML Manager - 设置',
    },
  },
  {
    path: '/category/:categoryPath*',
    name: 'category',
    component: () => import('../views/CategoryView.vue'),
    meta: {
      title: 'HTML Manager - 分类浏览',
    },
  },
  {
    path: '/file/:fileId',
    name: 'file',
    component: () => import('../views/FileDetailView.vue'),
    meta: {
      title: 'HTML Manager - 文件详情',
    },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
    meta: {
      title: 'HTML Manager - 管理后台',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      title: 'HTML Manager - 页面未找到',
      public: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

/**
 * Token 本地过期时间缓存（避免每次导航都请求远程验证）
 */
let tokenCacheValid = false
let tokenCacheTimestamp = 0
const TOKEN_CACHE_TTL = 60_000 // 本地缓存 60 秒

/**
 * 验证 token 是否有效
 */
async function validateToken(token: string): Promise<boolean> {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) return false

  // 本地缓存未过期，跳过远程验证
  const now = Date.now()
  if (tokenCacheValid && now - tokenCacheTimestamp < TOKEN_CACHE_TTL) {
    return true
  }

  try {
    const response = await fetch(`${apiUrl}/api/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      localStorage.removeItem('auth_token')
      tokenCacheValid = false
      return false
    }

    tokenCacheValid = response.ok
    tokenCacheTimestamp = now
    return response.ok
  } catch {
    // 网络错误时保持缓存状态
    return tokenCacheValid || true
  }
}

// 路由守卫 - 全局登录验证
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }

  const apiUrl = import.meta.env.VITE_API_URL

  // 静态模式不需要登录
  if (!apiUrl) {
    next()
    return
  }

  // 公开页面不需要登录验证
  if (to.meta?.public) {
    next()
    return
  }

  // 云端模式：检查登录状态
  const token = localStorage.getItem('auth_token')

  if (!token) {
    // 未登录，跳转登录页
    tokenCacheValid = false
    next({ name: 'login' })
    return
  }

  // 验证 token 有效性
  const isValid = await validateToken(token)
  if (!isValid) {
    next({ name: 'login' })
    return
  }

  next()
})

export default router
