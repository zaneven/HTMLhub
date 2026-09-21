# HTMLhub 全新 UI 风格与设计规范 (Design System Specification)

> 版本：v2.0-Alpha  
> 风格代号：**Nebula TechCraft（星云极客·流光质感工坊）**  
> 适用平台：桌面端 (Desktop)、平板 (Tablet)、移动端 (Mobile)

---

## 1. 设计哲学与愿景 (Design Philosophy)

HTMLhub 作为一款面向开发者、技术创作者和独立开发者的静态/云端 HTML 资源管理系统，原有的 Naive UI 默认偏企业后台的朴素绿色风格缺乏灵感激发感和现代感。

全新的 **Nebula TechCraft** 风格融合了 **Linear 的极简高质感**、**Vercel Geist 的硬朗排版** 与 **Raycast / Arc 的通透微光层级**，确立四大核心设计准则：

1. **Crafted & Tactile（精密工坊质感）**  
   摒弃粗糙生硬的扁平化，引入多层细微阴影（Elevation Layers）、微光边框（Luminous Borders, 1px 半透明边框）与精密亚克力毛玻璃质感（Backdrop Blur），提供高级物理触感。
2. **Signal over Noise（高信噪比的信息层级）**  
   核心资产（项目名称、文件类型、来源、分类）一目了然；辅助元数据（文件体积、哈希标识、修改日期）采用等宽代码字体弱化呈现；重要操作（预览、在新窗口打开、管理）提供明确的聚焦发光与悬浮反馈。
3. **Dual Atmosphere（明暗双生光影）**  
   - **深色模式（Nebula Dark）**：以深度灰黑（`#0B0F17` / `#111827`）为基底，叠加星轨微光与霓虹微光边框，降低眼疲劳，沉浸专注。
   - **浅色模式（Lumina Light）**：以冷萃纸白（`#F8FAFC` / `#FFFFFF`）为基底，搭配高质感冷灰分界线与微弱投影，干练清爽。
4. **Pure Vector Iconography（纯粹矢量符号体系）**  
   **绝对杜绝任何 Emoji 字符**，全站采用精密 1.5px~2px 笔画的精雕矢量 SVG 线性/双色图标，保证专业与严谨。

---

## 2. 色彩系统 (Color Tokens)

### 2.1 品牌与主强调色 (Brand & Primary Accent)
以**极光靛蓝 (Hyper Indigo)** 为核心，向**赛博青蓝 (Cyber Cyan)** 演化，形成高科技感的渐变梯度：

| Token 名称 | 十六进制 (Hex) | 语义说明 | 典型场景 |
| :--- | :--- | :--- | :--- |
| `--color-primary-50` | `#EEF2FF` | 最浅色调 / 浅色激活底色 | 浅色模式选中项背景 |
| `--color-primary-100` | `#E0E7FF` | 浅主色边框 / 徽章背景 | 浅色模式 Tag 边框 |
| `--color-primary-400` | `#818CF8` | 明亮强调色 | 深色模式文本链接、聚焦环 |
| `--color-primary-500` | `#6366F1` | 品牌主色 (Brand) | 主按钮悬浮态、高亮徽章 |
| `--color-primary-600` | `#4F46E5` | 核心品牌色 (Core Primary) | 主按钮背景、选中态边框 |
| `--color-primary-700` | `#4338CA` | 深度主色 | 按钮按压态 |
| `--color-gradient-primary` | `linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)` | 动态主渐变 | 重点操作按钮、品牌标牌、流光边框 |

### 2.2 资产源与功能语义色 (Functional & Asset Semantics)
针对 HTMLhub 的两大数据源（云端存储与本地静态文件），设计高辨识度的双色标识：

| 语义类型 | 强调色 (Hex) | 渐变背景 (Glow) | 语义用途 |
| :--- | :--- | :--- | :--- |
| **云端存储 (Cloud)** | `#0284C7` (Sky-600) | `linear-gradient(135deg, #0284C7, #38BDF8)` | Cloudflare R2 / 云端项目标识 |
| **本地文件 (Local)** | `#059669` (Emerald-600) | `linear-gradient(135deg, #059669, #34D399)` | 本地静态扫描 HTML 资产 |
| **成功 (Success)** | `#10B981` (Emerald) | `rgba(16, 185, 129, 0.15)` | 操作成功、连接正常 |
| **警告 (Warning)** | `#F59E0B` (Amber) | `rgba(245, 158, 11, 0.15)` | 未分类、Token 即将过期、云端连接异常 |
| **危险 (Danger)** | `#EF4444` (Rose) | `rgba(239, 68, 68, 0.15)` | 删除文件、清空索引、危险操作 |
| **代码标记 (Code/Mono)** | `#8B5CF6` (Violet) | `rgba(139, 92, 246, 0.12)` | `.html` 格式标识、Hash ID、API 路由 |

