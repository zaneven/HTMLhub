<template>
  <div class="category-view">
    <n-card :title="categoryTitle">
      <template #header-extra>
        <n-button @click="$router.go(-1)">返回</n-button>
      </template>
      
      <div class="category-content">
        <n-empty description="分类浏览功能正在开发中..." />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NButton, NEmpty } from 'naive-ui'

const route = useRoute()

const categoryTitle = computed(() => {
  const categoryPath = route.params.categoryPath as string[] | string
  if (Array.isArray(categoryPath)) {
    return `分类: ${categoryPath.join(' / ')}`
  }
  return categoryPath ? `分类: ${categoryPath}` : '分类浏览'
})
</script>

<style scoped>
.category-view {
  padding: 20px;
}

.category-content {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>