import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../app/useApp'
import { Icon } from '../../components/Icon'
import type {
  ContentRecord,
  Segment,
  VocabularyRecord,
  WordExplanation
} from '../../domain/types'
import { AiClientError } from '../../domain/types'
import { wordExplanationSchema } from '../../domain/schemas'
import { sha256 } from '../../domain/text'
import {
  createAiCacheKey,
  readValidatedCache,
  withTimeout
} from '../../services/ai'
import { lookupWord } from '../../services/dictionary'
import styles from '../../styles/app.module.css'
import {
  aiAnnouncement,
  createInitialWordAiState,
  WORD_EXPLANATION_FIELDS,
  wordAiReducer,
  type WordAiEvent
} from './wordAiStateMachine'

function waitForReveal(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }
    const timer = window.setTimeout(resolve, milliseconds)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(signal.reason)
      },
      { once: true }
    )
  })
}

function errorEvent(error: unknown): WordAiEvent {
  if (!(error instanceof AiClientError)) {
    return { type: 'AI_INVALID_RESPONSE' }
  }
  switch (error.code) {
    case 'offline':
    case 'network':
      return { type: 'AI_OFFLINE' }
    case 'timeout':
      return { type: 'AI_TIMED_OUT' }
    case 'rate-limit':
      return { type: 'AI_RATE_LIMITED' }
    case 'server':
      return { type: 'AI_SERVER_ERROR', status: error.httpStatus }
    case 'auth':
      return { type: 'AI_AUTH_ERROR', status: error.httpStatus }
    case 'cancelled':
      return { type: 'AI_CANCELLED' }
    default:
      return { type: 'AI_INVALID_RESPONSE' }
  }
}

