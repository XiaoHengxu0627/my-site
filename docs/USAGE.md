## 本地开发

```bash
npm install
npm run dev -- --port 5174
```

- 网站地址：http://localhost:5174/

## 内容替换（不使用 CMS）

内容都在 public/content 下：

- public/content/site.json：站点信息（品牌文字、简介、联系、社交链接等）
- public/content/projects.json：项目列表（标题、年份、封面、详情、画廊、奖项等）

媒体文件建议放在 public/uploads（CMS 默认上传目录）或 public/media（示例素材目录）。

## 内容管理后台（Decap CMS）

后台入口：

- http://localhost:5174/admin/index.html#/

### 本地编辑（推荐）

Decap CMS 的本地后端需要额外启动一个本地服务：

```bash
npx decap-server
```

然后打开后台页面进行编辑，保存后会直接写入 public/content 与 public/uploads。

### 线上编辑（Netlify）

如果你打算在 Netlify 上部署并用后台在线编辑：

- 在 Netlify 启用 Identity 和 Git Gateway
- 确保仓库默认分支与 public/admin/config.yml 中的 branch 一致（默认 main）
- 通过 Netlify Identity 邀请/创建管理员账号登录后台

