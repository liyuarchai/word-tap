# Word Tap API Key 获取与配置指南

Word Tap 通过 OpenAI-compatible `/chat/completions` 调用 AI。AI Key 只保存在当前浏览器的本地 IndexedDB 中，不会进入 Markdown、JSON 备份、日志或测试快照。

## 使用 OpenAI

1. 打开 [OpenAI API Keys](https://platform.openai.com/api-keys) 并登录 OpenAI 账号。
2. 检查 [Billing](https://platform.openai.com/settings/organization/billing/overview) 中的付款方式和 API 额度。
3. 回到 API Keys，选择项目，点击 **Create new secret key**。
4. 给 Key 命名，例如 `Word Tap`，创建后立即复制。
5. 打开 Word Tap 的“设置 → AI 配置”。
6. 填写：
   - 接口地址：`https://api.openai.com/v1`
   - API Key：刚创建的 Key
   - 模型：默认 `gpt-4o-mini`，也可换成账户实际可用的模型
   - 超时：`10s`
7. 保存设置并点击“测试连接”。

ChatGPT 订阅和 OpenAI API 计费通常相互独立。API Key 需要账户具有可用 API 额度；账号地区和付款要求以 OpenAI 官方控制台为准。

## 使用其他兼容服务

Word Tap 接受 OpenAI-compatible Chat Completions 服务。使用其他服务时，请在其控制台创建 Key，然后同时修改：

- 服务商提供的 Base URL
- API Key
- 该服务商实际支持的模型名称

Provider 必须允许浏览器跨域请求 CORS。若 Provider 禁止浏览器请求，Word Tap 会显示网络或 CORS 类错误，并继续使用本地词典和降级功能。

## 使用 DeepSeek

1. 打开 [DeepSeek API Keys](https://platform.deepseek.com/api_keys) 并登录。
2. 按控制台提示充值或确认账户有可用 API 余额。
3. 创建 API Key，并在只显示一次时立即复制。
4. 在 Word Tap 设置页点击“DeepSeek 预设”，或手动填写：
   - 接口地址：`https://api.deepseek.com`
   - API Key：刚创建的 Key
   - 模型：`deepseek-flash`，也可使用账户支持的 `deepseek-v4-pro`
   - 超时：`10s`
5. 保存并测试连接。

DeepSeek 当前官方文档：

- [Your First API Call](https://api-docs.deepseek.com/)
- [Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)

DeepSeek 使用余额扣费；模型和价格可能调整，以官方模型与计费页为准。

## 安全规则

- 不要把 Key 发到聊天、截图、Issue、日志或代码仓库。
- 不要将 Key 写进源码；Word Tap 从设置页读取本地 Key。
- 共用电脑或浏览器时，其他能使用同一浏览器配置的人可能访问本地 Key。
- 一旦 Key 泄漏，立即在 Provider 控制台撤销并创建新 Key。
- 建议为 Word Tap 单独创建 Key，并设置合理的用量限额。

## 常见错误

| 状态 | 含义 | 处理方式 |
| --- | --- | --- |
| 401 | Key 错误、撤销或无权限 | 重新检查 Key 和项目权限 |
| 403 | 无权访问模型或资源 | 检查 Provider 权限与模型访问资格 |
| 429 | 额度不足或请求限流 | 检查 Billing/额度，稍后再试 |
| 5xx | Provider 暂时不可用 | Word Tap 会自动重试一次后降级 |
| 网络/CORS | 浏览器无法访问 Provider | 检查网络、Base URL 和 Provider CORS 支持 |

Word Tap 的“网络请求失败”是浏览器层面的统一降级提示，不等同于电脑一定断网。常见原因是代理/VPN、DNS、TLS 证书、防火墙、浏览器扩展或 Provider 跨域限制。可打开浏览器开发者工具的 Network 面板，查看 `chat/completions` 的具体失败类型。

