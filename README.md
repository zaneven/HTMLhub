# HTMLhub - 现代化静态 HTML 站点与多应用聚合管理平台

一个优雅、高辨识度且即开即用的静态网页、单页报告、前端 Demo 集中管理与沉浸式预览工作台。  
支持**单文件 HTML 报告**与**多层级多文件站点**，提供「纯静态零成本托管」与「Cloudflare 免费云端托管」双通道架构。

---

## 核心特性

- **双通道架构，自由选择**
  - **纯静态模式**：无需任何后端、数据库或云服务器，丢入 HTML 即可自动生成目录与索引，100% 本地化运行，零门槛、零费用。
  - **云端托管模式**：基于 Cloudflare 免费全家桶（Workers + R2 对象存储 + KV 缓存），支持多端在线上传、增量添加文件与跨设备同步。
- **全屏沉浸式预览工作台**
  - **标准屏幕比例**：内置标准桌面（1440 × 900 · 16:10）、全高清大屏（1920 × 1080 · 16:9）、移动端（375 × 812 · 手机）与流式铺满等真实屏幕视口。
  - **智能等比缩放**：页面内容自动适应屏幕大小，支持手动微调放大/缩小（20% ~ 150%）与无损刷新。
  - **固定入口预览**：左侧文件目录树浏览，右侧稳态预览站点主入口，告别传统弹窗的狭窄压抑。
- **强大的文件与站点管理**
  - **支持多文件与目录上传**：支持单文件、多文件组合挑选，以及直接拖拽完整站点文件夹（保留 CSS、JS 等相对路径结构）。
  - **智能主入口探测**：自动识别 `index.html` 或首选 HTML 文件作为项目入口。
  - **本地只读安全保护**：本地静态项目自动开启只读保护，展示完整文件明细与大小统计，避免在线误删本地文件。
- **极简专业交互**
  - 纯矢量图标设计（`@vicons/ionicons5`），无杂质视觉干扰。
  - 支持按项目名、分类实时模糊搜索与分类聚合导航。

---

## 极速上手：选择适合你的部署方式

