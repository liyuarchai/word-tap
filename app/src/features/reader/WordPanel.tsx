import { useEffect, useRef, useState } from 'react'
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

type AiState =
  | { status: 'idle' | 'loading' }
  | { status: 'none'; message: string }
  | { status: 'success'; result: WordExplanation; cached?: boolean }
  | { status: 'error'; message: string }

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
  const [lemma, setLemma] = useState(word.toLowerCase())
  const [localDefinition, setLocalDefinition] = useState('正在查询本地词典…')
  const [localMeta, setLocalMeta] = useState('')
  const [dictionaryMissing, setDictionaryMissing] = useState(false)
  const [aiState, setAiState] = useState<AiState>(
    aiEnabled ? { status: 'loading' } : { status: 'none', message: '配置 API Key 可查看语境释义与例句' }
  )
  const [retryToken, setRetryToken] = useState(0)
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

  useEffect(() => {
    let cancelled = false
    void lookupWord(word)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setDictionaryMissing(true)
          setLocalDefinition('本地词典暂未收录该词')
          setLocalMeta('可保留上下文，稍后在生词本补充释义')
          return
        }
        setLemma(result.lemma)
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
        setLocalDefinition(result.entry.translation || result.entry.definition || '暂无中文释义')
        setLocalMeta(
          [result.entry.phonetic ? `/${result.entry.phonetic}/` : '', result.entry.pos]
            .filter(Boolean)
            .join(' · ')
        )
      })
      .catch(() => {
        if (!cancelled) {
          setDictionaryMissing(true)
          setLocalDefinition('本地词典加载失败')
          setLocalMeta('原文和生词本仍可使用')
        }
      })
    return () => {
      cancelled = true
    }
  }, [content.id, segment.id, vocabulary, word])

  useEffect(() => {
    if (!aiEnabled) {
      return
    }
    if (!segment.text.trim()) return
    const controller = new AbortController()
    let cancelled = false
    void (async () => {
      try {
        const cacheKey = await createAiCacheKey({
          operation: 'word',
          apiBaseUrl: settings.apiBaseUrl,
          model: settings.model,
          target: `${lemma}|${segment.text}`,
          contextBefore,
          contextAfter
        })
        const cached = await repository.getAiCache(cacheKey)
        const cachedResult = readValidatedCache(cached, wordExplanationSchema)
        if (cachedResult) {
          if (cancelled) return
          setAiState({
            status: 'success',
            result: cachedResult,
            cached: true
          })
          return
        }
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
        if (cancelled) return
        await repository.putAiCache({
          key: cacheKey,
          operation: 'word',
          payload: result,
          createdAt: new Date().toISOString()
        })
        setAiState({ status: 'success', result })
        const currentSaved = savedRef.current
        if (currentSaved && !currentSaved.aiDefinition) {
          const updated = {
            ...currentSaved,
            aiDefinition: result,
            updatedAt: new Date().toISOString()
          }
          savedRef.current = updated
          setSaved(updated)
          await onUpdate(updated)
        }
      } catch (error) {
        if (cancelled) return
        setAiState({
          status: 'error',
          message:
            error instanceof AiClientError || error instanceof Error
              ? error.message
              : 'AI 暂未给出可靠结果'
        })
      }
    })()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    aiClient,
    aiEnabled,
    contextAfter,
    contextBefore,
    lemma,
    onUpdate,
    repository,
    retryToken,
    segment.text,
    settings.apiBaseUrl,
    settings.model,
    settings.timeoutSeconds,
    word
  ])

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
        aiDefinition: aiState.status === 'success' ? aiState.result : undefined,
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
            {dictionaryMissing ? 'AI 推断' : aiState.status === 'success' && aiState.cached ? '语境 · 已缓存' : '语境'}
          </div>
          <div className={styles.aiBlock}>
            {aiState.status === 'loading' ? (
              <>
                <p className={styles.metaLine}>正在结合上下文…</p>
                <div className={styles.skeletonRow} />
                <div className={`${styles.skeletonRow} ${styles.skeletonRowShort}`} />
              </>
            ) : null}
            {aiState.status === 'none' ? (
              <p className={styles.aiClue}>
                {aiState.message} ·{' '}
                <a href="/settings" className={styles.textButton}>
                  去配置
                </a>
              </p>
            ) : null}
            {aiState.status === 'error' ? (
              <p className={styles.aiClue}>
                {aiState.message} ·{' '}
                <button
                  className={styles.textButton}
                  type="button"
                  onClick={() => {
                    setAiState({ status: 'loading' })
                    setRetryToken((value) => value + 1)
                  }}
                >
                  重试
                </button>
              </p>
            ) : null}
            {aiState.status === 'success' ? (
              <>
                <p className={styles.aiMeaning}>{aiState.result.contextMeaning}</p>
                <p className={styles.aiClue}>{aiState.result.clue}</p>
                <p className={styles.aiExample}>{aiState.result.example}</p>
                <p className={styles.aiExampleZh}>{aiState.result.exampleZh}</p>
              </>
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

