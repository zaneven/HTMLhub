<template>
  <!-- 移动端抽屉 -->
  <n-drawer
    v-if="isMobile"
    v-model:show="drawerVisible"
    :width="280"
    placement="left"
    class="refined-drawer"
  >
    <n-drawer-content closable>
      <div class="sidebar-inner">
        <div class="sidebar-brand">
          <AppLogo size="md" subtitle="WORKSPACE" clickable @click="goHome" />
        </div>
        <div class="sidebar-nav">
          <div class="nav-group">
            <div class="group-label">主要导航</div>
            <n-menu
              :options="categoryMenuOptions"
              :value="selectedCategory"
              @update:value="handleCategorySelect"
              class="refined-menu"
            />
          </div>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>

  <!-- 桌面端侧边栏 -->
  <n-layout-sider
    v-else
    bordered
    :width="sidebarWidth"
    class="refined-sidebar"
  >
    <div class="sidebar-inner">
      <div class="sidebar-brand">
        <AppLogo size="md" subtitle="WORKSPACE" clickable @click="goHome" />
      </div>

      <div class="sidebar-top">
        <div class="stats-panel">
          <div class="stat-item">
            <span class="stat-num">{{ totalProjects }}</span>
            <span class="stat-tag">总项目</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ totalCategories }}</span>
            <span class="stat-tag">目录数</span>
          </div>
        </div>
      </div>

      <div class="sidebar-nav">
        <div class="nav-group">
          <div class="group-label">项目目录</div>
          <n-menu
            :options="categoryMenuOptions"
            :value="selectedCategory"
            @update:value="handleCategorySelect"
            class="refined-menu"
          />
        </div>
      </div>


    </div>
  </n-layout-sider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NLayoutSider,
  NDrawer,
  NDrawerContent,
  NIcon,
  NMenu,
  type MenuOption,
} from 'naive-ui'
import { 
  FolderOutline, 
  AppsOutline,
} from '@vicons/ionicons5'
import AppLogo from '@/components/common/AppLogo.vue'
import { useFilesStore } from '../../stores/files'

const router = useRouter()
const drawerVisible = ref(false)
const windowWidth = ref(window.innerWidth)

function goHome() {
  router.push('/')
  if (isMobile.value) {
    drawerVisible.value = false
  }
}

const isMobile = computed(() => windowWidth.value < 768)
const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
const sidebarWidth = computed(() => isTablet.value ? 240 : 280)

function handleResize() { windowWidth.value = window.innerWidth }

defineExpose({
  toggleDrawer: () => { drawerVisible.value = !drawerVisible.value },
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const filesStore = useFilesStore()
const totalProjects = computed(() => filesStore.totalProjects)
const totalCategories = computed(() => filesStore.totalCategories)
const selectedCategory = computed(() => filesStore.selectedCategory)

const categoryMenuOptions = computed((): MenuOption[] => {
  const categories = filesStore.categories
  const options: MenuOption[] = [
    {
      label: '全部项目',
      key: '',
      icon: () => h(NIcon, null, { default: () => h(AppsOutline) }),
    },
  ]

  categories.forEach((category) => {
    options.push({
      label: category.name,
      key: category.name,
      extra: () => h('span', { class: 'item-badge' }, category.projectCount.toString()),
      icon: () => h(NIcon, null, { default: () => h(FolderOutline) }),
    })
  })

  return options
})

function handleCategorySelect(category: string) {
  filesStore.setSelectedCategory(category)
  if (isMobile.value) drawerVisible.value = false
}
</script>

<style scoped>
.refined-sidebar {
  height: 100vh;
  background: var(--n-card-color);
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 12px;
}

.sidebar-brand {
  padding: 12px 10px 24px;
  display: flex;
  align-items: center;
}

.sidebar-top {
  padding: 0 8px 24px;
}

.stats-panel {
  background: rgba(var(--n-primary-color-rgb), 0.05);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border: 1px solid rgba(var(--n-primary-color-rgb), 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 20px;
  font-weight: 800;
  color: var(--n-primary-color);
}

.stat-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(var(--n-text-color-rgb), 0.1);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
}

.nav-group {
  margin-bottom: 24px;
}

.group-label {
  padding: 0 16px 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

/* 菜单项排版间隙与圆角 */
.refined-menu :deep(.n-menu-item) {
  margin: 3px 0;
}

/* 彻底隐藏 Naive UI 内部缩进 8px 的 ::before 伪元素，防止出现多层重叠与周边溢出白框 */
.refined-menu :deep(.n-menu-item-content::before) {
  display: none !important;
}

.refined-menu :deep(.n-menu-item-content) {
  padding-left: 14px !important;
  padding-right: 12px !important;
  border-radius: 10px !important;
  height: 42px !important;
  line-height: 42px !important;
  background: transparent !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 未选中态文字与图标 */
.refined-menu :deep(.n-menu-item-content:not(.n-menu-item-content--selected) .n-menu-item-content-header) {
  color: var(--n-text-color-2, #334155) !important;
  font-weight: 500;
  transition: color 0.2s ease;
}

.refined-menu :deep(.n-menu-item-content:not(.n-menu-item-content--selected) .n-icon) {
  color: var(--n-text-color-3, #64748b) !important;
  transition: color 0.2s ease;
}

/* 未选中态悬停交互：单一平滑背景 */
.refined-menu :deep(.n-menu-item-content:not(.n-menu-item-content--selected):hover) {
  background-color: rgba(99, 102, 241, 0.08) !important;
}

.refined-menu :deep(.n-menu-item-content:not(.n-menu-item-content--selected):hover .n-menu-item-content-header) {
  color: #4f46e5 !important;
}

.refined-menu :deep(.n-menu-item-content:not(.n-menu-item-content--selected):hover .n-icon) {
  color: #4f46e5 !important;
}

/* 选中项：单一纯粹的主题渐变实体色块，严丝合缝、无任何周边重影 */
.refined-menu :deep(.n-menu-item-content--selected) {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
  box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.35) !important;
}

/* 选中项文字：纯白、高清晰度、字重加深 */
.refined-menu :deep(.n-menu-item-content--selected .n-menu-item-content-header),
.refined-menu :deep(.n-menu-item-content--selected .n-menu-item-content-header a) {
  color: #ffffff !important;
  font-weight: 700 !important;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

/* 选中项图标：纯白高亮 */
.refined-menu :deep(.n-menu-item-content--selected .n-menu-item-content__icon),
.refined-menu :deep(.n-menu-item-content--selected .n-icon) {
  color: #ffffff !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

/* 数量角标：未选中态 */
.refined-menu :deep(.item-badge) {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.15);
  color: var(--n-text-color-3, #64748b);
  transition: all 0.2s ease;
}

/* 数量角标：选中态（半透明白底 + 纯白数字） */
.refined-menu :deep(.n-menu-item-content--selected .item-badge) {
  background: rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
