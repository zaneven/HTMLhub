# HTML Manager - 静态HTML文件管理与预览系统

一个基于 Vue 3 + Vite + Naive UI 构建的现代化HTML文件管理和预览系统，支持静态部署和云端模式。

## ✨ 特性

- 🚀 **现代化技术栈**: Vue 3 + Vite + TypeScript + Naive UI
- 📁 **智能文件管理**: 自动扫描和分类HTML文件，支持列表和卡片视图
- 🔍 **强大搜索功能**: 支持关键词、分类多维度搜索和筛选
- 👀 **实时预览**: 点击文件即可预览HTML内容
- 📱 **响应式设计**: 完美适配桌面端和移动端
- 🔐 **登录认证**: 管理后台需要登录，Token 过期自动跳转登录页
- ☁️ **云端模式**: 支持 Cloudflare R2 存储和 Workers API
- 📂 **文件夹上传**: 支持直接选择项目文件夹上传

## 🏗️ 项目结构

```
html-manager/
├── public/                     # 静态资源
│   ├── data/                  # 数据文件
│   │   └── file-index.json   # 文件索引数据
│   └── html-files/           # HTML文件目录
├── src/                       # 源代码
│   ├── components/           # Vue组件
│   ├── views/                # 页面视图
│   ├── stores/               # Pinia状态管理
│   ├── router/               # Vue Router路由
│   └── types/                # TypeScript类型
├── workers/                   # Cloudflare Workers API
│   └── src/                  # Worker 源代码
├── scripts/                   # 构建脚本
│   └── scan-files.js        # 文件扫描脚本
└── docs/                      # 文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0

### 安装与开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生成文件索引
npm run scan

# 构建生产版本
npm run build
```

## 🔐 认证功能

管理后台 (`/admin`) 需要登录才能访问：

- 进入管理页面时自动验证 Token 有效性
- Token 过期时自动跳转到首页重新登录
- 所有管理操作（上传、删除、刷新）都会检测 401 响应

## ☁️ 云端模式

配置 `.env` 文件启用云端模式：

```env
VITE_API_URL=https://htmlmanager-api.your-domain.workers.dev
```

详细部署指南请参考 [Cloudflare 部署文档](docs/cloudflare-deployment.md)。

## 📚 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI组件库**: Naive UI
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **类型系统**: TypeScript
- **云端 API**: Cloudflare Workers + R2

## 📄 许可证

MIT License
