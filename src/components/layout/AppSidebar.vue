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
        <div class="brand">
          <div class="brand-logo">
            <n-icon size="22"><CodeSlashOutline /></n-icon>
          </div>
          <div class="brand-text">
            <span class="brand-main">HTML</span>
            <span class="brand-sub">HUB</span>
          </div>
        </div>
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
  CodeSlashOutline,
} from '@vicons/ionicons5'
import { useFilesStore } from '../../stores/files'

const drawerVisible = ref(false)
const windowWidth = ref(window.innerWidth)

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
  padding: 12px 12px 28px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-logo {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 16px -4px rgba(139, 92, 246, 0.4);
  transition: transform 0.3s ease;
}

.brand:hover .brand-logo {
  transform: rotate(-5deg) scale(1.05);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-main {
  font-weight: 900;
  font-size: 18px;
  color: var(--n-text-color-1);
  letter-spacing: -0.5px;
}

.brand-sub {
  font-size: 11px;
  font-weight: 800;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0.8;
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
  padding: 0 16px 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.refined-menu :deep(.n-menu-item-content) {
  padding-left: 16px !important;
  border-radius: 12px;
  margin: 2px 4px;
}

.refined-menu :deep(.n-menu-item-content--selected) {
  background: var(--n-primary-color) !important;
  box-shadow: 0 4px 12px rgba(var(--n-primary-color-rgb), 0.2);
}

.refined-menu :deep(.n-menu-item-content--selected .n-menu-item-content-header) {
  color: white !important;
  font-weight: 700;
}

.refined-menu :deep(.n-menu-item-content--selected .n-icon) {
  color: white !important;
}

.refined-menu :deep(.item-badge) {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(var(--n-text-color-rgb), 0.05);
  color: var(--n-text-color-3);
}

.refined-menu :deep(.n-menu-item-content--selected .item-badge) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
</style>
