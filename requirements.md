# HTML Viewer 项目需求文档

## 1. 项目概述

本项目旨在创建一个能够管理、索引和展示大量独立HTML文件的应用。用户只需将HTML文件放置在指定文件夹中，系统将自动进行分类、索引，并通过一个用户友好的界面进行呈现，方便用户浏览和查找。

## 2. 核心需求

### 2.1 文件管理与索引

*   **文件扫描**：
    *   使用构建时脚本（Node.js）扫描指定的 `public/html-files` 目录下的所有子目录和文件。
    *   只索引 `.html` 扩展名的文件。
    *   忽略 `.git`、`node_modules`、`.DS_Store` 等系统文件和目录。
    *   支持递归扫描多层嵌套目录结构。
    *   扫描过程中记录文件的修改时间、文件大小等基本信息。

*   **分类机制**：
    *   每个HTML文件所在的直接父文件夹名称作为其"分类"（Category）。
    *   支持多级分类：如 `docs/tutorials/basic.html` 将被分类为 `docs > tutorials`。
    *   如果HTML文件直接位于根目录下，分类为"未分类"。
    *   分类名称支持中文、英文和数字，自动处理特殊字符。

*   **元数据提取**：
    *   提取文件名（不含扩展名）作为默认"名称"（Name）。
    *   解析HTML文件内容，提取 `<title>` 标签作为显示标题。
    *   提取 `<meta name="description">` 作为文件描述。
    *   提取 `<meta name="keywords">` 作为搜索关键词。
    *   记录文件创建时间、修改时间、文件大小。
    *   生成文件的唯一标识符（基于文件路径的哈希值）。

*   **索引数据结构**：
    ```json
    {
      "files": [
        {
          "id": "unique-hash-id",
          "name": "文件名",
          "title": "HTML标题",
          "description": "文件描述",
          "keywords": ["关键词1", "关键词2"],
          "category": "分类名称",
          "categoryPath": ["一级分类", "二级分类"],
          "filePath": "相对路径",
          "fileSize": 1024,
          "createdAt": "2024-01-01T00:00:00Z",
          "modifiedAt": "2024-01-01T00:00:00Z"
        }
      ],
      "categories": [
        {
          "name": "分类名称",
          "path": ["一级分类", "二级分类"],
          "count": 5,
          "description": "分类描述"
        }
      ],
      "lastUpdated": "2024-01-01T00:00:00Z",
      "totalFiles": 100
    }
    ```

*   **索引生成与更新**：
    *   构建时自动生成 `public/data/index.json` 文件。
    *   支持增量更新：只重新索引修改过的文件。
    *   提供手动重新生成索引的命令。
    *   索引文件压缩存储，减少加载时间。

### 2.2 视图呈现（前端界面）

*   **整体布局**：
    *   采用经典的左侧边栏 + 右侧主内容区域的布局。
    *   顶部导航栏包含搜索框、视图切换按钮、设置按钮。
    *   响应式设计，移动端自动收起侧边栏。

*   **侧边栏（分类导航）**：
    *   使用 Naive UI 的 `n-menu` 组件展示分类树。
    *   支持多级分类的展开/收起。
    *   显示每个分类下的文件数量。
    *   支持分类搜索和快速定位。
    *   提供"全部文件"、"最近添加"、"收藏夹"等特殊分类。

*   **主内容区域**：
    *   **列表视图**：
        *   使用 `n-data-table` 组件展示文件列表。
        *   列包括：文件名、标题、分类、修改时间、文件大小。
        *   支持按任意列排序。
        *   支持多选操作（批量预览、导出等）。
        *   每行显示文件图标、标题、描述预览。
    *   **卡片视图**：
        *   使用 `n-card` 组件以卡片形式展示文件。
        *   每个卡片显示文件标题、描述、分类标签、预览缩略图。
        *   支持网格布局，自适应屏幕大小。
    *   **分页组件**：
        *   使用 `n-pagination` 实现分页功能。
        *   支持每页显示数量调整（10/20/50/100）。

*   **搜索功能**：
    *   顶部搜索框使用 `n-input` 组件，支持实时搜索。
    *   搜索范围：文件名、标题、描述、关键词、分类。
    *   支持高级搜索：按分类筛选、按时间范围筛选、按文件大小筛选。
    *   搜索结果高亮显示匹配关键词。
    *   提供搜索历史和热门搜索建议。

