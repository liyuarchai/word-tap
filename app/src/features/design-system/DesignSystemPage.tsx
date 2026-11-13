import type { ReactNode } from 'react'
import styles from '../../styles/app.module.css'

const colorTokens = [
  ['纸面', '--paper'],
  ['抬升纸面', '--paper-raised'],
  ['正文墨色', '--ink'],
  ['次级文字', '--ink-2'],
  ['辅助文字', '--ink-3'],
  ['选中词', '--selection-bg'],
  ['上下文', '--context-bg'],
  ['AI 增强', '--ai-bg'],
  ['缓存', '--cache-bg'],
  ['成功', '--success-bg'],
  ['警告', '--warning-bg'],
  ['错误', '--danger-bg']
] as const

const aiStates = [
  ['未配置 API Key', '本地词典、收藏和复习继续可用。', '降级'],
  ['已配置，尚未请求', '等待用户点词或主动分析。', '就绪'],
  ['等待首字', '显示独立等待区域，可停止请求。', '等待'],
  ['渐进展示', '完整结果通过校验后逐字段呈现。', '生成中'],
  ['成功完成', 'AI 来源和内容完整展示。', '成功'],
  ['命中缓存', '明确标记“已缓存”，不重复请求。', '缓存'],
  ['用户取消', '保留本地释义与原句，不写缓存。', '已停止'],
  ['断网', '提示检查网络，本地功能不受影响。', '降级'],
  ['请求超时', '允许重试或继续阅读。', '超时'],
  ['429 限流', '说明稍后重试，不阻塞收藏和复习。', '限流'],
  ['5xx 服务错误', '说明服务异常并提供重试入口。', '服务错误'],
  ['响应结构非法', '不展示原始 JSON，保留本地结果。', '校验失败']
] as const

const stateTone = (index: number) => {
  if (index === 4 || index === 5) return styles.dsStateSuccess
  if (index >= 7) return styles.dsStateWarning
  if (index === 6) return styles.dsStateNeutral
  return styles.dsStateAi
}

function SourceCard({
  source,
  title,
  children,
  ai = false,
  cached = false
}: {
  source: string
  title: string
  children: ReactNode
  ai?: boolean
  cached?: boolean
}) {
  return (
    <article className={`${styles.dsSourceCard} ${ai ? styles.dsSourceCardAi : ''}`}>
      <div className={styles.dsSourceHead}>
        <span className={`${styles.dsSourceBadge} ${ai ? styles.dsSourceBadgeAi : ''}`}>
          {source}
        </span>
        {cached ? <span className={styles.dsCacheBadge}>已缓存</span> : null}
      </div>
      <h3>{title}</h3>
      <div className={styles.dsSourceBody}>{children}</div>
    </article>
  )
}

