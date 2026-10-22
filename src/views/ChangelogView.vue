<template>
  <div class="changelog-view">
    <!-- 顶部版本概览 -->
    <section class="changelog-hero">
      <div class="hero-glow" aria-hidden="true"></div>

      <div class="hero-main">
        <div class="hero-eyebrow">
          <n-icon size="14"><SparklesOutline /></n-icon>
          <span>CHANGELOG · 更新日志</span>
        </div>

        <h1 class="hero-title">
          每一次迭代，<br />
          <span class="hero-title-accent">都有记录。</span>
        </h1>

        <p class="hero-desc">
          HTMLhub 的版本演进清单。新功能、问题修复与体验优化都会归档在这里，
          方便随时回溯每个版本究竟改变了什么。
        </p>

        <div class="hero-actions">
          <n-button type="primary" @click="scrollToLatest">查看最新版本</n-button>
          <n-button quaternary @click="router.push('/')">返回项目</n-button>
        </div>
      </div>

      <aside class="version-panel">
        <div class="version-current">
          <span class="version-label">当前版本</span>
          <span class="version-number">v{{ version }}</span>
          <span v-if="isNewForViewer" class="version-new">NEW</span>
        </div>

        <div class="version-stats">
          <div class="version-stat">
            <strong>{{ stats.totalReleases }}</strong>
            <span>个版本</span>
          </div>
          <div class="version-stat">
            <strong>{{ stats.totalChanges }}</strong>
            <span>项变更</span>
          </div>
          <div class="version-stat">
            <strong>{{ stats.latestDate }}</strong>
            <span>最近更新</span>
          </div>
        </div>
      </aside>
    </section>

    <!-- 变更类型筛选 -->
    <div class="filter-bar">
      <div class="filter-chips">
        <button
          class="filter-chip"
          :class="{ active: activeType === 'all' }"
          @click="activeType = 'all'"
        >
          全部
          <span class="filter-count">{{ stats.totalChanges }}</span>
        </button>

        <button
          v-for="type in availableTypes"
          :key="type"
          class="filter-chip"
          :class="{ active: activeType === type }"
          @click="activeType = type"
        >
          <span class="chip-dot" :style="{ background: CHANGE_TYPE_META[type].color }"></span>
          {{ CHANGE_TYPE_META[type].label }}
          <span class="filter-count">{{ countChangesByType(type) }}</span>
        </button>
      </div>
    </div>

    <!-- 版本时间线 -->
    <div ref="timelineRef" class="timeline">
      <article
        v-for="release in visibleReleases"
        :key="release.version"
        class="release"
        :class="{ 'is-current': release.version === version }"
      >
        <div class="release-rail" aria-hidden="true">
          <span class="rail-dot"></span>
          <span class="rail-line"></span>
        </div>

        <div class="release-card">
          <header class="release-head">
            <div class="release-meta">
              <span class="release-version">v{{ release.version }}</span>
              <span v-if="release.version === version" class="release-badge badge-current">
                当前版本
              </span>
              <span v-if="release.major" class="release-badge badge-major">里程碑</span>
              <span class="release-date">{{ formatDate(release.date) }}</span>
            </div>

            <h2 class="release-title">{{ release.title }}</h2>
            <p v-if="release.summary" class="release-summary">{{ release.summary }}</p>
          </header>

          <ul class="change-list">
            <li v-for="(change, index) in release.changes" :key="index" class="change-item">
              <span
                class="change-type"
                :style="{
                  color: CHANGE_TYPE_META[change.type].color,
                  background: CHANGE_TYPE_META[change.type].background,
                }"
              >
                {{ CHANGE_TYPE_META[change.type].label }}
              </span>

              <span v-if="change.scope" class="change-scope">{{ change.scope }}</span>

              <span class="change-content">{{ change.content }}</span>
            </li>
          </ul>
        </div>
      </article>

      <div v-if="visibleReleases.length === 0" class="timeline-empty">
        <n-empty description="该类型下暂无变更记录" />
      </div>
    </div>

    <!-- 页脚说明 -->
    <footer class="changelog-foot">
      <span class="foot-dot"></span>
      <span>
        当前版本 v{{ version }} · 最近更新 {{ stats.latestDate }} · 共 {{ stats.totalReleases }}
        个版本、{{ stats.totalChanges }} 项变更
      </span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NEmpty, NIcon } from 'naive-ui'
