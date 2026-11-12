# Word Tap MVP 开发与维护计划

> 文档类型：生产开发计划、任务台账与验收记录  
> 计划版本：v4.2  
> 当前迭代：R2：AI 词义解释状态机  
> 状态：阶段完成，等待用户审阅  
> 最后更新：2026-11-13  
> 目标目录：`E:\ai\word tap\app`  
> 需求基线：[PRD.md](./PRD.md)  
> 视觉基线：`yuanxing/PRD-原型设计.zip`

## 0. 文档维护规则

本文件是 Word Tap MVP 开发工作的唯一计划入口，后续持续在原文件维护。

1. 开始任务时将对应状态改为“进行中”；完成后勾选任务，并补充实际产物或测试证据。
2. 每次开发结束后更新顶部“最后更新”、当前阶段、完成比例、下一任务和文末变更记录。
3. 范围变化必须先更新 PRD；技术方案变化必须在“决策记录”中说明原因和影响。
4. 无法完成的事项标记为“阻塞”或“延期”，保留下一步处理动作，不直接删除。
5. 任务只有在实现、验证和文档记录均完成后才能标记完成。
6. 已知未完成或未验证的事项不得以“基本完成”代替。
7. 本文件是唯一计划入口；内部修订号、阶段状态和变更记录用于保留历史，不创建平行计划文件。
8. R0 只做计划基线与范围锁定，不修改 `app/src` 业务代码。

## 1. 当前状态

| 项目 | 当前值 |
| --- | --- |
| 当前阶段 | R2：AI 词义解释状态机（完成，待用户审阅） |
| 已完成任务 | MVP 阶段一至阶段三完成；R0、R1、R2 完成 |
| 当前阻塞 | 无 |
| 下一任务 | 用户审阅 R2；未确认前不进入 R3 |
| 生产工程 | `app/` 已创建并可构建 |
| Git 仓库 | 根目录已初始化，分支 `main`，首次提交 `4b675a0` |
| 可用运行时 | Node.js 24.22.1、pnpm 11.25.0 |
| npm | 当前 PATH 中不可用；统一使用 pnpm |
| 原型状态 | 已有静态 HTML 交互原型，使用 localStorage 和模拟 AI，仅作为视觉与交互基准 |

## 1.1 阶段状态总表

| 阶段 | 状态 | 开始时间 | 完成时间 | 最近测试结果 | 测试证据 |
| --- | --- | --- | --- | --- | --- |
| 阶段一：基础框架与路由 | 完成 | 2026-11-04 | 2026-11-04 | 5 类门禁全部通过 | 见 13.2 |
| 阶段二：差异化模块 UI | 完成 | 2026-11-04 | 2026-11-04 | visual、axe、零位移和 UI 测试通过 | 见 13.2 |
| 阶段三：AI 模拟与本地数据持久化 | 完成 | 2026-11-04 | 2026-11-04 | 词典、单元测试和 mock E2E 通过 | 见 13.2 |
| 阶段四：真实 API、PWA 与发布验收 | 阻塞 | 2026-11-04 | — | 连接成功，等待真实精析复测 | 见 13.2 |

## 1.2 新迭代状态总表

| 阶段 | 状态 | 开始时间 | 完成时间 | 说明 |
| --- | --- | --- | --- | --- |
| R0：计划基线与范围锁定 | 完成 | 2026-11-13 | 2026-11-13 | 用户已确认 R0，R1 作为独立 Goal 启动 |
| R1：核心闭环可信度与可访问性修复 | 完成 | 2026-11-13 | 2026-11-13 | 46 个单元/组件测试、7 个 E2E、lint、typecheck、build 全部通过 |
| R2：AI 词义解释状态机 | 完成 | 2026-11-13 | 2026-11-13 | 62 个单元/组件测试、12 个 E2E、lint、typecheck、build 全部通过 |

## 1.3 当前活跃迭代：R0 计划基线与范围锁定

### R0 目标

基于当前实现建立下一阶段的唯一执行基线，锁定范围、文件白名单、实施决策、验收标准和测试门禁，避免 Goal 执行时自行扩大范围。

### R0 边界

- 唯一允许修改的文件：`E:\ai\word tap\DEVELOPMENT-PLAN.md`
- 不修改任何 `app/src`、`app/tests`、配置、依赖或构建产物。
- 不新增依赖。
- 不创建 `DEVELOPMENT-PLAN-2.md` 或其他计划副本。
- 不创建 Git 提交。
- 不执行 R1 或后续阶段。
- 不处理账号、云同步、聊天、社交或排行榜。

### R0 只读审查基线

- Git 工作区在 R0 更新前干净，当前提交为 `4b675a0 chore: initialize Word Tap MVP`。
- 阅读器已实现本地词典先展示、AI 异步补充、词卡侧栏/底部面板、虚拟列表与离线降级。
- 生词、复习、导出均由独立本地数据层驱动，AI 不参与事务提交。
- 现有设计令牌覆盖颜色、字体、阴影与核心缓动，但间距、字号、圆角和部分触控尺寸仍硬编码。
- `--ink-3: #9a9ea6` 在 `--paper: #f7f5ef` 上对比度为 **2.46:1**，不满足 11–13 px 辅助文字的可读性要求。
- 当前测试在 2026-11-13 重新运行：43/43 单元与组件测试通过，lint、typecheck、build 通过。
- 当前 E2E 覆盖 smoke、视觉、Mock 闭环、API 降级和离线，但只拦截 `critical` axe 问题，并排除单词按钮的 44 px 检查。

### R0 退出标准

- 本文档明确 R1 的全部实施决策、允许修改文件、禁止事项、测试门禁和验收标准。
- 原有 MVP 阶段、实际测试记录、决策记录和变更记录完整保留。
- 用户明确确认 R1 范围后，R0 状态才能改为“完成”，R1 才能启动 Goal。

## 1.4 当前阶段：R1 核心闭环可信度与可访问性修复

> 状态：完成。用户已授权 `LibraryPage.tsx` 的窄范围 ARIA 修复，全部测试门禁通过。

### R1 目标

在不改变产品边界和数据库业务结构的前提下，使点词学习闭环更可信、更易访问：

1. 打通“已在生词本 · 查看”，跳转到生词本并打开对应词卡。
2. 点词、翻译和精析只发送当前词/当前句及最多前一段、后一段，不发送全文。
3. 翻译和精析增加请求取消、请求序号和成功结果缓存，丢弃迟到响应。
4. AI 缓存键包含 Provider、模型、操作、目标词/句和有界上下文；读取缓存必须通过 Schema 校验。
5. 本地词典、生词本、复习和导出始终不被 AI 阻塞。
6. 无 Key、断网、超时、限流和格式异常时保留完整本地流程。
7. 修复辅助文字对比度、隐藏顶部栏的键盘焦点和移动端主要触控目标。
8. axe 测试必须拦截 `serious` 和 `critical`。
9. 不修改 Dexie 业务表结构，不破坏现有内容、生词、复习和备份数据。
10. API Key 不进入日志、测试快照、Markdown 或 JSON。

### R1 允许修改的文件

- `app/src/features/reader/ReaderPage.tsx`
- `app/src/features/reader/WordPanel.tsx`
- `app/src/features/reader/MarkdownBlock.tsx`
- `app/src/features/vocabulary/NotebookPage.tsx`
- `app/src/features/library/LibraryPage.tsx`（仅列表现有 ARIA 语义修复）
- `app/src/services/ai.ts`
- `app/src/domain/schemas.ts`
- `app/src/domain/types.ts`
- `app/src/styles/tokens.css`
- `app/src/styles/app.module.css`
- `app/src/styles/global.css`
- `app/tests/e2e/app.spec.ts`
- `app/src/services/ai.test.ts`
- 必要时新增 `ReaderPage` 或 `WordPanel` 组件测试

如果实现发现必须修改白名单外文件，先停止并说明原因；不得擅自扩大范围。

### R1 明确不做

- 不增加账号、登录、云同步、聊天、社交、排行榜。
- 不新增依赖，除非先说明必要性并获得用户批准。
- 不向 AI 发送整篇正文、内容标题或无关段落。
- 不把 AI 推理结果展示成本地词典结果。
- 不改变内容、生词、复习、设置和备份的现有数据契约。
- 不执行 R2 或任何后续阶段。
- 不自动创建 Git 提交。

### R1 实施步骤

#### R1-01 已收藏词卡的查看跳转

