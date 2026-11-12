import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useApp } from '../../app/useApp'
import { Icon } from '../../components/Icon'
import type {
  ContentRecord,
  SentenceAnalysis,
  Segment,
  VocabularyRecord
} from '../../domain/types'
import { analysisSchema, translationSchema } from '../../domain/schemas'
import { formatTime } from '../../domain/review'
import {
  createAiCacheKey,
  readValidatedCache,
  withTimeout
} from '../../services/ai'
import { buildLocalGloss } from '../../services/dictionary'
import { MarkdownBlock } from './MarkdownBlock'
import { WordPanel } from './WordPanel'
import styles from '../../styles/app.module.css'

interface SegmentTranslationState {
  status?: 'loading' | 'success' | 'error'
  translation?: string
  analysis?: SentenceAnalysis
  analysisStatus?: 'loading' | 'success' | 'error'
  analysisMessage?: string
  localGloss?: string
  message?: string
}

interface ActiveAiOperation {
  controller: AbortController
  requestId: number
  segmentIndex: number
  kind: 'translate' | 'analysis'
}

function boundedText(text: string | undefined): string | undefined {
  if (!text) return undefined
  return Array.from(text).slice(0, 500).join('')
}

export function ReaderPage() {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const {
    contents,
    repository,
    refresh,
    loading,
    aiClient,
    aiEnabled,
    settings,
    notify
  } = useApp()
  const [content, setContent] = useState<ContentRecord | null>(null)
  const [selected, setSelected] = useState<{ word: string; segment: Segment } | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [chromeVisible, setChromeVisible] = useState(true)
  const [progress, setProgress] = useState(0)
  const [translations, setTranslations] = useState<Record<number, SegmentTranslationState>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | null>(null)
  const activeOperations = useRef<Map<string, ActiveAiOperation>>(new Map())
  const operationSequence = useRef(0)

  useEffect(() => {
    const found = contents.find((item) => item.id === contentId)
    setContent(found ?? null)
  }, [contentId, contents])

  const virtualizer = useVirtualizer({
    count: content?.segments.length ?? 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const segment = content?.segments[index]
      if (segment?.kind === 'h1') return 100
      if (segment?.kind === 'h2') return 84
      return 170
    },
    overscan: 8
  })

  const resetChromeTimer = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    setChromeVisible(true)
    hideTimer.current = window.setTimeout(() => setChromeVisible(false), 3000)
  }, [])

  useEffect(() => {
    resetChromeTimer()
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [resetChromeTimer])

  const changeMode = async (mode: 'subtitle' | 'page') => {
    if (!content || content.mode === mode) return
    const updated = { ...content, mode, updatedAt: new Date().toISOString() }
    setContent(updated)
    await repository.updateContent(updated)
    await refresh()
  }

  const saveVocabulary = useCallback(async (record: VocabularyRecord): Promise<VocabularyRecord> => {
    const existing = await repository.getVocabulary(record.id)
    if (existing) {
      notify('这个词已在生词本中')
      return existing
    }
    await repository.putVocabulary(record)
    await refresh()
    notify('已加入生词本')
    return record
  }, [notify, refresh, repository])

  const updateVocabulary = useCallback(async (record: VocabularyRecord) => {
    await repository.putVocabulary(record)
    await refresh()
  }, [refresh, repository])

  const getBoundedContext = (segment: Segment) => {
    if (!content) return { contextBefore: undefined, contextAfter: undefined }
    return {
      contextBefore: boundedText(content.segments[segment.index - 1]?.text),
      contextAfter: boundedText(content.segments[segment.index + 1]?.text)
    }
  }

  const abortAllOperations = useCallback(() => {
    for (const operation of activeOperations.current.values()) {
      operation.controller.abort()
    }
    activeOperations.current.clear()
  }, [])

  useEffect(() => {
    return () => abortAllOperations()
  }, [abortAllOperations, contentId])

  useEffect(() => {
    for (const [key, operation] of activeOperations.current) {
      if (operation.segmentIndex === currentIndex) continue
      operation.controller.abort()
      activeOperations.current.delete(key)
    }
  }, [currentIndex])

  const beginOperation = (segment: Segment, kind: ActiveAiOperation['kind']) => {
    const key = `${segment.index}:${kind}`
    for (const [activeKey, operation] of activeOperations.current) {
      if (activeKey === key || operation.segmentIndex !== segment.index) {
        operation.controller.abort()
        activeOperations.current.delete(activeKey)
      }
    }
    const operation: ActiveAiOperation = {
      controller: new AbortController(),
      requestId: ++operationSequence.current,
      segmentIndex: segment.index,
      kind
    }
    activeOperations.current.set(key, operation)
    return { key, operation }
  }

  const isCurrentOperation = (key: string, operation: ActiveAiOperation) => {
    const active = activeOperations.current.get(key)
    return (
      !operation.controller.signal.aborted &&
      active?.requestId === operation.requestId &&
      active.kind === operation.kind &&
      active.segmentIndex === operation.segmentIndex
    )
  }

  const finishOperation = (key: string, operation: ActiveAiOperation) => {
    if (activeOperations.current.get(key)?.requestId === operation.requestId) {
      activeOperations.current.delete(key)
    }
  }

  const translate = async (segment: Segment, force = false) => {
    const context = getBoundedContext(segment)
    if (!aiEnabled) {
      const gloss = await buildLocalGloss(segment.text)
      setTranslations((current) => ({
        ...current,
        [segment.index]: {
          status: 'error',
          message: '配置 API Key 后可翻译整句。',
          localGloss: gloss
        }
      }))
      return
    }
    const { key, operation } = beginOperation(segment, 'translate')
    setTranslations((current) => ({
      ...current,
      [segment.index]: { ...current[segment.index], status: 'loading' }
    }))
    try {
      const cacheKey = await createAiCacheKey({
        operation: 'translate',
        apiBaseUrl: settings.apiBaseUrl,
        model: settings.model,
        target: segment.text,
        ...context
      })
      if (!force) {
        const cached = readValidatedCache(
          await repository.getAiCache(cacheKey),
          translationSchema
        )
        if (cached && isCurrentOperation(key, operation)) {
          setTranslations((current) => ({
            ...current,
            [segment.index]: {
              ...current[segment.index],
              status: 'success',
              translation: cached.translation
            }
          }))
          return
        }
      }
      const result = await withTimeout(
        settings.timeoutSeconds,
        (signal) =>
          aiClient.translateSentence(
            { sentence: segment.text, ...context },
            signal
          ),
        operation.controller.signal
      )
      if (!isCurrentOperation(key, operation)) return
      await repository.putAiCache({
        key: cacheKey,
        operation: 'translate',
        payload: result,
        createdAt: new Date().toISOString()
      })
      setTranslations((current) => ({
        ...current,
        [segment.index]: {
          ...current[segment.index],
          status: 'success',
          translation: result.translation
        }
      }))
    } catch (error) {
      if (!isCurrentOperation(key, operation)) return
      const gloss = await buildLocalGloss(segment.text)
      if (!isCurrentOperation(key, operation)) return
      setTranslations((current) => ({
        ...current,
        [segment.index]: {
          ...current[segment.index],
          status: 'error',
          message: error instanceof Error ? error.message : '翻译暂不可用，原文不受影响。',
          localGloss: gloss
        }
      }))
    } finally {
      finishOperation(key, operation)
    }
  }

  const analyze = async (segment: Segment, force = false) => {
    if (!aiEnabled) return
    const context = getBoundedContext(segment)
    const { key, operation } = beginOperation(segment, 'analysis')
    setTranslations((current) => ({
      ...current,
      [segment.index]: {
        ...current[segment.index],
        analysisStatus: 'loading'
      }
    }))
    try {
      const cacheKey = await createAiCacheKey({
        operation: 'analysis',
        apiBaseUrl: settings.apiBaseUrl,
        model: settings.model,
        target: segment.text,
        ...context
      })
      if (!force) {
        const cached = readValidatedCache(
          await repository.getAiCache(cacheKey),
          analysisSchema
        )
        if (cached && isCurrentOperation(key, operation)) {
          setTranslations((current) => ({
            ...current,
            [segment.index]: {
              ...current[segment.index],
              analysis: cached,
              analysisStatus: 'success',
              analysisMessage: undefined
            }
          }))
          return
        }
      }
      const result = await withTimeout(
        settings.timeoutSeconds,
        (signal) =>
          aiClient.analyzeSentence(
            { sentence: segment.text, ...context },
            signal
          ),
        operation.controller.signal
      )
      if (!isCurrentOperation(key, operation)) return
      await repository.putAiCache({
        key: cacheKey,
        operation: 'analysis',
        payload: result,
        createdAt: new Date().toISOString()
      })
      setTranslations((current) => ({
        ...current,
        [segment.index]: {
          ...current[segment.index],
          analysis: result,
          analysisStatus: 'success'
        }
      }))
    } catch (error) {
      if (!isCurrentOperation(key, operation)) return
      setTranslations((current) => ({
        ...current,
        [segment.index]: {
          ...current[segment.index],
          analysisStatus: 'error',
          analysisMessage:
            error instanceof Error ? error.message : '精析暂不可用，请稍后重试。'
        }
      }))
    } finally {
      finishOperation(key, operation)
    }
  }

  if (loading) {
    return (
      <div className={styles.readerPage}>
        <div className={styles.readerColumn}>
          <div className={styles.skeletonRow} />
          <div className={`${styles.skeletonRow} ${styles.skeletonRowShort}`} />
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className={styles.emptyState}>
        <h1 className={styles.emptyTitle}>内容没有找到。</h1>
        <p className={styles.emptyText}>它可能已经被删除，返回内容库选择其他文章。</p>
        <button className={styles.textButton} type="button" onClick={() => navigate('/library')}>
          返回内容库
        </button>
      </div>
    )
  }

  return (
    <div className={styles.readerPage}>
      <header
        className={`${styles.readerChrome} ${chromeVisible ? '' : styles.chromeHidden}`}
        onPointerEnter={() => setChromeVisible(true)}
      >
        <div>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="返回内容库"
            onClick={() => navigate('/library')}
          >
            <Icon name="back" size={20} />
          </button>
        </div>
        <div className={styles.readerTitle}>{content.title}</div>
        <div className={styles.modeSwitch} style={{ justifySelf: 'end' }}>
          <button
            className={`${styles.modeButton} ${
              content.mode === 'subtitle' ? styles.activeMode : ''
            }`}
            type="button"
            aria-pressed={content.mode === 'subtitle'}
            onClick={() => void changeMode('subtitle')}
          >
            字幕
          </button>
          <button
            className={`${styles.modeButton} ${content.mode === 'page' ? styles.activeMode : ''}`}
            type="button"
            aria-pressed={content.mode === 'page'}
            onClick={() => void changeMode('page')}
          >
            书页
          </button>
        </div>
      </header>

      <div
        className={styles.readerScroll}
        ref={scrollRef}
        onPointerMove={(event) => {
          if (event.clientY <= 80) resetChromeTimer()
        }}
        onScroll={(event) => {
          const target = event.currentTarget
          const max = target.scrollHeight - target.clientHeight
          setProgress(max > 0 ? target.scrollTop / max : 0)
          const center = target.scrollTop + target.clientHeight * 0.42
          const visible = virtualizer
            .getVirtualItems()
            .find((item) => item.start <= center && item.end >= center)
          if (visible) setCurrentIndex(visible.index)
        }}
      >
        <div className={styles.readerColumn}>
          <div
            className={styles.virtualCanvas}
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const segment = content.segments[virtualRow.index]
              const translation = translations[segment.index]
              const plain =
                content.format !== 'MD' ||
                ['subtitle', 'paragraph', 'quote', 'list', 'code'].includes(segment.kind)
              return (
                <div
                  key={segment.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  className={styles.virtualItem}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <article
                    className={`${styles.segment} ${
                      content.mode === 'subtitle' && segment.kind === 'subtitle'
                        ? styles.subtitleSegment
                        : ''
                    } ${virtualRow.index === currentIndex ? styles.segmentCurrent : ''}`}
                    onPointerEnter={() => setCurrentIndex(virtualRow.index)}
                  >
                    {segment.startMs !== undefined && content.mode === 'subtitle' ? (
                      <span className={styles.timestamp}>{formatTime(segment.startMs)}</span>
                    ) : null}
                    <MarkdownBlock
                      markdown={segment.text}
                      plain={plain}
                      activeWord={selected?.word}
                      onWord={(word) => setSelected({ word, segment })}
                    />
                    <div className={styles.segmentTools}>
                      <button
                        className={styles.textButton}
                        type="button"
                        onClick={() => void translate(segment, Boolean(translation?.translation))}
                      >
                        {translation?.translation ? '重新翻译' : '翻译本句'}
                      </button>
                      <button
                        className={styles.textButton}
                        type="button"
                        disabled={!aiEnabled}
                        onClick={() => void analyze(segment)}
                      >
                        深入分析
                      </button>
                    </div>
                    {translation?.status === 'loading' ? (
                      <p className={styles.segmentTranslation}>正在翻译…</p>
                    ) : null}
                    {translation?.translation ? (
                      <p className={styles.segmentTranslation}>{translation.translation}</p>
                    ) : null}
                    {translation?.status === 'error' ? (
                      <div className={styles.segmentTranslation}>
                        <p>{translation.message}</p>
                        {translation.localGloss ? (
                          <p className={styles.metaLine}>本地逐词对照：{translation.localGloss}</p>
                        ) : null}
                      </div>
                    ) : null}
                    {translation?.analysisStatus === 'loading' ? (
                      <p className={styles.segmentTranslation}>正在分析句子结构…</p>
                    ) : null}
                    {translation?.analysis ? (
                      <div className={styles.analysisBox}>
                        <span>主干：{translation.analysis.mainClause}</span>
                        <span>逻辑：{translation.analysis.logic}</span>
                        <span>搭配：{translation.analysis.phrases}</span>
                        <span>难点：{translation.analysis.hardPoints}</span>
                        <span>自然表达：{translation.analysis.naturalZh}</span>
                      </div>
                    ) : null}
                    {translation?.analysisStatus === 'error' ? (
                      <p className={styles.fieldError} style={{ marginTop: 10 }}>
                        {translation.analysisMessage ?? '精析暂不可用，可稍后重试。'}{' '}
                        <button
                          className={styles.textButton}
                          type="button"
                          onClick={() => void analyze(segment, Boolean(translation?.analysis))}
                        >
                          重试
                        </button>
                      </p>
                    ) : null}
                  </article>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.readerProgress} aria-hidden="true">
        <div className={styles.readerProgressFill} style={{ width: `${progress * 100}%` }} />
      </div>

      {selected ? (
        <WordPanel
          key={`${selected.segment.id}:${selected.word}`}
          content={content}
          segment={selected.segment}
          word={selected.word}
          {...getBoundedContext(selected.segment)}
          onClose={() => setSelected(null)}
          onSave={saveVocabulary}
          onUpdate={updateVocabulary}
        />
      ) : null}
    </div>
  )
}

