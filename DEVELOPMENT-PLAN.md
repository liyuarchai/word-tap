# Word Tap MVP 开发与维护计划

> 文档类型：生产开发计划、任务台账与验收记录
> 计划版本：v6.1
> 当前迭代：R4：设计系统化与作品集展示
> 状态：R4 实现与自动化验收完成，待用户验收
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
| 当前阶段 | R4：设计系统化与作品集展示（实现完成，待验收） |
| 已完成任务 | MVP 阶段一至阶段三完成；R0、R1、R2、R3、R4 实现与自动化门禁完成 |
| 当前阻塞 | 无 |
| 下一任务 | 用户验收 `/design-system` 的视觉、状态矩阵和作品集截图效果 |
| 生产工程 | `app/` 已创建并可构建 |
| Git 仓库 | 分支 `main`；R3 最新提交 `bcf37f9`；R4 修改尚未提交，等待验收 |
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
| R3：多模态实验、电子书与阅读体验 | 完成 | 2026-11-13 | 2026-11-13 | 87 个单元/组件测试、18 个 E2E、真实 OCR 与 EPUB/MOBI/AZW3 实盘导入通过 |
| R4：设计系统化与作品集展示 | 待验收 | 2026-11-13 | 2026-11-13 | Token 审计、93 个单元/组件测试、4 个视觉 E2E、axe 与 reduced-motion 通过 |

## 1.3 历史迭代：R0 计划基线与范围锁定

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

## 1.4 历史阶段：R1 核心闭环可信度与可访问性修复

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

## 1.5 历史阶段：R2 AI 词义解释状态机

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

## 1.6 历史阶段：R3 多模态实验、电子书与阅读体验

> 状态：完成。实现、自动化验证和实盘样本冒烟均已通过。

### R3 目标

在保持现有文本导入、阅读器、点词、本地词典、AI 解释、生词本、复习、导出和备份流程完全可用的前提下，新增三个相互隔离的实验能力：

1. 本地书页 OCR：拍照或选择书页图片，获得可编辑文本，确认后进入现有阅读流程。
2. 电子书导入：支持无 DRM 的 EPUB、MOBI、AZW3，提取为现有 `Segment[]` 纯文本后阅读。
3. 阅读体验设置：支持字号、边距、行高、字体、首行缩进、亮度和多套字体/背景主题。

### R3 产品边界

- OCR 是独立、可关闭的实验入口，不替代或遮挡原有“粘贴”和“文件”导入。
- 原始书页图片只在浏览器本地预览和识别，不写入 IndexedDB，不进入备份，不发送给远程 OCR 或 AI。
- OCR 文本必须先进入可编辑预览；用户确认标题和正文后才允许创建内容。
- OCR 成功后进入现有阅读器，点词继续使用本地词典优先和 R2 AI 状态机。
- 电子书只从用户本次选择的本地文件提取文本，不接真实书库或视频平台。
- 阅读偏好是全局设置，不改变正文内容、生词、复习或 AI 缓存。
- 隐藏或关闭 OCR feature flag 时，原导入方式必须完全正常。

### R3 明确不做

- 不做远程 OCR、云端图片识别、多模态聊天或把原图发送给任意模型。
- 不做多页批量 OCR、连续拍书、自动翻页、复杂透视矫正和版式还原。
- 不做 DRM 解密、账号书库、在线下载、云同步或版权内容分发。
- 不做电子书原始排版、脚本、远程图片、字体和嵌入 HTML 的执行。
- 不做完整分页动画、跨页手势或 EPUB 原始 CSS 渲染。
- 不增加账号、聊天、社交、排行榜或通用 AI 对话。
- 不修改复习算法、AI 缓存键规则、API Key 导出限制或备份敏感数据处理。

### R3 技术决策与依赖

| 能力 | 方案 | 许可与包体 | 回退 |
| --- | --- | --- | --- |
| OCR | `tesseract.js@7`，动态加载 Worker 和英文模型 | Apache-2.0，npm unpacked 约 1.41 MB | 识别失败保留原图，允许重试或改用粘贴文本 |
| OCR 模型 | `@tesseract.js-data/eng`，部署到同源 `/ocr/`，首次识别时下载并缓存 | MIT，npm unpacked 约 13.88 MB | 模型加载失败视为 OCR 不可用，不影响原导入 |
| 电子书 | `foliate-js@1.0.1`，按格式动态导入解析模块 | MIT，npm unpacked 约 376 KB | 解析失败提示格式或 DRM 问题，不写数据库 |
| 阅读字体 | 复用现有 Newsreader 与 Inter | 无新增字体依赖 | 字体加载失败使用现有回退字体 |

- OCR 模型不得使用第三方 CDN；只允许同源 `/ocr/`、Web Worker 和 Tesseract 必要脚本请求。
- OCR 模型不得进入 Service Worker 应用壳预缓存；首次成功后可单独缓存。
- `foliate-js` 只在用户选择电子书后动态加载，不进入首屏主包。
- OCR 能力由 `VITE_ENABLE_OCR_DEMO=true` 开启；未设置或为 `false` 时入口不渲染。
- 本地开发、演示和自动化测试通过环境变量显式开启实验；生产构建默认关闭。

### R3 核心类型

新增类型必须作为领域契约，不得在组件中使用零散布尔值推断 OCR 状态：

```ts
type OcrPhase =
  | 'idle'
  | 'model-loading'
  | 'recognizing'
  | 'success'
  | 'partial'
  | 'failed'
  | 'cancelled'

interface OcrResult {
  text: string
  confidence: number
  wordCount: number
  warnings: string[]
}

interface OcrClient {
  recognize(image: Blob, signal: AbortSignal): Promise<OcrResult>
}

interface ExtractedEbook {
  title: string
  format: 'EPUB' | 'MOBI' | 'AZW3'
  rawText: string
  segments: Segment[]
  wordCount: number
  chapterCount: number
  warnings: string[]
}

interface EbookExtractor {
  extract(file: File, signal: AbortSignal): Promise<ExtractedEbook>
}

interface ReadingPreferences {
  fontFamily: 'serif' | 'sans'
  fontSize: 16 | 18 | 20 | 22 | 24
  margin: 'small' | 'medium' | 'large'
  lineHeight: 'tight' | 'normal' | 'loose'
  firstLineIndent: boolean
  theme: 'paper' | 'sepia' | 'mint' | 'night' | 'blush'
  brightness: 'dim' | 'normal' | 'bright'
}
```

- `ContentFormat` 扩展为 `TXT | SRT | MD | DOCX | XLSX | CSV | EPUB | MOBI | AZW3 | OCR`。
- `Settings` 增加可选 `readingPreferences?: ReadingPreferences`；加载时与默认偏好合并。
- OCR 内容使用 `format: 'OCR'`、`mode: 'page'`，`sourceName` 为图片文件名或“拍照书页”。
- 电子书内容使用对应格式和 `mode: 'page'`；`rawText` 只保存提取后的纯文本，不保存电子书二进制。

### R3-01 OCR 导入与状态

- 在导入弹层增加独立“拍照/选择书页”入口；存在性由 feature flag 控制，不改现有 tab 结构和默认流程。
- 移动端图片输入允许 `capture="environment"`；桌面端允许选择 JPEG、PNG、WebP。一次只处理一张图片。
- 选择图片后显示本地预览、页边范围提示和隐私说明：“图片仅在本机识别，不会上传；仅在你确认后的文字会进入阅读和后续 AI 上下文。”
- 不实现手动裁切 UI；通过图片预览上的四角/页边提示引导用户让书页完整、平整、光线均匀。后续需要时可单独增加裁切。
- 识别期间依次显示模型加载和本地识别状态，并提供取消按钮。
- 识别条件固定：
  - 至少 3 个英文词且平均置信度不低于 50%：`success`。
  - 有可用文字但少于阈值或置信度不足：`partial`，仍进入可编辑预览并显示警告。
  - 没有可用文字：`failed`，保留原图、原因、重新选择和改用粘贴入口。
  - 用户取消：`cancelled`，不写数据库、不写内容缓存。
