import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../app/useApp'
import type { Rating, ReviewSession, VocabularyRecord } from '../../domain/types'
import {
  dueBatch,
  formatDueDate,
  localDateKey,
  nextUpcomingDate,
  scheduleVocabulary
} from '../../domain/review'
import styles from '../../styles/app.module.css'

function unanswered(session: ReviewSession, vocabulary: VocabularyRecord[]) {
  return session.cardIds.filter(
    (id) => !session.answeredCardIds.includes(id) && vocabulary.some((item) => item.id === id)
  )
}

export function ReviewHomePage() {
  const { vocabulary, loading } = useApp()
  const navigate = useNavigate()
  const due = useMemo(() => dueBatch(vocabulary), [vocabulary])
  const allDueCount = due.batch.length + due.remaining
  const upcoming = nextUpcomingDate(vocabulary)

  if (loading) {
    return (
      <div className={styles.narrowPage}>
        <div className={styles.skeletonRow} />
      </div>
    )
  }

  return (
    <div className={styles.narrowPage}>
      {allDueCount ? (
        <section className={styles.reviewHome}>
          <div className={styles.reviewCount}>{allDueCount}</div>
          <p className={styles.reviewCountLabel}>张词卡今天到期</p>
          <div className={styles.reviewHomeActions}>
            <button
              className={styles.primaryButton}
              type="button"
              style={{ minWidth: 200 }}
              onClick={() => navigate('/review/card')}
            >
              开始复习
            </button>
            <span className={styles.metaLine}>约 {Math.max(1, Math.ceil(allDueCount / 2))} 分钟</span>
            {due.remaining ? (
              <span className={styles.metaLine}>另有 {due.remaining} 张超出本批上限</span>
            ) : null}
          </div>
        </section>
      ) : (
        <section className={styles.emptyState}>
          <h1 className={styles.emptyTitle}>今天没有要复习的了。</h1>
          <p className={styles.emptyText}>
            {upcoming ? `下一次是 ${formatDueDate(upcoming)}` : '收集生词后会在这里生成复习计划。'}
          </p>
          <a className={styles.textButton} href="/library">
            去内容库
          </a>
        </section>
      )}
    </div>
  )
}