- `WordPanel` 在 `saved` 存在时，主按钮必须表现为“已在生词本 · 查看”。
- 点击后导航到 `/notebook?card=<vocabularyId>`。
- `NotebookPage` 读取 `card` 查询参数；数据加载完成后查找对应词卡并打开现有编辑抽屉。
- ID 不存在或词卡已删除时，停留在生词本并提示“词卡不存在或已删除”，不得报错。
- 关闭抽屉后清除查询参数，避免刷新时重复打开。
- 不改变词卡 ID、内容、备注或复习状态。

#### R1-02 有界 AI 上下文

- `ReaderPage` 按当前段索引生成 `contextBefore` 和 `contextAfter`。
- 只允许取相邻各一个 `Segment`；首段无前文，末段无后文。
- 每个相邻上下文最多截取 500 个 Unicode 字符；当前句只使用点击所在段落。
- `WordPanel`、翻译和精析均使用同一有界上下文规则。
- 请求体不得包含 `content.rawText`、内容标题、整段列表或远端段落。
- UI 只显示当前句；前文/后文仅作为 AI 请求上下文，不额外制造阅读内容。

#### R1-03 请求取消、竞态与缓存

- 每个段落的翻译和精析分别维护 AbortController 与单调递增 requestId。
- 同一操作再次点击时，先中止上一请求，再启动新请求。
- 响应返回后同时校验 requestId、当前段落和操作类型；任一项不匹配即丢弃。
- 组件卸载、切换内容或切换段落时中止未完成请求。
- 点词请求继续由当前词卡生命周期取消；词卡关闭后不得更新已关闭面板。
- 翻译和精析成功后写入本地 AI 缓存；失败、超时、限流和非法响应不写缓存。

缓存键固定为：

```text
ai-cache:v2|operation|normalizedBaseUrl|model|targetOrSentenceHash|contextBeforeHash|contextAfterHash
```

- `targetOrSentenceHash` 对点词使用 `lemma + sentence`，翻译/精析使用当前句。
- `normalizedBaseUrl` 去除末尾斜杠，避免同一 Provider 地址产生不同键。
- 读取缓存时分别使用 `wordExplanationSchema`、`translationSchema`、`analysisSchema` 校验。
- 非法或旧版本缓存视为未命中，不覆盖用户数据，可提示重新生成。
- 缓存升级不改 Dexie 表结构；旧缓存自然失效，用户也可手动清空。

#### R1-04 可访问性与设计令牌

- 将辅助文字颜色调整为 `--ink-3: #6b7078`；该值在纸色背景上的对比度为 **4.57:1**。
- `--ink-3` 用于 11–13 px 时间戳、元信息和导航文字，不再用于低对比度的正文或关键操作。
- `.readerChrome:focus-within` 或等价逻辑必须让隐藏顶部栏在键盘聚焦时恢复可见和可交互。
- Escape、Tab、空格和评分数字键现有行为不得回归。
- 所有非内联主按钮、导航项、输入控件继续满足至少 44×44 px。
- 内联单词按钮不改变正文行高；通过不重叠的伪元素或等价方式提供至少 24×24 px 命中区域，并提供清晰焦点态。
- 移动词卡继续使用底部面板；拖拽扩展属于后续阶段，不在 R1 内实现。
- 不为视觉效果牺牲正文可读性、对比度或键盘操作。

#### R1-05 测试与证据

- 测试必须断言 AI 请求只包含当前词/句与相邻上下文，不包含远端段落标记、`rawText` 或内容标题。
- 使用可控 Promise 验证翻译和精析的迟到响应不会覆盖新请求。
- 使用相同句子、不同 Provider/模型验证缓存键隔离。
- 注入非法缓存载荷，验证不会渲染并回退到重新请求或错误状态。
- 验证已收藏词卡跳转、刷新、关闭和无效 ID 状态。
- 验证顶部栏隐藏后 Tab 聚焦仍可见。
- 验证主控件 44 px、单词命中区域 24 px 和无横向滚动。
- 对内容库、阅读器、生词本、复习和设置执行 axe，`serious` 与 `critical` 均必须为 0。

### R1 数据兼容策略

- 不修改 `WordTapDatabase` 的 Dexie 表定义和版本。
- 不修改 `ContentRecord`、`VocabularyRecord`、`ReviewLog`、`ReviewSession` 的持久化字段。
- 不修改 `wordtap.backup.v1` 备份格式；现有 Markdown/JSON 导出保持可读。
- AI 缓存仅改变键命名空间和读取校验，不属于用户业务数据。
- 设置页 API Key 继续仅保存在 IndexedDB，任何导出、日志、错误文本和测试快照不得包含 Key。
- 本地词典、保存生词、复习评分和导出的成功状态不得依赖任何 AI 请求。

### R1 风险与处理

| 风险 | 处理 |
| --- | --- |
| 相邻上下文导致超长请求 | 仅各取一段且各截断至 500 字符 |
| 多次点击造成旧结果覆盖 | AbortController + requestId + 当前段校验 |
| 更换 Provider 后命中错误缓存 | 缓存键加入 normalizedBaseUrl 和 model |
| 缓存 Schema 升级导致旧数据异常 | 使用 `ai-cache:v2` 命名空间并校验读取 |
| 颜色变深削弱设计层级 | 只调整辅助文字至 AA，正文和装饰层级保持既有灰度体系 |
| 单词命中区扩大导致正文重排 | 命中区必须使用不参与布局的方式实现 |
| 收藏查看跳转影响编辑抽屉 | 复用现有抽屉，不复制新的词卡详情 UI |

### R1 测试门禁

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

### R1 验收标准

- 已收藏词卡能从阅读器直接打开对应生词详情；无效 ID 有明确提示。
- 点词、翻译、精析的请求均不包含全文、内容标题或远端段落。
- 快速连续请求不会出现旧结果覆盖新结果。
- 成功缓存按 Provider、模型和上下文隔离；非法缓存不进入界面。
- 无 Key、断网、超时、429、5xx、空内容或非法 JSON 时，本地词典、收集、复习和导出仍可用。
- 辅助文字对比度不低于 4.5:1；axe serious/critical 为 0。
- 隐藏顶部栏可由键盘恢复；主要触控目标符合约定尺寸。
- Dexie 业务表版本、内容、生词、复习和备份格式未改变。
- 上述五条测试命令全部通过，真实结果写入“13.2 实际测试记录”。

### R1 已知限制

- 主 JavaScript chunk 为 784.80 kB，仍有 Vite 体积提示；代码分割属于后续性能阶段。
- 移动词卡仍为底部面板，拖拽扩展未在本阶段实现。
- 原有阶段四的真实 DeepSeek 精析人工复测仍待用户完成；R1 已通过拦截网络与字段兼容测试覆盖实现契约。

## 1.5 下一阶段：R2 AI 词义解释状态机

> 状态：完成。R1 不重开；R2 状态机、UI 和测试均已通过。

### R2 目标

在现有 Word Tap 点词语境释义上建立完整、可测试的模型行为状态机，清晰区分本地词典、AI 生命周期、缓存、取消和所有失败状态。

本阶段只处理点词 AI 语境解释：

- 不修改 OCR。
- 不增加多模态或图片识别入口。
- 不重构句子翻译和精析的状态机。
- 不增加账号、云同步、聊天、社交或排行榜。

### R2 输出模式决策

当前 AI 请求使用 `stream:false`，返回完整 JSON 后由 Zod 校验。阶段二采用：

```text
validated-progressive
```

即：

1. 等待完整模型响应。
2. 使用 `wordExplanationSchema` 校验完整结构。
3. 校验通过后，按字段渐进展示。
4. 渐进展示完成后写入缓存并进入完成态。

这不是真实网络 SSE。代码类型、注释、README 和 UI 测试名称必须明确标注 `validated-progressive`，不得把字段渐显描述为真实流式传输。

### R2 状态类型

新增 `app/src/features/reader/wordAiStateMachine.ts`，核心类型固定为：

```ts
type DictionaryUiState =
  | { phase: 'loading' }
  | {
      phase: 'ready'
      lemma: string
      definition: string
      meta: string
    }
  | { phase: 'not-found' }
  | { phase: 'error'; message: string }

type AiUiPhase =
  | 'not-configured'
  | 'configured-idle'
  | 'waiting-first'
  | 'streaming'
  | 'complete'
  | 'cache-hit'
  | 'cancelled'
  | 'offline'
  | 'timeout'
  | 'rate-limited'
  | 'server-error'
  | 'invalid-response'
  | 'auth-error'

type AiUiAction =
  | 'configure'
  | 'retry'
  | 'check-network'
  | 'wait'

interface AiUiState {
  phase: AiUiPhase
  transport: 'validated-progressive'
  result?: WordExplanation
  message?: string
  action?: AiUiAction
  httpStatus?: number
  localFallbackAvailable: true
}

interface WordAiSnapshot {
  dictionary: DictionaryUiState
  ai: AiUiState
}
```

