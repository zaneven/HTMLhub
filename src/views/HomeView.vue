<template>
  <div class="home-view">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 文件管理主界面 -->
      <AppMain />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppMain from '@/components/layout/AppMain.vue'
import { useFilesStore } from '@/stores/files'
import { useSearchStore } from '@/stores/search'

const filesStore = useFilesStore()
const searchStore = useSearchStore()

// 页面加载时初始化数据
onMounted(async () => {
  // 仅在数据未加载时加载（App.vue onMounted 可能已加载）
  if (!filesStore.indexData) {
    await filesStore.loadIndexData()
  }

  // 重置搜索状态
  searchStore.clearSearch()
})
</script>

<style scoped>
.home-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
