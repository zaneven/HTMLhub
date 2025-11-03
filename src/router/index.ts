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

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
  next()
})

export default router
