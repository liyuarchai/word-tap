import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../../app/useApp'
import { ConfirmDialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import type { VocabularyRecord } from '../../domain/types'
import { isDueToday } from '../../domain/review'
import styles from '../../styles/app.module.css'

type Filter = 'all' | 'due' | 'future'

export function NotebookPage() {
  const { vocabulary, contents, repository, refresh, loading, notify } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<number | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [source, setSource] = useState('all')
  const [selected, setSelected] = useState<VocabularyRecord | null>(null)
  const [word, setWord] = useState('')
  const [definition, setDefinition] = useState('')
  const [note, setNote] = useState('')
  const [deleting, setDeleting] = useState<VocabularyRecord | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current)
    }
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return vocabulary.filter((item) => {
      if (source !== 'all' && item.contentId !== source) return false
      const due = isDueToday(item)
      if (filter === 'due' && !due) return false
      if (filter === 'future' && due) return false
      if (!needle) return true
      return [item.word, item.lemma, item.localDefinition, item.userDefinition, item.contextSentence]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [filter, query, source, vocabulary])

  const scheduleSearch = (value: string) => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      searchTimer.current = null
      setQuery(value)
    }, 150)
  }

  const open = useCallback((record: VocabularyRecord) => {
    setSelected(record)
    setWord(record.word)
    setDefinition(record.userDefinition)
    setNote(record.note)
  }, [])

  useEffect(() => {
    if (loading) return
    const cardId = searchParams.get('card')
    if (!cardId) return
    const record = vocabulary.find((item) => item.id === cardId)
    const timer = window.setTimeout(() => {
      if (record) open(record)
      else notify('词卡不存在或已删除')
    }, 0)
    const next = new URLSearchParams(searchParams)
    next.delete('card')
    setSearchParams(next, { replace: true })
    return () => window.clearTimeout(timer)
  }, [loading, notify, open, searchParams, setSearchParams, vocabulary])

  const save = async () => {
    if (!selected || !word.trim()) return
    setSaving(true)
    try {
      await repository.putVocabulary({
        ...selected,
        word: word.trim(),
        userDefinition: definition.trim(),
        note: note.trim(),
        updatedAt: new Date().toISOString()
      })
      await refresh()
      setSelected(null)
      notify('词卡已保存')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleting) return
    await repository.deleteVocabulary(deleting.id)
    await refresh()
    setDeleting(null)
    setSelected(null)
    notify('词卡已删除')
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>生词本</h1>
          <p className={styles.pageSubtitle}>共 {vocabulary.length} 词</p>
        </div>
      </header>

      <div className={styles.notebookToolbar}>
        <label className={styles.searchBox}>
          <Icon name="search" size={20} />
          <span className={styles.srOnly}>搜索生词</span>
          <input
            ref={searchInputRef}
            className={styles.searchInput}
            type="search"
            defaultValue=""
            placeholder="搜单词、释义或句子"
            onChange={(event) => scheduleSearch(event.target.value)}
          />
        </label>
        <select
          className={styles.select}
          aria-label="按来源筛选"
          value={source}
          onChange={(event) => setSource(event.target.value)}
        >
          <option value="all">全部来源</option>
          {contents.map((content) => (
            <option key={content.id} value={content.id}>
              {content.title}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterTabs}>
        {(
          [
            ['all', '全部'],
            ['due', '今日到期'],
            ['future', '未到期']
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            className={`${styles.filterTab} ${filter === value ? styles.activeFilter : ''}`}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.notebookList}>
          <div className={styles.skeletonRow} />
          <div className={`${styles.skeletonRow} ${styles.skeletonRowShort}`} />
        </div>
      ) : null}

      {!loading && !vocabulary.length ? (
        <section className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>在阅读中点一个词，它就会出现在这里。</h2>
          <a className={styles.textButton} href="/library">
            去内容库
          </a>
        </section>
      ) : null}

      {!loading && vocabulary.length && !filtered.length ? (
        <section className={styles.emptyState}>
          <p className={styles.emptyText}>没有找到匹配的词。</p>
          <button
            className={styles.textButton}
            type="button"
            onClick={() => {
              setQuery('')
              if (searchInputRef.current) searchInputRef.current.value = ''
              setFilter('all')
              setSource('all')
            }}
          >
            清除搜索与筛选
          </button>
        </section>
      ) : null}

      <div className={styles.notebookList}>
        {filtered.map((record) => {
          const contentMissing = record.contentId && !contents.some((item) => item.id === record.contentId)
          return (
            <article className={styles.vocabRow} key={record.id}>
              <button className={styles.vocabMain} type="button" onClick={() => open(record)}>
                <span className={styles.vocabWord}>
                  {record.word}
                  {record.lemma !== record.word.toLowerCase() ? (
                    <span className={styles.vocabLemma}>· {record.lemma}</span>
                  ) : null}
                </span>
                <span className={styles.vocabDefinition}>
                  {record.userDefinition || record.aiDefinition?.contextMeaning || record.localDefinition}
                </span>
              </button>
              <span className={styles.vocabMeta}>
                {contentMissing ? '来源内容已删除' : record.contentTitle}
                <br />
                {new Intl.DateTimeFormat('zh-CN', {
                  month: 'numeric',
                  day: 'numeric'
                }).format(new Date(record.createdAt))}
              </span>
            </article>
          )
        })}
      </div>

      {selected ? (
        <>
          <button
            className={styles.drawerBackdrop}
            type="button"
            aria-label="关闭词卡详情"
            onClick={() => setSelected(null)}
          />
          <aside className={styles.drawer} aria-label="词卡详情">
            <div className={styles.dialogHead}>
              <div>
                <div className={styles.eyebrow}>生词卡</div>
                <h2 className={styles.dialogTitle}>{selected.word}</h2>
              </div>
              <button
                className={styles.iconButton}
                type="button"
                aria-label="关闭"
                onClick={() => setSelected(null)}
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <blockquote className={styles.contextQuote}>{selected.contextSentence}</blockquote>
            <div className={styles.drawerForm}>
              <label className={styles.field}>
                <span className={styles.label}>单词拼写</span>
                <input
                  className={styles.input}
                  value={word}
                  onChange={(event) => setWord(event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>用户补充释义</span>
                <input
                  className={styles.input}
                  value={definition}
                  placeholder={selected.localDefinition}
                  onChange={(event) => setDefinition(event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>备注</span>
                <textarea
                  className={styles.textarea}
                  value={note}
                  placeholder="写下你的记忆线索"
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              <div className={styles.metaLine}>
                来源：{selected.sourceName} · 下次复习：
                {new Intl.DateTimeFormat('zh-CN', {
                  month: 'long',
                  day: 'numeric'
                }).format(new Date(selected.dueAt))}
              </div>
              <div className={styles.buttonRow}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={saving || !word.trim()}
                  onClick={() => void save()}
                >
                  {saving ? '保存中…' : '保存'}
                </button>
                <button
                  className={styles.dangerButton}
                  type="button"
                  onClick={() => setDeleting(selected)}
                >
                  删除这张词卡
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}
      {deleting ? (
        <ConfirmDialog
          title="删除词卡"
          description="该词卡及对应复习记录会被删除，且不会影响原始内容。"
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      ) : null}
    </div>
  )
}

