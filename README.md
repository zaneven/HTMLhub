# HTML Viewer - 静态HTML文件管理与预览系统

一个基于 Vue 3 + Vite + Naive UI 构建的现代化HTML文件管理和预览系统，专为静态部署设计，无需后端支持。

## ✨ 特性

- 🚀 **现代化技术栈**: Vue 3 + Vite + TypeScript + Naive UI
- 📁 **智能文件管理**: 自动扫描和分类HTML文件，支持列表和卡片两种视图
- 🔍 **强大搜索功能**: 支持关键词、分类多维度搜索和筛选
- 👀 **实时预览**: 点击文件即可预览HTML内容，支持新标签页预览
- 📱 **响应式设计**: 完美适配桌面端和移动端，优化的用户体验
- 🎨 **美观界面**: 基于Naive UI的现代化设计，直观的操作界面
- ⚡ **高性能**: 代码分割、懒加载等优化策略，快速响应
- 🔧 **易于部署**: 纯静态文件，支持多种部署方式
- ✅ **批量操作**: 支持文件批量选择、下载等操作
- 🔄 **实时更新**: 自动检测文件变化，实时更新文件列表

## 🏗️ 项目结构

```
html-viewer/
├── public/                     # 静态资源
│   ├── data/                  # 数据文件
│   │   └── file-index.json   # 文件索引数据
│   ├── html-files/           # 公共HTML文件目录
│   └── favicon.ico
├── src/                       # 源代码
│   ├── components/           # Vue组件
│   │   ├── files/           # 文件相关组件
│   │   │   ├── FileListView.vue      # 列表视图组件
│   │   │   ├── FileGridView.vue      # 卡片视图组件
│   │   │   └── FilePreviewModal.vue  # 文件预览弹窗
│   │   ├── layout/          # 布局组件
│   │   │   ├── AppHeader.vue         # 应用头部
│   │   │   ├── AppMain.vue           # 主内容区域
│   │   │   └── FilterModal.vue       # 筛选弹窗
│   │   └── ui/              # UI组件
│   ├── views/               # 页面视图
│   │   ├── HomeView.vue     # 首页
│   │   ├── AboutView.vue    # 关于页面
│   │   └── NotFoundView.vue # 404页面
│   ├── stores/              # Pinia状态管理
│   │   └── files.ts         # 文件状态管理
│   ├── router/              # Vue Router路由
│   │   └── index.ts         # 路由配置
│   ├── types/               # TypeScript类型定义
│   │   └── file.ts          # 文件相关类型
│   ├── utils/               # 工具函数
│   │   └── fileUtils.ts     # 文件处理工具
│   ├── composables/         # Vue组合式函数
│   │   ├── useFiles.ts      # 文件管理逻辑
│   │   └── useSearch.ts     # 搜索功能逻辑
│   ├── data/                # 静态数据
│   │   └── categories.ts    # 分类数据
│   ├── assets/              # 资源文件
│   │   ├── main.css         # 主样式文件
│   │   └── base.css         # 基础样式
│   ├── App.vue              # 根组件
│   └── main.ts              # 入口文件
├── scripts/                  # 构建脚本
│   └── scan-files.js        # 文件扫描脚本
├── html-files/              # HTML文件存储目录
│   ├── examples/           # 示例文件
│   ├── templates/          # 模板文件
│   └── components/         # 组件文件
├── requirements.md          # 项目需求文档
├── package.json            # 项目配置和依赖
├── vite.config.ts          # Vite配置
├── tsconfig.json           # TypeScript配置
├── eslint.config.ts        # ESLint配置
└── README.md               # 项目说明文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 在浏览器中打开 http://localhost:5173
```

### 生产构建

