import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../app/useApp'
import { ConfirmDialog, Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import type { ContentRecord } from '../../domain/types'
import { downloadFile, todayFileStamp, vocabularyToMarkdown } from '../../services/export'
import { ImportDialog } from './ImportDialog'
import styles from '../../styles/app.module.css'

export function LibraryPage() {
  const { contents, vocabulary, repository, refresh, loading, notify, ocrClient } = useApp()
  const [importing, setImporting] = useState(false)
  const [renaming, setRenaming] = useState<ContentRecord | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleting, setDeleting] = useState<ContentRecord | null>(null)
  const navigate = useNavigate()

  const openContent = async (content: ContentRecord) => {
    const now = new Date().toISOString()
    await repository.updateContent({ ...content, lastOpenedAt: now, updatedAt: now })
    await refresh()
    navigate(`/reader/${content.id}`)
  }

  const rename = async () => {
    if (!renaming || !renameValue.trim()) return
    const now = new Date().toISOString()
    await repository.updateContent({
      ...renaming,
      title: renameValue.trim(),
      updatedAt: now
    })
    await refresh()
    setRenaming(null)
    notify('标题已更新')
  }

  const remove = async () => {
    if (!deleting) return
    await repository.deleteContent(deleting.id)
    await refresh()
    setDeleting(null)
    notify('内容已删除，已收集生词仍保留')
  }

  const exportContent = (content: ContentRecord) => {
    const items = vocabulary.filter((item) => item.contentId === content.id)
    if (!items.length) {
      notify('这篇内容还没有收集生词')
      return
    }
    downloadFile(
      `Word-Tap-${todayFileStamp()}-${content.title.replace(/[\\/:*?"<>|]/g, '-')}.md`,
      vocabularyToMarkdown(items, content.title),
      'text/markdown;charset=utf-8'
    )
    notify('当前内容生词已导出')
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonRow} />
        <div className={`${styles.skeletonRow} ${styles.skeletonRowShort}`} />
      </div>
    )
  }

  if (!contents.length) {
    return (
      <>
        <div className={styles.page}>
          <section className={styles.emptyState}>
            <h1 className={styles.emptyTitle}>还没有内容。</h1>
            <p className={styles.emptyText}>
              粘贴一段字幕，或导入一个 .txt / .srt / .md 文件。
            </p>
            <button className={styles.primaryButton} type="button" onClick={() => setImporting(true)}>
              导入内容
            </button>
          </section>
        </div>
        {importing ? (
          <ImportDialog
            contents={contents}
            ocrClient={ocrClient}
            onClose={() => setImporting(false)}
            onSave={async (content) => {
              await repository.addContent(content)
              await refresh()
              setImporting(false)
              navigate(`/reader/${content.id}`)
            }}
          />
        ) : null}
      </>
    )
  }

  const [lead, ...rest] = contents
  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>内容库</h1>
        <div className={styles.pageActions}>
          <button
            className={styles.textButton}
            type="button"
            onClick={() => exportContent(lead)}
          >
            导出本篇
          </button>
          <button
            className={styles.textButton}
            type="button"
            onClick={() => {
              setRenaming(lead)
              setRenameValue(lead.title)
            }}
          >
            重命名本篇
          </button>
          <button
            className={styles.dangerButton}
            type="button"
            onClick={() => setDeleting(lead)}
          >
            删除本篇
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="导入内容"
            onClick={() => setImporting(true)}
          >
            <Icon name="plus" />
          </button>
        </div>
      </header>

      <button className={styles.continueCard} type="button" onClick={() => void openContent(lead)}>
        <span className={styles.eyebrow}>继续阅读</span>
        <span className={styles.continueTitle}>{lead.title}</span>
        <span className={styles.metaLine}>
          {lead.format} · {lead.wordCount.toLocaleString()} 词 · 已收集{' '}
          {vocabulary.filter((item) => item.contentId === lead.id).length} 词
        </span>
        <span className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: '36%' }} />
        </span>
      </button>

      <div className={styles.libraryList} role="list" aria-label="全部内容">
        {rest.map((content) => (
          <div key={content.id} className={styles.libraryRow} role="listitem">
            <button className={styles.rowMain} type="button" onClick={() => void openContent(content)}>
              <span className={styles.rowTitle}>{content.title}</span>
              <span className={styles.rowMeta}>
                {content.format} · {content.wordCount.toLocaleString()} 词 ·{' '}
                {new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(
                  new Date(content.lastOpenedAt)
                )}
              </span>
            </button>
            <span className={styles.rowSide}>
              {vocabulary.filter((item) => item.contentId === content.id).length} 词
            </span>
            <div className={styles.inlineActions}>
              <button
                className={styles.textButton}
                type="button"
                onClick={() => {
                  setRenaming(content)
                  setRenameValue(content.title)
                }}
              >
                重命名
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                onClick={() => setDeleting(content)}
              >
                删除
              </button>
              <button
                className={styles.textButton}
                type="button"
                onClick={() => exportContent(content)}
              >
                导出
              </button>
            </div>
          </div>
        ))}
      </div>

      {importing ? (
        <ImportDialog
          contents={contents}
          ocrClient={ocrClient}
          onClose={() => setImporting(false)}
          onSave={async (content) => {
            await repository.addContent(content)
            await refresh()
            setImporting(false)
            navigate(`/reader/${content.id}`)
          }}
        />
      ) : null}
      {renaming ? (
        <Dialog title="重命名" onClose={() => setRenaming(null)} small>
          <label className={styles.field}>
            <span className={styles.label}>标题</span>
            <input
              className={styles.input}
              maxLength={80}
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
            />
          </label>
          <div className={styles.buttonRow} style={{ justifyContent: 'flex-end', marginTop: 24 }}>
            <button className={styles.textButton} type="button" onClick={() => setRenaming(null)}>
              取消
            </button>
            <button className={styles.textButton} type="button" onClick={() => void rename()}>
              保存
            </button>
          </div>
        </Dialog>
      ) : null}
      {deleting ? (
        <ConfirmDialog
          title="删除内容"
          description="正文会被删除，已经收集的生词卡及上下文快照会保留。"
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      ) : null}
    </div>
  )
}