import { SparklesOutline } from '@vicons/ionicons5'
import {
  APP_VERSION,
  CHANGE_TYPE_META,
  CHANGELOG,
  countChangesByType,
  getChangelogStats,
  type ChangeType,
  type VersionRelease,
} from '@/data/changelog'
import { hasUnseenRelease, markVersionSeen } from '@/composables/useVersion'

const router = useRouter()
const version = APP_VERSION
const stats = getChangelogStats()

/** 进入页面时记录本次是否有未读更新（进入后即标记已读） */
const isNewForViewer = ref(hasUnseenRelease.value)

/** 当前筛选的变更类型 */
const activeType = ref<ChangeType | 'all'>('all')

/** 只在筛选栏展示实际存在的变更类型 */
const availableTypes = computed(() => {
  const order = Object.keys(CHANGE_TYPE_META) as ChangeType[]
  return order.filter((type) => countChangesByType(type) > 0)
})

/** 按类型筛选版本：保留包含该类型变更的版本，并只展示匹配的条目 */
const visibleReleases = computed<VersionRelease[]>(() => {
  if (activeType.value === 'all') return CHANGELOG

  return CHANGELOG.map((release) => ({
    ...release,
    changes: release.changes.filter((change) => change.type === activeType.value),
  })).filter((release) => release.changes.length > 0)
})

const timelineRef = ref<HTMLElement | null>(null)

function formatDate(date: string): string {
  return date.replace(/-/g, '.')
}

function scrollToLatest() {
  activeType.value = 'all'
  timelineRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  // 进入更新日志即视为已读，清除侧边栏的新版本提示
  markVersionSeen()
})
</script>

<style scoped>
.changelog-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 8px 4px 48px;
}

/* ========== 版本概览 ========== */
.changelog-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 32px;
  padding: 40px;
  border-radius: 20px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -140px;
  right: -80px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0) 68%);
  pointer-events: none;
}

.hero-main {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 11px;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.08);
  color: #4f46e5;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

.hero-title {
  margin: 18px 0 14px;
  font-size: 38px;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -1px;
  color: var(--text-main);
}

.hero-title-accent {
  background: linear-gradient(120deg, #6366f1 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-desc {
  max-width: 460px;
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 26px;
}

/* 当前版本面板 */
.version-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  padding: 22px;
  border-radius: 16px;
  background: linear-gradient(150deg, #4f46e5 0%, #4338ca 55%, #312e81 100%);
  box-shadow: 0 16px 32px -16px rgba(79, 70, 229, 0.65);
  color: #ffffff;
}

.version-current {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.version-label {
  width: 100%;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.7);
}

.version-number {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.1;
}

.version-new {
  padding: 2px 7px;
  border-radius: 6px;
  background: #22d3ee;
  color: #083344;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
}

.version-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.version-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.version-stat strong {
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.version-stat span {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.62);
  white-space: nowrap;
}

/* ========== 筛选栏 ========== */
.filter-bar {
  position: sticky;
  top: 0;
  z-index: 5;
  margin: 24px 0 8px;
  padding: 10px 0;
  background: linear-gradient(
    to bottom,
    var(--bg-page) 62%,
    rgba(248, 250, 252, 0) 100%
  );
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  border-color: rgba(99, 102, 241, 0.45);
  color: #4f46e5;
}

.filter-chip.active {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #ffffff;
  box-shadow: 0 4px 12px -4px rgba(79, 70, 229, 0.6);
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.filter-chip.active .chip-dot {
  background: #ffffff !important;
}

.filter-count {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 10px;
  padding: 0 5px;
  border-radius: 5px;
  background: rgba(var(--n-text-color-rgb), 0.07);
  color: inherit;
  opacity: 0.8;
}

.filter-chip.active .filter-count {
  background: rgba(255, 255, 255, 0.22);
  opacity: 1;
}

/* ========== 时间线 ========== */
.timeline {
  display: flex;
  flex-direction: column;
  padding-top: 12px;
  scroll-margin-top: 20px;
}

.release {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 14px;
}

.release-rail {
  position: relative;
  display: flex;
  justify-content: center;
  padding-top: 26px;
}

.rail-dot {
  position: relative;
  z-index: 1;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--bg-page);
  border: 2px solid var(--border-medium);
  transition: all 0.2s ease;
}

.release.is-current .rail-dot {
  background: #4f46e5;
  border-color: rgba(79, 70, 229, 0.35);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.14);
}