*   **文件预览功能**：
    *   点击文件项弹出 `n-modal` 预览窗口。
    *   预览窗口包含：
        *   左侧：文件信息面板（标题、描述、分类、大小、修改时间等）。
        *   右侧：HTML内容预览区域（使用 iframe 安全加载）。
    *   预览窗口工具栏：
        *   全屏预览按钮。
        *   在新标签页打开按钮。
        *   下载文件按钮。
        *   添加到收藏夹按钮。
        *   分享链接按钮。

*   **交互细节**：
    *   使用 `n-loading-bar` 显示页面加载进度。
    *   文件操作使用 `n-dropdown` 右键菜单。
    *   重要操作使用 `n-popconfirm` 确认对话框。
    *   使用 `n-message` 显示操作结果提示。
    *   支持键盘快捷键：Ctrl+F 搜索、ESC 关闭预览等。

*   **主题与样式**：
    *   支持明暗主题切换。
    *   使用 Naive UI 的主题定制功能。
    *   采用现代化的设计语言，圆角、阴影、渐变等视觉效果。
    *   统一的色彩方案和字体规范。

### 2.3 部署

*   **静态部署**：
    *   项目应生成静态文件（HTML, CSS, JavaScript），可以直接部署到Vercel、Netlify等静态网站托管服务。
    *   **本项目不涉及后端服务，所有功能均通过前端实现。**

## 3. 技术方案

### 3.1 技术栈

*   **前端框架**：Vue 3 (Composition API)
*   **构建工具**：Vite 4+
*   **UI 框架**：Naive UI
*   **状态管理**：Pinia
*   **路由管理**：Vue Router 4
*   **类型检查**：TypeScript
*   **代码规范**：ESLint + Prettier
*   **CSS 预处理器**：SCSS
*   **图标库**：@vicons (Naive UI 推荐)

### 3.2 项目结构

```
html-viewer/
├── public/                     # 静态资源目录
│   ├── html-files/            # HTML文件存放目录
│   │   ├── docs/              # 文档类HTML
│   │   ├── tutorials/         # 教程类HTML
│   │   └── examples/          # 示例类HTML
│   ├── data/                  # 生成的数据文件
│   │   └── index.json         # 索引数据
│   └── favicon.ico
├── src/                       # 源代码目录
│   ├── components/            # 公共组件
│   │   ├── FileList.vue       # 文件列表组件
│   │   ├── FileCard.vue       # 文件卡片组件
│   │   ├── PreviewModal.vue   # 预览弹窗组件
│   │   ├── SearchBar.vue      # 搜索栏组件
│   │   └── CategoryTree.vue   # 分类树组件
│   ├── views/                 # 页面组件
│   │   ├── Home.vue           # 主页
│   │   ├── Search.vue         # 搜索页
│   │   └── Settings.vue       # 设置页
│   ├── stores/                # Pinia 状态管理
│   │   ├── files.ts           # 文件数据状态
│   │   ├── search.ts          # 搜索状态
│   │   └── settings.ts        # 设置状态
│   ├── composables/           # 组合式函数
│   │   ├── useFileData.ts     # 文件数据处理
│   │   ├── useSearch.ts       # 搜索功能
│   │   └── useTheme.ts        # 主题切换
│   ├── utils/                 # 工具函数
│   │   ├── fileUtils.ts       # 文件处理工具
│   │   ├── searchUtils.ts     # 搜索工具
│   │   └── formatUtils.ts     # 格式化工具
│   ├── types/                 # TypeScript 类型定义
│   │   ├── file.ts            # 文件相关类型
│   │   └── search.ts          # 搜索相关类型
│   ├── styles/                # 样式文件
│   │   ├── main.scss          # 主样式
│   │   ├── variables.scss     # SCSS 变量
│   │   └── components.scss    # 组件样式
│   ├── App.vue                # 根组件
│   └── main.ts                # 入口文件
├── scripts/                   # 构建脚本
│   ├── build-index.js         # 索引生成脚本
│   └── dev-server.js          # 开发服务器脚本
├── package.json               # 项目配置
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
├── .eslintrc.js               # ESLint 配置
├── .prettierrc                # Prettier 配置
└── README.md                  # 项目说明
```

### 3.3 核心依赖

```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "naive-ui": "^2.35.0",
    "@vicons/ionicons5": "^0.12.0",
    "fuse.js": "^6.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.3.0",
    "vite": "^4.4.0",
    "typescript": "^5.0.0",
    "vue-tsc": "^1.8.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.45.0",
    "eslint-plugin-vue": "^9.15.0",
    "prettier": "^3.0.0",
    "sass": "^1.64.0",
    "cheerio": "^1.0.0",
    "glob": "^10.3.0"
  }
}
```