- 成功和部分成功的预览允许修改标题和正文，显示词数、置信度和警告；只有用户点击“开始阅读”后才写 IndexedDB。
- OCR 文本按普通 TXT 分段规则生成 `Segment[]`；确认后导航到现有 `/reader/:contentId`。
- 关闭弹层、切换图片、组件卸载或重复识别时调用 `AbortController.abort()`；迟到响应同时校验当前 requestId，不得更新新任务状态。
- OCR 识别文本只作为文本数据，不执行其中任何指令，不把内容当作系统提示或 AI 指令。
- OCR 失败、取消、模型加载失败或确认前关闭，不得新增、覆盖或删除任何内容。

### R3-02 电子书导入

- 文件输入新增 `.epub`、`.mobi`、`.azw3`，并与现有 TXT、SRT、MD、CSV、DOCX、XLSX 入口共存。
- 扩展名之外还需检查文件签名或格式结构；无法识别时提示实际支持的格式。
- 原始文件上限 50 MB；提取文本上限 10 MB。超限、DRM、加密或损坏文件在创建内容前失败。
- EPUB 按 spine 阅读顺序提取；MOBI/AZW3 按解析器给出的阅读顺序提取。标题、段落、引用和列表映射到现有 `Segment`，忽略脚本、样式、远程资源和原始 HTML 执行。
- 选择电子书后显示提取状态、书名、格式、章节数、词数和正文短预览；用户确认后才创建内容。
- 提取失败不得写数据库，不得影响当前选择的其他文件和原有导入流程。
- 不保存电子书二进制、封面、图片、字体或 DRM 相关数据；备份只包含提取后的文本与分段。
- 若 `foliate-js` 无法可靠处理某一合法格式，必须明确显示该格式不可用并保留其他两种格式与原有导入；不得用虚假成功或空内容掩盖失败。

### R3-03 阅读排版与主题

- 阅读器顶部栏增加 `Aa` 入口；移动端打开底部面板，桌面端打开侧向面板。面板可关闭，并支持 Escape、Tab 顺序和焦点返回。
- 阅读偏好全局应用，所有已打开内容共享同一设置；刷新后从现有 `settings` 记录恢复。
- 字号：16、18、20、22、24 px。
- 边距：小、中、大三档；桌面与移动端分别使用响应式 CSS 变量，不改变正文列最大可读宽度约束。
- 行高：紧 1.6、正常 1.8、松 2.0。
- 字体：Newsreader 衬线体和 Inter 无衬线体。
- 首行缩进：仅作用于普通正文段落；不应用于字幕、标题、列表、引用、代码块。
- 主题：paper、sepia、mint、night、blush；每套主题定义背景、正文、辅助文字、边框、强调色和点词高亮 Token。
- 亮度：dim、normal、bright；必须通过独立 Token 调整，不得用整体 `opacity` 或 CSS filter 制造低对比度。
- 五套主题与三档亮度组合必须进行对比度测试，正文和辅助文字达到 WCAG AA；11–13 px 辅助文字不得低于 4.5:1。
- 字号、主题或面板变化不得造成横向滚动，不得改变词元行高，不得改变词卡打开前后正文边界和宽度。
- 偏好保存失败时显示可操作提示；当前阅读正文、词典、收藏和复习不能被阻塞或清空。

### R3-04 装配、缓存与数据兼容

- `OcrClient` 和 `EbookExtractor` 通过 `AppProvider` 或等价的依赖注入入口提供给 UI；测试可使用显式 mock，不在 UI 中散落模拟业务分支。
- OCR 模型和 Worker 使用同源资源；测试必须断言 OCR 过程中没有原始图片上传请求，点词 AI 请求也不包含图片。
- 不修改 Dexie 表定义和数据库版本；`settings` 通过可选字段扩展，旧记录读取时补齐默认 `ReadingPreferences`。
- 保持 `wordtap.backup.v1`：
  - 旧备份没有 `readingPreferences` 时正常导入并使用默认值。
  - 新备份可携带非敏感阅读偏好。
  - 内容格式枚举的扩展向后读取旧内容；旧版本应用打开新格式超出兼容范围时不得伪造成功。
  - API Key 继续不进入备份、Markdown、JSON、日志、错误文案或测试快照。
- OCR 图片和电子书文件不进入 `aiCache`、导出或备份；AI 缓存键和 R2 状态机规则保持不变。
- 原有文本导入仍受 2 MB 正文上限约束；电子书提取文本单独受 10 MB 上限约束。
- OCR、电子书解析、AI 或模型加载失败都不得阻塞本地词典、生词收集、今日复习和 Markdown/JSON 导出。

### R3 允许修改的文件

- 导入：`app/src/features/library/ImportDialog.tsx`
- 导入：`app/src/features/library/officeImport.ts`
- 新增 OCR：`app/src/features/library/ocrImport.ts`、对应测试和必要图片夹具
- 新增电子书：`app/src/features/library/ebookImport.ts`、对应测试和来源可审计的电子书夹具
- OCR 服务与 Mock：`app/src/services/ocr.ts`、`app/src/services/mockOcr.ts` 及测试
- OCR 资源同步脚本：`app/scripts/sync-ocr-assets.mjs`
- 阅读器：`app/src/features/reader/ReaderPage.tsx`
- 新增阅读偏好：`app/src/features/reader/ReadingPreferencesPanel.tsx`、`readingThemes.ts` 及测试
- 应用装配：`app/src/app/AppContext.tsx`、`app/src/app/appContextValue.ts`、`app/src/main.tsx`
- 领域契约：`app/src/domain/types.ts`、`app/src/domain/schemas.ts`
- 本地存储：`app/src/db/repository.ts`
- 环境类型与示例：`app/src/vite-env.d.ts`、`app/.env.example`
- 设计变量：`app/src/styles/tokens.css`、`app/src/styles/global.css`、`app/src/styles/app.module.css`
- 测试：`app/tests/e2e/app.spec.ts`、`app/src/test/setup.ts`、新增单元/组件测试和 E2E 测试辅助夹具
- 文档与依赖：`app/README.md`、`app/package.json`、`app/pnpm-lock.yaml`、`app/pnpm-workspace.yaml`
- 同源 OCR 静态资源：`app/public/ocr/`，只包含构建所需的 Worker、WASM 和英文模型文件
- 环境与生成物边界：`app/.env.example` 和根目录 `.gitignore`；`public/ocr/`、`live-fixtures/` 为 Git 忽略的本地生成/测试输入

如果实施发现必须修改白名单外文件，先停止并说明原因；不得为了通过测试擅自扩大范围。不修改 `app/src/db/db.ts` 的表定义或数据库版本。不创建平行计划文档。

### R3 实施顺序

1. 先锁定类型、Zod Schema、Settings 默认合并和依赖装配，不写 UI。
2. 完成 OCR 服务、结果分档、取消和纯文本预览，再接入导入弹层。
3. 完成电子书格式检测、动态提取、失败分类和确认写入。
4. 把 OCR 与电子书创建的内容直接接入现有阅读器和点词流程。
5. 完成阅读偏好面板、主题 Token、响应式布局和键盘交互。
6. 补齐单元、组件、E2E、可访问性、性能与刷新恢复测试。
7. 实际运行全部门禁，将命令、数量、耗时、失败原因和修复结果写入 13.2 后再更新 R3 状态。

