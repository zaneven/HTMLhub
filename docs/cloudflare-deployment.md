# Cloudflare R2 + Workers 部署指南

本指南帮助你将 HTMLviewer 部署到 Cloudflare Pages，并配置 R2 存储和 Workers API 以启用文件上传功能。

## 前提条件

- Cloudflare 账户
- Node.js 18+ 和 npm
- wrangler CLI（Cloudflare 官方命令行工具）

## 步骤 1: 安装 Wrangler CLI

```bash
npm install -g wrangler

# 登录到 Cloudflare
wrangler login
```

## 步骤 2: 创建 R2 存储桶

```bash
# 创建存储桶
wrangler r2 bucket create htmlviewer-files

# 验证创建成功
wrangler r2 bucket list
```

## 步骤 3: 创建 KV 命名空间

```bash
cd workers

# 创建 KV 命名空间（注意：新版 wrangler 使用空格分隔命令）
wrangler kv namespace create FILE_INDEX

# 输出示例:
# ⛅️ wrangler 4.x.x
# 🆕 Creating namespace "htmlviewer-api-FILE_INDEX"
# ✨ Success! Add the following to your configuration:
# [[kv_namespaces]]
# binding = "FILE_INDEX"
# id = "abcd1234..."  <-- 复制这个 ID
```

将输出的 `id` 更新到 `workers/wrangler.toml` 中：

```toml
[[kv_namespaces]]
binding = "FILE_INDEX"
id = "你的KV命名空间ID"  # <-- 替换这里
```

## 步骤 4: 设置管理密码

```bash
cd workers

# 设置管理密码（作为 secret 存储，不会出现在代码中）
wrangler secret put ADMIN_PASSWORD

# 按提示输入你的管理密码
```

## 步骤 5: 安装依赖并部署 Worker

```bash
cd workers

# 安装依赖
npm install

# 本地测试
npm run dev

# 部署到 Cloudflare
npm run deploy
```

部署成功后，你会看到类似这样的输出：

```
Published htmlviewer-api (x.xx sec)
  https://htmlviewer-api.your-subdomain.workers.dev
```

记下这个 URL，后面需要用到。

## 步骤 6: 配置前端环境变量

在项目根目录创建 `.env` 文件：

```bash
# 从 .env.example 复制
cp .env.example .env
```

编辑 `.env`，填入 Worker URL：

```env
VITE_API_URL=https://htmlviewer-api.your-subdomain.workers.dev
```

## 步骤 7: 构建和部署前端

```bash
# 回到项目根目录
cd ..

# 安装依赖（如果还没有）
npm install

# 构建
npm run build
```

### 部署到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 点击 **Create application** > **Pages** > **Connect to Git**
4. 选择你的 GitHub 仓库
5. 配置构建设置：
   - **Framework preset**: Vue
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. 在 **Environment variables** 中添加：
   - `VITE_API_URL` = `https://htmlviewer-api.your-subdomain.workers.dev`
7. 点击 **Save and Deploy**

## 步骤 8: 验证部署

1. 访问你的 Pages URL
2. 你应该能在页面右上角看到「登录」按钮
3. 点击登录，输入你设置的管理密码
4. 登录成功后，会跳转到管理页面
5. 尝试上传一个 HTML 文件
6. 返回首页，确认新上传的文件显示在列表中

## 常见问题

### Q: 看不到「登录」按钮？

确保 `VITE_API_URL` 环境变量已正确配置。这是在构建时读取的，所以需要重新构建部署。

### Q: 上传文件失败？

1. 检查 R2 存储桶是否正确绑定
2. 检查 Worker 日志：`wrangler tail`
3. 确认 CORS 配置正确

### Q: 如何查看 Worker 日志？

```bash
cd workers
wrangler tail
```

### Q: 如何更新管理密码？

```bash
cd workers
wrangler secret put ADMIN_PASSWORD
# 输入新密码
```

## 目录结构说明

```
workers/
├── src/
│   ├── index.ts          # Worker 入口
│   ├── types.ts          # 类型定义
│   ├── routes/
│   │   └── files.ts      # 文件操作路由
│   └── utils/
│       ├── auth.ts       # 认证工具
│       └── response.ts   # 响应工具
├── wrangler.toml         # Cloudflare 配置
├── package.json
└── tsconfig.json
```

## R2 存储结构

上传的文件按以下结构存储在 R2 中：

```
html-files/
├── 工具/
│   ├── 电表报文解析/
│   │   └── index.html
│   └── 其他工具.html
├── 原型/
│   └── 社区小程序/
│       └── index.html
└── ...
```

## 费用说明

Cloudflare 提供慷慨的免费额度：

- **R2**: 10GB 存储 + 100万次读取/月 免费
- **Workers**: 10万次请求/天 免费
- **KV**: 100k读 + 1k写/天 免费
- **Pages**: 无限静态站点 免费

对于个人项目/小型团队，通常完全免费。