### 3.4 构建配置

*   **Vite 配置**：
    *   配置路径别名 (@/ 指向 src/)
    *   配置代理服务器用于开发环境
    *   配置构建优化和代码分割
    *   集成 TypeScript 和 Vue SFC 支持

*   **TypeScript 配置**：
    *   严格模式开启
    *   配置路径映射
    *   支持 Vue SFC 类型检查

*   **ESLint + Prettier**：
    *   Vue 3 + TypeScript 规则集
    *   自动格式化配置
    *   Git hooks 集成

### 3.5 索引生成机制

*   **构建时索引生成**：
    *   使用 Node.js 脚本扫描 `public/html-files` 目录
    *   使用 Cheerio 解析 HTML 文件提取元数据
    *   生成 JSON 索引文件到 `public/data/index.json`
    *   支持增量更新和缓存机制

*   **开发环境热更新**：
    *   监听文件变化自动重新生成索引
    *   Vite 插件集成，无需手动刷新

### 3.6 性能优化

*   **代码分割**：
    *   路由级别的懒加载
    *   组件级别的异步加载
    *   第三方库单独打包

*   **资源优化**：
    *   图片压缩和格式优化
    *   CSS 和 JS 压缩
    *   Gzip 压缩支持

*   **缓存策略**：
    *   静态资源长期缓存
    *   索引数据适当缓存
    *   Service Worker 离线支持（可选）

## 4. 开发流程

### 4.1 环境搭建
1. **初始化项目**
   ```bash
   npm create vue@latest html-viewer
   cd html-viewer
   npm install
   ```

2. **安装依赖**
   ```bash
   # 核心依赖
   npm install naive-ui @vicons/ionicons5 pinia vue-router@4
   
   # 开发依赖
   npm install -D @types/node sass typescript eslint prettier
   ```

3. **配置开发环境**
   - 配置 Vite (vite.config.ts)
   - 配置 TypeScript (tsconfig.json)
   - 配置 ESLint + Prettier
   - 设置 VS Code 工作区配置

### 4.2 开发阶段
1. **项目结构搭建**
   - 创建基础目录结构
   - 设置路由配置
   - 配置状态管理 (Pinia)
   - 设置 Naive UI 主题

2. **核心功能开发**
   - 实现文件扫描脚本
   - 开发索引生成逻辑
   - 构建主界面布局
   - 实现文件列表组件
   - 开发预览功能
   - 添加搜索和筛选

3. **测试与优化**
   - 单元测试 (Vitest)
   - 端到端测试 (Playwright)
   - 性能测试和优化
   - 响应式设计测试

### 4.3 开发命令
```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint

# 格式化代码
npm run format

# 运行测试
npm run test

# 生成文件索引
npm run scan
```

## 5. 部署流程

### 5.1 静态部署
1. **构建准备**
   ```bash
   # 生成最新的文件索引
   npm run scan
   
   # 构建生产版本
   npm run build
   ```

2. **部署选项**
   
   **GitHub Pages**
   ```bash
   # 使用 gh-pages 分支部署
   npm install -D gh-pages
   npm run build
   npx gh-pages -d dist
   ```
   
   **Netlify**
   - 连接 GitHub 仓库
   - 构建命令: `npm run build`
   - 发布目录: `dist`
   - 环境变量配置（如需要）
   
   **Vercel**
   - 导入 GitHub 项目
   - 自动检测 Vite 配置
   - 自动部署和预览
   
   **传统服务器**
   ```bash
   # 上传 dist 目录到服务器
   scp -r dist/* user@server:/var/www/html/
   ```

### 5.2 自动化部署
1. **GitHub Actions 配置**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm ci
         - run: npm run scan
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

2. **持续集成检查**
   - 代码质量检查 (ESLint)
   - 类型检查 (TypeScript)
   - 单元测试执行
   - 构建成功验证

### 5.3 部署后维护
1. **监控和分析**
   - 使用 Google Analytics 或其他分析工具
   - 监控页面加载性能
   - 收集用户反馈

2. **内容更新**
   - 定期运行文件扫描脚本
   - 更新索引数据
   - 重新部署更新内容

3. **版本管理**
   - 使用语义化版本控制
   - 维护更新日志
   - 备份重要配置和数据