`localFallbackAvailable: true` 是 AI 不可用时的固定不变量：AI 状态可以失败，但本地词典、原句、收藏、复习和导出不被禁用。

### R2 状态清单

| # | 状态 | 进入条件 | UI 与后续动作 |
| --- | --- | --- | --- |
| 1 | 本地词典加载中 | 词卡打开 | 本地区显示“正在查询本地词典…”；AI 不先于本地状态完成 |
| 2 | 本地词典已返回 | 查到词条或明确未收录/加载失败 | 显示本地释义、音标、词性或“未收录”；本地区不再等待 AI |
| 3 | 未配置 API Key | 本地结果稳定且 Key 为空 | 显示“未配置 API Key；本地词典仍可使用。”+ 去配置 |
| 4 | 已配置但尚未请求 AI | 本地结果稳定、Key 存在、自动请求启动前 | 内部短暂状态；自动派发请求事件 |
| 5 | AI 等待首字 | 缓存未命中，请求已发出 | 显示“正在结合上下文…”和停止按钮 |
| 6 | AI 流式输出 | 完整结果已通过 Zod 校验，开始字段渐显 | 显示“正在呈现已校验的语境解释…”和停止按钮；不得展示原始 JSON |
| 7 | AI 成功完成 | 四个字段全部显示并验证完成 | 展示完整语境释义、线索、例句和译文 |
| 8 | 命中本地缓存 | `ai-cache:v2` 命中且 Schema 有效 | 立即显示完整结果并标注“已缓存” |
| 9 | 用户主动取消 | 用户点击停止或关闭词卡/卸载 | 中止请求或字段渐显，清空未完成 AI 内容，显示“已停止生成”；不写缓存 |
| 10 | 断网 | `navigator.onLine === false` 或网络失败 | 显示网络原因和检查网络建议；本地流程继续 |
| 11 | 请求超时 | 超时 AbortController 触发，reason 为 timeout | 显示超时信息 + 重试；本地流程继续 |
| 12 | 429 限流 | HTTP 429 | 显示“请求过于频繁或额度受限”+ 稍后重试；本地流程继续 |
| 13 | 5xx 服务错误 | 5xx 且一次重试后仍失败 | 显示“AI 服务暂时不可用”+ 重试；本地流程继续 |
| 14 | 空内容或结构不合法 | 响应为空、JSON 非法、Zod 校验失败 | 显示“AI 返回内容为空或无法校验”+ 重新生成；不展示原始 JSON |
| 15 | AI 不可用但本地继续 | 任一 AI 失败、取消或未配置 | AI 区显示具体原因和动作，本地阅读、收藏、复习、导出保持可用 |

额外保留 `auth-error`：401/403 时提示“API Key 无效或没有模型权限”+ 去设置。它不与 429、5xx 或非法响应混用。

### R2 状态转换

新增 reducer 处理以下事件，禁止在组件中依赖多个互斥布尔值：

```ts
type WordAiEvent =
  | { type: 'DICTIONARY_LOAD_STARTED' }
  | { type: 'DICTIONARY_READY'; lemma: string; definition: string; meta: string }
  | { type: 'DICTIONARY_NOT_FOUND' }
  | { type: 'DICTIONARY_FAILED'; message: string }
  | { type: 'AI_REQUESTED' }
  | { type: 'AI_WAITING_FIRST' }
  | { type: 'AI_REVEAL_STARTED' }
  | { type: 'AI_REVEAL_FIELD'; field: keyof WordExplanation }
  | { type: 'AI_COMPLETED'; result: WordExplanation }
  | { type: 'AI_CACHE_HIT'; result: WordExplanation }
  | { type: 'AI_CANCELLED' }
  | { type: 'AI_OFFLINE' }
  | { type: 'AI_TIMED_OUT' }
  | { type: 'AI_RATE_LIMITED' }
  | { type: 'AI_SERVER_ERROR'; status?: number }
  | { type: 'AI_INVALID_RESPONSE' }
  | { type: 'AI_AUTH_ERROR' }
```

转换约束：

- 本地词典未进入 `ready`、`not-found` 或 `error` 前，不得进入 `waiting-first`。
- `configured-idle` 在自动请求启动后只能进入缓存命中或 `waiting-first`。
- 只有完整响应通过 Zod 校验后才允许进入 `streaming`。
- 只有所有验证字段完成渐显后才允许进入 `complete` 并写缓存。
- `cancelled`、`timeout`、`offline` 和网络失败态不得写入缓存。
- `complete` 和 `cache-hit` 必须保留独立的来源语义。

### R2 请求生命周期

- 词卡维护一个用户取消 AbortController 和一个单调递增 requestId。
- 用户点击停止时使用明确 abort reason，例如 `user-cancel`。
- 超时由 `withTimeout` 使用独立 abort reason，例如 `timeout`。
- 取消和超时不得被映射为同一状态。
- 新词点击、关闭词卡和组件卸载均 abort 当前请求并递增 requestId。
- 响应、字段渐显和缓存写入前都校验 requestId 与当前词卡身份。
- 用户取消后立即停止后续字段渐显；已清空 AI 内容，禁止再 setState 或写缓存。
- 只有渐进展示完成后才写 `ai-cache:v2`；取消时不得缓存已验证但未完成展示的结果。

### R2 文案与可访问性

| 状态 | 固定文案 | 动作 |
| --- | --- | --- |
| 未配置 | 未配置 API Key；本地词典仍可使用。 | 去配置 |
| 等待 | 正在结合上下文… | 停止生成 |
| 渐进展示 | 正在呈现已校验的语境解释… | 停止生成 |
| 缓存 | 语境解释 · 已缓存 | — |
| 主动取消 | 已停止生成；本地释义已保留。 | 重新生成 |
| 断网 | 当前网络不可用；本地词典、收藏和复习不受影响。 | 检查网络 |
| 超时 | AI 未在设定时间内响应；本地释义已保留。 | 重试 |
| 429 | 请求过于频繁或额度受限；请稍后重试。 | 重试 |
| 5xx | AI 服务暂时不可用。 | 重试 |
| 非法响应 | AI 返回内容为空或无法校验。 | 重新生成 |
| 鉴权错误 | API Key 无效或没有模型权限。 | 去设置 |

可访问性要求：

- AI 区块只有一个 `role="status"`、`aria-live="polite"`、`aria-atomic="true"` 的状态区域。
- 只在状态转换时播报，不逐字段播报。
- 相同文案不得因重复渲染再次朗读；使用 transition sequence 或上一播报文案去重。
- 停止、重试、去配置、去设置等动作必须是可键盘访问的按钮或链接。
- 停止按钮在等待和渐进展示阶段可用，触控尺寸至少 44×44 px。
- 错误状态使用文字和动作说明，不只依赖颜色。

### R2 布局与视觉

- 本地词典、原句、AI 语境继续分区；本地结果始终先出现。
- AI 区预留最小高度，骨架、停止、错误和成功态切换不得使词卡主按钮大幅位移。
- 渐进展示仅显示完整校验后的四个用户可理解字段，不显示原始 JSON、请求体或思维链。
- `streaming` 状态的界面文案不使用“真实流式”表述；README 和代码注释标注 `validated-progressive`。
- 缓存状态明确显示“已缓存”，不得把缓存结果标成新生成结果。

### R2 允许修改的文件

- 新增 `app/src/features/reader/wordAiStateMachine.ts`
- 新增 `app/src/features/reader/wordAiStateMachine.test.ts`
- `app/src/features/reader/WordPanel.tsx`
- `app/src/services/ai.ts`
- `app/src/services/ai.test.ts`
- `app/src/domain/types.ts`（仅错误状态/HTTP 状态所需类型）
- `app/src/styles/app.module.css`（仅 AI 状态区和布局稳定）
- `app/tests/e2e/app.spec.ts`
- `app/README.md`（明确 validated-progressive 非 SSE）
- `DEVELOPMENT-PLAN.md`（实施后回写证据）

不新增依赖。不得修改 OCR、多模态、翻译/精析 UI、Dexie 表或备份格式。

### R2 实施步骤