```bash
# 生成文件索引
npm run scan

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📝 使用说明

### 1. 添加HTML文件

将你的HTML文件放置在以下目录中：

- `html-files/examples/` - 示例文件
- `html-files/templates/` - 模板文件
- `html-files/components/` - 组件文件

或者创建自定义目录，然后在 `scripts/scan-files.js` 中配置扫描路径。

### 2. 生成文件索引

```bash
npm run scan
```

此命令会扫描指定目录中的HTML文件，生成包含文件信息、分类、标签等元数据的索引文件。

### 3. 启动应用

```bash
npm run dev
```

应用将自动加载索引数据，展示所有HTML文件的列表。

### 4. 文件管理功能

- **视图切换**: 支持列表视图和卡片视图两种展示方式
- **文件预览**: 点击"查看"按钮预览文件，支持弹窗和新标签页预览
- **文件下载**: 点击"下载"按钮下载单个文件
- **批量操作**: 使用复选框选择多个文件进行批量下载
- **搜索筛选**: 支持按关键词、分类、标签等条件搜索和筛选
- **排序功能**: 支持按文件名、大小、修改时间等字段排序

## 🔧 配置说明

### 文件扫描配置

编辑 `scripts/scan-files.js` 中的配置：

```javascript
const config = {
  // 扫描的根目录
  scanDirs: ['./html-files', './documents', './examples'],
  // 忽略的目录
  ignoreDirs: ['node_modules', '.git', 'dist', 'build'],
  // 支持的文件扩展名
  supportedExtensions: ['.html', '.htm'],
  // 输出文件路径
  outputPath: './public/data/file-index.json',
}
```

### Vite配置

项目使用Vite作为构建工具，配置文件为 `vite.config.ts`：

- 支持TypeScript
- 配置了代码分割优化
- 集成了测试环境配置

## 🧪 测试

```bash
# 运行单元测试
npm run test

# 运行测试UI界面
npm run test:ui

# 类型检查
npm run type-check
```

## 📦 部署

### GitHub Pages

```bash
# 构建并部署
npm run scan
npm run build
npx gh-pages -d dist
```

### Netlify

1. 连接GitHub仓库
2. 构建命令: `npm run scan && npm run build`
3. 发布目录: `dist`

### Vercel

1. 导入GitHub项目
2. Vercel会自动检测Vite配置
3. 自动部署和预览

### 传统服务器

```bash
# 构建项目
npm run scan
npm run build

# 上传dist目录到服务器
scp -r dist/* user@server:/var/www/html/
```

## 🛠️ 开发

### 代码规范

项目使用ESLint + Prettier进行代码规范化：

```bash
# 代码检查和自动修复
npm run lint

# 代码格式化
npm run format
```

### 项目优化

项目已进行以下优化：

- 移除了未使用的默认Vue组件和图标
- 清理了重复的CSS样式定义
- 优化了组件结构和代码复用
- 统一了文件操作界面设计

### 添加新功能

1. 在 `src/types/` 中定义TypeScript类型
2. 在 `src/components/` 中创建Vue组件
3. 在 `src/stores/` 中管理状态
4. 在 `src/views/` 中创建页面视图
5. 在 `src/composables/` 中封装可复用逻辑

## 📚 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI组件库**: Naive UI
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **类型系统**: TypeScript
- **样式预处理**: Sass
- **代码规范**: ESLint + Prettier
- **测试框架**: Vitest + Vue Test Utils
- **图标库**: @vicons/ionicons5

## 🎯 核心功能

### 文件管理

- 自动扫描HTML文件并生成索引
- 支持多种文件分类和标签系统
- 提供文件详细信息展示

### 用户界面

- 响应式设计，适配各种屏幕尺寸
- 列表视图和卡片视图切换
- 直观的文件操作按钮设计

### 搜索和筛选

- 实时搜索功能
- 多维度筛选条件
- 智能搜索建议

### 预览功能

- 弹窗预览模式
- 新标签页预览模式
- 支持HTML文件的完整渲染

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [Naive UI 文档](https://www.naiveui.com/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Pinia 文档](https://pinia.vuejs.org/)

## 📞 支持

如果你在使用过程中遇到问题，可以：

1. 查看 [Issues](../../issues) 中是否有类似问题
2. 创建新的 [Issue](../../issues/new) 描述你的问题
3. 联系维护者

---

**享受使用HTML Viewer！** 🎉
