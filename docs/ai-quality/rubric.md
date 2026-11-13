# Word Tap AI 语境解释评估规范

> **状态：机器运行与项目作者非盲复核已完成；独立盲评 `NOT_RUN`；R5 状态为 `PAUSED`。**
>
> 2026-11-14 已使用 `deepseek-flash` 完成运行 `20261113T195921Z-f22545`：40/40 案例为 `COMPLETED`，0 个机器调用错误。项目作者随后完成非盲复核，观察到 39 PASS、1 FAIL。该结果只描述本次运行和本案例集，不代表总体准确率，也不等于独立盲评。独立盲评仍未执行，因此 R5 保持暂停，等待独立评分者完成盲评后才能结项。

## 1. 评估范围

- 只评估 Word Tap 的单词语境解释。
- 不覆盖整句翻译、句法精析、OCR、电子书解析或通用聊天能力。
- 评估集为 `eval-cases.json` 中的 40 个原创案例。
- 评估默认绕过产品缓存，确保评分针对新的模型响应。

## 2. 评分维度

每题总分 10 分。

| 维度 | 0 分 | 1 分 | 2 分 | 3 分 |
| --- | --- | --- | --- | --- |
| 当前语境含义正确 | 主要语义错误 | 部分偏差或只给出宽泛义项 | 基本正确但不完整 | 完整、准确且贴合当前句 |
| 解释简洁 | 冗长、堆砌义项或跑题 | 直接说明当前用法 | — | — |
| 引用正确上下文线索 | 未引用或引用错误 | 引用真正起作用的搭配、句法或语域 | — | — |
| 未编造不存在用法 | 实质编造词义、搭配、来源或事实 | 有轻微过度推断 | 无编造 | — |
| 例句自然 | 语法不自然、语境不匹配或照抄原句 | 自然且符合当前义 | — | — |
| 不确定时正确处理 | 语境不足时仍硬猜 | 明确表达无法可靠判断，不扩展未知事实 | — | — |
| 复习问题有价值 | 空泛、泄题或无法检验当前义 | 能检验目标词在当前语境中的理解 | — | — |

### 硬性判定

- `PASS`：总分至少 8/10，且“当前语境含义正确”至少 2 分。
- `FAIL`：总分低于 8，或“当前语境含义正确”为 0/1。
- “未编造不存在用法”为 0 分时，无论其他维度得分多少，一律 `FAIL`。
- 案例声明 `expectedBehavior = express-uncertainty` 时，“不确定时正确处理”必须为 1 分，否则 `FAIL`。
- 每个维度必须附简短证据，不能只记录数字。

## 3. 评分流程

1. 使用 3 个校准案例熟悉 rubric；校准分数只用于评分者培训，不进入正式结果。
2. 正式评分隐藏 Provider 和模型名称，避免品牌偏见。
3. 对每个案例记录机器输出、7 个维度分数、总分、硬性 verdict、评分人、评分时间和证据。
4. 未评分案例保持 `NOT_RUN`。
5. 非盲复核必须先单独标注；它不能替代隐藏 Provider/模型信息的独立盲评。
6. 独立盲评完成后，汇总只描述“本运行、本模型、本案例集观察到 X/40 通过”，不得表述为模型总体准确率。

## 4. 指标定义

| 字段 | 说明 |
| --- | --- |
| `local_first_response_ms` | 词卡打开到本地定义或“未收录”可见的时间，由浏览器性能测试采集 |
| `ai_first_token_ms` | AI 请求开始到第一个非空流式内容分片的时间 |
| `ai_total_ms` | AI 请求开始到完整响应结束、最终 Schema 校验或错误落定的时间 |
| `input_tokens` | Provider `usage.prompt_tokens` 或兼容字段 |
| `output_tokens` | Provider `usage.completion_tokens` 或兼容字段 |
| `estimated_cost_usd` | 仅在 Token 和单价都存在时计算 |
| `cache_status` | `bypass`、`hit`、`miss` 或 `not_applicable` |
| `error_type` | `none`、现有 AI 错误码、`stream-parse`、`usage-missing` 等 |

缺失值规则：

- 没有真实流式响应：`ai_first_token_ms = not_measured`。
- 没有浏览器指标：`local_first_response_ms = not_measured`。
- Provider 没返回 Token usage：`input_tokens`/`output_tokens = not_reported`。
- 没有输入 Token、输出 Token 或单价：`estimated_cost_usd = not_computed`。
- 未运行：`run_status = NOT_RUN`，输出、分数和指标全部为空。

成本公式：

```text
estimated_cost_usd =
  input_tokens / 1_000_000 * input_usd_per_million_tokens
  + output_tokens / 1_000_000 * output_usd_per_million_tokens
```

## 5. 实际结果与模板

`results-template.csv` 仍是 40 行未运行模板，不因机器运行而改变。正式运行文件必须包含：

- 运行时间；
- 运行 ID；
- Provider Base URL 域名；
- 模型；
- 案例集版本；
- 脚本版本；
- 模型输出；
- 机器指标；
- 人工评分与证据。

模板中的空白数据、`NOT_RUN` 和 `not_measured` 不得进入正式统计。

当前已记录结果：

- `20261113T195921Z-f22545`：真实 Provider 40/40 `COMPLETED`，0 个机器调用错误，`cache_status=bypass`。
- 项目作者非盲复核：40/40 已评分，39 PASS、1 FAIL；这是非盲观察，不是独立盲评。
- 独立盲评：`NOT_RUN`。
- R5 阶段状态：`PAUSED` / 待独立盲评。

## 6. 安全与隐私

- API Key 只从环境变量读取，只在进程内存中使用。
- 不打印、不序列化、不写入日志或结果文件。
- 不记录请求 Authorization Header、完整 Query String 或敏感 URL 参数。
- 结果目录 `eval-results/` 默认不提交 Git。
- 模型原始输出只保存在本地结果文件中，不自动写入用户内容库。

## 7. 假设与限制

- 40 个案例是固定回归集，不代表完整英语分布，也不等于模型总体准确率。
- Provider 不返回 usage 或不支持可靠流式响应时，相关指标不可得。
- 人工评分存在主观性；盲评、硬性失败规则和证据字段只能降低偏差，不能消除偏差。
- 评分集不覆盖整句翻译、精析、OCR 或电子书质量。
- 当前已有真实机器结果和项目作者非盲复核，但独立盲评仍为 `NOT_RUN`；不能将非盲复核表述为独立验证，也不能声称模型总体准确率。