### R3 风险与处理

| 风险 | 处理 |
| --- | --- |
| Tesseract 模型体积大、首次识别慢 | 只在 feature flag 开启且用户选择图片后加载；显示模型下载/识别状态；同源缓存；提供取消和粘贴回退 |
| 拍照倾斜、反光或小字导致低置信度 | 预览显示页边与清晰度提示；低置信度进入 partial 可编辑修正，不直接无提示写入 |
| OCR 失败污染已有内容 | 确认前不写 IndexedDB；OCR 结果只在组件内存；失败只保留图片预览和错误 |
| 远程资源泄露图片或引入网络依赖 | 模型和 Worker 全部同源；测试断言无图片上传；隐私文案明确本地处理边界 |
| MOBI/AZW3 格式变体多、存在 DRM | 以明确失败代替猜测；仅承诺无 DRM 合法文件；用三类夹具验证成功和拒绝路径 |
| 电子书提取文本过大导致卡顿 | 50 MB 原文件/10 MB 文本双上限；按章节映射分段；失败不写库 |
| 主题降低辅助文字对比度 | 每套主题由专用 Token 控制；五主题×三亮度自动化对比度验证 |
| 字号和边距导致横向滚动或词卡位移 | 使用正文列宽度和 CSS 变量受控调整；覆盖 320–1920 px 与词卡打开前后边界断言 |
| 新增格式破坏旧备份 | 保持 backup v1 和可选字段；旧文件无偏好和旧格式数据必须通过往返测试 |

### R3 测试计划

#### 单元测试

- OCR 文本规范化、英文词数统计、置信度阈值、success/partial/failed 分类。
- OCR 取消、模型加载失败、空结果、迟到响应和重复任务。
- OCR 文本中的指令、脚本和 HTML 只作为普通文字，不执行、不传给 AI 系统提示。
- 电子书格式检测、EPUB/MOBI/AZW3 文本与章节顺序、DRM/损坏/超限错误。
- `ReadingPreferences` 默认值、Schema 旧数据兼容、五种主题与三种亮度 Token 对比度。
- 内容格式枚举扩展后，旧 TXT/SRT/MD/DOCX/XLSX/CSV 内容仍可读取和导出。

#### 组件测试

- feature flag 关闭时 OCR 入口不出现，粘贴和文件导入保持原行为。
- feature flag 开启时出现独立拍照/选择入口，不遮挡原入口。
- 图片预览、正在加载模型、识别中、成功、部分成功、完全失败和取消状态。
- 部分成功可修改标题和正文；确认前仓库写入次数为零，确认后只写一次。
- 失败后保留原图并可重新选择或切换到粘贴。
- 阅读偏好面板支持键盘、Escape、焦点返回、44 px 触控目标与减少动画。
- 偏好保存失败不清空正文，不阻塞点词、收藏或复习。

#### E2E 测试

- 通过显式测试注入或 `?ocrMock=1` 模拟 OCR，不依赖公网模型下载；覆盖“选择书页 → 识别 → 可编辑预览 → 开始阅读 → 点词”。
- 拦截网络并断言 OCR 流程没有向 AI 或远程服务上传原始图片。
- OCR 完全失败后内容库数量不变，原图预览和粘贴回退仍可用。
- feature flag 关闭后，原 TXT/SRT/MD/DOCX/XLSX/CSV 导入和阅读闭环正常。
- EPUB、MOBI、AZW3 入口可识别；至少一个真实解析夹具完成阅读，另外两个格式覆盖有效和 DRM/损坏失败路径。
- 切换字号、边距、行高、字体、主题和亮度后刷新，偏好仍保留。
- 在 320、390、600、820、1024、1440、1920 px 验证无横向滚动，词卡打开前后正文边界不变。
- 内容库、阅读器、生词本、复习、设置和 OCR 预览执行 axe，`serious` 与 `critical` 必须为 0。
- 现有 R0–R2 的 AI 取消、缓存、无 Key、断网、超时、429、5xx 和非法响应测试不得回归。

### R3 测试门禁

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

- 首次使用 OCR 的模型下载与真实识别至少完成一次人工冒烟；自动化测试可以注入 Mock，但不得把 Mock 结果伪报为真实 OCR 精度。
- 电子书真实解析至少验证一个无 DRM EPUB；MOBI/AZW3 使用来源可审计的夹具或人工样本验证，不能只检查文件扩展名。
- 若构建需要额外环境变量，命令和结果必须原样写入“13.2 实际测试记录”。

### R3 验收标准

- 用户可从图片得到可编辑文本，确认后进入现有阅读器并正常点词。
- OCR 失败时保留原图预览，提供重新拍照、选择图片或改用粘贴的明确入口。
- 原始书页图片不上传、不写入 IndexedDB、不进入备份和 AI 请求。
- OCR 入口可通过 feature flag 完全关闭，关闭后原有导入方式完全正常。
- 支持无 DRM 的 EPUB、MOBI、AZW3；DRM、损坏和超限文件给出明确错误且不改动已有内容。
- 阅读器支持字号、边距、行高、字体、首行缩进、亮度和五套主题；偏好刷新后保留。
- 所有主题与亮度组合满足 WCAG AA，键盘可操作，320–1920 px 无横向滚动。
- 点词、收藏、复习、导出和 API Key 安全规则不发生回归。
- 不出现未捕获异常；所有测试门禁真实通过后才将 R3 标记“完成”。

### R3 已知限制

- OCR 只处理单张英文书页；多页批处理、手动裁切、旋转矫正和版式保持不在本迭代。
- OCR 模型首次使用需要下载，完全离线且未缓存模型时 OCR 不可用，但阅读、收藏和复习继续可用。
- 电子书只保留纯文本和有限语义分段，不还原原始排版、图片、脚注交互或 DRM 内容。
- Project Gutenberg #1342 的 EPUB/MOBI/AZW3 样本仅用于本地实盘验收，放在 Git 忽略的 `app/live-fixtures/`；缺少样本时 `ebook-live` 会明确跳过。
- 主 JavaScript chunk 为 815.07 kB，仍有 Vite 体积提示；OCR 与电子书解析器已动态拆包，体积优化留待后续。

## 1.7 当前阶段：R4 设计系统化与作品集展示

> 状态：待验收。实现和自动化验证已完成，等待用户确认作品集页面与视觉方向。

### R4 目标

把 Word Tap 现有视觉语言整理为一套安静、编辑性、纸感、重视阅读的设计系统，并新增仅供作品集展示的 `/design-system` 页面。R4 不重做产品，也不引入通用 AI 产品风格；所有现有页面继续使用同一套视觉契约。

### R4 设计原则

1. 阅读体验优先：阅读正文使用 Newsreader，控件和元信息使用 Inter。
2. 纸感而非装饰：背景、边框和层级来自纸张、墨色和编辑排版，不使用霓虹渐变、玻璃拟态或通用 AI 光效。
3. AI 是来源而非主题：AI 结果通过来源标签、细边框和语义色表达，不能盖过正文或本地词典。
4. 低干扰：装饰不抢占注意力，正文保持高对比，辅助信息清楚但不喧宾夺主。
5. 状态可理解：动效只解释状态变化、展开和空间关系；不依赖颜色单独传达含义。
6. 可复用：颜色、字体、间距、圆角、边框、阴影、动效和状态必须从 Token 消费。

### R4 页面与范围

