# Word Tap

本地优先的英语精读与词汇复习 PWA。导入 TXT、SRT、Markdown、CSV、DOCX、XLSX，或解析无 DRM 的 EPUB、MOBI、AZW3，在上下文中点词、收集生词，并按固定间隔复习。

## 环境

- Node.js 24+
- pnpm 11+

## 开发

```powershell
pnpm install
pnpm dev
```

开发服务器固定运行在 <http://127.0.0.1:5180/>，避免与其他本地项目占用同一个端口。设置页地址为 <http://127.0.0.1:5180/settings>。

OCR 是默认关闭的实验入口。本地开发时显式开启：

```powershell
$env:VITE_ENABLE_OCR_DEMO='true'
pnpm dev
```

生产构建同样通过 `VITE_ENABLE_OCR_DEMO=true` 开启。没有该变量时，原有粘贴、文本、Office 和电子书导入保持不变。

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
pnpm exec playwright test --project=ocr-live
pnpm exec playwright test --project=ebook-live
```

Playwright 会自动构建并在 `http://127.0.0.1:4173` 启动预览。

`ocr-live` 使用浏览器生成的英文页执行真实 Tesseract 识别。`ebook-live` 会读取被 Git 忽略的 `live-fixtures/pride-and-prejudice.epub`、`.mobi` 与 `.azw3`；未提供样本时明确跳过。样本可使用 Project Gutenberg 的公开领域 Pride and Prejudice 文件。

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

### 点词 AI 状态

点词语境解释使用 `validated-progressive` 展示模式：先等待完整模型响应，再通过 Zod 校验，最后按字段渐进展示。这不属于真实网络 SSE。等待或渐进展示期间可以停止生成；取消后不会写入结果或缓存。无 Key、离线、超时、限流、5xx 和非法结构均有独立状态，并且不会影响本地阅读、收藏、复习或导出。

## 本地词典

`public/dictionary/dictionary.json` 是构建产物，来源为 npm 包 `ecdict@0.0.4` 所携带的 [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT) 数据，许可为 MIT。

重新生成 30,000 高频词子集：

```powershell
pnpm dictionary:build
```

脚本默认读取 `node_modules/ecdict/assets/ecdict.csv`，输出词典和 `dictionary-meta.json`。元数据记录源文件哈希、输出哈希、许可和词条数量。

## OCR 与电子书

- `pnpm dev` 和 `pnpm build` 会先运行 `pnpm ocr:sync`，把 Tesseract Worker、WASM Core 和英文模型同步到同源 `public/ocr/`；生成文件不提交到 Git。
- 书页图片只在浏览器内存中预览和识别，不上传到 AI 或远程 OCR，不写入 IndexedDB，也不进入备份。用户确认后的文字才会创建为 `OCR` 内容。
- OCR 支持单张 JPEG、PNG、WebP。模型首次识别时从同源加载并缓存；识别中可停止，失败后可重新选择或改用粘贴文本。
- 电子书入口支持无 DRM 的 `.epub`、`.mobi`、`.azw3`，原文件上限 50 MB，提取文字上限 10 MB。只保存提取后的纯文本与分段，不保存电子书二进制、图片或字体。
- 阅读器顶部 `Aa` 入口可调整字号、边距、行距、字体、首行缩进、亮度和五套主题；偏好全局保存于现有设置记录。

## 数据存储

- 内容、生词、复习记录和设置保存在 IndexedDB。
- 刷新或重新打开应用后恢复。
- JSON 备份包含内容、生词、复习日志和未完成会话，不包含 API Key。
- Markdown 导出适合直接放入 Obsidian。
- Service Worker 预缓存应用壳、字体和本地词典；OCR 模型不进入应用壳预缓存，首次使用后单独缓存。AI 请求不缓存。

## 部署

生成文件位于 `dist/`。生产部署必须使用 HTTPS，并配置 SPA 路由回退到 `index.html`。PWA 离线能力须使用 `pnpm build && pnpm preview` 或生产站点验证，开发服务器不能作为离线证明。

## 范围

当前版本不包含账号、云同步、真实视频平台接口、版权书库、DRM 解密、远程 OCR、多页批量拍书、复杂 SM-2 和悬浮窗。