### 2.3 表面与中性色层级 (Surface & Neutral Hierarchy)

#### 深色模式 (Nebula Dark Mode)
- **基底背景 (Canvas BG)**: `#0B0F17` (Deep Space)
- **侧边栏与表头 (Header / Sider BG)**: `rgba(15, 23, 42, 0.85)` (Glass Frosting)
- **卡片表面 (Card Surface)**: `rgba(30, 41, 59, 0.65)` (Subtle Glass Layer)
- **悬停浮层 (Card Hover)**: `rgba(30, 41, 59, 0.95)`
- **微光边框 (Luminous Border)**: `rgba(255, 255, 255, 0.08)`
- **聚焦/悬停边框 (Border Active)**: `rgba(99, 102, 241, 0.5)`
- **一级文字 (Text Primary)**: `#F8FAFC`
- **次级文字 (Text Secondary)**: `#94A3B8`
- **弱化文字 (Text Muted)**: `#64748B`

#### 浅色模式 (Lumina Light Mode)
- **基底背景 (Canvas BG)**: `#F8FAFC` (Cool Slate)
- **侧边栏与表头 (Header / Sider BG)**: `rgba(255, 255, 255, 0.88)` (Frosted Glass)
- **卡片表面 (Card Surface)**: `#FFFFFF`
- **悬停浮层 (Card Hover)**: `#FFFFFF` (带 0 10px 25px -5px 阴影)
- **细线边框 (Fine Border)**: `#E2E8F0`
- **聚焦/悬停边框 (Border Active)**: `#818CF8`
- **一级文字 (Text Primary)**: `#0F172A`
- **次级文字 (Text Secondary)**: `#475569`
- **弱化文字 (Text Muted)**: `#94A3B8`

---

## 3. 字体与排版系统 (Typography System)

全站严格遵循清晰的字号、字重与行高层级：

- **正文字体栈 (System Sans)**:
  `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`