.rail-line {
  position: absolute;
  top: 34px;
  bottom: -18px;
  width: 2px;
  border-radius: 2px;
  background: var(--border-subtle);
}

.release:last-child .rail-line {
  display: none;
}

.release-card {
  margin-bottom: 18px;
  padding: 24px 26px;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.release-card:hover {
  border-color: rgba(99, 102, 241, 0.28);
  box-shadow: var(--shadow-md);
}

.release.is-current .release-card {
  border-color: rgba(79, 70, 229, 0.35);
  box-shadow: 0 12px 30px -18px rgba(79, 70, 229, 0.6);
}

.release-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.release-version {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.2px;
  color: var(--text-main);
}

.release.is-current .release-version {
  color: #4f46e5;
}

.release-badge {
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.badge-current {
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
}

.badge-major {
  background: rgba(6, 182, 212, 0.12);
  color: #0891b2;
}

.release-date {
  margin-left: auto;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.release-title {
  margin: 12px 0 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: var(--text-main);
}

.release-summary {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

/* 变更条目 */
.change-list {
  list-style: none;
  margin: 18px 0 0;
  padding: 16px 0 0;
  border-top: 1px dashed var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.change-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-secondary);
}

.change-type {
  flex-shrink: 0;
  margin-top: 1px;
  padding: 1px 7px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.change-scope {
  flex-shrink: 0;
  margin-top: 1px;
  padding: 1px 6px;
  border-radius: 5px;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 10px;
  line-height: 1.6;
  white-space: nowrap;
}

.change-content {
  min-width: 0;
}

.timeline-empty {
  padding: 56px 0;
}

/* ========== 页脚 ========== */
.changelog-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 26px;
  color: var(--text-muted);
  font-size: 11px;
  text-align: center;
}

.foot-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-muted);
  opacity: 0.6;
}

/* ========== 深色模式 ========== */
:root[data-theme='dark'] .filter-bar,
.dark .filter-bar {
  background: linear-gradient(to bottom, #0b0f17 62%, rgba(11, 15, 23, 0) 100%);
}

:root[data-theme='dark'] .hero-eyebrow,
.dark .hero-eyebrow {
  background: rgba(129, 140, 248, 0.12);
  color: #a5b4fc;
}

/* ========== 响应式 ========== */
@media (max-width: 900px) {
  .changelog-hero {
    grid-template-columns: minmax(0, 1fr);
    padding: 30px;
    gap: 26px;
  }

  .version-panel {
    flex-direction: row;
    align-items: flex-end;
    gap: 18px;
  }

  .version-current {
    flex: 1;
  }

  .version-stats {
    flex: 1.4;
    padding-top: 0;
    border-top: none;
  }
}

@media (max-width: 640px) {
  .changelog-view {
    padding-bottom: 28px;
  }

  .changelog-hero {
    padding: 24px 20px;
    border-radius: 16px;
  }

  .hero-title {
    font-size: 28px;
  }

  .version-panel {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .version-stats {
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.16);
  }

  .release {
    grid-template-columns: 16px minmax(0, 1fr);
    gap: 8px;
  }

  .release-rail {
    padding-top: 22px;
  }

  .rail-line {
    bottom: -14px;
  }

  .release-card {
    padding: 18px 16px;
  }

  .release-date {
    margin-left: 0;
    width: 100%;
  }

  .change-item {
    flex-wrap: wrap;
    gap: 6px;
  }

  .change-content {
    width: 100%;
  }
}
</style>