- 新增直接路由 `/design-system`，放入现有应用壳内，但**不加入**桌面图标轨或移动底栏，避免成为普通用户功能。
- 页面只使用静态示例和本地交互，不读取内容库、不调用 AI、不写 IndexedDB。
- 页面能独立作为作品集截图素材，桌面重点宽度 1440/1920px，移动重点宽度 390px。
- 现有 `/library`、`/reader/:contentId`、`/notebook`、`/review`、`/settings` 的视觉方向和产品流程保持不变。
- 不增加账号、聊天、营销落地页、排行榜、云同步或通用 AI 品牌元素。

### R4 展示页信息架构

`/design-system` 按以下顺序组织，页面本身应像一份编辑设计折页，而不是组件库后台：

1. **封面与叙事**：Word Tap 标识、产品一句话、设计原则摘要。
2. **Foundations**：纸面与墨色色板、阅读/界面字体、字号与行高阶梯。
3. **阅读标记**：选中词、当前句、上下文标记、段落焦点；同时展示纯文本和中文辅助说明。
4. **本地释义与 AI 释义**：两个独立来源卡，清楚标注“本地词典”“AI 语境解释”“已缓存”，不以颜色作为唯一差异。
5. **阅读边注状态**：未配置 Key、已配置未请求、等待、渐进展示、成功、缓存、用户取消、断网、超时、429、5xx、非法响应、已保存/未保存。
6. **反馈与控件**：主/次/文字/危险按钮的默认、悬停、焦点、按下、禁用；输入框正常、聚焦、错误、禁用；标签、状态徽标、加载和空状态。
7. **Responsive specimen**：桌面侧栏词卡与移动底部面板并排呈现，展示正文列不被推动。
8. **Motion specimen**：仅展示淡入、面板进入、状态切换和 reduced-motion 对应结果。

页面不展示真实 API Key、用户数据、完整模型 JSON 或思维链。

### R4 Token 架构

`app/src/styles/tokens.css` 是运行时 CSS Token 的唯一权威来源；组件样式和展示页通过 `var(--token-name)` 消费，不在组件中重复写十六进制颜色。

阅读主题也必须并入同一 Token 来源：

- 将 R3 `readingThemes.ts` 中的原始颜色迁移为 `--reading-theme-{theme}-{role}` CSS Token。
- `readingThemes.ts` 只保留主题名称、无障碍标签、亮度映射和对比度工具的轻量元数据，不再保存独立颜色副本。
- `ReaderPage` 通过 `data-theme`、`data-brightness` 选择 Token，不通过内联颜色对象生成主题。
- Design System 色块和阅读器主题共享同一组 CSS 变量。

#### 颜色 Token

| 语义 | Token | 用途 |
| --- | --- | --- |
| 纸面 | `--paper`、`--paper-raised`、`--paper-muted` | 页面、卡片、次级纸面 |
| 正文 | `--ink` | 正文和关键标题 |
| 次级文字 | `--ink-2`、`--ink-3` | 说明、元信息、禁用前状态 |
| 边界 | `--line`、`--line-strong` | 分隔线、卡片边界、上下文引用 |
| 选中词 | `--selection-bg`、`--selection-ink` | 当前点击词和键盘选中 |
| 上下文 | `--context-bg`、`--context-line` | 当前句/邻近上下文的低调标记 |
| AI 增强 | `--ai-ink`、`--ai-bg`、`--ai-line` | AI 来源标签、语境解释边框和层级 |
| 缓存 | `--cache-ink`、`--cache-bg` | “已缓存”状态 |
| 成功 | `--success-ink`、`--success-bg` | 保存、完成、本地可用 |
| 警告 | `--warning-ink`、`--warning-bg` | 部分 OCR、待核对、低置信度 |
| 错误 | `--danger-ink`、`--danger-bg` | 失败、删除、非法响应 |
| 焦点 | `--focus-ring` | 2px 键盘焦点轮廓 |
| 交互 | `--accent`、`--accent-hover`、`--accent-pressed` | 主操作和可交互强调 |

- AI 颜色采用低饱和蓝灰或现有绿色体系中的语义变体，不使用紫色霓虹光晕。
- 文本和背景对比度至少 4.5:1；大字号标题至少 3:1；焦点环与相邻背景至少 3:1。
- 所有状态同时提供文字标签或图形/线型差异，不能只依赖颜色。

#### 字体 Token

| Token | 值 |
| --- | --- |
| `--font-reading` | 现有 Newsreader + 中文衬线回退 |
| `--font-ui` | 现有 Inter + 中文字体回退 |
| `--font-mono` | 代码与 token 名称 |
| `--type-caption` | 11px / 1.4 / 400 |
| `--type-meta` | 12px / 1.5 / 400 |
| `--type-control` | 13px / 1.55 / 500 |
| `--type-body` | 14px / 1.6 / 400 |
| `--type-reading-mobile` | 17px / 1.85 / 400 |
| `--type-reading` | 20px / 1.9 / 400 |
| `--type-heading-sm` | 26px / 1.3 / 400 |
| `--type-heading` | 32px / 1.2 / 400 |
| `--type-display` | 64px / 1.05 / 400 |

- Token 名称表达角色而非单个页面；字号和行高保留为单位化 Token。
- 中文正文使用现有中文衬线回退，但来源标签、时间和按钮使用界面字体。

#### 间距、圆角、边框与层级

| 类别 | Token |
| --- | --- |
| 间距 | `--space-1: 4px`、`--space-2: 8px`、`--space-3: 12px`、`--space-4: 16px`、`--space-5: 20px`、`--space-6: 24px`、`--space-7: 32px`、`--space-8: 40px`、`--space-9: 48px`、`--space-10: 64px` |
| 圆角 | `--radius-inline: 4px`、`--radius-control: 10px`、`--radius-card: 12px`、`--radius-panel: 16px`、`--radius-sheet: 20px`、`--radius-pill: 999px` |
| 边框 | `--border-hairline: 1px`、`--border-strong: 2px`、`--border-color-subtle`、`--border-color-strong` |
| 阴影 | `--shadow-low`、`--shadow-raised`、`--shadow-overlay`、`--focus-ring-shadow` |
| 层级 | 阅读正文 0、工具栏 40、词卡 60、弹层 70、错误提示 100、toast 110 |

- 4/8 为布局基础网格；重复间距必须使用 Token。
- 14px、18px、22px 等光学微调只允许用于已存在且难以网格化的局部排版，不得在多个规则重复。
- 当前视觉中的 10px 控件圆角、16px 面板圆角、20px 移动面板圆角保留为 Token，避免 R4 改变既有观感。

#### 动效 Token

| Token | 值 | 用途 |
| --- | --- | --- |
| `--motion-instant` | 0ms | reduced-motion 和立即切换 |
| `--motion-fast` | 120ms | hover、按下、标签切换 |
| `--motion-standard` | 180ms | 按钮和颜色状态 |
| `--motion-reading` | 320ms | 阅读聚光、错误/结果出现 |
| `--motion-chrome` | 420ms | 阅读器顶部栏淡出 |
| `--ease-standard` | 现有 `cubic-bezier(0.2, 0.7, 0.3, 1)` | 常规空间关系 |
| `--ease-enter` | 快速进入、缓慢停止 | 面板和状态进入 |

- 禁止循环呼吸光效、无限漂浮和与状态无关的装饰动画。
- `prefers-reduced-motion: reduce` 下时长归零或接近零，保留最终状态。

#### 交互状态

| 状态 | 规则 |
| --- | --- |
| 默认 | 使用语义默认 Token |
| 悬停 | 只改变背景、边框或文字层级；正文和关键按钮不做位移 |
| 焦点 | 2px `--focus-ring`，偏移 2px；隐藏顶部栏聚焦时恢复可见 |
| 按下 | 使用 `--accent-pressed` 或加深背景，不缩小正文 |
| 禁用 | 设置 `disabled`/`aria-disabled`，降低视觉权重并保留可读标签和 `cursor: not-allowed` |
| 加载 | 使用稳定的占位尺寸和状态文本，不造成正文或词卡大幅跳动 |
| 错误 | 显示错误图标/标签、原因和可行动作，不只改变颜色 |
| 成功 | 显示“已保存/已完成/已缓存”文字与视觉标记 |

