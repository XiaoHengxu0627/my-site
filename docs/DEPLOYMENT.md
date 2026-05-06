## 构建

```bash
npm install
npm run build
```

产物目录：dist/

## 部署（静态托管）

该项目是纯静态前端站点（React + Vite），任何静态托管都可以：

### 方案 A：Netlify / Vercel（推荐）

- Build command：`npm run build`
- Output directory：`dist`
- SPA 重写规则：将所有路径重写到 `/index.html`

如果你需要 Decap CMS 在线编辑：

- 建议使用 Netlify，并启用 Identity + Git Gateway
- 后台地址：`/admin/index.html#/`

### 方案 B：自建服务器（Nginx）

1) 上传 dist/ 到服务器，例如：`/var/www/portfolio`

2) Nginx 配置示例（核心是 SPA fallback）：

```nginx
server {
  listen 80;
  server_name example.com www.example.com;

  root /var/www/portfolio;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

3) 重新加载 Nginx 配置后访问域名即可。

## 域名绑定（通用步骤）

- 在域名服务商添加 DNS 解析
  - 使用托管平台：按平台给的 CNAME/A 记录添加
  - 自建服务器：A 记录指向服务器公网 IP
- 配置 HTTPS
  - 托管平台通常可一键开启
  - 自建服务器可用 Let’s Encrypt（Certbot）签发证书

