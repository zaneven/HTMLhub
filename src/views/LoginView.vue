<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NAlert,
  NSpace,
  NIcon,
  useMessage,
} from 'naive-ui'
import { LockClosedOutline, FolderOpenOutline } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppMode } from '@/composables/useAppMode'

const router = useRouter()
const authStore = useAuthStore()
const { isCloudMode } = useAppMode()
const message = useMessage()

const password = ref('')

// 如果已登录，直接跳转首页
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.replace('/')
  }
})

async function handleLogin() {
  if (!password.value.trim()) {
    message.warning('请输入密码')
    return
  }

  const success = await authStore.login(password.value)

  if (success) {
    message.success('登录成功')
    password.value = ''
    router.replace('/')
  } else {
    message.error(authStore.error || '登录失败')
  }
}
</script>

<template>
  <div class="login-view">
    <n-card class="login-card" :bordered="false">
      <!-- Logo -->
      <div class="logo">
        <n-icon size="48" color="#18a058">
          <FolderOpenOutline />
        </n-icon>
        <h1>HTMLManager</h1>
        <p>静态HTML文件管理系统</p>
      </div>

      <!-- 静态模式提示 -->
      <n-alert v-if="!isCloudMode" type="info" style="margin-bottom: 24px">
        当前为静态模式，无需登录即可使用基础功能。
        <br />配置 VITE_API_URL 环境变量启用云端模式。
      </n-alert>

      <!-- 登录表单 -->
      <n-form @submit.prevent="handleLogin">
        <n-alert v-if="authStore.error" type="error" :show-icon="true" style="margin-bottom: 16px">
          {{ authStore.error }}
        </n-alert>

        <n-form-item label="管理密码" :show-feedback="false">
          <n-input
            v-model:value="password"
            type="password"
            placeholder="请输入管理密码"
            show-password-on="click"
            :disabled="authStore.loading"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <n-icon>
                <LockClosedOutline />
              </n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-button
          type="primary"
          block
          :loading="authStore.loading"
          @click="handleLogin"
          style="margin-top: 24px"
        >
          登录
        </n-button>
      </n-form>
    </n-card>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.logo {
  text-align: center;
  margin-bottom: 32px;
}

.logo h1 {
  margin: 12px 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #18a058;
}

.logo p {
  margin: 0;
  color: #666;
  font-size: 14px;
}
</style>
