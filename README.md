# API合集工具

一个静态 API 导航工具，参考 `public-apis` 的 README 表格格式生成数据，并为每个 API 增强用途、使用方法、请求示例、接入建议和注意事项。

## 数据源

优先读取：

```text
C:\Users\mo\Downloads\public-apis-master\public-apis-master\README.md
```

如果本地参考项目没有 API 列表，会自动从官方 public-apis README 拉取数据并生成本地 JSON。

## 运行

```powershell
npm run build
npm start
```

打开：

```text
http://127.0.0.1:8092/
```

## 验证

```powershell
npm test
```

## GitHub Pages 部署

仓库包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 后，Actions 会重新生成 API 数据并把 `public/` 部署到 GitHub Pages。

## 文件说明

- `scripts/build-data.mjs`：解析 public-apis Markdown 表格，生成增强版 `public/data/apis.json`
- `public/index.html`：应用页面
- `public/assets/app.js`：搜索、分类、筛选、详情交互
- `public/assets/styles.css`：界面样式
- `tests/verify.mjs`：构建结果验证