export function ReviewSessionPage() {
  const { vocabulary, repository, refresh, aiEnabled } = useApp()
  const navigate = useNavigate()
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [error, setError] = useState('')
  const localDate = localDateKey()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const due = dueBatch(vocabulary)
      let current = await repository.getSession(localDate)
      if (!current) {
        const now = new Date().toISOString()
        current = {
          localDate,
          cardIds: due.batch.map((item) => item.id),
          answeredCardIds: [],
          ratings: {},
          startedAt: now,
          updatedAt: now
        }
        await repository.putSession(current)
      } else {
        const missing = due.batch
          .map((item) => item.id)
          .filter((id) => !current!.cardIds.includes(id))
        if (missing.length) {
          current = {
            ...current,
            cardIds: [...current.cardIds, ...missing],
            updatedAt: new Date().toISOString()
          }
          await repository.putSession(current)
        }
      }
      if (!cancelled) setSession(current)
    })()
    return () => {
      cancelled = true
    }
  }, [localDate, repository, vocabulary])

  const remaining = session ? unanswered(session, vocabulary) : []
  const currentCard = remaining.length
    ? vocabulary.find((item) => item.id === remaining[0])
    : undefined
  const answeredCount = session?.answeredCardIds.length ?? 0
  const total = session?.cardIds.length ?? 0

  const rate = async (rating: Rating) => {
    if (!session || !currentCard || busyRef.current || !revealed) return
    busyRef.current = true
    setBusy(true)
    setError('')
    try {
      const now = new Date()
      const updatedVocabulary = scheduleVocabulary(currentCard, rating, now)
      const nextSession: ReviewSession = {
        ...session,
        answeredCardIds: [...session.answeredCardIds, currentCard.id],
        ratings: { ...session.ratings, [currentCard.id]: rating },
        updatedAt: now.toISOString(),
        completedAt:
          session.answeredCardIds.length + 1 >= session.cardIds.length
            ? now.toISOString()
            : undefined
      }
      await repository.gradeVocabulary(updatedVocabulary, nextSession, {
        id: crypto.randomUUID(),
        vocabularyId: currentCard.id,
        reviewedAt: now.toISOString(),
        rating,
        previousIntervalDays: currentCard.intervalDays,
        nextDueAt: updatedVocabulary.dueAt,
        localDate
      })
      setSession(nextSession)
      setRevealed(false)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '评分保存失败，请重试。')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!currentCard) return
      if (event.code === 'Space' && !revealed) {
        event.preventDefault()
        setRevealed(true)
      }
      if (revealed && ['1', '2', '3'].includes(event.key)) {
        event.preventDefault()
        const rating: Rating =
          event.key === '1' ? 'forgot' : event.key === '2' ? 'fuzzy' : 'know'
        void rate(rating)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  if (!session) {
    return (
      <div className={styles.completePage}>
        <p className={styles.emptyText}>正在生成今日复习计划…</p>
      </div>
    )
  }

  if (!currentCard) {
    const counts: Record<Rating, number> = { forgot: 0, fuzzy: 0, know: 0 }
    Object.values(session.ratings).forEach((rating) => {
      counts[rating] += 1
    })
    const todayRemaining = dueBatch(vocabulary).batch.length + dueBatch(vocabulary).remaining
    return (
      <main className={styles.completePage}>
        <h1 className={styles.completeTitle}>今天做完了。</h1>
        <div className={styles.statsRow}>
          {(
            [
              ['know', '认识'],
              ['fuzzy', '模糊'],
              ['forgot', '忘记']
            ] as const
          ).map(([rating, label]) => (
            <div className={styles.stat} key={rating}>
              <span className={styles.statNumber}>{counts[rating]}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
        <p className={styles.emptyText}>
          {todayRemaining
            ? `今天还有 ${todayRemaining} 张到期，可稍后继续。`
            : '今天的复习已经全部完成。'}
        </p>
        <div className={styles.buttonRow}>
          <button className={styles.textButton} type="button" onClick={() => navigate('/library')}>
            回内容库
          </button>
          <button className={styles.textButton} type="button" onClick={() => navigate('/notebook')}>
            看生词本
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.reviewSession}>
      <div className={styles.reviewTopLine} aria-hidden="true">
        <div
          className={styles.reviewTopLineFill}
          style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }}
        />
      </div>
      <header className={styles.reviewSessionHead}>
        <span>
          第 {Math.min(answeredCount + 1, total)} 张 / 共 {total} 张
        </span>
        <button className={styles.textButton} type="button" onClick={() => navigate('/review')}>
          退出
        </button>
      </header>

      <section className={styles.reviewCard}>
        <h1 className={styles.reviewWord}>{currentCard.word}</h1>
        <p className={styles.reviewSentence}>{currentCard.contextSentence}</p>
        <p className={styles.reviewSource}>来源 · {currentCard.contentTitle}</p>
        {revealed ? (
          <div className={styles.reviewAnswer}>
            <p className={styles.reviewAnswerMeaning}>
              {currentCard.userDefinition || currentCard.localDefinition}
            </p>
            {currentCard.aiDefinition ? (
              <>
                <p>
                  <span className={styles.sectionLabel}>语境</span> ·{' '}
                  {currentCard.aiDefinition.contextMeaning}
                </p>
                <p className={styles.aiExample}>{currentCard.aiDefinition.example}</p>
                <p className={styles.aiExampleZh}>{currentCard.aiDefinition.exampleZh}</p>
              </>
            ) : (
              <p className={styles.metaLine}>
                {aiEnabled ? 'AI 内容暂不可用，已显示本地释义。' : '未配置 API Key，已显示本地释义。'}
              </p>
            )}
            {currentCard.note ? <p>备注：{currentCard.note}</p> : null}
          </div>
        ) : null}
        {error ? <p className={styles.fieldError}>{error}</p> : null}
      </section>

      <footer className={styles.reviewFooter}>
        {revealed ? (
          <div className={styles.ratingGrid}>
            <button
              className={`${styles.ratingButton} ${styles.ratingForgot}`}
              type="button"
              disabled={busy}
              onClick={() => void rate('forgot')}
            >
              忘记 <span className={styles.keyHint}>1</span>
            </button>
            <button
              className={`${styles.ratingButton} ${styles.ratingFuzzy}`}
              type="button"
              disabled={busy}
              onClick={() => void rate('fuzzy')}
            >
              模糊 <span className={styles.keyHint}>2</span>
            </button>
            <button
              className={`${styles.ratingButton} ${styles.ratingKnow}`}
              type="button"
              disabled={busy}
              onClick={() => void rate('know')}
            >
              认识 <span className={styles.keyHint}>3</span>
            </button>
          </div>
        ) : (
          <>
            <button
              className={`${styles.secondaryButton} ${styles.revealButton}`}
              type="button"
              onClick={() => setRevealed(true)}
            >
              显示答案
            </button>
            <span className={styles.keyHint}>空格</span>
          </>
        )}
      </footer>
    </main>
  )
}

