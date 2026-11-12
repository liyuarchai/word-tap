# Word Tap

本地优先的英语精读与词汇复习 PWA。导入 TXT、SRT、Markdown、CSV、DOCX 或 XLSX，在上下文中点词、收集生词，并按固定间隔复习。

## 环境

- Node.js 24+
- pnpm 11+

## 开发

```powershell
pnpm install
pnpm dev
```

开发服务器固定运行在 <http://127.0.0.1:5180/>，避免与其他本地项目占用同一个端口。设置页地址为 <http://127.0.0.1:5180/settings>。

生产构建和本地预览：

```powershell
pnpm build
pnpm preview
```

## 质量检查

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

阶段测试可使用 Playwright 项目筛选：

```powershell
pnpm exec playwright test --project=smoke
pnpm exec playwright test --project=visual
pnpm exec playwright test --project=mock
pnpm exec playwright test --project=api
```

Playwright 会自动构建并在 `http://127.0.0.1:4173` 启动预览。

## AI 配置

Word Tap 使用 OpenAI-compatible `POST /chat/completions`。在设置页填写：

- 接口地址，例如 `https://api.openai.com/v1`
- API Key
- 模型名称
- 超时时间

设置页提供 OpenAI 和 DeepSeek 快捷预设。DeepSeek 使用：

- 接口地址：`https://api.deepseek.com`
- 模型：`deepseek-flash`
- API Key：[DeepSeek Platform](https://platform.deepseek.com/api_keys)

API Key 只保存在当前浏览器的 IndexedDB，不进入 Markdown、JSON 或日志。浏览器会直接请求 Provider，因此 Provider 必须允许浏览器 CORS；不足以保证 CORS 的 Provider 会触发明确降级。共用设备上使用本地 Key 存在被同一浏览器环境访问的风险。

无 API Key、断网、超时、限流或响应异常时，本地词典、生词本、复习和导出仍可工作。

完整的获取与安全说明见项目根目录的 [`API-KEY-GUIDE.md`](../API-KEY-GUIDE.md)。

## 本地词典

`public/dictionary/dictionary.json` 是构建产物，来源为 npm 包 `ecdict@0.0.4` 所携带的 [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT) 数据，许可为 MIT。

重新生成 30,000 高频词子集：

```powershell
pnpm dictionary:build
```

脚本默认读取 `node_modules/ecdict/assets/ecdict.csv`，输出词典和 `dictionary-meta.json`。元数据记录源文件哈希、输出哈希、许可和词条数量。

## 数据存储

- 内容、生词、复习记录和设置保存在 IndexedDB。
- 刷新或重新打开应用后恢复。
- JSON 备份包含内容、生词、复习日志和未完成会话，不包含 API Key。
- Markdown 导出适合直接放入 Obsidian。
- Service Worker 预缓存应用壳、字体和本地词典；AI 请求不缓存。

## 部署

生成文件位于 `dist/`。生产部署必须使用 HTTPS，并配置 SPA 路由回退到 `index.html`。PWA 离线能力须使用 `pnpm build && pnpm preview` 或生产站点验证，开发服务器不能作为离线证明。

## 范围

当前 MVP 不包含账号、云同步、真实视频平台接口、版权书库、复杂 SM-2 和悬浮窗。