1. 建立状态机类型、初始状态、事件和 reducer。
2. 为词典状态和 AI 状态定义独立初始化与事件。
3. 扩展 `AiClientError` 携带 HTTP 状态；保持 5xx 单次重试及错误分类。
4. 将 `WordPanel` 的 `loading/none/success/error` 和布尔状态迁移到 reducer。
5. 在本地词典进入终态后自动检查缓存；未命中再进入 `waiting-first`。
6. 接入用户取消 AbortController、timeout reason、requestId 和卸载清理。
7. 完整 Zod 校验后按字段渐显；完成后写缓存并进入 `complete`。
8. 增加停止按钮、缓存标签、错误动作和唯一 aria-live 状态区。
9. 增加布局稳定与状态播报去重测试。
10. 运行门禁并回写同一份计划。

### R2 测试计划

- reducer：15 个目标状态及 auth-error 均有明确转换测试。
- reducer：非法事件不破坏当前状态；词典未完成时不能进入 AI 等待。
- 单元：无 Key、离线、超时、429、5xx、鉴权失败、空内容、非法 JSON。
- 单元：取消后无结果写入、无缓存写入、迟到响应被丢弃。
- 单元：缓存命中与网络成功状态不同；非法缓存不展示。
- 组件：本地词典先显示；AI 状态独立；停止按钮只在等待/渐显出现。
- 组件：取消后清空未完成 AI 内容；重试从失败态重新开始。
- 可访问性：唯一 aria-live 状态播报；渐显字段不重复播报；按钮可键盘操作。
- E2E：无 Key、离线、等待中取消、429、5xx、缓存命中、收藏与复习仍可用。
- 视觉：AI 骨架、错误、渐显和成功之间词卡主按钮位移不超过 8 px。

### R2 数据兼容策略

- 不修改 `WordTapDatabase` Dexie 版本和表结构。
- 不修改内容、生词、复习、设置和 `wordtap.backup.v1` 数据契约。
- 缓存继续使用 `ai-cache:v2`，键包含原形/当前句、Provider、模型和前后文。
- API Key 不进入状态快照、日志、测试快照、Markdown 或 JSON。
- 本地词典、收藏、复习和导出不等待 AI 状态机。

### R2 测试门禁

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

### R2 验收标准

- 本地词典加载中与已返回状态清楚可区分，AI 不阻塞本地结果。
- 未配置、已配置未请求、等待、渐显、成功、缓存、取消和所有错误均有代码级状态。
- 用户可在等待和渐显期间停止；取消后不更新结果或缓存。
- 断网、超时、429、5xx、空内容和非法结构都有具体原因与可执行动作。
- AI 失败时原句和本地词典始终保留，收藏、复习和导出仍可用。
- 缓存命中明确标注“已缓存”。
- UI 不出现原始 JSON、完整思维链或伪造的真实流式文案。
- aria-live 只在状态变化时播报，不逐字段重复朗读。
- AI 状态变化造成的词卡主按钮位移不超过 8 px。
- Dexie 表和业务数据格式未改变。
- 上述五条测试命令全部通过，实际结果写入本文件“13.2 实际测试记录”。

### R2 已知限制

- “流式输出”状态是完整响应通过 Zod 校验后的 `validated-progressive` 字段渐显，不是真实 SSE。
- 主 JavaScript chunk 为 792.08 kB，仍有 Vite 体积提示；代码分割属于后续阶段。

## 2. 产品目标与范围

### 2.1 MVP 目标

实现一个无账号、无后端、本地优先的响应式 Web/PWA，完整打通：

```text
导入英文内容 -> 点词查看本地释义和 AI 语境 -> 收集生词
-> 生成今日复习 -> 评分更新到期时间 -> 导出 Markdown/JSON
```

### 2.2 必须实现

- 粘贴或导入 TXT、SRT、Markdown，支持字幕和书页两种阅读形态。
- 本地英汉词典优先，AI 异步补充语境释义和例句。
- 单句机器翻译与按需精析。
- 生词新增、查看、搜索、筛选、编辑和删除。
- 简单固定间隔复习、今日计划和复习会话恢复。
- Markdown 导出、JSON 完整备份、合并导入和覆盖导入。
- AI 无 Key、断网、超时、限流和响应异常时自动降级。
- IndexedDB 本地持久化、PWA 应用壳和离线本地功能。

### 2.3 明确不做

- 账号、登录和云同步。
- 版权书库、真实视频平台 API。
- Android 悬浮窗、桌面置顶悬浮查词。
- 复杂 SM-2 算法。
- 离线大模型或服务端代理。
- 多文件批量导入、词组查询、标签、图表、学习日历。

## 3. 已确认技术决策

| 决策 | 结论 |
| --- | --- |
| 生产工程位置 | 新建 `app/`，根目录保留需求、原型和计划文档 |
| 应用栈 | React 19 + TypeScript + Vite + React Router |
| 包管理器 | pnpm |
| 数据存储 | Dexie + IndexedDB |
| 数据校验 | Zod |
| Markdown | React Markdown + GFM + sanitize，禁止内联 HTML 执行 |
| 长文阅读 | `@tanstack/react-virtual` 分段虚拟列表 |
| PWA | `vite-plugin-pwa`，预缓存应用壳、字体和词典 |
| AI 请求 | 浏览器直接请求 OpenAI-compatible `/chat/completions` |
| AI Key | 保存于本地 IndexedDB，不进入任何导出文件 |
| 本地词典 | 从 ECDICT 生成约 30,000 高频词子集，校验许可 |
| 应用启动数据 | 空数据，不迁移原型 localStorage 模拟数据 |
| 部署形态 | 静态 HTTPS 站点，需要 SPA 路由回退 |

### 3.1 运行时依赖

- `react`、`react-dom`
- `react-router-dom`
- `dexie`
- `zod`
- `react-markdown`
- `remark-gfm`
- `rehype-sanitize`
- `@tanstack/react-virtual`
- `vite-plugin-pwa`

### 3.2 开发与测试依赖

- `vite`、`typescript`
- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `fake-indexeddb`
- `@playwright/test`
- `@axe-core/playwright`
- `eslint` 及 Vite 默认 React/TypeScript 规则
- `tsx`，用于词典构建脚本

不引入 Tailwind、组件库或图标库。视觉样式使用全局 Token、CSS Modules 和内联 SVG。

## 4. 目录结构约定

```text
app/
  public/
    icons/
  scripts/
    build-dictionary.ts
  src/
    app/
      router.tsx
      AppShell.tsx
    components/
    db/
      db.ts
      repositories/
    domain/
      types.ts
      schemas.ts
      parsers/
      dictionary/
      review/
      backup/
    features/
      library/
      reader/
      ai/
      vocabulary/
      review/
      settings/
    styles/
      tokens.css
      global.css
    test/
      fixtures/
  tests/
    e2e/
  package.json
  vite.config.ts
  playwright.config.ts
```

设计参考文件不复制到生产运行目录；只提取需要复用的字体、Token 和交互规则。

## 5. 路由与页面

| 路由 | 页面 | 布局 |
| --- | --- | --- |
| `/` | 重定向至 `/library` | 无内容 |
| `/library` | 内容库首页、导入入口、空状态 | 应用壳 |
| `/reader/:contentId` | 字幕/书页阅读器和词卡 | 全屏 |
| `/notebook` | 生词本列表和编辑抽屉 | 应用壳 |
| `/review` | 今日复习首页、无到期状态 | 应用壳 |
| `/review/card` | 复习卡和完成页 | 全屏 |
| `/settings` | AI 配置、数据管理和关于 | 应用壳 |

桌面导航使用 64px 图标轨；视口小于 640px 时使用 56px 底部标签栏。阅读器和复习卡隐藏常规导航。

## 6. 核心数据模型

```ts
type ContentFormat = 'TXT' | 'SRT' | 'MD';
type ReadingMode = 'subtitle' | 'page';
type Rating = 'forgot' | 'fuzzy' | 'know';

interface Segment {
  id: string;
  index: number;
  text: string;
  kind: 'subtitle' | 'paragraph' | 'h1' | 'h2' | 'h3' | 'quote' | 'list' | 'code';
  startMs?: number;
  endMs?: number;
}

interface ContentRecord {
  id: string;
  title: string;
  format: ContentFormat;
  rawText: string;
  segments: Segment[];
  sourceName: string;
  contentHash: string;
  wordCount: number;
  mode: ReadingMode;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}

interface VocabularyRecord {
  id: string;
  word: string;
  lemma: string;
  contextSentence: string;
  contentId: string | null;
  contentTitle: string;
  segmentId: string;
  segmentIndex: number;
  startMs?: number;
  sourceName: string;
  localDefinition: string;
  aiDefinition?: WordExplanation;
  userDefinition: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  intervalDays: number;
  reviewCount: number;
  lastReviewedAt?: string;
  lastRating?: Rating;
}
```

