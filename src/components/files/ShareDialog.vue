<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NPopconfirm,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpin,
  NTag,
  useMessage,
} from 'naive-ui'
import {
  CopyOutline,
  KeyOutline,
  LinkOutline,
  LockClosedOutline,
  LockOpenOutline,
  RefreshOutline,
  TrashOutline,
} from '@vicons/ionicons5'
import { useShareStore } from '@/stores/share'

const shareStore = useShareStore()
const message = useMessage()

const show = computed({
  get: () => shareStore.showDialog,
  set: (value: boolean) => {
    if (!value) shareStore.close()
  },
})

type PasswordMode = 'auto' | 'custom'

const form = reactive({
  mode: 'auto' as PasswordMode,
  password: '',
  length: 4,
  ttlSeconds: 7 * 24 * 60 * 60,
  hint: '',
})

/** 已开启状态下是否进入「重置密码」表单 */
const editing = ref(false)

const ttlOptions = [
  { label: '1 小时', value: 60 * 60 },
  { label: '1 天', value: 24 * 60 * 60 },
  { label: '7 天（推荐）', value: 7 * 24 * 60 * 60 },
  { label: '30 天', value: 30 * 24 * 60 * 60 },
  { label: '永久有效', value: 0 },
]

const lengthOptions = [
  { label: '4 位（便于口头分享）', value: 4 },
  { label: '6 位（更安全）', value: 6 },
  { label: '8 位（最安全）', value: 8 },
]

const status = computed(() => shareStore.status)
const created = computed(() => shareStore.created)
const links = computed(() => shareStore.links)

const enabled = computed(() => Boolean(status.value?.enabled))
const expired = computed(() => Boolean(status.value?.expired))

const statusTag = computed(() => {
  if (!enabled.value) return { type: 'default' as const, text: '未开启' }
  if (expired.value) return { type: 'warning' as const, text: '分享已结束' }
  return { type: 'success' as const, text: '保护中' }
})

const customError = computed(() => {
  if (form.mode !== 'custom') return ''
  const value = form.password.trim()
  if (!value) return '请输入自定义密码'
  if (!/^[A-Za-z0-9]{4,32}$/.test(value)) return '密码需为 4–32 位字母或数字'
  return ''
})

const expiryText = computed(() => {
  const at = status.value?.expiresAt ?? 0
  return at > 0 ? formatDateTime(at) : '永久有效'
})

const remainingText = computed(() => {
  const at = status.value?.expiresAt ?? 0
  if (!at) return ''
  const diff = at - Math.floor(Date.now() / 1000)
  if (diff <= 0) return '已结束'
  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  if (days > 0) return `剩余 ${days} 天 ${hours} 小时`
  const minutes = Math.max(Math.floor((diff % 3600) / 60), 1)
  if (hours > 0) return `剩余 ${hours} 小时 ${minutes} 分`
  return `剩余 ${minutes} 分钟`
})

const lastUsedText = computed(() => {
  const at = status.value?.lastUsedAt ?? 0
  return at > 0 ? formatDateTime(at) : '暂无访问记录'
})

watch(show, (open) => {
  if (open) {
    editing.value = false
    form.mode = 'auto'
    form.password = ''
    form.length = 4
    form.ttlSeconds = 7 * 24 * 60 * 60
    form.hint = ''
  }
})

function formatDateTime(seconds: number): string {
  const date = new Date(seconds * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function startEditing() {
  editing.value = true
  form.mode = 'auto'
  form.password = ''
  form.length = 4
  form.ttlSeconds = 7 * 24 * 60 * 60
  form.hint = status.value?.hint ?? ''
}

function cancelEditing() {
  editing.value = false
  form.password = ''
}

function sanitizePassword(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32)
}

async function handleSave() {
  if (customError.value) {
    message.error(customError.value)
    return
  }

  const wasEditing = editing.value
  const ok = await shareStore.save({
    mode: form.mode,
    password: form.mode === 'custom' ? form.password.trim() : '',
    length: form.length,
    ttlSeconds: form.ttlSeconds,
    hint: form.hint.trim(),
  })

  if (ok) {
    editing.value = false
    message.success(wasEditing ? '密码已重置，旧链接已全部失效' : '分享已开启')
  } else {
    message.error(shareStore.error || '保存分享设置失败')
  }
}

async function handleRevoke() {
  const ok = await shareStore.revoke()
  if (ok) {
    editing.value = false
    message.success('已撤销分享，项目恢复公开访问')
  } else {
    message.error(shareStore.error || '撤销分享失败')
  }
}

async function copyText(text: string, label: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    message.success(`已复制${label}`)
  } catch {
    message.error('复制失败，请手动选择文本复制')
  }
}
</script>