### R4 实施步骤

1. 审计 `tokens.css`、`global.css`、`app.module.css`、`readingThemes.ts` 和现有组件，建立旧值到语义 Token 的映射表。
2. 在 `tokens.css` 建立颜色、字体、间距、圆角、边框、阴影、层级、动效和状态 Token，并保留旧变量别名以避免一次性破坏现有样式。
3. 迁移阅读主题色到 CSS Token，确保 paper/sepia/mint/night/blush × dim/normal/bright 的对比度与 R3 等价。
4. 将 `app.module.css` 中重复的颜色、间距、圆角、阴影和动效替换为 Token；光学微调值保留并注释用途。
5. 新增 `/design-system` 页面和静态展示数据；复用现有视觉类或提取最小共享展示组件，不复制整个产品页面。
6. 增加组件、Token、无障碍、响应式和截图测试；对比 R4 前后关键页面截图。
7. 运行门禁并将实际结果写入本节及 13.2，之后才允许把 R4 标为完成。

### R4 允许修改的文件

- 计划与规范：`DEVELOPMENT-PLAN.md`、新增 `app/DESIGN-SYSTEM.md`
- 路由与应用壳：`app/src/app/router.tsx`、必要时 `app/src/components/AppShell.tsx`
- 设计系统页面：新增 `app/src/features/design-system/DesignSystemPage.tsx`、其展示数据与组件测试
- Token：`app/src/styles/tokens.css`、`app/src/styles/global.css`、`app/src/styles/app.module.css`
- 阅读主题：`app/src/features/reader/readingThemes.ts`、`app/src/features/reader/readingThemes.test.ts`
- 展示所需的最小组件样式调整：现有按钮、输入、状态、词卡相关 CSS 类，不改变业务流程
- 测试：现有组件测试、`app/tests/e2e/app.spec.ts`、新增 Token/页面测试

不允许新增依赖；若实施发现必须新增依赖，先停止并说明必要性、包体和替代方案。不得修改 Dexie Schema、业务数据、AI 请求、导入解析或复习规则。

### R4 测试计划

#### Token 与样式测试

- 扫描 `app.module.css` 和 TSX 组件：除 `tokens.css`、展示样例和测试夹具外，不允许新增十六进制颜色作为组件颜色。
- 扫描重复间距、圆角和阴影，验证高频值均由 Token 消费。
- 对正文、次级文字、按钮、标签、AI/缓存/错误/成功状态执行 WCAG AA 对比度检查。
- 五套阅读主题 × 三档亮度继续全部通过既有对比度测试，视觉值不得回退。
- reduced-motion 下动画与过渡时长被关闭，内容最终状态仍完整。

#### 组件测试

- `/design-system` 渲染全部八个区块和必需示例。
- 本地词典与 AI 释义均有明确来源标签，缓存、错误、成功和失败状态具备文字说明。
- 选中词、上下文标记、保存前后状态在 DOM 中具备非颜色语义。
- 按钮、输入、标签、加载和空状态样例可通过键盘访问。
- 页面不调用 AI、不写入 IndexedDB、不显示 API Key 或原始 JSON。

#### E2E 与视觉证据

- 1440px 桌面截图完整展示设计系统页面的核心 Token、阅读边注和控制状态。
- 390px 移动截图展示阅读边注底部面板、按钮尺寸和无横向滚动。
- 原有内容库、阅读器、生词本、复习和设置视觉回归通过；词卡打开前后正文边界不变。
- 对 `/design-system` 运行 axe，`serious` 与 `critical` 均为 0。
- 在 reduced-motion 模拟下验证页面没有持续视觉运动。

### R4 测试门禁

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

R4 涉及新的 UI 页面，因此实施时还应运行现有视觉 E2E 作为补充证据；若 `pnpm test:e2e -- --project=visual` 失败，R4 不得标记完成。

### R4 验收标准

- 视觉语言明显仍是 Word Tap：安静、纸感、编辑性，阅读优先。
- Token 在 `tokens.css` 集中管理；重复颜色、间距、圆角、阴影和动效不再散落在组件中。
- `/design-system` 可独立访问且不作为普通产品主导航项。
- 页面包含颜色与字体、阅读标记、本地/AI 来源差异、保存前后、完整 AI 状态矩阵、按钮/输入/标签/加载/空状态、桌面与移动示例。
- 正文和按钮满足 WCAG AA；所有状态均有文字、图形或线型辅助，不只依赖颜色。
- 键盘焦点清楚，控件触控尺寸不退化，`prefers-reduced-motion` 生效。
- 原有页面没有明显视觉漂移，现有产品闭环和测试不回归。
- `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 全部通过，真实结果写入 13.2。

### R4 风险与处理

| 风险 | 处理 |
| --- | --- |
| Token 迁移导致现有页面视觉漂移 | 先映射当前值，再做别名替换；以现有视觉 E2E 和前后截图对照 |
| 展示页喧宾夺主或变成通用组件库后台 | 采用编辑折页式叙事，只展示 Word Tap 真实组件和状态 |
| AI 状态色彩过强 | AI 使用低饱和来源色 + 文本标签，主视觉仍由正文和纸面主导 |
| 状态仅靠颜色区分 | 为选中、缓存、成功、错误和降级增加文字/图标/线型 |
| 新页面进入主导航造成产品噪音 | `/design-system` 只直达，不加入 rail/tabbar |
| 硬编码审计误报 | 允许 `tokens.css`、测试夹具和展示样例中的受控原始值，其他位置必须使用 Token |
| 主题 Token 双份维护 | 移入 `tokens.css`，`readingThemes.ts` 只保留元数据，不复制颜色 |

### R4 已知限制

- `/design-system` 是 Word Tap 专用作品集页面，不发布为通用 npm 组件库。
- R4 不新增主题编辑器、代码复制面板或设计稿导入功能。
- 深色主题范围仍限于阅读体验；R4 不新增全应用深浅主题切换。
- 视觉回归以现有页面和 1440/390px 作品集页面为主，不承诺覆盖所有浏览器渲染差异。

## 2. 产品目标与范围

### 2.1 MVP 目标

实现一个无账号、无后端、本地优先的响应式 Web/PWA，完整打通：

```text
导入英文内容 -> 点词查看本地释义和 AI 语境 -> 收集生词
-> 生成今日复习 -> 评分更新到期时间 -> 导出 Markdown/JSON
```

### 2.2 必须实现

- 粘贴或导入 TXT、SRT、Markdown、CSV、DOCX、XLSX，支持字幕和书页两种阅读形态。
- R3 实验能力：通过 feature flag 启用本地 OCR 书页导入；导入无 DRM 的 EPUB、MOBI、AZW3。
- R3 阅读体验：字号、边距、行高、字体、首行缩进、亮度和五套阅读主题。
- R4 设计系统：集中语义 Token，新增仅用于作品集的 `/design-system` 展示页，并保持现有页面视觉一致。
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
- 远程 OCR、云书库、DRM 解密和多页批量拍书。
- 通用组件库后台、营销落地页、霓虹 AI 视觉和与产品无关的组件演示。

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
| OCR 实验 | `tesseract.js@7` + 同源英文模型；`VITE_ENABLE_OCR_DEMO` 控制入口；图片只在本地处理 |
| 电子书 | `foliate-js@1.0.1` 动态加载，只提取无 DRM EPUB/MOBI/AZW3 的纯文本 |
| 阅读偏好 | 扩展现有 `settings` 可选字段，不新增 Dexie 表，不升级数据库版本 |
| R4 设计系统 | 使用 `tokens.css` 语义 Token 与现有 CSS Modules，不新增 UI 框架或 Token 依赖 |
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
- `mammoth`、`read-excel-file`，现有 Office 导入能力
- `csv-parse`，现有 CSV 处理能力
- R3 实施时新增 `tesseract.js@7`、`@tesseract.js-data/eng` 和 `foliate-js@1.0.1`；本计划文档修订阶段不安装

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
    ocr/
      eng.traineddata.gz
      tesseract-worker.min.js
      tesseract-core.wasm.js
  scripts/
    build-dictionary.ts
  src/
    app/
      router.tsx
      AppShell.tsx
    components/
    db/
      db.ts
      repository.ts
    domain/
      types.ts
      schemas.ts
      parsers.ts
      text.ts
      review.ts
    features/
      design-system/
        DesignSystemPage.tsx
      library/
        ImportDialog.tsx
        officeImport.ts
        ocrImport.ts
        ebookImport.ts
      reader/
        ReaderPage.tsx
        ReadingPreferencesPanel.tsx
        WordPanel.tsx
      vocabulary/
      review/
      settings/
    services/
      ocr.ts
      mockOcr.ts
      ai.ts
      export.ts
    styles/
      tokens.css
      global.css
    test/
      fixtures/
  tests/
    e2e/
  DESIGN-SYSTEM.md
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
| `/design-system` | 作品集用设计系统展示页，不进入主导航 | 应用壳 |

桌面导航使用 64px 图标轨；视口小于 640px 时使用 56px 底部标签栏。阅读器和复习卡隐藏常规导航。`/design-system` 只允许直接访问，不加入 rail 或 tabbar。

## 6. 核心数据模型

```ts
type ContentFormat =
  | 'TXT'
  | 'SRT'
  | 'MD'
  | 'DOCX'
  | 'XLSX'
  | 'CSV'
  | 'EPUB'
  | 'MOBI'
  | 'AZW3'
  | 'OCR';
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

