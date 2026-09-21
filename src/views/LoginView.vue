<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  darkTheme,
  NConfigProvider,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NAlert,
  NIcon,
  useMessage,
} from 'naive-ui'
import { LockClosedOutline } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppMode } from '@/composables/useAppMode'
import AppLogo from '@/components/common/AppLogo.vue'

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
      <n-config-provider :theme="darkTheme">
        <n-card class="login-card" :bordered="false">
          <!-- Logo -->
          <div class="logo-hero">
            <AppLogo size="xl" theme="dark" subtitle="STATIC SITE & APP WORKSPACE" />
            <p class="logo-desc">轻量、极速的现代 HTML 站点与多应用聚合工作台</p>
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
                class="login-input"
                :disabled="authStore.loading"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <n-icon color="#94a3b8">
                    <LockClosedOutline />
                  </n-icon>
                </template>
              </n-input>
            </n-form-item>

            <n-button
              type="primary"
              block
              size="large"
              class="login-submit-btn"
              :loading="authStore.loading"
              @click="handleLogin"
            >
              登录
            </n-button>
          </n-form>

          <!-- 底部信息 -->
          <div class="footer-info">
            <span>Powered by Vue 3 + Naive UI</span>
          </div>
        </n-card>
      </n-config-provider>
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
  max-width: 440px;
  padding: 20px;
}

.login-card {
  border-radius: 20px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
  background: rgba(26, 27, 46, 0.88) !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 24px 20px;
}

.logo-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  text-align: center;
}

.logo-hero :deep(.brand-html) {
  color: #ffffff !important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.logo-hero :deep(.brand-hub) {
  color: #818cf8 !important;
  text-shadow: 0 2px 12px rgba(99, 102, 241, 0.4);
}

.logo-hero :deep(.brand-subtitle) {
  color: #94a3b8 !important;
  letter-spacing: 1.8px;
  font-weight: 700;
}

.logo-desc {
  margin: 14px 0 0;
  color: #cbd5e1;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
}

/* 表单与输入框深色强化 */
:deep(.n-form-item .n-form-item-label .n-form-item-label__text) {
  color: #f1f5f9 !important;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.2px;
}

.login-input {
  border-radius: 10px !important;
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  transition: all 0.25s ease;
}

.login-input:hover {
  border-color: rgba(129, 140, 248, 0.5) !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

.login-input:focus-within {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25) !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

:deep(.login-input .n-input__input-el) {
  color: #ffffff !important;
  font-size: 15px;
}

:deep(.login-input .n-input__placeholder) {
  color: #94a3b8 !important;
}

.login-submit-btn {
  margin-top: 24px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
  border: none !important;
  transition: all 0.2s ease;
}

.login-submit-btn:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%) !important;
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.6);
  transform: translateY(-1px);
}

.footer-info {
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 18px 16px;
  }
}
</style>
