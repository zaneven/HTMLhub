<script setup lang="ts">
import { ref } from 'vue'
import { NModal, NCard, NForm, NFormItem, NInput, NButton, NAlert, useMessage } from 'naive-ui'
import { LockClosedOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}>()

const authStore = useAuthStore()
const message = useMessage()

const password = ref('')

async function handleLogin() {
  if (!password.value.trim()) {
    message.warning('请输入密码')
    return
  }

  const success = await authStore.login(password.value)

  if (success) {
    message.success('登录成功')
    password.value = ''
    emit('update:show', false)
    emit('success')
  } else {
    message.error(authStore.error || '登录失败')
  }
}

function handleClose() {
  password.value = ''
  authStore.clearError()
  emit('update:show', false)
}
</script>

<template>
  <n-modal
    :show="show"
    :mask-closable="true"
    @update:show="emit('update:show', $event)"
  >
    <n-card
      title="管理员登录"
      :bordered="false"
      size="medium"
      style="width: 400px"
      :segmented="{ content: true }"
    >
      <template #header-extra>
        <n-icon size="24" color="#18a058">
          <LockClosedOutline />
        </n-icon>
      </template>

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
          />
        </n-form-item>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px">
          <n-button @click="handleClose" :disabled="authStore.loading">
            取消
          </n-button>
          <n-button
            type="primary"
            :loading="authStore.loading"
            @click="handleLogin"
          >
            登录
          </n-button>
        </div>
      </n-form>
    </n-card>
  </n-modal>
</template>
