<template>
  <div
    class="app-logo-wrapper"
    :class="[
      `size-${normalizedSize}`,
      `theme-${theme}`,
      {
        'is-animated': animated,
        'is-clickable': clickable,
        'mark-only': markOnly,
      },
    ]"
    @click="handleClick"
  >
    <!-- 方案 B：纯扁平圆角微标 (Flat Code Squircle) -->
    <div v-if="!textOnly" class="logo-mark" :style="markStyle">
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="logo-svg"
      >
        <!-- 纯色圆角微标底板 -->
        <rect
          x="0"
          y="0"
          width="80"
          height="80"
          rx="22"
          class="mark-base"
        />

        <!-- 负空间纯白镂空代码标签 < / > -->
        <g
          stroke="#ffffff"
          stroke-width="7.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mark-code"
        >
          <!-- 左尖括号 < -->
          <path d="M30 25 L17 40 L30 55" />
          <!-- 闭合斜杠 / -->
          <path d="M44 22 L36 58" />
          <!-- 右尖括号 > -->
          <path d="M50 25 L63 40 L50 55" />
        </g>
      </svg>
    </div>

    <!-- 品牌字标 (Wordmark) -->
    <div v-if="showText && !markOnly" class="logo-wordmark">
      <div class="brand-title">
        <span class="brand-html">HTML</span>
        <span class="brand-hub">hub</span>
      </div>
      <span v-if="subtitle" class="brand-subtitle">{{ subtitle }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
  theme?: 'light' | 'dark' | 'auto'
  showText?: boolean
  subtitle?: string
  textOnly?: boolean
  markOnly?: boolean
  animated?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  theme: 'auto',
  showText: true,
  subtitle: '',
  textOnly: false,
  markOnly: false,
  animated: true,
  clickable: false,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const normalizedSize = computed(() => {
  if (typeof props.size === 'string') {
    return props.size
  }
  return 'custom'
})

const markStyle = computed(() => {
  if (typeof props.size === 'number') {
    return {
      width: `${props.size}px`,
      height: `${props.size}px`,
    }
  }
  return {}
})

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.app-logo-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  user-select: none;
}

.is-clickable {
  cursor: pointer;
}

/* 徽标尺寸与渲染 */
.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.mark-base {
  fill: #4f46e5;
  transition: fill 0.3s ease;
}

.logo-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* 尺寸预设 */
.size-sm .logo-mark {
  width: 28px;
  height: 28px;
}
.size-sm .brand-html,
.size-sm .brand-hub {
  font-size: 16px;
}
.size-sm .brand-subtitle {
  font-size: 9px;
}

.size-md .logo-mark {
  width: 36px;
  height: 36px;
}
.size-md .brand-html,
.size-md .brand-hub {
  font-size: 19px;
}
.size-md .brand-subtitle {
  font-size: 10px;
}

.size-lg .logo-mark {
  width: 50px;
  height: 50px;
}
.size-lg .brand-html,
.size-lg .brand-hub {
  font-size: 26px;
}
.size-lg .brand-subtitle {
  font-size: 11px;
}

.size-xl .logo-mark {
  width: 64px;
  height: 64px;
}
.size-xl .brand-html,
.size-xl .brand-hub {
  font-size: 34px;
}
.size-xl .brand-subtitle {
  font-size: 12px;
}

/* 品牌文字排版 */
.logo-wordmark {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.05;
}

.brand-title {
  display: flex;
  align-items: baseline;
  font-weight: 900;
  letter-spacing: -0.6px;
}

.brand-html {
  color: var(--n-text-color-1, #0f172a);
  transition: color 0.3s ease;
}

:root[data-theme='dark'] .brand-html,
.dark .brand-html,
body[class*='dark'] .brand-html,
.theme-dark .brand-html {
  color: #f8fafc !important;
}

.brand-hub {
  color: #4f46e5;
  margin-left: 1px;
  transition: color 0.3s ease;
}

:root[data-theme='dark'] .brand-hub,
.dark .brand-hub,
body[class*='dark'] .brand-hub,
.theme-dark .brand-hub {
  color: #818cf8 !important;
}

.brand-subtitle {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--n-text-color-3, #94a3b8);
  margin-top: 3px;
}

.theme-dark .brand-subtitle {
  color: #94a3b8 !important;
}

.theme-light .brand-html {
  color: #0f172a !important;
}

.theme-light .brand-hub {
  color: #4f46e5 !important;
}

.theme-light .brand-subtitle {
  color: #64748b !important;
}

/* 简约动效 */
.is-animated:hover .logo-mark {
  transform: scale(1.05);
}
</style>
