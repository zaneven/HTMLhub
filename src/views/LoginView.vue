<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NForm, NFormItem, NInput, NButton, NAlert, NIcon, useMessage } from 'naive-ui'
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
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="login-container">
      <n-card class="login-card" :bordered="false">
        <!-- Logo -->
        <div class="logo">
          <div class="logo-icon">
            <n-icon size="56" color="#18a058">
              <FolderOpenOutline />
            </n-icon>
          </div>
          <h1>HTMLManager</h1>
          <p>静态HTML文件管理系统</p>
        </div>

        <!-- 静态模式提示 -->
        <n-alert v-if="!isCloudMode" type="info" style="margin-bottom: 24px">
          当前为静态模式，无需登录即可使用。
          <br />配置 <code>VITE_API_URL</code> 启用云端模式。
        </n-alert>

        <!-- 登录表单 -->
        <n-form @submit.prevent="handleLogin">
          <n-alert
            v-if="authStore.error"
            type="error"
            :show-icon="true"
            style="margin-bottom: 16px"
          >
            {{ authStore.error }}
          </n-alert>

          <n-form-item label="管理密码" :show-feedback="false">
            <n-input
              v-model:value="password"
              type="password"
              placeholder="请输入管理密码"
              show-password-on="click"
              size="large"
              :disabled="authStore.loading"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <n-icon color="#999">
                  <LockClosedOutline />
                </n-icon>
              </template>
            </n-input>
          </n-form-item>

          <n-button
            type="primary"
            block
            size="large"
            :loading="authStore.loading"
            @click="handleLogin"
            style="margin-top: 24px; height: 48px; font-size: 16px"
          >
            登录
          </n-button>
        </n-form>

        <!-- 底部信息 -->
        <div class="footer-info">
          <span>Powered by Vue 3 + Naive UI</span>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
  overflow: hidden;
}

/* 背景装饰圆圈 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(24, 160, 88, 0.3), rgba(24, 160, 88, 0.1));
  filter: blur(60px);
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.1));
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, rgba(24, 160, 88, 0.2), transparent);
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.login-card {
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  background: rgba(30, 30, 46, 0.95);
  backdrop-filter: blur(20px);
  padding: 20px;
}

.logo {
  text-align: center;
  margin-bottom: 36px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 160, 88, 0.15);
  border-radius: 20px;
  border: 1px solid rgba(24, 160, 88, 0.3);
}

.logo h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #18a058, #36d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo p {
  margin: 0;
  color: #888;
  font-size: 14px;
}

.footer-info {
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #666;
  font-size: 12px;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 16px;
  }

  .logo h1 {
    font-size: 24px;
  }

  .logo-icon {
    width: 64px;
    height: 64px;
  }
}
</style>
