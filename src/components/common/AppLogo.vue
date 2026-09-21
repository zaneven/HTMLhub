<template>
  <div
    class="app-logo-wrapper"
    :class="[
      `size-${normalizedSize}`,
      {
        'is-animated': animated,
        'is-clickable': clickable,
        'mark-only': markOnly,
      },
    ]"
    @click="handleClick"
  >
    <!-- 专属矢量徽标 (Precision Vector Mark) -->
    <div v-if="!textOnly" class="logo-mark" :style="markStyle">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="logo-svg"
      >
        <defs>
          <!-- 背景流光 -->
          <linearGradient
            :id="`logoBg-${uuid}`"
            x1="10"
            y1="10"
            x2="90"
            y2="90"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#1e1b4b" />
            <stop offset="100%" stop-color="#090d16" />
          </linearGradient>

          <!-- 外边框渐变 -->
          <linearGradient
            :id="`logoBorder-${uuid}`"
            x1="10"
            y1="10"
            x2="90"
            y2="90"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#818cf8" stop-opacity="0.9" />
            <stop offset="50%" stop-color="#c084fc" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.9" />
          </linearGradient>

          <!-- 左翼 (<) 极光紫 -->
          <linearGradient
            :id="`logoLeft-${uuid}`"
            x1="22"
            y1="28"
            x2="48"
            y2="72"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#a78bfa" />
            <stop offset="50%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#4338ca" />
          </linearGradient>

          <!-- 右翼 (>) 赛博青 -->
          <linearGradient
            :id="`logoRight-${uuid}`"
            x1="52"
            y1="28"
            x2="78"
            y2="72"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="50%" stop-color="#06b6d4" />
            <stop offset="100%" stop-color="#0d9488" />
          </linearGradient>

          <!-- 核心纽带 -->
          <linearGradient
            :id="`logoBridge-${uuid}`"
            x1="32"
            y1="50"
            x2="68"
            y2="50"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#818cf8" />
            <stop offset="50%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#34d399" />
          </linearGradient>

          <!-- 脉冲氛围光 -->
          <radialGradient
            :id="`logoGlow-${uuid}`"
            cx="50"
            cy="50"
            r="28"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- 超椭圆底座 -->
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="26"
          :fill="`url(#logoBg-${uuid})`"
          :stroke="`url(#logoBorder-${uuid})`"
          stroke-width="2.5"
          class="mark-base"
        />

        <!-- 中心氛围微光 -->
        <circle
          cx="50"
          cy="50"
          r="26"
          :fill="`url(#logoGlow-${uuid})`"
          class="mark-glow"
        />

        <!-- 枢纽横桥 (连接并构成字母 H 拓扑) -->
        <line
          x1="34"
          y1="50"
          x2="66"
          y2="50"
          :stroke="`url(#logoBridge-${uuid})`"
          stroke-width="5.5"
          stroke-linecap="round"
          class="mark-bridge"
        />

        <!-- 左翼尖角 (<) -->
        <path
          d="M42 28 L26 50 L42 72"
          :stroke="`url(#logoLeft-${uuid})`"
          stroke-width="7"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mark-wing mark-wing-left"
        />

        <!-- 右翼尖角 (>) -->
        <path
          d="M58 28 L74 50 L58 72"
          :stroke="`url(#logoRight-${uuid})`"
          stroke-width="7"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mark-wing mark-wing-right"
        />

        <!-- Hub 核心晶核环 -->
        <circle
          cx="50"
          cy="50"
          r="7"
          fill="#090d16"
          :stroke="`url(#logoBridge-${uuid})`"
          stroke-width="2.8"
          class="mark-core-ring"
        />

        <!-- Hub 核心质点 -->
        <circle
          cx="50"
          cy="50"
          r="3"
          fill="#ffffff"
          class="mark-core-dot"
        />
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
import { computed, useId } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
  showText?: boolean
  subtitle?: string
  textOnly?: boolean
  markOnly?: boolean
  animated?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
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

const uuid = useId().replace(/[^a-zA-Z0-9]/g, '')

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

/* 徽标尺寸 */
.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease;
}

.logo-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  display: block;
}

/* 尺寸预设 */
.size-sm .logo-mark {
  width: 28px;
  height: 28px;
}
.size-sm .brand-html {
  font-size: 16px;
}
.size-sm .brand-hub {
  font-size: 16px;
}
.size-sm .brand-subtitle {
  font-size: 9px;
}

.size-md .logo-mark {
  width: 38px;
  height: 38px;
}
.size-md .brand-html {
  font-size: 19px;
}
.size-md .brand-hub {
  font-size: 19px;
}
.size-md .brand-subtitle {
  font-size: 10px;
}

.size-lg .logo-mark {
  width: 52px;
  height: 52px;
}
.size-lg .brand-html {
  font-size: 26px;
}
.size-lg .brand-hub {
  font-size: 26px;
}
.size-lg .brand-subtitle {
  font-size: 11px;
}

.size-xl .logo-mark {
  width: 72px;
  height: 72px;
}
.size-xl .brand-html {
  font-size: 36px;
}
.size-xl .brand-hub {
  font-size: 36px;
}
.size-xl .brand-subtitle {
  font-size: 13px;
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
body[class*='dark'] .brand-html {
  color: #f8fafc;
}

.brand-hub {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-left: 1px;
}

.brand-subtitle {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--n-text-color-3, #94a3b8);
  margin-top: 3px;
  opacity: 0.85;
}

/* 动效与交互 */
.is-animated:hover .logo-mark {
  transform: translateY(-2px) scale(1.04) rotate(-3deg);
}

.is-animated:hover .mark-glow {
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.is-animated:hover .mark-core-dot {
  filter: drop-shadow(0 0 6px #38bdf8);
}
</style>