export function WordPanel({
  content,
  segment,
  word,
  contextBefore,
  contextAfter,
  onClose,
  onSave,
  onUpdate
}: {
  content: ContentRecord
  segment: Segment
  word: string
  contextBefore?: string
  contextAfter?: string
  onClose: () => void
  onSave: (vocabulary: VocabularyRecord) => Promise<VocabularyRecord>
  onUpdate: (vocabulary: VocabularyRecord) => Promise<void>
}) {
  const { aiClient, aiEnabled, settings, repository, vocabulary } = useApp()
  const navigate = useNavigate()
  const [wordState, dispatch] = useReducer(
    wordAiReducer,
    aiEnabled,
    createInitialWordAiState
  )
  const { dictionary, ai: aiState } = wordState
  const lemma = dictionary.phase === 'ready' ? dictionary.lemma : word.toLowerCase()
  const localDefinition =
    dictionary.phase === 'ready'
      ? dictionary.definition
      : dictionary.phase === 'not-found'
        ? '本地词典暂未收录该词'
        : dictionary.phase === 'error'
          ? dictionary.message
          : '正在查询本地词典…'
  const localMeta =
    dictionary.phase === 'ready'
      ? dictionary.meta
      : dictionary.phase === 'not-found'
        ? '可保留上下文，稍后在生词本补充释义'
        : dictionary.phase === 'error'
          ? '原文和生词本仍可使用'
          : '本地词典'
  const [saved, setSaved] = useState<VocabularyRecord | null>(
    vocabulary.find(
      (item) =>
        item.contentId === content.id &&
        item.segmentId === segment.id &&
        item.word.toLowerCase() === word.toLowerCase()
    ) ?? null
  )
  const savedRef = useRef(saved)
  const [saving, setSaving] = useState(false)
  const requestSequence = useRef(0)
  const activeRequest = useRef<{
    id: number
    controller: AbortController
  } | null>(null)
  const mountedRef = useRef(true)
  const autoRequestStarted = useRef(false)

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'DICTIONARY_LOAD_STARTED' })
    void lookupWord(word)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          dispatch({ type: 'DICTIONARY_NOT_FOUND' })
          return
        }
        if (!savedRef.current) {
          const existing = vocabulary.find(
            (item) =>
              item.contentId === content.id &&
              item.segmentId === segment.id &&
              (item.lemma === result.lemma ||
                item.word.toLowerCase() === word.toLowerCase())
          )
          if (existing) {
            savedRef.current = existing
            setSaved(existing)
          }
        }
        dispatch({
          type: 'DICTIONARY_READY',
          lemma: result.lemma,
          definition:
            result.entry.translation || result.entry.definition || '暂无中文释义',
          meta: [
            result.entry.phonetic ? `/${result.entry.phonetic}/` : '',
            result.entry.pos
          ]
            .filter(Boolean)
            .join(' · ')
        })
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({
            type: 'DICTIONARY_FAILED',
            message: '本地词典加载失败'
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [content.id, segment.id, vocabulary, word])

  const applyAiResultToSaved = useCallback(async (result: WordExplanation) => {
    const currentSaved = savedRef.current
    if (!currentSaved || currentSaved.aiDefinition) return
    const updated = {
      ...currentSaved,
      aiDefinition: result,
      updatedAt: new Date().toISOString()
    }
    savedRef.current = updated
    setSaved(updated)
    await onUpdate(updated)
  }, [onUpdate])

  const startAi = useCallback(async (retry = false) => {
    if (!aiEnabled || !segment.text.trim()) return
    activeRequest.current?.controller.abort('superseded')
    const id = ++requestSequence.current
    const controller = new AbortController()
    activeRequest.current = { id, controller }
    const isCurrent = () =>
      mountedRef.current &&
      activeRequest.current?.id === id &&
      !controller.signal.aborted
    try {
      const cacheKey = await createAiCacheKey({
        operation: 'word',
        apiBaseUrl: settings.apiBaseUrl,
        model: settings.model,
        target: `${lemma}|${segment.text}`,
        contextBefore,
        contextAfter
      })
      const cached = readValidatedCache(
        await repository.getAiCache(cacheKey),
        wordExplanationSchema
      )
      if (!isCurrent()) return
      if (cached && !retry) {
        dispatch({ type: 'AI_CACHE_HIT', result: cached })
        await applyAiResultToSaved(cached)
        return
      }

      dispatch(retry ? { type: 'AI_RETRY_STARTED' } : { type: 'AI_REQUESTED' })
      const result = await withTimeout(
        settings.timeoutSeconds,
        (signal) =>
          aiClient.explainWord(
            {
              word,
              lemma,
              sentence: segment.text,
              contextBefore,
              contextAfter
            },
            signal
          ),
        controller.signal
      )
      const validated = wordExplanationSchema.safeParse(result)
      if (!isCurrent()) return
      if (!validated.success) {
        dispatch({ type: 'AI_INVALID_RESPONSE' })
        return
      }

      dispatch({ type: 'AI_REVEAL_STARTED', result: validated.data })
      for (const field of WORD_EXPLANATION_FIELDS) {
        await waitForReveal(220, controller.signal)
        if (!isCurrent()) return
        dispatch({ type: 'AI_REVEAL_FIELD', field })
      }
      if (!isCurrent()) return
      dispatch({ type: 'AI_COMPLETED', result: validated.data })
      await repository.putAiCache({
        key: cacheKey,
        operation: 'word',
        payload: validated.data,
        createdAt: new Date().toISOString()
      })
      await applyAiResultToSaved(validated.data)
    } catch (error) {
      if (!mountedRef.current || activeRequest.current?.id !== id) return
      if (controller.signal.aborted) return
      dispatch(errorEvent(error))
    } finally {
      if (activeRequest.current?.id === id) activeRequest.current = null
    }
  }, [
    aiClient,
    aiEnabled,
    applyAiResultToSaved,
    contextAfter,
    contextBefore,
    lemma,
    repository,
    segment.text,
    settings.apiBaseUrl,
    settings.model,
    settings.timeoutSeconds,
    word
  ])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      autoRequestStarted.current = false
      activeRequest.current?.controller.abort('user-cancel')
      activeRequest.current = null
    }
  }, [])

  useEffect(() => {
    if (dictionary.phase === 'loading') return
    if (aiState.phase !== 'configured-idle') return
    if (autoRequestStarted.current) return
    autoRequestStarted.current = true
    void startAi()
  }, [aiState.phase, dictionary.phase, startAi])

  const stopAi = () => {
    const request = activeRequest.current
    if (!request) return
    activeRequest.current = null
    request.controller.abort('user-cancel')
    dispatch({ type: 'AI_CANCELLED' })
  }

  const retryAi = useCallback(() => {
    void startAi(true)
  }, [startAi])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const addWord = async () => {
    if (saved || saving) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const id = await sha256(`${content.id}|${segment.id}|${lemma}`)
      const aiDefinition =
        aiState.phase === 'complete' || aiState.phase === 'cache-hit'
          ? aiState.result
          : undefined
      const vocabularyRecord: VocabularyRecord = {
        id,
        word,
        lemma,
        contextSentence: segment.text,
        contentId: content.id,
        contentTitle: content.title,
        segmentId: segment.id,
        segmentIndex: segment.index,
        startMs: segment.startMs,
        sourceName: content.sourceName,
        localDefinition,
        aiDefinition,
        userDefinition: '',
        note: '',
        createdAt: now,
        updatedAt: now,
        dueAt: now,
        intervalDays: 0,
        reviewCount: 0
      }
      const savedRecord = await onSave(vocabularyRecord)
      savedRef.current = savedRecord
      setSaved(savedRecord)
    } finally {
      setSaving(false)
    }
  }

  const handlePrimaryAction = () => {
    if (saved) {
      navigate(`/notebook?card=${encodeURIComponent(saved.id)}`)
      return
    }
    void addWord()
  }

  const isAiBusy =
    aiState.phase === 'waiting-first' || aiState.phase === 'streaming'
  const resultForDisplay =
    aiState.phase === 'streaming' ||
    aiState.phase === 'complete' ||
    aiState.phase === 'cache-hit'
      ? aiState.result
      : null
  const revealedFields =
    aiState.phase === 'streaming'
      ? aiState.revealedFields
      : aiState.phase === 'complete' || aiState.phase === 'cache-hit'
        ? WORD_EXPLANATION_FIELDS
        : []
  const errorPhases = [
    'not-configured',
    'cancelled',
    'offline',
    'timeout',
    'rate-limited',
    'server-error',
    'invalid-response',
    'auth-error'
  ] as const
  const isErrorState = errorPhases.includes(
    aiState.phase as (typeof errorPhases)[number]
  )

  const renderAiAction = () => {
    if (!('action' in aiState)) return null
    if (aiState.action === 'configure') {
      return (
        <a href="/settings" className={styles.textButton}>
          去配置
        </a>
      )
    }
    const label =
      aiState.phase === 'cancelled' || aiState.phase === 'invalid-response'
        ? '重新生成'
        : aiState.action === 'check-network'
        ? '检查网络后重试'
        : aiState.action === 'wait'
          ? '稍后重试'
          : '重试'
    return (
      <button className={styles.textButton} type="button" onClick={retryAi}>
        {label}
      </button>
    )
  }

  return (
    <aside className={styles.wordPanel} aria-label="词卡详情">
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.wordHeading}>{word}</h2>
          {lemma !== word.toLowerCase() ? (
            <p className={styles.lemmaLine}>原形 · {lemma}</p>
          ) : null}
          <p className={styles.phoneticLine}>{localMeta || '本地词典'}</p>
        </div>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label="关闭词卡">
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className={styles.panelScroll}>
        <section className={styles.panelSection}>
          <div className={styles.sectionLabel}>本地词典</div>
          <div className={styles.localDefinition}>{localDefinition}</div>
        </section>

        <section className={styles.panelSection}>
          <div className={styles.sectionLabel}>原句</div>
          <blockquote className={styles.contextQuote}>{segment.text}</blockquote>
        </section>

        <section className={styles.panelSection}>
          <div className={styles.sectionLabel}>
            {dictionary.phase === 'not-found'
              ? 'AI 推断'
              : aiState.phase === 'cache-hit'
                ? '语境 · 已缓存'
                : '语境'}
          </div>
          <div className={styles.aiBlock}>
            <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
              {aiAnnouncement(aiState)}
            </p>
            {aiState.phase === 'configured-idle' ? (
              <p className={styles.aiClue}>正在准备语境解释…</p>
            ) : null}
            {aiState.phase === 'waiting-first' ? (
              <>
                <p className={styles.metaLine}>{aiState.message}</p>
                <div className={styles.skeletonRow} />
                <div className={`${styles.skeletonRow} ${styles.skeletonRowShort}`} />
              </>
            ) : null}
            {aiState.phase === 'streaming' ? (
              <p className={styles.aiClue}>{aiState.message}</p>
            ) : null}
            {resultForDisplay && revealedFields.includes('contextMeaning') ? (
              <p className={styles.aiMeaning}>{resultForDisplay.contextMeaning}</p>
            ) : null}
            {resultForDisplay && revealedFields.includes('clue') ? (
              <p className={styles.aiClue}>{resultForDisplay.clue}</p>
            ) : null}
            {resultForDisplay && revealedFields.includes('example') ? (
              <p className={styles.aiExample}>{resultForDisplay.example}</p>
            ) : null}
            {resultForDisplay && revealedFields.includes('exampleZh') ? (
              <p className={styles.aiExampleZh}>{resultForDisplay.exampleZh}</p>
            ) : null}
            {isErrorState ? (
              <div className={styles.aiStatusRow}>
                <p className={styles.aiClue}>
                  {'message' in aiState ? aiState.message : ''}
                </p>
                {renderAiAction()}
              </div>
            ) : null}
            {isAiBusy ? (
              <div className={styles.aiStatusRow}>
                <button
                  className={styles.textButton}
                  type="button"
                  onClick={stopAi}
                >
                  停止生成
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className={styles.panelFooter}>
        <button
          className={`${styles.primaryButton} ${styles.panelFooterButton} ${
            saved ? styles.savedPanelButton : ''
          }`}
          type="button"
          disabled={saving}
          onClick={handlePrimaryAction}
        >
          {saved ? '已在生词本 · 查看' : saving ? '正在保存…' : '加入生词本'}
        </button>
        <p className={styles.panelHint}>Esc 关闭</p>
      </div>
    </aside>
  )
}