interface ReadingPreferences {
  fontFamily: 'serif' | 'sans';
  fontSize: 16 | 18 | 20 | 22 | 24;
  margin: 'small' | 'medium' | 'large';
  lineHeight: 'tight' | 'normal' | 'loose';
  firstLineIndent: boolean;
  theme: 'paper' | 'sepia' | 'mint' | 'night' | 'blush';
  brightness: 'dim' | 'normal' | 'bright';
}

interface Settings {
  id: 'app';
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  timeoutSeconds: 5 | 10 | 20;
  readingPreferences?: ReadingPreferences;
  updatedAt: string;
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
| `settings` | 固定主键 `app` | AI 配置、非敏感界面偏好和可选 `readingPreferences` |
| `aiCache` | `key`, `createdAt` | 稳定的 AI 成功结果缓存 |

数据库必须包含版本和迁移入口。所有业务写入以 IndexedDB 成功为准，界面不能在落盘前显示“已保存”。

### 6.2 数据约束

- 词卡稳定 ID 由 `contentId + segmentId + normalized lemma` 生成。
- 同一内容、同一段、同一原形不得重复添加。
- 删除内容只删除正文，保留生词快照。
- 删除词卡同步删除评分记录，并从当前会话过滤该卡。
- 新词收集时 `dueAt = createdAt`，立即进入今日复习。
- API Key 只存本地，不进入 Markdown、JSON、日志或错误提示。
- 新增内容格式和阅读偏好不修改 Dexie 表定义或数据库版本；旧设置读取时补齐默认阅读偏好。
- OCR 图片与电子书二进制不进入内容表、备份、导出或 AI 缓存。

## 7. 解析、分词与本地词典

### 7.1 内容导入

- 普通文本/字幕正文最大 2 MB；超限保留用户输入并显示明确提示。
- 文件使用 `arrayBuffer + TextDecoder('utf-8', { fatal: true })` 解码。
- 文本文件接受 `.txt`、`.srt`、`.md`、`.csv`；现有 Office 入口接受 `.docx`、`.xlsx`。
- R3 文件入口增加 `.epub`、`.mobi`、`.azw3`。电子书原文件上限 50 MB，提取文本上限 10 MB。
- 文本/字幕/Office 正文继续使用 2 MB 正文上限；电子书使用独立的 10 MB 提取文本上限。
- 标题默认取文件名或首个有效文本行前 40 字，可后续编辑。
- 使用 SHA-256 正文哈希检测重复内容，提示用户“仍然导入”或取消。
- 导入成功后直接进入阅读器；局部解析错误显示警告但保留可用内容。
- OCR 书页入口只在 `VITE_ENABLE_OCR_DEMO=true` 时出现；原图表、电子书、文本和 Office 导入路径不得被遮挡或改变。
- OCR 图片只在内存预览，识别文本必须先进入可编辑预览；用户确认前不得写 IndexedDB。
- 电子书在用户选择文件后才动态提取，确认前不得写 IndexedDB；DRM、加密、损坏或超限文件必须失败且不修改已有内容。

### 7.2 分段规则

- TXT：空行分段，段内换行合并为空格。
- SRT：一个合法 cue 为一段；支持可选序号、时间轴和正文多行；跳过损坏块并计数。
- Markdown：保留标题、段落、引用、列表和代码块；内联 HTML 不执行，远程图片不加载，代码块不可点词。
- SRT 字幕标签和 ASS 位置标签从展示文本中剥离。
- OCR：确认后的纯文本按 TXT 空行规则分段；不执行图片或文字中的指令。
- EPUB：按 spine 顺序提取章节；MOBI/AZW3：按解析器阅读顺序提取。标题、段落、引用和列表映射为现有 `Segment`，忽略脚本、样式、远程资源和原始内联 HTML。

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

- 正文默认最大宽度 680px，桌面 20px 字号、1.9 行高；移动端 17px、1.85 行高。R3 阅读偏好开启后使用用户选择的响应式字号、边距和行高。
- 阅读器顶部栏提供 `Aa` 设置入口；移动端使用底部面板，桌面端使用侧向面板，不与词卡同时遮挡正文。
- 字号支持 16、18、20、22、24 px；行高支持 1.6、1.8、2.0；字体支持 Newsreader 和 Inter；首行缩进仅作用于普通正文段落。
- 主题支持 paper、sepia、mint、night、blush，亮度支持 dim、normal、bright；所有组合必须采用专用 Token 并满足 WCAG AA。
- 阅读偏好全局保存在现有 `settings` 记录，刷新后恢复；保存失败不得清空正文或阻塞点词、收藏和复习。
- 字幕模式当前段正常显示，非当前段降低透明度，段 hover 时恢复。
- 书页模式关闭字幕聚光，保留舒适排版。
- 顶部栏和底部进度线在 3 秒无操作后淡出，鼠标进入顶部或触摸顶部时恢复。
- 桌面视口不小于 1280px 时词卡固定右侧 360px；窄屏使用最高 55vh、可上拖至 85vh 的底部面板。
- 点词高亮使用荧光笔黄，不移动正文；侧栏出现前后正文边界必须完全一致。
- 阅读偏好变化不得造成横向滚动、词元行高变化或词卡打开前后正文坐标变化。
- `Aa` 面板支持 Escape、Tab 顺序、44 px 触控目标和清楚焦点态；关闭后焦点返回触发按钮。
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
- `settings.readingPreferences` 为可选非敏感字段；旧备份缺少该字段时使用默认阅读偏好导入。
- OCR 原始图片和电子书二进制不属于备份数据，只备份确认后的正文、分段和生词等现有业务记录。
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

### R3 后续迭代：多模态实验、电子书与阅读体验

- [x] R3-01 增加 `VITE_ENABLE_OCR_DEMO`、同源 Tesseract 资源、OCR 状态机和可取消识别
- [x] R3-02 实现图片预览、隐私说明、可编辑标题/正文和失败回退
- [x] R3-03 实现 EPUB/MOBI/AZW3 无 DRM 纯文本提取和确认写入
- [x] R3-04 实现阅读偏好类型、设置兼容、`Aa` 面板和五套主题
- [x] R3-05 覆盖 OCR/电子书/阅读偏好单元、组件和 E2E，运行完整门禁
- [x] R3-06 使用真实 Tesseract 和 Project Gutenberg 公开领域 EPUB/MOBI/AZW3 样本完成实盘冒烟

**测试门禁：**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

**退出标准：** R3 验收标准全部满足，真实测试结果写入 13.2，且 R0–R2 核心回归测试保持通过。

### R4 后续迭代：设计系统化与作品集展示

- [x] R4-01 审计现有视觉值并建立旧值到语义 Token 的映射
- [x] R4-02 在 `tokens.css` 集中颜色、字体、间距、圆角、边框、阴影、层级、动效和状态 Token
- [x] R4-03 迁移阅读主题与现有页面重复硬编码，保持视觉等价
- [x] R4-04 新增 `/design-system` 作品集展示页，覆盖全部要求的状态和响应式示例
- [x] R4-05 维护 `app/DESIGN-SYSTEM.md` 作为设计系统使用规范
- [x] R4-06 完成 Token、对比度、键盘、reduced-motion、视觉回归与质量门禁

**R4 测试门禁：**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test:e2e --project=visual` 作为设计系统页、移动端和既有页面视觉回归的补充硬性证据。

**退出标准：** 语义 Token 集中管理，`/design-system` 可独立作为作品集素材，原页面视觉与业务闭环不回归，四条质量命令和视觉 E2E 均通过。

## 13. 测试与验收矩阵

| 测试域 | 必测内容 | 证据 |
| --- | --- | --- |
| 导入 | TXT/SRT/MD/CSV/DOCX/XLSX、BOM、非法 UTF-8、空文件、2 MB、重复哈希、损坏 SRT | 单元测试 + E2E |
| R3 OCR | 图片预览、模型加载、识别中、成功/部分/失败/取消、置信度、零写入回退、图片不上传 | 单元 + 组件 + E2E |
| R3 电子书 | EPUB/MOBI/AZW3、无 DRM 提取、DRM/损坏/50 MB/10 MB、确认写入 | 单元 + E2E + 公开领域实盘 |
| R3 阅读偏好 | 字号、边距、行高、字体、缩进、五主题、三亮度、持久化、零位移、无横向滚动 | 组件 + E2E + axe |
| 阅读 | 两种模式、虚拟滚动、当前段、Markdown 安全、代码块不可点、R3 排版 | 组件/E2E |
| 点词 | 精确词、缩写、连字符、词形还原、未收录、快速切词 | 单元 + E2E |
| AI | 成功、无 Key、401、断网、超时、429、500、非法 JSON、缓存、迟到响应 | 单元 + 路由模拟 |
| 生词 | 新增、去重、搜索、筛选、编辑、删除、刷新 | 集成 + E2E |
| 复习 | 今日、逾期、50 张上限、三种评分、重复评分、会话恢复 | 单元 + E2E |
| 备份 | Markdown、JSON、合并、覆盖、损坏文件、Key 排除 | 单元 + E2E 下载 |
| 持久化 | Dexie 事务、存储失败、刷新、重开 | 集成 + E2E |
| 响应式 | 全部目标视口、无横向滚动、侧栏不推动正文 | Playwright |
| 可访问性 | 键盘、标签、焦点、触控、对比度、reduced-motion | axe + 人工 |
| 性能 | 2 MB 导入目标 2 秒；本地查词目标 200 ms | 基准记录 |
| R4 Token | 语义色、字体、4/8 间距、圆角、边框、阴影、动效、交互状态和硬编码扫描 | 单元 + 静态检查 |
| R4 展示页 | 八个内容区块、来源差异、状态矩阵、桌面/移动示例和截图素材 | 组件 + E2E + 人工截图 |

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

#### R3 扩展验收映射

| 验收项 | 对应任务 | 当前状态 |
| --- | --- | --- |
| R3-AC-01 图片 OCR 后进入可编辑预览 | R3-01 | 自动化通过 |
| R3-AC-02 确认后进入现有阅读与点词流程 | R3-01、R3-04 | 自动化通过 |
| R3-AC-03 OCR 失败保留图片并可重试/粘贴 | R3-01、R3-05 | 自动化通过 |
| R3-AC-04 原图不上传、不落库、不进备份 | R3-01、R3-04 | 自动化通过 |
| R3-AC-05 OCR flag 关闭时原导入不受影响 | R3-01、R3-05 | 自动化通过 |
| R3-AC-06 EPUB/MOBI/AZW3 无 DRM 导入 | R3-02、R3-05 | 自动化 + 公开领域实盘通过 |
| R3-AC-07 电子书失败不污染已有内容 | R3-02、R3-05 | 自动化通过 |
| R3-AC-08 阅读偏好全局持久化且满足 AA | R3-03、R3-05 | 自动化通过 |
| R3-AC-09 移动端优先且无横向滚动 | R3-03、R3-05 | 自动化通过 |

#### R4 扩展验收映射

| 验收项 | 对应任务 | 当前状态 |
| --- | --- | --- |
| R4-AC-01 Token 集中管理且无重复硬编码 | R4-01、R4-02 | 自动化通过 |
| R4-AC-02 `/design-system` 可独立访问并可作为作品集素材 | R4-04、R4-06 | 自动化 + 截图通过 |
| R4-AC-03 本地词典、AI、缓存、错误和降级来源清楚 | R4-04、R4-06 | 自动化通过 |
| R4-AC-04 状态不只依赖颜色 | R4-02、R4-06 | 自动化通过 |
| R4-AC-05 正文、按钮、焦点达到 WCAG AA | R4-02、R4-06 | 自动化通过 |
| R4-AC-06 桌面与移动示例无横向滚动且触控尺寸合格 | R4-04、R4-06 | 自动化通过 |
| R4-AC-07 原有页面视觉和业务闭环不回归 | R4-03、R4-06 | 视觉 E2E 通过 |

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
| 2026-11-13 | R3 | `pnpm lint` | 通过 | 6.7s | OCR、电子书、阅读偏好和新增测试静态检查通过 | 本文件 |
| 2026-11-13 | R3 | `pnpm typecheck` | 通过 | 4.6s | 数据格式、偏好 Schema、Tesseract/Foliate 适配层类型通过 | 本文件 |
| 2026-11-13 | R3 | `pnpm test` | 87/87 通过 | 7.9s | OCR 分档/取消、EPUB/MOBI/AZW3、DRM/超限、主题对比度和设置兼容 | 本文件 |
| 2026-11-13 | R3 | `pnpm build` | 通过，PWA 24 项预缓存 | 7.9s | 同步 20 个同源 OCR 资产；主包 815.07 kB，体积提示不阻断；OCR 模型不进入预缓存 | `app/dist` |
| 2026-11-13 | R3 | `pnpm test:e2e` | 18/18 通过 | 34.3s | OCR 成功/失败/取消、偏好持久化、移动面板、axe、旧流程回归 | 本文件 |
| 2026-11-13 | R3 | `pnpm exec playwright test --project=ocr-live` | 1/1 通过 | 11.7s | 浏览器生成英文页后由真实 Tesseract 识别，无远程图片 POST | 本文件 |
| 2026-11-13 | R3 | `ebook-live` | EPUB、MOBI、AZW3 均通过 | 1.5–2.5s/本 | Project Gutenberg #1342 公开领域样本在本地导入并进入阅读器 | `app/live-fixtures/`（Git 忽略） |
| 2026-11-13 | R4 | `pnpm lint` | 通过 | 8.2s | ESLint + `design:tokens` 审计：颜色、网格间距、圆角、字体和动效无散落硬编码 | 本文件 |
| 2026-11-13 | R4 | `pnpm typecheck` | 通过 | 6.3s | 设计系统页、Token 测试和懒加载路由类型通过 | 本文件 |
| 2026-11-13 | R4 | `pnpm test` | 93/93 通过 | 7.6s | Token 对比度、硬编码扫描、展示页状态、键盘和既有组件回归 | 本文件 |
| 2026-11-13 | R4 | `pnpm build` | 通过，PWA 26 项预缓存 | 6.6s | 设计系统页懒加载为 12.04 kB chunk；主包 815.21 kB；体积提示不阻断 | `app/dist` |
| 2026-11-13 | R4 | `pnpm test:e2e --project=visual` | 4/4 通过 | 19.7s | 1440/390 截图、axe、reduced-motion、触控尺寸和既有页面零位移 | `app/test-results/design-system-*.png` |
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
- R3 发布前额外验证：OCR flag 开启/关闭、原图不上传、真实本地 OCR 冒烟、一个无 DRM EPUB 实盘解析、五主题×三亮度对比度。
- R4 发布前额外验证：`/design-system` 桌面/移动截图、全部状态非颜色表达、Token 硬编码扫描、axe、reduced-motion 和既有页面视觉回归。

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

R3 的多模态与电子书能力使用单独短演示，不替代上述三分钟核心闭环：

```text
开启 OCR flag -> 选择单页图片 -> 本地识别 -> 修正文本 -> 开始阅读
-> 点词 → 打开阅读设置 → 切主题/字号 → 刷新确认保留
```

R4 作品集素材使用独立截图流程：

```text
打开 /design-system
-> 1440px 捕获 Foundations + 阅读标记 + 来源差异
-> 捕获 AI 状态矩阵 + 控件状态
-> 390px 捕获移动底部边注
-> 确认无横向滚动、焦点清楚、状态有文字说明
```

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
| 2026-11-13 | R3 OCR 使用本地 Tesseract + 同源模型 | 避免上传书页图片，并让 OCR 失败不影响文本主流程 | `VITE_ENABLE_OCR_DEMO` 隔离入口；首次下载模型，确认后才写内容 |
| 2026-11-13 | R3 电子书只提取无 DRM 纯文本 | 在不引版权书库和 DRM 解密的前提下复用现有阅读器 | EPUB/MOBI/AZW3 动态解析，失败不写库 |
| 2026-11-13 | R3 阅读偏好为现有 Settings 可选字段 | 保持 Dexie 表、备份 v1 和旧数据兼容 | 旧设置读取时补默认值，不升级数据库版本 |
| 2026-11-13 | R3 主题 Token 以 TypeScript 单一来源注入 CSS 变量 | 避免面板色块、阅读器主题和对比度测试三份配置漂移 | 五主题×三亮度共用同一数据源 |
| 2026-11-13 | R3 阅读偏好写入串行排队 | 快速连续点击时防止旧设置晚完成并覆盖新选择 | 本地立即预览，仓库写入按用户操作顺序执行 |
| 2026-11-13 | R4 使用 `tokens.css` 作为 CSS Token 唯一来源 | 避免颜色、间距和主题值在组件、TS 与文档间重复 | 阅读主题色迁入 CSS Token，展示页和各页面共享同一来源 |
| 2026-11-13 | `/design-system` 只直达、不加入主导航 | 设计系统用于作品集展示，不应增加普通用户操作负担 | 保留应用壳，但不扩展 rail/tabbar |
| 2026-11-13 | AI 以来源层级而非视觉主角表达 | 产品核心仍是阅读和本地学习闭环 | AI 使用低饱和语义色、明确标签和稳定布局 |
| 2026-11-13 | R4 只整理现有视觉，不重做产品风格 | 现有页面已经形成纸感、编辑性和阅读优先方向 | Token 化以视觉等价为约束，通过现有视觉回归 |
| 2026-11-13 | `/design-system` 使用路由级懒加载 | 作品集页面不应增加普通用户首屏负担 | 页面独立为约 12 kB chunk，主流程不加载该页面 |
| 2026-11-13 | Token 审计纳入 `pnpm lint` | 颜色、间距、圆角、字体和动效约束需要在日常门禁自动执行 | 新增 `design:tokens` Node 审计脚本，无新增依赖 |

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
| OCR 模型过慢或加载失败 | 首次使用、网络受限或设备性能不足 | 显示模型/识别状态和取消；允许重试或改用粘贴；不阻塞原流程 | 已验证：取消/失败/真实识别均通过 |
| OCR 图片隐私 | 上传、日志或被远程模型处理 | 同源模型、本地内存预览、网络断言和隐私说明 | 已验证：同源资源、无图片上传断言 |
| 电子书解析兼容 | DRM、格式变体或损坏文件 | 明确失败、不写库；对三种格式分别测试 | 已验证：三种公开领域样本与 DRM/损坏测试 |
| 阅读主题对比度 | 深浅背景或亮度组合导致辅助文字过浅 | 五主题×三亮度自动化对比度和 axe 门禁 | 已验证：15 组对比度与设置面板 axe |
| R3 包体增大 | OCR 模型和电子书解析器进入首屏 | 模型首次按需加载；`foliate-js` 动态导入；构建体积记录 | 已缓解：解析器动态拆包；主包体积提示保留 |
| R4 Token 迁移造成视觉漂移 | 替换硬编码时改变了现有空间或色值 | 先建立旧值映射，保持视觉等价，用现有 E2E 和前后截图回归 | 已验证：既有视觉 E2E 通过 |
| R4 展示页被误当产品页面 | 加入主导航或承载真实业务操作 | 保持直达路由、不加入 rail/tabbar，使用静态样例 | 计划已约束 |
| R4 状态仅靠颜色 | AI、缓存、成功和错误使用不同色但没有文字语义 | 每个状态同时提供标签、图标或线型，axe 与人工截图复核 | 已验证：状态标签 + axe 通过 |
| R4 Token 重复维护 | CSS、TypeScript 主题和展示页各存一份颜色 | CSS Token 为唯一来源，`readingThemes.ts` 移除原始色值 | 已验证：颜色审计通过 |

## 18. 变更记录

| 日期 | 版本 | 变更 |
| --- | --- | --- |
| 2026-11-13 | v6.1 | R4 实现完成：语义 Token 集中、阅读主题 CSS 化、`/design-system` 作品集页、Token 审计、axe/reduced-motion/视觉回归全部通过 |
| 2026-11-13 | v6.0 | 新增 R4 设计系统计划：语义 Token 单一来源、`/design-system` 作品集页面、阅读/AI 状态矩阵、无障碍与视觉回归门禁 |
| 2026-11-13 | v5.1 | R3 实现完成：本地 OCR、EPUB/MOBI/AZW3、阅读偏好与五套主题；87 个单元/组件测试、18 个 E2E、真实 OCR 和三种电子书实盘通过 |
| 2026-11-13 | v5.0 | 新增 R3 计划：本地 OCR 多模态实验入口、EPUB/MOBI/AZW3 导入、阅读排版与五套主题；锁定隐私、数据兼容、文件白名单和测试门禁 |
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

