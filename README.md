# HTML Manager - 静态 HTML 站点与文件管理系统

HTML Manager 是一个专为静态网页、单页报告、前端 Demo 及多文件站点项目设计的现代化管理与沉浸式预览系统。基于 Vue 3、Vite、TypeScript 与 Naive UI 构建，支持「本地静态扫描」与「Cloudflare R2 云端托管」双通道架构。

---

## 核心特性

- **双通道数据架构**
  - **本地静态模式**：自动递归扫描本地 `public/html-files/` 目录，单 HTML 文件或多层级站点文件夹均可自动建立完整索引与文件树。
  - **云端 R2 模式**：集成 Cloudflare Workers + R2 对象存储，支持免运维的云端静态网站托管、在线上传与跨设备同步。
  - **本地只读安全保护**：本地静态项目自动启用只读模式，展示完整文件目录与容量统计，禁用在线增删操作，确保本地资产安全。

- **灵活的项目上传机制**
  - **多文件组合上传**：支持同时选取多个 HTML、CSS、JS、资源文件打包为项目。
  - **整目录文件夹上传**：支持直接拖拽或选择站点文件夹，保留原始目录层级结构。
  - **智能主入口探测**：自动识别 `index.html` 或项目内主入口 HTML，快速直达页面。

- **沉浸式全屏预览工作台**
  - **双栏工作台布局**：左侧展示项目静态文件树与大小明细，右侧提供高保真网页实时预览。
  - **标准屏幕视口比例**：内置标准桌面（1440 × 900 · 16:10）、全高清大屏（1920 × 1080 · 16:9）、紧凑桌面（1280 × 720 · 16:9）、移动端（375 × 812 · 手机）及 100% 流式自适应多种视口。
  - **智能等比缩放**：支持自适应屏幕尺寸缩放、手动步进缩放（20% ~ 150%）及无损页面刷新。

- **管理与搜索体验**
  - **多维搜索与筛选**：支持按项目名称、分类标签实时模糊搜索与分类聚合。
  - **安全登录认证**：管理控制台配备 JWT 鉴权保护，Token 过期自动提示并重定向。
  - **极简专业设计**：遵循现代无杂质设计风格，全界面使用标准化矢量图标，支持高对比度清晰交互。

---

## 目录结构

```text
html-manager/
├── public/
│   ├── data/
│   │   └── file-index.json       # 本地文件与项目全量索引数据
│   └── html-files/               # 本地静态 HTML 项目放置目录（按分类归档）
├── src/
│   ├── components/
│   │   ├── admin/                # 项目全屏预览与管理工作台
│   │   ├── files/                # 项目卡片、上传弹窗与视图组件
│   │   └── layout/               # 顶部导航栏、侧边栏及主布局
│   ├── stores/                   # Pinia 状态中心（项目数据、搜索、认证等）
│   ├── views/                    # 路由视图（首页、分类、管理后台、登录等）
│   ├── types/                    # TypeScript 类型定义
│   └── utils/                    # 文件解析与格式化工具函数
├── workers/                      # Cloudflare Workers API 与 R2 存储后端
│   ├── src/                      # Worker 路由与业务逻辑
│   └── wrangler.jsonc            # Cloudflare Worker 配置文件
├── scripts/
│   └── scan-files.js             # 本地项目与静态文件扫描生成脚本
├── requirements.md               # 详细需求与设计规范说明
└── vite.config.ts                # Vite 构建与开发配置
```

---

## 快速开始

### 1. 环境准备

- Node.js >= 20.19.0 或 >= 22.12.0
- npm 或 pnpm / yarn

### 2. 安装依赖

```bash
npm install
```

### 3. 本地项目放置与索引生成

将你的 HTML 单文件或完整站点文件夹放置在 `public/html-files/` 对应的分类目录下，例如：

```text
public/html-files/
├── 报告总结/
│   └── 哈基米文化研究.html
└── 数据可视化/
    └── 运营大屏/
        ├── index.html
        ├── css/
        └── js/
```

运行扫描脚本生成索引数据：

```bash
npm run scan
```

> 扫描脚本会自动识别单文件与多文件目录，收集所有静态文件列表（文件名、类型、大小、路径），并生成 `public/data/file-index.json`。

### 4. 启动开发服务器

```bash
npm run dev
```

启动后可在终端给出的本地地址（如 `http://localhost:5173`）中访问使用。

### 5. 构建生产产物

```bash
npm run build
```

构建将依次执行 TypeScript 类型检查与 Vite 生产打包，输出至 `dist/` 目录。

---

## 云端模式配置 (Cloudflare Workers + R2)

如需启用云端托管功能，请配合 Workers 后端使用：

1. **配置环境变量**：在项目根目录创建或修改 `.env` 文件：
   ```env
   VITE_API_URL=https://<your-worker-subdomain>.workers.dev
   ```

2. **后端服务部署**：
   进入 `workers/` 目录并根据配置指引完成部署：
   ```bash
   cd workers
   npm install
   npx wrangler r2 bucket create html-manager-files
   npx wrangler deploy
   ```

3. 更多后端环境细节可参阅 `docs/cloudflare-deployment.md`。

---

## 常用脚本命令

| 命令 | 说明 |
| :--- | :--- |
| `npm run dev` | 启动本地前端开发热重载服务器 |
| `npm run scan` | 扫描 `public/html-files/` 生成本地项目文件索引 |
| `npm run build` | 执行类型检查并构建前端生产静态包 |
| `npm run lint` | 运行 ESLint 进行代码规范检查与自动修复 |
| `npm run type-check` | 执行 Vue 与 TypeScript 静态类型检查 |

---

## 核心技术栈

- **前端架构**：Vue 3 (Composition API / `<script setup>`)
- **构建工具**：Vite
- **UI 组件库**：Naive UI
- **图标系统**：@vicons/ionicons5 矢量图标库
- **状态管理**：Pinia
- **路由管理**：Vue Router 4
- **云端服务**：Cloudflare Workers + Cloudflare R2 对象存储

---

## 许可证

本项目基于 [MIT License](LICENSE) 协议开源。
