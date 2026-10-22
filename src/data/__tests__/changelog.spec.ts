import { describe, expect, it } from 'vitest'
import {
  APP_VERSION,
  CHANGE_TYPE_META,
  CHANGELOG,
  countChangesByType,
  getChangelogStats,
} from '../changelog'
import packageJson from '../../../package.json'

const SEMVER = /^\d+\.\d+\.\d+$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

describe('版本与更新日志', () => {
  it('版本号唯一且符合语义化版本规范', () => {
    const versions = CHANGELOG.map((release) => release.version)

    expect(new Set(versions).size).toBe(versions.length)
    versions.forEach((version) => expect(version).toMatch(SEMVER))
  })

  it('按发布日期倒序排列（最新版本在最前）', () => {
    const dates = CHANGELOG.map((release) => new Date(release.date).getTime())

    dates.forEach((time, index) => {
      expect(Number.isNaN(time)).toBe(false)
      if (index > 0) expect(dates[index - 1]).toBeGreaterThanOrEqual(time)
    })
  })

  it('每个版本都有完整的元信息与至少一条变更记录', () => {
    CHANGELOG.forEach((release) => {
      expect(release.date).toMatch(DATE)
      expect(release.title.trim().length).toBeGreaterThan(0)
      expect(release.changes.length).toBeGreaterThan(0)

      release.changes.forEach((change) => {
        expect(change.content.trim().length).toBeGreaterThan(0)
        expect(Object.keys(CHANGE_TYPE_META)).toContain(change.type)
      })
    })
  })

  it('当前版本、package.json 与最新记录保持一致', () => {
    expect(APP_VERSION).toBe(CHANGELOG[0].version)
    expect(packageJson.version).toBe(APP_VERSION)
  })

  it('统计信息与实际记录一致', () => {
    const stats = getChangelogStats()
    const changeTypeCount = Object.keys(CHANGE_TYPE_META).reduce(
      (sum, type) => sum + countChangesByType(type as keyof typeof CHANGE_TYPE_META),
      0,
    )

    expect(stats.totalReleases).toBe(CHANGELOG.length)
    expect(stats.totalChanges).toBe(changeTypeCount)
    expect(stats.latestDate).toBe(CHANGELOG[0].date)
  })
})