### 6.1 Dexie 表

| 表 | 主键与索引 | 用途 |
| --- | --- | --- |
| `contents` | `id`, `lastOpenedAt`, `contentHash`, `updatedAt` | 正文、分段、标题和阅读模式 |
| `vocabularies` | `id`, `contentId`, `createdAt`, `dueAt`, `updatedAt` | 生词、上下文快照和复习状态 |
| `reviewLogs` | `id`, `vocabularyId`, `reviewedAt` | 每次评分审计记录 |
| `reviewSessions` | `localDate` | 当天卡列表、已答集合和时间 |
| `settings` | 固定主键 `app` | AI 配置和界面偏好 |
| `aiCache` | `key`, `createdAt` | 稳定的 AI 成功结果缓存 |

数据库必须包含版本和迁移入口。所有业务写入以 IndexedDB 成功为准，界面不能在落盘前显示“已保存”。

### 6.2 数据约束

- 词卡稳定 ID 由 `contentId + segmentId + normalized lemma` 生成。
- 同一内容、同一段、同一原形不得重复添加。
- 删除内容只删除正文，保留生词快照。
- 删除词卡同步删除评分记录，并从当前会话过滤该卡。
- 新词收集时 `dueAt = createdAt`，立即进入今日复习。
- API Key 只存本地，不进入 Markdown、JSON、日志或错误提示。

## 7. 解析、分词与本地词典

### 7.1 内容导入

- 单文件最大 2 MB；超限保留用户输入并显示明确提示。
- 文件使用 `arrayBuffer + TextDecoder('utf-8', { fatal: true })` 解码。
- 接受 `.txt`、`.srt`、`.md`，格式检测结果允许用户手动纠正。
- 标题默认取文件名或首个有效文本行前 40 字，可后续编辑。
- 使用 SHA-256 正文哈希检测重复内容，提示用户“仍然导入”或取消。
- 导入成功后直接进入阅读器；局部解析错误显示警告但保留可用内容。

### 7.2 分段规则

- TXT：空行分段，段内换行合并为空格。
- SRT：一个合法 cue 为一段；支持可选序号、时间轴和正文多行；跳过损坏块并计数。
- Markdown：保留标题、段落、引用、列表和代码块；内联 HTML 不执行，远程图片不加载，代码块不可点词。
- SRT 字幕标签和 ASS 位置标签从展示文本中剥离。

### 7.3 分词与词形

- 字母词元支持撇号缩写和连字符复合词，例如 `don't`、`binge-watched`。
- 查询忽略大小写。
- 先查找精确词，再查词典生成的词形索引，最后进行有限后缀还原。
- 所有词典回退必须经过词典确认，避免将任意 `-ed` 错误还原。
- 界面保留原文词形，同时显示词典原形。

### 7.4 ECDICT 子集生成

- 输入为固定版本或提交号的 ECDICT CSV，原始数据不提交。
- 过滤无中文释义条目，根据频率字段选约 30,000 个高频词。
- 保留 word、phonetic、pos、translation、exchange 字段。
- 生成词形到原形的索引，并固定补充演示词及其词形。
- 生成 `dictionary-meta.json`，记录来源、许可、选取规则、源文件哈希和输出哈希。
- `pnpm dictionary:build` 必须可重复生成相同输出。
- 若许可或字段验证失败，构建直接失败，不生成无来源词典。

## 8. AI 接口与降级

### 8.1 公共接口

```ts
interface WordExplanation {
  contextMeaning: string;
  clue: string;
  example: string;
  exampleZh: string;
}

interface SentenceTranslation {
  translation: string;
}

interface SentenceAnalysis {
  mainClause: string;
  logic: string;
  phrases: string;
  hardPoints: string;
  naturalZh: string;
}

interface AiClient {
  explainWord(input: WordExplainInput, signal: AbortSignal): Promise<WordExplanation>;
  translateSentence(input: SentenceInput, signal: AbortSignal): Promise<SentenceTranslation>;
  analyzeSentence(input: SentenceInput, signal: AbortSignal): Promise<SentenceAnalysis>;
  testConnection(signal: AbortSignal): Promise<void>;
}
```

### 8.2 请求约定

- 地址：`{baseUrl}/chat/completions`，安全拼接，避免重复斜杠。
- 方法：原生 `fetch`，Bearer 鉴权。
- 默认值：`https://api.openai.com/v1`、模型 `gpt-4o-mini`、超时 10 秒。
- 超时允许 5、10、20 秒。
- 温度 0.2，不启用流式输出。
- 系统提示要求只输出合法 JSON、中文解释、例句简短，并将原文当作引用而非指令。
- 点词只发送词、原形、当前句和必要时相邻句；翻译和精析只发送当前句及必要语境。

### 8.3 错误类型

```ts
type AiErrorCode =
  | 'missing-key'
  | 'auth'
  | 'offline'
  | 'timeout'
  | 'rate-limit'
  | 'server'
  | 'invalid-response';
```

| 场景 | 行为 |
| --- | --- |
| 未配置 Key | 本地词典 + 去配置入口 |
| 401/403 | 鉴权失败，保留本地结果，不自动重试 |
| 断网 | 离线提示，本地功能继续可用 |
| 超时/中止 | 取消请求，不显示迟到结果 |
| 429 | 限流提示，不自动重试 |
| 5xx | 自动重试一次后降级 |
| JSON 空值或校验失败 | 显示 AI 暂无可靠结果 |
| 成功缓存 | 优先读取本地缓存，标记“已缓存” |

### 8.4 缓存与并发

- 缓存键为 `operation + word/sentence + model` 的 SHA-256。
- 成功结果不自动过期，可在设置中清除。
- 切换单词或关闭词卡时中止旧请求。
- 每次词卡请求携带请求序号；旧序号结果不得覆盖新单词。
- 保存词卡时立即保存当前快照；AI 随后成功且该卡 AI 快照为空时，可补写，不覆盖用户备注或用户释义。

## 9. 阅读器与交互

- 正文最大宽度 680px，桌面 20px 字号、1.9 行高；移动端 17px、1.85 行高。
- 字幕模式当前段正常显示，非当前段降低透明度，段 hover 时恢复。
- 书页模式关闭字幕聚光，保留舒适排版。
- 顶部栏和底部进度线在 3 秒无操作后淡出，鼠标进入顶部或触摸顶部时恢复。
- 桌面视口不小于 1280px 时词卡固定右侧 360px；窄屏使用最高 55vh、可上拖至 85vh 的底部面板。
- 点词高亮使用荧光笔黄，不移动正文；侧栏出现前后正文边界必须完全一致。
- Escape 关闭词卡或离开临时层；点击词元不能触发整句翻译。
- 翻译不替换原文，可按句折叠；精析只由“深入分析”触发。
- 使用 `prefers-reduced-motion` 时关闭位移和呼吸动画。

## 10. 复习规则

### 10.1 今日计划

- 以浏览器本地时区当天结束时间为截止。
- 选取未删除且 `dueAt <= 今日结束` 的词卡。
- 排序：到期时间升序，其次创建时间升序。
- 每批最多 50 张；超出时显示剩余数量并支持继续生成。
- 同一天重新生成时保留已答集合，并补入新到期卡。

### 10.2 评分

| 评分 | 新间隔 | 下次到期 |
| --- | --- | --- |
| 忘记 | 0 天 | 当前时间 + 10 分钟 |
| 模糊 | 1 天 | 当前时间 + 1 天 |
| 认识 | 3/7/14/30 天阶梯，封顶 30 | 当前时间 + 新间隔 |

- 当前间隔为 0 或 1 时，首次“认识”进入 3 天。
- 当前间隔为 3、7、14 时分别进入 7、14、30 天。
- 评分与日志、会话更新在同一事务完成。
- 已答卡不得重复评分。
- 忘记后 10 分钟到期的卡不在当前会话立即重放，可由今日页重新生成。

## 11. 导出与备份

### 11.1 Markdown

- 支持导出全部生词或当前内容生词。
- 文件名格式：`Word-Tap-YYYY-MM-DD.md`。
- 包含 YAML frontmatter，以及本地释义、语境释义、例句、原句、来源、收集时间、备注和下次复习日期。
- 转义 Markdown 特殊字符，不依赖 Obsidian 插件才能阅读。
- 不包含 API Key。

### 11.2 JSON

```json
{
  "schema": "wordtap.backup.v1",
  "schemaVersion": 1,
  "exportedAt": "ISO-8601",
  "appVersion": "0.1.0",
  "data": {
    "contents": [],
    "vocabularies": [],
    "reviewLogs": [],
    "reviewSessions": [],
    "settings": {}
  }
}
```