<template>
  <n-modal
    v-model:show="show"
    preset="card"
    :mask-closable="false"
    :bordered="false"
    class="share-modal"
    style="width: 580px; max-width: calc(100vw - 32px)"
  >
    <template #header>
      <div class="share-modal-title">
        <span class="share-modal-icon">
          <n-icon size="16"><KeyOutline /></n-icon>
        </span>
        分享与访问密码
      </div>
    </template>

    <div v-if="shareStore.project" class="share-project">
      <div class="share-project-meta">
        <div class="share-project-name">{{ shareStore.project.name }}</div>
        <div class="share-project-path">
          {{ shareStore.project.category }} · {{ shareStore.project.indexPath }}
        </div>
      </div>
      <n-tag size="small" round :bordered="false" :type="statusTag.type">
        <template #icon>
          <n-icon size="12">
            <LockOpenOutline v-if="!enabled || expired" />
            <LockClosedOutline v-else />
          </n-icon>
        </template>
        {{ statusTag.text }}
      </n-tag>
    </div>

    <div v-if="shareStore.loading" class="share-loading">
      <n-spin size="small" />
      <span>正在读取分享状态…</span>
    </div>

    <n-alert
      v-else-if="shareStore.error && !shareStore.status"
      type="error"
      :bordered="false"
      class="share-error"
    >
      <div class="share-error-row">
        <span>{{ shareStore.error }}</span>
        <n-button size="tiny" @click="shareStore.refresh()">重试</n-button>
      </div>
    </n-alert>

    <template v-else>
      <!-- 未开启 / 重置密码表单 -->
      <div v-if="!enabled || editing" class="share-form-wrap">
        <p class="share-intro">
          {{
            enabled
              ? '重置后会立即生成新的密码，旧密码、旧链接和已解锁的会话全部失效。'
              : '开启后，只有拿到密码或免密链接的人才能访问这个项目。'
          }}
        </p>

        <n-form label-placement="left" label-width="84" size="small" :show-feedback="false">
          <n-form-item label="密码方式">
            <n-radio-group v-model:value="form.mode" size="small">
              <n-radio value="auto">随机生成</n-radio>
              <n-radio value="custom">自定义</n-radio>
            </n-radio-group>
          </n-form-item>

          <n-form-item v-if="form.mode === 'auto'" label="密码长度">
            <n-select
              v-model:value="form.length"
              :options="lengthOptions"
              style="width: 220px"
            />
          </n-form-item>

          <n-form-item v-else label="自定义密码">
            <div class="share-custom-password">
              <n-input
                :value="form.password"
                placeholder="4–32 位字母或数字"
                maxlength="32"
                :status="form.password && customError ? 'error' : undefined"
                @update:value="(value: string) => (form.password = sanitizePassword(value))"
              />
              <span v-if="customError" class="share-field-error">{{ customError }}</span>
            </div>
          </n-form-item>

          <n-form-item label="有效期">
            <n-select
              v-model:value="form.ttlSeconds"
              :options="ttlOptions"
              style="width: 220px"
            />
          </n-form-item>

          <n-form-item label="密码提示">
            <n-input
              v-model:value="form.hint"
              placeholder="可选，会显示在密码页"
              maxlength="60"
            />
          </n-form-item>
        </n-form>

        <div class="share-form-actions">
          <n-button v-if="editing" size="small" @click="cancelEditing">取消</n-button>
          <n-button
            type="primary"
            size="small"
            :loading="shareStore.saving"
            @click="handleSave"
          >
            {{ editing ? '确认重置' : '开启分享' }}
          </n-button>
        </div>
      </div>

      <!-- 已开启 -->
      <div v-else class="share-active">
        <n-alert v-if="expired" type="warning" :bordered="false" class="share-expired-alert">
          分享已于 {{ expiryText }} 结束，访客现在会看到「分享已结束」页面。项目不会自动恢复公开。
        </n-alert>

        <div class="share-meta-grid">
          <div class="share-meta-item">
            <span class="share-meta-label">有效期</span>
            <strong class="share-meta-value">{{ expiryText }}</strong>
            <span v-if="remainingText && !expired" class="share-meta-sub">
              {{ remainingText }}
            </span>
          </div>
          <div class="share-meta-item">
            <span class="share-meta-label">最近访问</span>
            <strong class="share-meta-value">{{ lastUsedText }}</strong>
            <span class="share-meta-sub">密码只保存哈希，无法找回</span>
          </div>
        </div>

        <div v-if="created" class="share-password">
          <div class="share-password-head">
            <span>访问密码</span>
            <n-tag size="tiny" type="warning" :bordered="false">仅展示一次</n-tag>
          </div>
          <div class="share-password-row">
            <code class="share-password-value">{{ created.password }}</code>
            <n-button
              size="tiny"
              secondary
              @click="copyText(created.password, '密码')"
            >
              <template #icon>
                <n-icon><CopyOutline /></n-icon>
              </template>
              复制
            </n-button>
          </div>
          <p class="share-note">
            关闭面板后无法再次查看此密码；忘记密码可以重置，但旧链接会立即失效。
          </p>
        </div>

        <div v-if="links" class="share-links">
          <div class="share-link-item">
            <div class="share-link-label">
              <n-icon size="13"><LockClosedOutline /></n-icon>
              需要密码的链接
            </div>
            <div class="share-link-row">
              <n-input :value="links.passwordLink" readonly size="small" />
              <n-button
                size="small"
                secondary
                @click="copyText(links.passwordLink, '链接')"
              >
                复制
              </n-button>
            </div>
          </div>

          <div class="share-link-item">
            <div class="share-link-label">
              <n-icon size="13"><LinkOutline /></n-icon>
              免密链接
              <n-tag size="tiny" type="warning" :bordered="false">持链接即可访问</n-tag>
            </div>
            <div class="share-link-row">
              <n-input :value="links.link" readonly size="small" />
              <n-button size="small" secondary @click="copyText(links.link, '免密链接')">
                复制
              </n-button>
            </div>
          </div>

          <p class="share-note">
            免密链接内置签名令牌，会随分享到期或重置密码而失效，请只发给信任的人。
          </p>
        </div>

        <div class="share-actions">
          <n-button size="small" @click="startEditing">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            {{ expired ? '重新开启' : '重置密码' }}
          </n-button>

          <n-popconfirm @positive-click="handleRevoke">
            <template #trigger>
              <n-button size="small" type="error" ghost :loading="shareStore.saving">
                <template #icon>
                  <n-icon><TrashOutline /></n-icon>
                </template>
                撤销分享
              </n-button>
            </template>
            撤销后项目将恢复公开访问，现有密码与链接立即失效。确定继续？
          </n-popconfirm>
        </div>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
