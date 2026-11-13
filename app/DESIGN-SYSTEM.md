# Word Tap Design System

Word Tap 的视觉语言是安静、编辑性和纸感的。阅读正文由 Newsreader 承担，控件与元信息由 Inter 承担。AI 是明确的信息来源，不是霓虹装饰或页面主角。

在线样例：`/design-system`

## 1. Token 来源

运行时 Token 的唯一来源是 `src/styles/tokens.css`。

- 颜色和阅读主题通过 CSS 自定义属性提供。
- 组件 CSS 和 TSX 不保存十六进制颜色。
- 阅读器用 `data-theme` 与 `data-brightness` 选择主题 Token。
- 旧变量名保留为语义别名，避免一次性破坏现有样式。

常用分组：

| 分组 | 示例 |
| --- | --- |
| 纸面与墨色 | `--paper`、`--paper-raised`、`--ink`、`--ink-2`、`--ink-3` |
| 意义色 | `--selection-bg`、`--context-bg`、`--ai-bg`、`--cache-bg` |
| 状态色 | `--success-bg`、`--warning-bg`、`--danger-bg` |
| 字体 | `--font-reading`、`--font-ui`、`--font-mono` |
| 间距 | `--space-1` 至 `--space-10`，以 4/8px 为基础 |
| 形状 | `--radius-control`、`--radius-card`、`--radius-panel`、`--radius-sheet` |
| 层级 | `--shadow-low`、`--shadow-raised`、`--shadow-overlay` |
| 动效 | `--motion-fast`、`--motion-standard`、`--motion-reading`、`--motion-chrome` |

## 2. 阅读与来源

- 本地词典先出现，不等待 AI。
- AI 内容必须带“AI 语境解释”等来源标签。
- 缓存必须显示“已缓存”，不能把缓存伪装成刚生成。
- 错误和降级不得覆盖本地释义、原句或已保存词卡。
- 选中词同时使用底色和下划线；上下文使用边框和文字标签。
- 状态不能只靠颜色区分。

## 3. 字体层级

| 角色 | 字体 | 建议尺寸/行高 |
| --- | --- | --- |
| 作品集标题 | Newsreader | `--font-size-display` |
| 页面标题 | Newsreader | `--font-size-page-title` |
| 阅读正文 | Newsreader | `--font-size-reading` / `--line-height-reading` |
| 移动阅读正文 | Newsreader | `--font-size-reading-mobile` / `--line-height-reading-mobile` |
| 控件 | Inter | `--font-size-control` |
| 元信息 | Inter | `--font-size-meta` |
| 辅助标签 | Inter | `--font-size-caption` |

## 4. 交互状态

- 焦点：2px `--focus-ring`，偏移 2px。
- 悬停：改变文字、边框或背景层级，不移动正文。
- 按下：使用 `--accent-pressed` 或加深背景。
- 禁用：保留文字，设置 `disabled` 或 `aria-disabled`。
- 错误：文字说明原因，并提供重试或设置入口。
- 成功：显示“已保存”“已完成”“已缓存”等文字。
- 加载：使用稳定占位尺寸，避免词卡和正文跳动。

## 5. 无障碍

- 正文与按钮达到 WCAG AA。
- 焦点不能由 `outline: none` 单独移除。
- 主要触控目标不小于 44×44px。
- `prefers-reduced-motion: reduce` 下关闭非必要过渡和动画。
- 所有状态提供文字、图标或线型辅助。
- Design System 页面必须通过 axe，`serious` 和 `critical` 为 0。

## 6. 演进规则

1. 新增颜色先定义语义 Token，再使用。
2. 同一间距在多个组件重复时提升为 `--space-*`。
3. 阅读主题只修改 `tokens.css`，不在组件或 TS 中复制色值。
4. `/design-system` 只用于作品集和设计评审，不加入主导航。
5. 修改现有组件视觉时，必须保留原有业务流程和正文布局。

## 7. 验证

```powershell
pnpm design:tokens
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

视觉验收使用 `pnpm test:e2e --project=visual`。测试会捕获 1440px 与 390px 设计系统页面，并运行 axe、reduced-motion 和既有页面回归。