- `settings` 只含非敏感偏好，不包含 API Key。
- 导入先在事务外解析并进行完整 Zod 校验，再展示数量与冲突预览。
- 合并规则：
  - 内容、词卡同 ID 时取较新 `updatedAt`。
  - 日志同 ID 跳过。
  - 同日会话合并 `answeredCardIds`，保留较晚完成时间。
  - 新 ID 全部加入。
- 覆盖导入需二次确认，并在单一 Dexie 事务中替换业务数据。
- 合并或覆盖均保留当前本地 API Key；只有“清除全部本地数据”删除 Key。
- 任一条目校验失败则整个导入失败，现有数据不得变化。

## 12. 四阶段执行清单

### 阶段一：基础框架与路由

- [x] S1-01 初始化根目录 Git 和兼容 Node/Vite/IDE/词典数据的 `.gitignore`
- [x] S1-02 创建 `app/` React 19 + TypeScript + Vite 工程与 pnpm lockfile
- [x] S1-03 配置 React Router、六个业务路由和 `/` 重定向
- [x] S1-04 配置 lint、typecheck、unit、build、E2E 与 dictionary 脚本
- [x] S1-05 从 `yuanxing/PRD-原型设计.zip` 提取实际字体和设计 Token
- [x] S1-06 建立桌面图标轨、移动标签栏、全屏阅读器外壳和减少动画规则
- [x] S1-07 定义页面依赖接口、内存演示仓库和 AI 客户端占位接口
- [x] S1-08 覆盖路由、未知内容、导航、320/390/1440px 和构建检查

**测试门禁：**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright test --project=smoke
```

**退出标准：** 空数据应用可启动，所有业务路由均可访问，基础响应式和质量命令全部通过。

### 阶段二：差异化模块 UI

- [x] S2-01 实现内容库、导入弹层、空状态和列表状态
- [x] S2-02 实现字幕/书页阅读器、分段渲染、聚光、进度和 chrome 淡出
- [x] S2-03 实现点词高亮、桌面侧栏、移动底部面板和已收集状态
- [x] S2-04 实现生词本列表、编辑抽屉、搜索、来源和到期筛选
- [x] S2-05 实现复习首页、复习卡、答案态和完成页
- [x] S2-06 实现设置页、AI 配置视觉、数据区域和危险操作
- [x] S2-07 实现 AI 未配置、加载、失败、未收录、离线、删除确认和骨架状态
- [x] S2-08 使用固定内存演示数据和组件 Mock，不接 IndexedDB、真实词典或真实 AI
- [x] S2-09 补齐 Escape、Tab、空格、1/2/3 键盘交互和 44px 触控目标
- [x] S2-10 完成桌面与移动视觉回归、axe 检查和正文零位移断言

**测试门禁：**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright test --project=visual
```

**退出标准：** 所有 PRD P0 页面和关键状态具备可交互 UI，视觉与原型一致，测试证据写入文档。

### 阶段三：AI 模拟与本地数据持久化

- [x] S3-01 建立领域类型、Zod schema、Dexie schema 与迁移
- [x] S3-02 实现内容、生词、复习、设置和 AI 缓存仓储
- [x] S3-03 实现 TXT/SRT/Markdown 解析、严格 UTF-8、2 MB、哈希和容错
- [x] S3-04 实现分词、词形还原、ECDICT 构建脚本和本地词典
- [x] S3-05 实现内容导入、标题编辑、删除和重复提示
- [x] S3-06 实现生词新增、去重、编辑、删除、搜索和筛选
- [x] S3-07 实现今日计划、固定间隔、事务评分和会话恢复
- [x] S3-08 实现 Markdown/JSON 导出、备份校验、合并和覆盖
- [x] S3-09 实现 `MockAiClient` 成功、加载、无 Key、断网、超时、429、500 和非法响应
- [x] S3-10 编写解析、词典、IndexedDB、复习、备份和模拟 AI 测试
- [x] S3-11 完成导入到导出 Obsidian 的 Mock E2E 演示
- [x] S3-12 增加 CSV、DOCX、XLSX 文件导入并明确旧版 Office 格式限制

**测试门禁：**

```powershell
pnpm dictionary:build
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright test --project=mock
```

**退出标准：** 刷新后数据和复习进度不丢，全部核心业务可在无真实 API Key 下通过模拟 AI 完成。

### 阶段四：真实 API、PWA 与发布验收

- [x] S4-01 实现 OpenAI-compatible `HttpAiClient`
- [x] S4-02 实现 Bearer、AbortController、超时、请求序号、缓存和错误映射
- [x] S4-03 实现 Key 掩码、连接测试、缓存清理、CORS 与安全提示
- [x] S4-04 配置 Manifest、图标、Service Worker 和离线应用壳
- [x] S4-05 验证离线重载后内容、词典、生词和复习可用，AI 正确降级
- [x] S4-06 测试真实请求体、401/403、429、500、超时、断网和非法响应
- [ ] S4-07 使用真实 Provider 完成连接、点词翻译和精析人工冒烟测试
- [x] S4-08 完成 320–1920px、axe、2 MB 性能、下载和视觉回归
- [x] S4-09 完成 PRD AC-01 至 AC-08 自动化验收与三分钟 Mock 演示
- [x] S4-10 更新计划当前状态、实际测试记录和发布说明
- [x] S4-11 增强 DeepSeek 精析字段兼容、具体错误提示和重试入口

**测试门禁：**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

**退出标准：** PRD AC-01 至 AC-08 全部通过，离线与响应式检查完成，三分钟演示彩排成功。

## 13. 测试与验收矩阵

| 测试域 | 必测内容 | 证据 |
| --- | --- | --- |
| 导入 | TXT/SRT/MD、BOM、非法 UTF-8、空文件、2 MB、重复哈希、损坏 SRT | 单元测试 + E2E |
| 阅读 | 两种模式、虚拟滚动、当前段、Markdown 安全、代码块不可点 | 组件/E2E |
| 点词 | 精确词、缩写、连字符、词形还原、未收录、快速切词 | 单元 + E2E |
| AI | 成功、无 Key、401、断网、超时、429、500、非法 JSON、缓存、迟到响应 | 单元 + 路由模拟 |
| 生词 | 新增、去重、搜索、筛选、编辑、删除、刷新 | 集成 + E2E |
| 复习 | 今日、逾期、50 张上限、三种评分、重复评分、会话恢复 | 单元 + E2E |
| 备份 | Markdown、JSON、合并、覆盖、损坏文件、Key 排除 | 单元 + E2E 下载 |
| 持久化 | Dexie 事务、存储失败、刷新、重开 | 集成 + E2E |
| 响应式 | 全部目标视口、无横向滚动、侧栏不推动正文 | Playwright |
| 可访问性 | 键盘、标签、焦点、触控、对比度、reduced-motion | axe + 人工 |
| 性能 | 2 MB 导入目标 2 秒；本地查词目标 200 ms | 基准记录 |

### 13.1 PRD 验收映射

| 验收项 | 对应阶段 | 状态 |
| --- | --- | --- |
| AC-01 内容导入 | 阶段二、阶段三 | 自动化通过 |
| AC-02 点词出释义 | 阶段二、阶段三 | 自动化通过 |
| AC-03 AI 自动降级 | 阶段三、阶段四 | 自动化通过；真实 Provider 待人工 |
| AC-04 生词本增删改 | 阶段二、阶段三 | 自动化通过 |
| AC-05 今日复习 | 阶段二、阶段三 | 自动化通过 |
| AC-06 数据持久化 | 阶段三 | 自动化通过 |
| AC-07 导出与导入 | 阶段三、阶段四 | 自动化通过 |
| AC-08 范围约束 | 阶段四、发布前 | 自动化通过 |

### 13.2 实际测试记录