.share-modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main, #0f172a);
}

.share-modal-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 70, 229, 0.08);
  color: #4f46e5;
}

.share-project {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.025);
  border: 1px solid rgba(15, 23, 42, 0.05);
  margin-bottom: 14px;
}

.share-project-meta {
  min-width: 0;
}

.share-project-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-project-path {
  margin-top: 2px;
  font-size: 11px;
  font-family: monospace;
  color: var(--text-muted, #64748b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 0;
  color: var(--text-muted, #64748b);
  font-size: 13px;
}

.share-error {
  margin-bottom: 4px;
}

.share-error-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.share-intro {
  margin: 0 0 16px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-muted, #64748b);
}

.share-custom-password {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.share-field-error {
  font-size: 11px;
  color: #d14343;
}

.share-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.share-expired-alert {
  margin-bottom: 14px;
}

.share-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.share-meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(15, 23, 42, 0.02);
}

.share-meta-label {
  font-size: 11px;
  color: var(--text-muted, #64748b);
}

.share-meta-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main, #0f172a);
  font-variant-numeric: tabular-nums;
}

.share-meta-sub {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
}

.share-password {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.32);
  background: rgba(245, 158, 11, 0.06);
  margin-bottom: 14px;
}

.share-password-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.share-password-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.share-password-value {
  flex: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #78350f;
  word-break: break-all;
}

.share-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 4px;
}

.share-link-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  margin-bottom: 6px;
}

.share-link-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.share-note {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-muted, #64748b);
}

.share-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

:root[data-theme='dark'] .share-modal-title,
.dark .share-modal-title,
:root[data-theme='dark'] .share-project-name,
.dark .share-project-name,
:root[data-theme='dark'] .share-meta-value,
.dark .share-meta-value {
  color: #f8fafc;
}

:root[data-theme='dark'] .share-modal-icon,
.dark .share-modal-icon {
  background: rgba(129, 140, 248, 0.15);
  color: #a5b4fc;
}

:root[data-theme='dark'] .share-project,
.dark .share-project {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.07);
}

:root[data-theme='dark'] .share-meta-item,
.dark .share-meta-item {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.07);
}

:root[data-theme='dark'] .share-meta-label,
.dark .share-meta-label,
:root[data-theme='dark'] .share-meta-sub,
.dark .share-meta-sub,
:root[data-theme='dark'] .share-note,
.dark .share-note,
:root[data-theme='dark'] .share-intro,
.dark .share-intro {
  color: #94a3b8;
}

:root[data-theme='dark'] .share-link-label,
.dark .share-link-label {
  color: #cbd5e1;
}

:root[data-theme='dark'] .share-password,
.dark .share-password {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.1);
}

:root[data-theme='dark'] .share-password-head,
.dark .share-password-head {
  color: #fbbf24;
}

:root[data-theme='dark'] .share-password-value,
.dark .share-password-value {
  color: #fcd34d;
}

:root[data-theme='dark'] .share-actions,
.dark .share-actions {
  border-top-color: rgba(255, 255, 255, 0.08);
}
</style>
