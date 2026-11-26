import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../app/useApp'
import { Icon } from '../../components/Icon'
import {
  formatReadingDuration,
  formatReadingDurationCompact,
  READING_RANGE_OPTIONS,
  shiftReadingAnchor,
  summarizeReadingSessions,
  type ReadingChartBucket,
  type ReadingRangePreset
} from '../../domain/readingStats'
import type { ReadingSessionRecord } from '../../domain/types'
import styles from '../../styles/app.module.css'

type StatsView = 'overview' | 'ranking'

function trendText(seconds: number, previousSeconds: number, percent: number | null) {
  if (!seconds) return '这一周期还没有阅读记录'
  if (!previousSeconds) return '上一周期暂无数据'
  if (percent === null || percent === 0) return '与上一周期持平'
  return `比上一周期${percent > 0 ? '增加' : '减少'} ${Math.abs(percent)}%`
}

function bucketDetail(bucket: ReadingChartBucket | undefined) {
  if (!bucket) return '点击图表查看每天的阅读时长'
  return `${bucket.fullLabel} · ${formatReadingDuration(bucket.seconds)}`
}

function avatarVariant(contentId: string) {
  return Array.from(contentId).reduce((sum, value) => sum + value.charCodeAt(0), 0) % 3
}

export function ReadingStatsPage() {
  const { contents, repository } = useApp()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<ReadingSessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)
  const [preset, setPreset] = useState<ReadingRangePreset>('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [view, setView] = useState<StatsView>('overview')
  const [selectedBucketKey, setSelectedBucketKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void repository
      .listReadingSessions()
      .then((items) => {
        if (!cancelled) setSessions(items)
      })
      .catch(() => {
        if (!cancelled) setError('阅读记录暂时没有载入，请稍后重试。')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadVersion, repository])

  const summary = useMemo(
    () => summarizeReadingSessions(sessions, preset, anchor, new Date()),
    [anchor, preset, sessions]
  )
  const selectedBucket =
    summary.buckets.find((bucket) => bucket.key === selectedBucketKey) ??
    summary.longestBucket ??
    summary.buckets[0]
  const chartMax = Math.max(1, ...summary.buckets.map((bucket) => bucket.seconds))
  const contentIds = useMemo(
    () => new Set(contents.map((content) => content.id)),
    [contents]
  )

  const switchPreset = (next: ReadingRangePreset) => {
    setPreset(next)
    setAnchor(new Date())
    setSelectedBucketKey(null)
  }

  const openContent = (contentId: string) => {
    if (contentIds.has(contentId)) navigate(`/reader/${contentId}`)
  }

  return (
    <div className={styles.statsPage}>
      <header className={styles.statsHeader}>
        <div className={styles.statsTitleRow}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="返回内容库"
            onClick={() => navigate('/library')}
          >
            <Icon name="back" size={20} />
          </button>
          <div>
            <h1 className={styles.pageTitle}>阅读统计</h1>
            <p className={styles.pageSubtitle}>只记录当前浏览器中的有效阅读时间</p>
          </div>
        </div>
      </header>

      <nav className={styles.statsTabs} aria-label="阅读数据视图">
        <button
          className={`${styles.statsTab} ${view === 'overview' ? styles.statsTabActive : ''}`}
          type="button"
          aria-pressed={view === 'overview'}
          onClick={() => setView('overview')}
        >
          统计概览
        </button>
        <button
          className={`${styles.statsTab} ${view === 'ranking' ? styles.statsTabActive : ''}`}
          type="button"
          aria-pressed={view === 'ranking'}
          onClick={() => setView('ranking')}
        >
          时长排行
        </button>
      </nav>

      <div className={styles.statsRangeTabs} role="group" aria-label="统计时间范围">
        {READING_RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`${styles.statsRangeTab} ${
              preset === option.value ? styles.statsRangeTabActive : ''
            }`}
            type="button"
            aria-pressed={preset === option.value}
            onClick={() => switchPreset(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.statsPeriodBar}>
        <p className={styles.statsPeriodLabel}>{summary.period.label}</p>
        <div className={styles.statsPeriodActions}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="上一周期"
            disabled={!summary.period.canGoPrevious}
            onClick={() =>
              setAnchor((current) => shiftReadingAnchor(preset, current, -1))
            }
          >
            <Icon name="back" size={18} />
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="下一周期"
            disabled={!summary.period.canGoNext}
            onClick={() =>
              setAnchor((current) => shiftReadingAnchor(preset, current, 1))
            }
          >
            <Icon name="forward" size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.statsLoading} role="status">
          <div className={styles.skeletonRow} />
          <div className={`${styles.skeletonRow} ${styles.skeletonRowShort}`} />
          <div className={styles.statsChartSkeleton} />
        </div>
      ) : error ? (
        <section className={styles.statsState} role="alert">
          <h2 className={styles.emptyTitle}>阅读记录暂时没有载入。</h2>
          <p className={styles.emptyText}>{error}</p>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => {
              setLoading(true)
              setError('')
              setReloadVersion((current) => current + 1)
            }}
          >
            重新载入
          </button>
        </section>
      ) : summary.totalSeconds === 0 ? (
        <section className={styles.statsState}>
          <h2 className={styles.emptyTitle}>
            {sessions.length ? '这一周期还没有阅读记录。' : '还没有阅读记录。'}
          </h2>
          <p className={styles.emptyText}>
            打开一篇内容开始阅读，这里会按本地时间记录真实阅读时长。
          </p>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => navigate('/library')}
          >
            去内容库
          </button>
        </section>
      ) : view === 'overview' ? (
        <>
          <section className={styles.statsSummary} aria-labelledby="reading-total-heading">
            <p className={styles.sectionLabel}>总阅读时长</p>
            <h2 className={styles.statsTotal} id="reading-total-heading">
              {formatReadingDuration(summary.totalSeconds)}
            </h2>
            <p className={styles.statsCompare}>
              日均 {formatReadingDuration(summary.averageSeconds)} ·{' '}
              {trendText(
                summary.totalSeconds,
                summary.previousSeconds,
                summary.trendPercent
              )}
            </p>
            <dl className={styles.statsMetrics}>
              <div>
                <dt>阅读天数</dt>
                <dd>{summary.readingDays}</dd>
              </div>
              <div>
                <dt>阅读会话</dt>
                <dd>{summary.sessionCount}</dd>
              </div>
              <div>
                <dt>阅读内容</dt>
                <dd>{summary.contentCount}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.statsCard} aria-labelledby="reading-chart-heading">
            <div className={styles.statsCardHead}>
              <h2 id="reading-chart-heading">阅读时长分布</h2>
              <span>{preset === 'week' ? '按天' : preset === 'month' ? '按日' : '按时段'}</span>
            </div>
            <div
              className={`${styles.statsChart} ${
                summary.buckets.length > 16 ? styles.statsChartDense : ''
              }`}
              role="group"
              aria-label="阅读时长分布图"
              style={{
                gridTemplateColumns: `repeat(${summary.buckets.length}, minmax(32px, 1fr))`
              }}
            >
              {summary.buckets.map((bucket) => {
                const height = Math.max(2, (bucket.seconds / chartMax) * 100)
                return (
                  <button
                    key={bucket.key}
                    className={`${styles.statsBarButton} ${
                      selectedBucket?.key === bucket.key ? styles.statsBarSelected : ''
                    }`}
                    type="button"
                    aria-label={`${bucket.fullLabel}，${formatReadingDuration(bucket.seconds)}`}
                    aria-pressed={selectedBucket?.key === bucket.key}
                    title={`${bucket.fullLabel} · ${formatReadingDuration(bucket.seconds)}`}
                    onClick={() => setSelectedBucketKey(bucket.key)}
                    onFocus={() => setSelectedBucketKey(bucket.key)}
                  >
                    <span className={styles.statsBarTrack} aria-hidden="true">
                      <span className={styles.statsBarFill} style={{ height: `${height}%` }} />
                    </span>
                    <span className={styles.statsBarLabel}>{bucket.label}</span>
                  </button>
                )
              })}
            </div>
            <p className={styles.statsBarDetail} aria-live="polite">
              {bucketDetail(selectedBucket)}
            </p>
          </section>

          <section className={styles.statsInsights} aria-label="阅读洞察">
            <div className={styles.statsInsight}>
              <p className={styles.sectionLabel}>阅读最久</p>
              <h2>{summary.longestBucket?.fullLabel ?? '暂无'}</h2>
              <p>{formatReadingDuration(summary.longestBucket?.seconds ?? 0)}</p>
            </div>
            <div className={styles.statsInsight}>
              <p className={styles.sectionLabel}>最常阅读</p>
              <h2 title={summary.topContent?.contentTitle}>
                {summary.topContent?.contentTitle ?? '暂无'}
              </h2>
              <button
                className={styles.textButton}
                type="button"
                disabled={!summary.topContent || !contentIds.has(summary.topContent.contentId)}
                onClick={() =>
                  summary.topContent && openContent(summary.topContent.contentId)
                }
              >
                打开内容
              </button>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className={styles.rankingHero} aria-labelledby="ranking-heading">
            <div>
              <p className={styles.sectionLabel}>本机内容排行</p>
              <h2 id="ranking-heading" title={summary.topContent?.contentTitle}>
                {summary.topContent?.contentTitle}
              </h2>
              <p>本期最常阅读 · 共 {summary.ranking.length} 个内容</p>
            </div>
            <div className={styles.rankingHeroScore}>
              <strong>第 {summary.topContent?.rank ?? 1} 名</strong>
              <span>{formatReadingDuration(summary.topContent?.seconds ?? 0)}</span>
            </div>
          </section>

          <p className={styles.rankingNote}>
            仅按当前浏览器中的本地阅读会话结算，不包含在线用户或全站排名。
          </p>

          <ol className={styles.rankingList} aria-label="阅读时长排行">
            {summary.ranking.map((item) => {
              const currentContent = contentIds.has(item.contentId)
              const avatar = Array.from(item.contentTitle.trim())[0] ?? '文'
              return (
                <li key={item.contentId}>
                  <button
                    className={`${styles.rankingRow} ${
                      item.contentId === summary.topContent?.contentId
                        ? styles.rankingRowCurrent
                        : ''
                    }`}
                    type="button"
                    disabled={!currentContent}
                    aria-label={`第 ${item.rank} 名，${item.contentTitle}，${formatReadingDuration(item.seconds)}`}
                    onClick={() => openContent(item.contentId)}
                  >
                    <span
                      className={`${styles.rankingNumber} ${
                        item.rank <= 3 ? styles[`rankingNumber${item.rank}`] : ''
                      }`}
                    >
                      {item.rank}
                      {item.tied ? <small>并列</small> : null}
                    </span>
                    <span
                      className={`${styles.rankingAvatar} ${
                        styles[`rankingAvatar${avatarVariant(item.contentId)}`]
                      }`}
                      aria-hidden="true"
                    >
                      {avatar}
                    </span>
                    <span className={styles.rankingName}>
                      <strong title={item.contentTitle}>{item.contentTitle}</strong>
                      <small>{item.sessionCount} 次会话</small>
                    </span>
                    <span className={styles.rankingDuration}>
                      {formatReadingDurationCompact(item.seconds)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </div>
  )
}