| 日期 | 阶段 | 命令 | 结果 | 耗时 | 失败原因/修复 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-13 | R0 | `pnpm test` | 43/43 通过 | 24.5s | 修改前基线 | 本文件 |
| 2026-11-13 | R0 | `pnpm lint` | 通过 | 20.3s | 修改前基线 | 本文件 |
| 2026-11-13 | R0 | `pnpm typecheck` | 通过 | 9.6s | 修改前基线 | 本文件 |
| 2026-11-13 | R0 | `pnpm build` | 通过，PWA 19 项预缓存 | 18.0s | 主包体积提示不阻断 | `app/dist` |
| 2026-11-13 | R1 | `pnpm lint` | 通过 | 3.2s | — | 本文件 |
| 2026-11-13 | R1 | `pnpm typecheck` | 通过 | 3.8s | — | 本文件 |
| 2026-11-13 | R1 | `pnpm test` | 46/46 通过 | 5.0s | 修复 1,000 词搜索的重复全列表重绘 | 本文件 |
| 2026-11-13 | R1 | `pnpm test:e2e` | 7/7 通过 | 24.1s | 查看跳转、上下文、竞态、缓存、焦点、触控和五页面 axe | 本文件 |
| 2026-11-13 | R1 | `pnpm test:e2e` | 7/7 通过 | 23.5s | 将扩展上下文测试收敛到白名单内后最终复跑 | 本文件 |
| 2026-11-13 | R1 | `pnpm build` | 通过，PWA 19 项预缓存 | 6.1s | 主包 784.80 kB，体积提示不阻断 | `app/dist` |
| 2026-11-13 | R2 | `pnpm lint` | 通过 | 3.2s | 状态机、组件和 E2E 静态检查通过 | 本文件 |
| 2026-11-13 | R2 | `pnpm typecheck` | 通过 | 3.2s | 联合状态类型和 HTTP 状态类型通过 | 本文件 |
| 2026-11-13 | R2 | `pnpm test` | 62/62 通过 | 5.0s | reducer、取消/超时、缓存和 AI 客户端测试 | 本文件 |
| 2026-11-13 | R2 | `pnpm test:e2e` | 11/11 通过 | 24.2s | 无 Key、离线、停止、5xx、非法响应、缓存和布局 | 本文件 |
| 2026-11-13 | R2 | `pnpm build` | 通过，PWA 19 项预缓存 | 5.6s | 主包 792.08 kB，体积提示不阻断 | `app/dist` |
| 2026-11-13 | R2 | `pnpm test:e2e` | 12/12 通过 | 27.5s | 补验渐进展示阶段停止、aria-live 唯一性与缓存不写入 | 本文件 |
| 2026-11-04 | 阶段一 | `pnpm lint` | 通过，1 个非阻断 Fast Refresh 警告 | 2.6s | — | 本文件 |
| 2026-11-04 | 阶段一 | `pnpm typecheck` | 通过 | 2.8s | 初次测试泛型错误，已修复 | 本文件 |
| 2026-11-04 | 阶段一 | `pnpm test` | 22/22 通过 | 1.1s | 排除 E2E 目录避免 Vitest 误收集 | 本文件 |
| 2026-11-04 | 阶段一 | `pnpm build` | 通过，PWA 17 项预缓存 | 4.8s | 调整 9.4 MB 词典预缓存上限 | 本文件 |
| 2026-11-04 | 阶段一 | `pnpm exec playwright test --project=smoke` | 1/1 通过 | 9.0s | 安装 Chromium 测试浏览器 | 本文件 |
| 2026-11-04 | 阶段二 | `pnpm test` | 24/24 通过 | 3.6s | 新增导入弹层和空状态组件测试 | 本文件 |
| 2026-11-04 | 阶段二 | `pnpm exec playwright test --project=visual` | 1/1 通过 | 8.5s | 320/390/1440px、axe 和正文零位移通过 | 本文件 |
| 2026-11-04 | 阶段三 | `pnpm dictionary:build` | 通过，30,000 词 | 3.7s | 770,611 行源数据，输出哈希稳定 | `app/public/dictionary/dictionary-meta.json` |
| 2026-11-04 | 阶段三 | `pnpm test` | 24/24 通过 | 3.6s | 解析、复习、IndexedDB、备份、AI 与 UI 测试 | 本文件 |
| 2026-11-04 | 阶段三 | `pnpm exec playwright test --project=mock` | 1/1 通过 | 11.0s | 完整演示闭环通过 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm lint` | 通过，无警告 | 2.5s | 拆分 Context 与 hook 消除 Fast Refresh 警告 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm typecheck` | 通过 | 2.9s | — | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm test` | 30/30 通过 | 5.1s | 包含 2 MB 解析和 1,000 词搜索性能场景 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm build` | 通过，PWA 17 项预缓存 | 4.9s | 主包 773.85 kB，构建有体积提示但不阻断 | `app/dist` |
| 2026-11-04 | 阶段四 | `pnpm test:e2e` | 5/5 通过 | 12.0s | smoke、visual、Mock、API 缓存/降级、离线 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm dictionary:build` | 通过，30,000 词 | 4.0s | 修复词典字面 `\n` 展示，更新输出哈希 | `app/public/dictionary/dictionary-meta.json` |
| 2026-11-04 | 阶段四 | `pnpm test` | 32/32 通过 | 5.1s | 新增重复评分事务回归和 1,000 词搜索场景 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm test:e2e` | 5/5 通过 | 13.7s | 11 个视口、触控、复习跨刷新、内容 CRUD、JSON 往返 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm lint` | 通过 | 2.6s | API Key 指南与设置入口无静态错误 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm typecheck` | 通过 | 2.9s | 设置页链接与测试类型正确 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm test` | 32/32 通过 | 5.1s | 设置页 API Key 官方入口可见 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm build` | 通过，PWA 17 项预缓存 | 5.0s | 最新帮助入口进入发行包 | `app/dist` |
| 2026-11-04 | 阶段四 | DeepSeek CORS 预检 | 200，允许 `POST`、`Authorization` | 4.2s | 浏览器直连路径可用 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm lint` | 通过 | 2.6s | DeepSeek 预设无静态错误 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm typecheck` | 通过 | 3.0s | DeepSeek 预设类型正确 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm test` | 32/32 通过 | 5.5s | DeepSeek 链接和预设字段验证通过 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm build` | 通过，PWA 17 项预缓存 | 4.8s | DeepSeek 预设进入发行包 | `app/dist` |
| 2026-11-04 | 阶段四 | Chromium Fetch → DeepSeek | 401，`cors` 类型响应 | 4.2s | 浏览器可读取官方错误响应，直连链路成立 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm test` | 34/34 通过 | 5.5s | 网络/CORS 与离线状态分开映射 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm lint` / `typecheck` / `build` | 全部通过 | 10.7s | 最新网络诊断提示进入发行包 | `app/dist` |
| 2026-11-04 | 阶段四 | `pnpm test` | 35/35 通过 | 5.4s | 连接测试期间保持“测试中”，不再闪回“未测试” | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm lint` / `typecheck` / `build` | 全部通过 | 10.6s | 连接状态修复进入发行包 | `app/dist` |
| 2026-11-04 | 阶段四 | 用户本机 DeepSeek 连接测试 | 5s/10s/20s 均连接成功 | — | 真实地址、Key、模型配置正确 | 用户反馈 |
| 2026-11-04 | 阶段四 | `pnpm test` | 42/42 通过 | 5.5s | DOCX/XLSX 接线、CSV 解析和精析字段兼容 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm lint` / `typecheck` / `build` | 全部通过 | 10.6s | Office 导入和精析修复进入发行包 | `app/dist` |
| 2026-11-04 | 阶段四 | `pnpm test:e2e` | 5/5 通过 | 14.3s | CSV 文件上传、精析展示和全部既有流程 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm test:e2e` | 5/5 通过 | 16.0s | 真实 DOCX/XLSX 文件上传并读取出文本 | 本文件 |
| 2026-11-04 | 阶段四 | `pnpm test` / `lint` / `typecheck` / `build` | 43/43 测试通过，其余门禁通过 | 11.9s | DeepSeek 精析 JSON Output 参数已验证 | 本文件 |
| 2026-11-04 | 阶段四 | 真实 Provider 人工冒烟 | 待用户 API Key | — | 无法在无真实 Key 时合法完成 | 待补 |

## 14. 发布门槛

在 `app/` 中依次通过：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

发布还要求：

- 桌面 Chrome/Edge 完整手工验收。
- Safari 和移动端完成导入、点词、收集、复习冒烟测试。
- 静态站点运行于 HTTPS，并配置 SPA 路由回退。
- 目标 AI Provider 支持浏览器 CORS；不支持时只能显示明确兼容性错误并降级。
- Settings 关于区域展示词典来源、许可和应用版本。
- 正式演示素材为原创或已授权字幕。

## 15. 三分钟演示验收

| 时间 | 操作 | 必须看到 |
| --- | --- | --- |
| 0:00–0:15 | 说明问题 | 阅读、查词、复习原本分散 |
| 0:15–0:45 | 导入演示 SRT | 进入字幕模式，可切书页 |
| 0:45–1:30 | 点 3 个词 | 本地词典先到、AI 语境异步补充、可收集 |
| 1:30–1:55 | 打开生词本 | 单词、原句、来源、时间完整，备注可编辑 |
| 1:55–2:20 | 今日复习 | 三张卡可开始复习，评分后更新日期 |
| 2:20–2:45 | 导出 Markdown | 词条与上下文完整，可放入 Obsidian |
| 2:45–3:00 | 边界说明 | 本地优先、无账号；悬浮窗仅在路线图 |

彩排时必须额外验证 AI 失败降级、刷新持久化和 JSON 导入，但这些检查不挤占正式三分钟。

## 16. 决策记录

| 日期 | 决策 | 原因 | 影响 |
| --- | --- | --- | --- |
| 2026-11-04 | 生产工程放在 `app/` | 保留需求与原型文件，生产代码分离 | 所有工程命令在 `app/` 执行 |
| 2026-11-04 | 采用 React + Vite + TypeScript + Dexie | 原型是静态单文件，生产需要组件、数据和测试边界 | 按原型重建 UI，不直接扩展单文件 |
| 2026-11-04 | AI 浏览器直连 | 保持无后端、本地优先定位 | Provider 必须支持 CORS；Key 暴露风险需提示 |
| 2026-11-04 | 本地词典使用 ECDICT 子集 | 允许离线真实查词并控制包体积 | 必须先核验许可并生成元数据 |
| 2026-11-04 | 每日复习批次上限 50 | 控制单次复习规模 | 超出部分可当天继续生成 |
| 2026-11-04 | 不迁移原型 localStorage | 原型数据为模拟数据 | 生产首启为空数据库 |
| 2026-11-04 | 执行计划调整为四阶段 | 每阶段需要完整 UI、数据、测试门禁 | 阶段二 UI、阶段三数据与 Mock AI、阶段四真实 API/PWA |
| 2026-11-13 | 使用单一计划文档管理后续迭代 | 避免每个阶段生成计划副本造成冗余 | 原地维护本文件，以修订号、阶段状态和变更记录保留历史 |
| 2026-11-13 | R0 只做计划锁定，R1 独立作为 Goal | Goal 需要有清晰、可验证的单一终点 | R0 未确认前不修改业务代码，不启动 R1 |
| 2026-11-13 | R2 使用 validated-progressive | 完整结构化 JSON 的部分分片不能可靠校验，展示未验证 JSON 会违反可信原则 | 保持非 SSE 请求，完整校验后逐字段展示，并在代码与文案中明确非真实流式 |
| 2026-11-13 | R2 自动请求点词 AI | 保持“点词后 AI 出现在需要理解处”的核心体验 | 本地词典进入终态后自动检查缓存并发起请求 |
| 2026-11-13 | R2 取消时清空未完成 AI 内容 | 避免用户把部分生成误当成完整解释 | 保留本地释义和原句，不写结果、不写缓存 |

## 17. 风险与阻塞记录

| 风险 | 触发条件 | 处理动作 | 状态 |
| --- | --- | --- | --- |
| ECDICT 许可或下载不可用 | M2-09 失败 | 停止打包来源不明数据；确认许可或切换已批准词表 | 待验证 |
| 浏览器 CORS 不兼容 | 用户 Base URL 不允许跨域 | 显示具体兼容提示并降级；不私加代理 | 已知限制 |
| API Key 本地暴露 | 共用设备或浏览器插件 | 设置页明确风险；不复用账号；公开发布前复评 | 已接受风险 |
| 2 MB 长文卡顿 | 全量渲染导致大量 DOM | 分段虚拟列表和性能基准 | 待验证 |
| Markdown XSS | 内联 HTML 或危险链接 | sanitize、禁止 HTML、安全链接策略 | 待验证 |
| 导入备份数据损坏 | Schema 不匹配或部分记录非法 | 事务前完整校验，失败不写入 | 待验证 |
| 删除导致复习会话悬空 | 会话含已删除卡 | 读取和评分时过滤，删除时同步清理 | 待验证 |
| 时间跨日 | 页面跨过本地午夜 | 每次进入复习重算本地日期和到期列表 | 待验证 |

## 18. 变更记录

| 日期 | 版本 | 变更 |
| --- | --- | --- |
| 2026-11-13 | v4.2 | R2 最终复跑通过：等待与渐进展示阶段均可取消，aria-live 文案不随字段渐显重复 |
| 2026-11-13 | v4.1 | R2 完成：AI 词义解释状态机、取消、缓存、渐进展示和可访问播报全部通过 |
| 2026-11-13 | v4.0 | 新增 R2 AI 词义解释状态机计划：15 个目标状态、validated-progressive、取消/超时区分、可访问播报与测试门禁 |
| 2026-11-13 | v3.5 | R1 最终复跑通过；恢复未授权测试夹具，扩展上下文测试移入白名单文件 |
| 2026-11-13 | v3.4 | R1 完成：可信度、AI 边界、竞态/缓存、可访问性及完整测试门禁全部通过 |
| 2026-11-13 | v3.3 | 用户授权将 `LibraryPage.tsx` 加入 R1 白名单，仅修复列表 ARIA 语义 |
| 2026-11-13 | v3.2 | R1 实现大部分完成；axe 发现白名单外 `LibraryPage.tsx` ARIA 问题，暂停等待范围确认 |
| 2026-11-13 | v3.1 | R0 经用户确认完成；R1 作为独立 Goal 启动 |
| 2026-11-13 | v3.0 | 新增 R0 计划基线与 R1 详细草案；锁定可信度、AI 边界、缓存、可访问性与数据兼容范围 |
| 2026-11-04 | v2.6 | 环境连续三轮无真实 Provider Key，按目标规则将阶段四标记为阻塞 |
| 2026-11-04 | v2.7 | 新增本地 API Key 指南和设置页官方入口；目标重新激活，等待用户配置真实 Key |
| 2026-11-04 | v2.8 | 恢复后连续等待仍未发现可用 Key，阶段四重新标记为阻塞 |
| 2026-11-04 | v2.9 | 新增 DeepSeek 官方配置、CORS 验证和设置页一键预设 |
| 2026-11-04 | v2.10 | 用户确认已有 DeepSeek Key，阶段四恢复为待人工验收 |
| 2026-11-04 | v2.11 | 区分浏览器网络/CORS 错误与离线状态，并验证 DeepSeek 浏览器直连返回 401 |
| 2026-11-04 | v2.12 | 用户本机仍报告网络失败；应用保持运行，阶段四标记为外部环境阻塞 |
| 2026-11-04 | v2.13 | 修复测试连接期间短暂显示“未测试”的状态顺序问题 |
| 2026-11-04 | v2.14 | 用户本机 DeepSeek 连接测试成功；剩余验收为真实点词与精析 |
| 2026-11-04 | v2.15 | 增加 DOCX/XLSX/CSV 导入并增强真实精析字段兼容与错误反馈 |
| 2026-11-04 | v2.16 | 完成 Office 导入与精析自动化验证；保留真实 DeepSeek 复测为最后人工项 |
| 2026-11-04 | v2.17 | 真实 DOCX/XLSX 浏览器上传 E2E 通过；精析兼容修复待用户真实 Provider 复测 |
| 2026-11-04 | v2.18 | 收紧 DeepSeek 精析 JSON 模板，进一步降低真实调用格式偏离 |
| 2026-11-04 | v2.19 | DeepSeek 精析启用官方 JSON Output 与 800 token 上限，避免格式和截断问题 |
| 2026-11-04 | v2.20 | 自动化修复完成；真实 DeepSeek 精析复测依赖用户本机环境，阶段四标记为阻塞 |
| 2026-11-04 | v2.5 | 扩展视口、触控、复习刷新和内容生命周期测试；修复复习事务误判与词典换行 | 
| 2026-11-04 | v2.4 | 自动化发布门禁全部通过；阶段四等待真实 Provider 人工验收 |
| 2026-11-04 | v2.3 | 阶段三词典、持久化、模拟 AI 和数据闭环验收通过，进入真实 API/PWA |
| 2026-11-04 | v2.2 | 阶段二 UI 与视觉门禁通过，进入数据闭环验收 |
| 2026-11-04 | v2.1 | 阶段一完成并记录测试证据，进入阶段二 UI 验收 |
| 2026-11-04 | v2.0 | 重构为四阶段执行计划，增加阶段状态表、分阶段测试门禁和实际测试记录 |
| 2026-11-04 | v1.0 | 根据 PRD v0.1 和已确认技术决策建立首版开发与维护计划 |

## 19. 每次开发后的更新模板

```text
日期：
当前阶段：
完成任务：
新增/变更文件：
验证命令：
测试结果：
已知问题：
决策变化：
下一任务：
```

