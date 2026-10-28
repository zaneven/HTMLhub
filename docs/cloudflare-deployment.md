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

# 设置分享签名密钥（建议单独设置，用于给免密链接 / 会话 Cookie 签名）
wrangler secret put AUTH_SECRET
```

> `AUTH_SECRET` 同时作为分享密码哈希的 pepper：即使 KV 数据泄露，没有该密钥也无法离线穷举 4 位短码。
> 未设置时会回退到 `ADMIN_PASSWORD`，此时修改管理员密码会让所有分享链接立即失效。

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

## 分享访问控制（项目级密码）

Worker 已内置项目级访问保护，无需额外资源。核心行为：

| 场景 | 结果 |
| :--- | :--- |
| 未设置分享 | `/r2/...` 公开访问，`Cache-Control: public` |
| 已设置密码 | 文档导航返回密码页（401），CSS / JS / 图片等子资源返回 401 |
| 输入正确密码 | 种 `HttpOnly; Secure; SameSite=Lax` Cookie，默认 7 天或跟随分享有效期 |
| 访问带 `?k=` 的免密链接 | 校验签名 → 302 到去掉 `k` 的 URL，避免令牌留在地址栏与 Referer |
| 分享到期 | 返回 410「分享已结束」，不会自动恢复公开 |
| 重置密码 / 撤销 | 版本号递增，旧密码、旧链接、旧会话全部立即失效 |
| 管理员工作台预览 | `POST /api/share/preview` 签发 5 分钟令牌，不受分享有效期影响 |

接口一览（管理接口需 `Authorization: Bearer <管理员 token>`）：

```bash
# 创建 / 重置（password 省略即自动生成 4 位字母数字码；ttlSeconds: 0 为永久）
curl -X PUT https://<API>/api/share \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"path":"html-files/原型/Demo","ttlSeconds":604800}'

# 查看状态（不返回明文密码）
curl "https://<API>/api/share?path=html-files/原型/Demo" -H "Authorization: Bearer <token>"

# 撤销
curl -X DELETE "https://<API>/api/share?path=html-files/原型/Demo" -H "Authorization: Bearer <token>"

# 访客解锁（无需鉴权）
curl -X POST https://<API>/api/share/unlock \
  -H "Content-Type: application/json" \
  -d '{"path":"html-files/原型/Demo","password":"AB3K"}'
```

注意事项：

- **同站部署**：Hub 与 API 应位于同一主域（如 `html.getprompt.top` + `htmlmanager-api.getprompt.top`）。跨站场景下 Safari 会拦截 iframe 内的第三方 Cookie，表现为「密码输对了但预览资源 401」。
- **限流**：单 IP 10 次 / 10 分钟，单项目 30 次 / 10 分钟。4 位码约 105 万组合，务必保留限流与较短有效期。
- **缓存**：受保护项目的响应为 `Cache-Control: private, no-store`，`/api/content` 同样改为 `no-store`。
- **4 位码的边界**：它能挡住随手访问与链接扩散，但不是强密码；高敏内容请用 6 位以上或自定义长密码。
- **静态模式不支持**：纯静态部署没有服务端，请使用 Cloudflare Pages Functions 做整站口令，或改用云端模式。

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
│   │   ├── files.ts      # 文件操作路由
│   │   └── share.ts      # 分享密码 / 免密链接 / 访问拦截
│   └── utils/
│       ├── auth.ts       # 认证工具
│       ├── share.ts      # 密码哈希、令牌签名、Cookie、限流键
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
