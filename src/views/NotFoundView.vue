<template>
  <div class="not-found-view">
    <n-result status="404" title="404" description="页面未找到">
      <template #footer>
        <n-button @click="$router.push('/')">返回首页</n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup lang="ts">
import { NResult, NButton } from 'naive-ui'
</script>

<style scoped>
.not-found-view {
  padding: 60px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>