> 请根据你的实际使用场景选择以下任意一种部署方式：
> - **[方式一：纯静态极简部署（新手推荐 · 零成本）](#-方式一纯静态极简部署新手推荐--零服务器成本)**：适合个人本地整理、内网查看，或直接推送到 GitHub Pages / Vercel 等免费静态托管平台。
> - **[方式二：全功能云端部署（Cloudflare 免费全家桶）](#-方式二全功能云端部署cloudflare-免费全家桶)**：适合需要登录管理后台、在线上传/删除项目、多人协作或跨设备访问。

---

### 方式一：纯静态极简部署（新手推荐 · 零服务器成本）

完全不需要配置任何云服务或后端数据库，从克隆到运行仅需 1 分钟！

#### 1. 克隆项目并安装依赖

```bash
git clone https://github.com/zaneven/HTMLhub.git
cd HTMLhub
npm install
```

#### 2. 放入你的 HTML 项目文件

将需要展示的 HTML 单文件或完整站点文件夹放入 `public/html-files/` 下的对应分类文件夹中：

```text
public/html-files/
├── 报告总结/
│   └── 哈基米文化研究.html
└── 可视化项目/
    └── 数据大屏演示/
        ├── index.html
        ├── css/
        └── js/
```

> **提示**：文件夹名即为分类名称（如“报告总结”、“可视化项目”）。如需增加新分类，直接新建一个文件夹即可。

#### 3. 运行扫描生成索引

```bash
npm run scan
```

> 此命令会自动递归扫描 `public/html-files/`，识别单文件与多文件项目，收集文件数量、体积与类型，并生成 `public/data/file-index.json`。

#### 4. 启动预览或打包发布

- **本地启动预览**：
  ```bash
  npm run dev
  ```
  在浏览器中打开终端显示的本地地址（如 `http://localhost:5173`）即可使用。

- **一键构建生产包**：
  ```bash
  npm run build
  ```
  生成的 `dist/` 文件夹为纯静态文件，可直接拖入 Vercel、Netlify、Cloudflare Pages 或 GitHub Pages，完全免费！

---

### 方式二：全功能云端部署（Cloudflare 免费全家桶）

使用 Cloudflare Workers + R2 对象存储 + KV 缓存，免费额度完全覆盖个人和小团队的日常使用。

#### 1. 安装 Wrangler 并登录

```bash
npm install -g wrangler
wrangler login
```

#### 2. 一键创建 Cloudflare 存储资源

```bash
# 1. 创建 R2 文件存储桶
wrangler r2 bucket create htmlhub-files

# 2. 创建 KV 缓存命名空间（注意记下终端输出的 id）
wrangler kv namespace create FILE_INDEX
```

执行第 2 步后，终端会输出类似：
```text
[[kv_namespaces]]
binding = "FILE_INDEX"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```
打开 `workers/wrangler.toml` 文件，将上述生成的 `id` 替换到 `[[kv_namespaces]]` 的 `id` 字段中。

#### 3. 设置后台管理密码并一键部署后端

```bash
cd workers

# 设置登录密码（根据提示输入你自定义的管理员密码）
npx wrangler secret put ADMIN_PASSWORD

# 一键部署 API 后端
npx wrangler deploy
```

部署成功后，终端会打印出后端 API 访问地址，例如：
`https://htmlhub-api.<你的账号>.workers.dev`

#### 4. 前端配置并启动

返回项目根目录，从模板复制 `.env` 文件：

```bash
cd ..
cp .env.example .env
```

打开 `.env` 文件，填入第 3 步生成的后端 API 地址：

```env
VITE_API_URL=https://htmlhub-api.<你的账号>.workers.dev
```

现在启动前端：

```bash
npm run dev
```

在浏览器中打开，点击右上角「登录」，输入你在第 3 步设置的密码，即可体验完整的多文件上传、文件夹拖拽、在线增删及实时云端同步功能！

---

## 常见问题 (FAQ)

### Q1: 登录管理后台的默认账号和密码是什么？
> 本系统采用**单管理员密码认证机制**，无需输入用户名/账号。
> - 密码在部署后端时通过 `npx wrangler secret put ADMIN_PASSWORD` 命令设置；
> - 如果需要修改密码，重新执行该命令输入新密码即可秒级生效，无需重新部署。

### Q2: 本地静态项目和云端项目可以同时存在吗？
> **可以！**
> 系统支持**双通道混合展现**。如果配置了云端 API，首页会同时聚合显示本地已扫描的项目和云端 R2 中的项目：
> - **本地静态项目**：标记为 `本地静态 (只读)`，可以在线查看完整文件树与预览页面，但前端无法也禁止在线增删本地磁盘文件，保证本地资产安全；
> - **云端项目**：标记为 `云端 R2`，支持在线追加文件、上传新版本和删除。

### Q3: 上传项目时，怎么指定网页的首页入口？
> 系统会自动在上传的文件列表中查找 `index.html` 或首选 HTML 文件作为主入口。进入全屏工作台后，右侧会自动呈现该入口的渲染结果。

### Q4: 怎样给后端绑定自己的独立自定义域名？
> 如果你有自己在 Cloudflare 托管的域名，只需编辑 `workers/wrangler.toml`，取消 `routes` 注释并填入你的域名：
> ```toml
> routes = [
>   { pattern = "api.yourdomain.com", custom_domain = true }
> ]
> ```
> 然后重新执行 `npx wrangler deploy` 即可自动完成 SSL 证书签发与 DNS 解析。

---

## 常用开发命令

| 命令 | 说明 |
| :--- | :--- |
| `npm run dev` | 启动本地开发热重载服务器 |
| `npm run scan` | 扫描本地 `public/html-files/` 生成静态索引数据 |
| `npm run build` | 执行严格 TypeScript 类型检查并构建生产静态包 |
| `npm run lint` | 运行 ESLint 进行代码规范检查与自动修正 |
| `npm run type-check` | 执行 Vue 与 TypeScript 静态类型检查 |

---

## 项目目录结构

```text
html-manager/
├── public/
│   ├── data/
│   │   └── file-index.json       # 扫描生成的本地项目索引文件
│   └── html-files/               # 本地静态 HTML 项目分类存放目录
├── src/
│   ├── components/
│   │   ├── admin/                # 项目全屏预览与文件管理工作台
│   │   ├── files/                # 项目卡片、上传弹窗与视图组件
│   │   └── layout/               # 顶部导航、侧边栏及主布局
│   ├── stores/                   # Pinia 状态中心（文件列表、搜索、鉴权）
│   ├── views/                    # 页面视图（首页、分类视图、登录、管理后台）
│   ├── types/                    # TypeScript 类型定义
│   └── utils/                    # 文件识别与工具库
├── workers/                      # Cloudflare Workers API 与 R2 存储后端
│   ├── src/                      # 后端接口与鉴权逻辑
│   ├── wrangler.toml             # Cloudflare 配置文件
│   └── wrangler.toml.example     # 开源通用配置模板
├── scripts/
│   └── scan-files.js             # 本地项目递归扫描生成脚本
└── vite.config.ts                # Vite 构建配置文件
```

---

## 开源许可证

本项目基于 [MIT License](LICENSE) 协议开源。
