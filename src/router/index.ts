import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
      requiresAuth: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      title: 'HTML Manager - 页面未找到',
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
 * 验证 token 是否有效
 */
async function validateToken(token: string): Promise<boolean> {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) return false

  try {
    const response = await fetch(`${apiUrl}/api/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      // Token 过期，清除
      localStorage.removeItem('auth_token')
      return false
    }

    return response.ok
  } catch {
    // 网络错误时保持登录状态
    return true
  }
}

// 路由守卫 - 设置页面标题和权限检查
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }

  // 权限检查（仅在云端模式下检查）
  if (to.meta?.requiresAuth) {
    const token = localStorage.getItem('auth_token')
    const apiUrl = import.meta.env.VITE_API_URL

    // 如果是云端模式
    if (apiUrl) {
      // 未登录，重定向到首页
      if (!token) {
        next({ name: 'home' })
        return
      }

      // 验证 token 有效性
      const isValid = await validateToken(token)
      if (!isValid) {
        next({ name: 'home' })
        return
      }
    }
  }

  next()
})

export default router
