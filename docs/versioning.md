# 版本与更新日志维护指南

HTMLhub 的版本号与每次迭代的变更内容，统一维护在 `src/data/changelog.ts`。
只要这个文件里有记录，站内的「更新日志」页面（`/changelog`）就会自动呈现，无需改动页面代码。

---

## 版本号规则

遵循 [语义化版本](https://semver.org/lang/zh-CN/) `MAJOR.MINOR.PATCH`：

| 变更类型 | 版本位 | 示例 |
| :--- | :--- | :--- |
| 不兼容的架构或使用方式变更 | MAJOR | `1.0.0` → `2.0.0` |
| 新增功能、界面能力 | MINOR | `1.1.0` → `1.2.0` |
| 问题修复、细节优化 | PATCH | `1.1.0` → `1.1.1` |

---

## 发布新版本

1. 在 `src/data/changelog.ts` 的 `CHANGELOG` 数组**最顶部**追加一条记录（数组为倒序，最新版本在最前）：

   ```ts
   {
     version: '1.2.0',
     date: '2026-11-01',
     title: '一句话概括本版主题',
     summary: '一两句话说明这个版本带来了什么。',
     major: false, // 仅里程碑版本标记为 true
     changes: [
       {
         type: 'feature',       // feature | fix | style | refactor | perf | security | docs | chore
         scope: 'admin',        // 可选：影响范围
         content: '新增了 xxx 能力，解决了 xxx 场景的问题',
       },
     ],
   },
   ```

2. 同步修改 `package.json` 的 `version`，保持与文件内最新记录一致（测试会校验）。

3. 运行校验：

   ```bash
   npm run test:run
   npm run type-check
   ```

4. 提交并打标签：

   ```bash
   git add .
   git commit -m "chore(release): v1.2.0"
   git tag v1.2.0
   git push --follow-tags
   ```

---

## 记录规范

- **一条变更只讲一件事**：描述「改了什么 + 带来什么」，避免只写「优化代码」这类无效信息。
- **面向使用者表达**：优先写用户能感知到的变化，内部细节归入 `refactor` / `chore`。
- **类型选择**：
  - `feature` 新功能、新页面、新能力
  - `fix` 缺陷修复
  - `style` 视觉、样式、交互细节调整
  - `refactor` 不改变外部行为的结构重构
  - `perf` 加载、渲染等性能优化
  - `security` 鉴权、脱敏、安全策略调整
  - `docs` 文档与说明更新
  - `chore` 构建、依赖、配置等工程杂项
- **回溯补充**：历史版本也建议补齐记录，保证版本时间线连续、可追溯。

---

## 站内展示位置

| 位置 | 说明 |
| :--- | :--- |
| `/changelog` | 完整版本时间线，支持按变更类型筛选 |
| 左侧边栏底部 | 显示当前版本，点击进入更新日志；有新版本时出现提示圆点 |
| 顶部导航右侧 | 版本号徽标，点击进入更新日志 |
| 设置页「关于 HTMLhub」 | 显示当前版本、版本数量与变更总数 |

## 未读提示机制

- 用户打开「更新日志」页面后，当前版本会写入 `localStorage` 的 `htmlhub_last_seen_version`。
- 当 `APP_VERSION` 与该值不一致时，侧边栏与顶栏会显示新版本提示圆点。
- 因此发布新版本时只需修改 `changelog.ts`，未读提示会自动生效。

## 自动化校验

`src/data/__tests__/changelog.spec.ts` 会校验：

- 版本号唯一且符合语义化版本规范
- 版本按日期严格倒序
- 每个版本都有标题、日期与至少一条变更
- `APP_VERSION`、`package.json` 与最新记录三者一致
- 统计数字与实际条目一致