export function DesignSystemPage() {
  return (
    <div className={styles.designSystemPage}>
      <header className={styles.dsHero}>
        <div>
          <p className={styles.eyebrow}>Word Tap · Design System</p>
          <h1 className={styles.dsTitle}>阅读，不与噪声争夺注意力。</h1>
          <p className={styles.dsLead}>
            Word Tap 把 AI 查词重构为上下文学习闭环。纸面、排版和来源层级服务于阅读，
            AI 出现在需要理解的地方，但不成为视觉中心。
          </p>
        </div>
        <div className={styles.dsHeroNote} aria-label="设计原则">
          <span>安静</span>
          <span>编辑性</span>
          <span>纸感</span>
          <span>阅读优先</span>
        </div>
      </header>

      <nav className={styles.dsIndex} aria-label="设计系统章节">
        <a href="#foundations">01 Foundations</a>
        <a href="#reading">02 Reading marks</a>
        <a href="#sources">03 Sources</a>
        <a href="#states">04 States</a>
        <a href="#controls">05 Controls</a>
        <a href="#responsive">06 Responsive</a>
      </nav>

      <section className={styles.dsSection} id="foundations">
        <div className={styles.dsSectionHead}>
          <p className={styles.eyebrow}>01 · Foundations</p>
          <h2>颜色与字体</h2>
          <p>所有视觉值来自语义 Token；组件只表达角色，不直接拥有颜色。</p>
        </div>

        <div className={styles.dsColorGrid}>
          {colorTokens.map(([label, token]) => (
            <div className={styles.dsColorCard} key={token}>
              <span
                className={styles.dsColorSwatch}
                style={{ background: `var(${token})` }}
                aria-hidden="true"
              />
              <strong>{label}</strong>
              <code>{token}</code>
            </div>
          ))}
        </div>

        <div className={styles.dsTypeSpecimen}>
          <div>
            <p className={styles.dsTypeMeta}>Newsreader · reading</p>
            <p className={styles.dsReadingSample}>
              The team stayed resilient through a difficult year.
            </p>
          </div>
          <div>
            <p className={styles.dsTypeMeta}>Inter · interface</p>
            <p className={styles.dsInterfaceSample}>
              Local meaning first. AI context follows. Controls stay quiet.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.dsSection} id="reading">
        <div className={styles.dsSectionHead}>
          <p className={styles.eyebrow}>02 · Reading marks</p>
          <h2>选中词与上下文</h2>
          <p>选中态同时使用底色和下划线；上下文标记使用线型与标签，不依赖颜色。</p>
        </div>
        <article className={styles.dsReadingSpecimen}>
          <p>
            The team stayed{' '}
            <span className={styles.dsSelectedWord}>resilient</span> through a year nobody
            expected.
          </p>
          <p className={styles.dsContextLine}>
            <span className={styles.dsAnnotationLabel}>当前句</span>
            through a year nobody expected.
          </p>
        </article>
      </section>

      <section className={styles.dsSection} id="sources">
        <div className={styles.dsSectionHead}>
          <p className={styles.eyebrow}>03 · Sources</p>
          <h2>本地释义与 AI 释义</h2>
          <p>来源是信息层级，不是装饰。本地结果先出现，AI 结果独立更新。</p>
        </div>
        <div className={styles.dsSourceGrid}>
          <SourceCard source="本地词典" title="resilient · 有韧性的">
            <p>能在困难、挫折或变化后恢复并继续前进。</p>
            <p className={styles.dsSourceMeta}>/rɪˈzɪliənt/ · adjective</p>
          </SourceCard>
          <SourceCard source="AI 语境解释" title="在这里更接近“坚持住了”" ai cached>
            <p>stay resilient 表示团队经历艰难一年后仍保持恢复力和坚持。</p>
            <p className={styles.dsQuote}>The team stayed resilient through hard times.</p>
          </SourceCard>
        </div>
      </section>

      <section className={styles.dsSection} id="states">
        <div className={styles.dsSectionHead}>
          <p className={styles.eyebrow}>04 · Complete states</p>
          <h2>阅读边注与降级矩阵</h2>
          <p>每个状态都有可读标签和下一步动作；颜色只是辅助。</p>
        </div>

        <div className={styles.dsSaveGrid}>
          <article className={styles.dsSaveCard}>
            <span className={styles.dsSourceBadge}>未收藏</span>
            <h3>resilient</h3>
            <p>本地释义已出现，可以立即保存，不需要等待 AI。</p>
            <button className={styles.primaryButton} type="button">
              加入生词本
            </button>
          </article>
          <article className={styles.dsSaveCard}>
            <span className={styles.dsSuccessBadge}>✓ 已保存</span>
            <h3>resilient</h3>
            <p>词卡、原句、来源和时间已保存；之后仍可编辑备注。</p>
            <button className={styles.secondaryButton} type="button">
              已在生词本 · 查看
            </button>
          </article>
        </div>

        <div className={styles.dsStateGrid} role="list" aria-label="AI 状态矩阵">
          {aiStates.map(([title, description, label], index) => (
            <article
              className={`${styles.dsStateCard} ${stateTone(index)}`}
              key={title}
              role="listitem"
            >
              <div className={styles.dsStateHead}>
                <h3>{title}</h3>
                <span className={styles.dsStateLabel}>{label}</span>
              </div>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.dsSection} id="controls">
        <div className={styles.dsSectionHead}>
          <p className={styles.eyebrow}>05 · Controls</p>
          <h2>按钮、输入与反馈</h2>
          <p>触控目标至少 44px，焦点清楚；禁用和错误状态保留可读文字。</p>
        </div>
        <div className={styles.dsControlGrid}>
          <div className={styles.dsControlCard}>
            <h3>按钮</h3>
            <div className={styles.dsButtonRow}>
              <button className={styles.primaryButton} type="button">
                主要操作
              </button>
              <button className={styles.secondaryButton} type="button">
                次要操作
              </button>
              <button className={styles.textButton} type="button">
                文字操作
              </button>
              <button className={styles.dangerButton} type="button">
                危险操作
              </button>
              <button className={styles.secondaryButton} type="button" disabled>
                已禁用
              </button>
            </div>
          </div>
          <div className={styles.dsControlCard}>
            <h3>输入</h3>
            <label className={styles.field}>
              <span className={styles.label}>正常输入</span>
              <input className={styles.input} defaultValue="Newsreader" />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>错误输入</span>
              <input
                className={styles.input}
                defaultValue="not-an-url"
                aria-invalid="true"
                aria-describedby="ds-input-error"
              />
              <span className={styles.fieldError} id="ds-input-error">
                请输入有效地址。
              </span>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>禁用输入</span>
              <input className={styles.input} value="只读内容" disabled readOnly />
            </label>
          </div>
          <div className={styles.dsControlCard}>
            <h3>标签与状态</h3>
            <div className={styles.dsTagRow}>
              <span className={styles.dsSourceBadge}>本地词典</span>
              <span className={`${styles.dsSourceBadge} ${styles.dsSourceBadgeAi}`}>
                AI 解释
              </span>
              <span className={styles.dsCacheBadge}>已缓存</span>
              <span className={styles.dsSuccessBadge}>✓ 连接成功</span>
              <span className={styles.dsErrorBadge}>! 请求失败</span>
            </div>
          </div>
          <div className={styles.dsControlCard}>
            <h3>加载与空状态</h3>
            <div className={styles.dsLoadingSample} role="status">
              <span className={styles.skeletonRow} aria-hidden="true" />
              <span>正在加载本地词典…</span>
            </div>
            <div className={styles.dsEmptySample}>
              <strong>还没有内容。</strong>
              <span>导入一段英文，开始安静地阅读。</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.dsSection} id="responsive">
        <div className={styles.dsSectionHead}>
          <p className={styles.eyebrow}>06 · Responsive</p>
          <h2>桌面侧栏与移动边注</h2>
          <p>词卡表达同一来源层级：桌面固定侧栏，移动端底部面板，正文位置不变。</p>
        </div>
        <div className={styles.dsResponsiveGrid}>
          <article className={styles.dsDesktopPanel}>
            <div className={styles.dsPanelTop}>
              <span>桌面侧栏 · 360px</span>
              <span>Esc 关闭</span>
            </div>
            <h3>resilient</h3>
            <p className={styles.dsSourceMeta}>本地词典 · adjective</p>
            <p>有韧性的；能在困难后恢复并继续前进。</p>
            <SourceCard source="AI 语境解释" title="坚持住了" ai>
              原文描述团队在艰难一年里仍保持恢复力。
            </SourceCard>
            <button className={styles.primaryButton} type="button">
              加入生词本
            </button>
          </article>
          <article className={styles.dsMobilePanel}>
            <div className={styles.dsMobileHandle} aria-hidden="true" />
            <div className={styles.dsPanelTop}>
              <span>移动底部边注</span>
              <span>保持正文宽度</span>
            </div>
            <h3>resilient</h3>
            <p>本地释义先出现，AI 来源独立展示。</p>
            <div className={styles.dsTagRow}>
              <span className={styles.dsSourceBadge}>本地词典</span>
              <span className={`${styles.dsSourceBadge} ${styles.dsSourceBadgeAi}`}>
                AI 语境
              </span>
            </div>
            <button className={styles.primaryButton} type="button">
              加入生词本
            </button>
          </article>
        </div>
      </section>
    </div>
  )
}