- **代码与元数据字体栈 (Mono Data)**:
  `'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

| 级别 | 字号 (px/rem) | 字重 | 行高 | 适用元素 |
| :--- | :--- | :--- | :--- | :--- |
| **Display / H1** | 24px (1.5rem) | 700 (Bold) | 32px | 页面大标题、登录页品牌名 |
| **Heading / H2** | 18px (1.125rem) | 600 (Semibold) | 26px | 模块标题、抽屉/弹窗标题 |
| **Subheading / H3** | 15px (0.9375rem) | 600 (Semibold) | 22px | 卡片项目标题、侧边栏分组标题 |
| **Body (Regular)** | 14px (0.875rem) | 400 (Regular) | 20px | 表格正文、表单项、描述文本 |
| **Body (Medium)** | 14px (0.875rem) | 500 (Medium) | 20px | 按钮文字、分类菜单项 |
| **Caption / Mono** | 12px (0.75rem) | 500 (Medium) | 16px | 状态标签、时间戳、代码标签、体积 |
| **Micro** | 11px (0.6875rem) | 600 (Semibold) | 14px | 键盘快捷键徽标 (`⌘K`)、计数角标 |

---

## 4. 空间、圆角与投影规范 (Elevation & Geometry)

### 4.1 几何圆角规范 (Border Radius)
- **Micro (xs)**: `4px` - 极小徽标、计数标签
- **Control (sm)**: `8px` - 输入框、基础按钮、下拉菜单选项
- **Component (md)**: `12px` - 业务卡片 (Project Card)、统计组件
- **Container (lg)**: `16px` - 弹窗对话框、大型容器、代码预览框
- **Pill (full)**: `9999px` - 胶囊过滤标签、状态指示 Pill、快捷键按键

### 4.2 多层阴影规范 (Shadows & Ambient Glow)
- **Level 1 (Subtle Border Light)**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **Level 2 (Card Idle)**: `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`
- **Level 3 (Card Hover / Dropdown)**: `0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)`
- **Neon Glow (Primary Accent Glow)**: `0 0 20px -3px rgba(99, 102, 241, 0.45)`
- **Cloud Glow (Cyan Accent Glow)**: `0 0 20px -3px rgba(2, 132, 199, 0.4)`

---

## 5. 组件级设计规范 (Component Specifications)

### 5.1 顶部导航栏 (AppHeader)
- 采用 `backdrop-filter: blur(16px)` 半透明毛玻璃。
- 全新集成式搜索框：
  - 左侧集成优雅的放大镜矢量 SVG；
  - 右侧内置 `⌘ K` 快捷键微型胶囊标牌；
  - 聚焦时展开温润外发光环 (`box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2)`)。
- 快速切换操作区：排序切换、视图模式（网格/列表分段胶囊按钮）、明暗模式切换器、云端登录状态头像/药丸指示。

### 5.2 侧边栏导航 (AppSidebar)
- 品牌区：渐变动态 Logo 符号 + 渐变文字 `HTMLhub`。
- 快速仪表板部件：双指标迷你胶囊（总分类数 / 活跃项目数），采用轻质感玻璃卡片包装。
- 分类树项：
  - 统一左侧目录矢量图标；
  - 激活态具备竖向霓虹指示条（Left Indicator Strip）与柔和背景填充；
  - 右侧配有等宽计数字符胶囊。

### 5.3 项目卡片 (ProjectCard - Grid View)
- 高信噪比桌面级技术卡片架构：
  - **头部 (Header)**：文件类型矢量图标（支持语义色高亮）、项目全名（加粗高对比、超长省略）、右上角双通道来源标签（`云端 R2` 或 `本地静态`，带矢量图标）；
  - **元信息属性区 (Card Meta Body)**：摒弃冗余虚假的代码视窗剪影，采用紧凑多维属性徽章组（`.card-meta-chips`）：包含最后修改相对时间（带时钟矢量小图标）、等宽文件体积胶囊、状态指示小绿点（“已同步”/“就绪”）；
  - **分类路径 (Category Path)**：微型路径导航芯片，清晰展现项目层级关系；
  - **底部动作区 (Action Footer)**：
    - 次要操作：一键快捷复制直链按钮、外部新窗口打开图标按钮；
    - 主操作按钮：“打开”高亮主按钮（带眼睛或进入矢量图标）。
- 动效反馈：悬停时平滑向上浮动 4px，边框自发光平滑过渡，顶部 2px 渐变流光渐显。

### 5.4 列表视图行 (ProjectRow - List View)
- 高信噪比桌面级排版：
  - 第一列：文件类型矢量图标 + 项目名称（粗体）+ 扩展名标签（`.html`）；
  - 第二列：所属分类面包屑胶囊；
  - 第三列：来源类型（云端/本地带色圆点）；
  - 第四列：修改时间；
  - 第五列：操作按钮组（预览、打开、更多）。

### 5.5 状态与反馈规范
- **加载状态 (Skeleton)**：采用流光掠影动画 (Shimmer Skeleton Effect)，避免呆板纯色。
- **空状态 (Empty State)**：采用细腻的空文件夹线稿矢量插画 + 一键刷新或创建建议。
- **消息提示 (Toast)**：深色亚克力悬浮条，带高饱和度状态小圆点与平滑缓动。

---

## 6. Naive UI 深度适配方案 (`themeOverrides`)

通过 Naive UI 的 `n-config-provider` 全局注入精准定制参数：

```typescript
export const darkThemeOverrides = {
  common: {
    primaryColor: '#6366F1',
    primaryColorHover: '#818CF8',
    primaryColorPressed: '#4F46E5',
    primaryColorSuppl: '#4F46E5',
    infoColor: '#06B6D4',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    errorColor: '#EF4444',
    baseColor: '#0B0F17',
    cardColor: 'rgba(30, 41, 59, 0.7)',
    modalColor: '#111827',
    popoverColor: '#1E293B',
    borderRadius: '10px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  Card: {
    borderRadius: '12px',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  Button: {
    borderRadiusMedium: '8px',
    fontWeight: '500',
  },
  Input: {
    borderRadius: '8px',
  }
}
```

---

*文档完结。具体全套组件的可视化展示请查看交互式预览文件：`public/design-system-preview.html`。*
