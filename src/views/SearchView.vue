<template>
  <div class="search-view">
    <n-card title="搜索结果">
      <template #header-extra>
        <n-button @click="$router.go(-1)">返回</n-button>
      </template>
      
      <div class="search-content">
        <n-empty description="搜索功能正在开发中..." />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NCard, NButton, NEmpty } from 'naive-ui'
</script>

<style scoped>
.search-view {
  padding: 20px;
}

.search-content {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>