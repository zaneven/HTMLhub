import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: {
      title: 'HTML Viewer - 首页'
    }
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/SearchView.vue'),
    meta: {
      title: 'HTML Viewer - 搜索'
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: {
      title: 'HTML Viewer - 设置'
    }
  },
  {
    path: '/category/:categoryPath*',
    name: 'category',
    component: () => import('../views/CategoryView.vue'),
    meta: {
      title: 'HTML Viewer - 分类浏览'
    }
  },
  {
    path: '/file/:fileId',
    name: 'file',
    component: () => import('../views/FileDetailView.vue'),
    meta: {
      title: 'HTML Viewer - 文件详情'
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
    meta: {
      title: 'HTML Viewer - 管理后台',
      requiresAuth: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      title: 'HTML Viewer - 页面未找到'
    }
  }
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
  }
})

// 路由守卫 - 设置页面标题和权限检查
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }

  // 权限检查（仅在云端模式下检查）
  if (to.meta?.requiresAuth) {
    const token = localStorage.getItem('auth_token')
    const apiUrl = import.meta.env.VITE_API_URL

    // 如果是云端模式且未登录，重定向到首页
    if (apiUrl && !token) {
      next({ name: 'home' })
      return
    }
  }

  next()
})

export default router
