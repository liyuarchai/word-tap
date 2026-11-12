import { useMemo, useRef, useState, type DragEvent } from 'react'
import { Dialog } from '../../components/Dialog'
import type { ContentFormat, ContentRecord } from '../../domain/types'
import { parseContent } from '../../domain/parsers'
import {
  MAX_CONTENT_BYTES,
  defaultTitle,
  sha256,
  uniqueId
} from '../../domain/text'
import styles from '../../styles/app.module.css'
import { extractImportFile, MAX_UPLOAD_BYTES } from './officeImport'

type FormatOption = 'AUTO' | 'TXT' | 'SRT' | 'MD'

export function ImportDialog({
  contents,
  onClose,
  onSave
}: {
  contents: ContentRecord[]
  onClose: () => void
  onSave: (content: ContentRecord) => Promise<void>
}) {
  const [tab, setTab] = useState<'paste' | 'file'>('paste')
  const [raw, setRaw] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<FormatOption>('AUTO')
  const [error, setError] = useState('')
  const [extractedFormat, setExtractedFormat] = useState<ContentFormat | null>(null)
  const [duplicate, setDuplicate] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bytes = useMemo(() => new TextEncoder().encode(raw).byteLength, [raw])

  const readFile = async (nextFile: File) => {
    setError('')
    if (nextFile.size > MAX_UPLOAD_BYTES) {
      setError('文件超过 10 MB，请拆分后再导入。')
      return
    }
    try {
      const extracted = await extractImportFile(nextFile)
      setFile(nextFile)
      setRaw(extracted.rawText)
      setExtractedFormat(extracted.format)
      setFormat(
        extracted.format === 'SRT'
          ? 'SRT'
          : extracted.format === 'MD'
            ? 'MD'
            : 'TXT'
      )
    } catch (caught) {
      setExtractedFormat(null)
      setError(
        caught instanceof Error
          ? caught.message
          : '文件无法解析，请检查格式或转换为 UTF-8 后重试。'
      )
    }
  }

  const importContent = async (force = false) => {
    setError('')
    setDuplicate(false)
    if (!raw.trim()) {
      setError('请输入或选择一个文本文件。')
      return
    }
    if (new TextEncoder().encode(raw).byteLength > MAX_CONTENT_BYTES) {
      setError('内容超过 2 MB，请拆分后再导入。')
      return
    }
    setSaving(true)
    try {
      const parsed = parseContent(
        raw,
        extractedFormat ? 'TXT' : format,
        file?.name ?? ''
      )
      const contentHash = await sha256(raw)
      if (!force && contents.some((content) => content.contentHash === contentHash)) {
        setDuplicate(true)
        return
      }
      const now = new Date().toISOString()
      await onSave({
        id: uniqueId('content'),
        title:
          (file?.name ? file.name.replace(/\.[^.]+$/, '') : parsed.title) ||
          defaultTitle(raw),
        format: extractedFormat ?? parsed.format,
        rawText: raw,
        segments: parsed.segments,
        sourceName: file?.name ?? '粘贴内容',
        contentHash,
        wordCount: parsed.wordCount,
        mode: (extractedFormat ?? parsed.format) === 'SRT' ? 'subtitle' : 'page',
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '导入失败，请检查内容。')
    } finally {
      setSaving(false)
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const nextFile = event.dataTransfer.files[0]
    if (nextFile) void readFile(nextFile)
  }

  return (
    <Dialog title="导入内容" onClose={onClose}>
      <div className={styles.importTabs} role="tablist">
        <button
          className={`${styles.importTab} ${tab === 'paste' ? styles.activeImportTab : ''}`}
          type="button"
          role="tab"
          aria-selected={tab === 'paste'}
          onClick={() => setTab('paste')}
        >
          粘贴
        </button>
        <button
          className={`${styles.importTab} ${tab === 'file' ? styles.activeImportTab : ''}`}
          type="button"
          role="tab"
          aria-selected={tab === 'file'}
          onClick={() => setTab('file')}
        >
          文件
        </button>
      </div>

      <div className={styles.importPanel} hidden={tab !== 'paste'}>
        <textarea
          className={styles.textarea}
          aria-label="粘贴英文内容"
          placeholder="粘贴英文字幕、文章或书摘…"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
        />
        <div className={styles.detectRow}>
          <span>自动识别格式</span>
          <select
            className={styles.select}
            aria-label="内容格式"
            value={format}
            onChange={(event) => setFormat(event.target.value as FormatOption)}
            style={{ width: 140 }}
          >
            <option value="AUTO">自动识别</option>
            <option value="TXT">TXT</option>
            <option value="SRT">SRT</option>
            <option value="MD">Markdown</option>
          </select>
        </div>
      </div>

      <div className={styles.importPanel} hidden={tab !== 'file'}>
        <div
          className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {file ? (
            <div>
              <strong>{file.name}</strong>
              <p className={styles.metaLine}>{Math.round(file.size / 1024)} KB</p>
            </div>
          ) : (
            <span>拖入 .txt / .srt / .md / .csv / .docx / .xlsx，或点击选择文件</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.srt,.md,.csv,.docx,.xlsx,text/plain,text/markdown,text/csv"
            hidden
            onChange={(event) => {
              const nextFile = event.target.files?.[0]
              if (nextFile) void readFile(nextFile)
            }}
          />
        </div>
      </div>

      {error ? <p className={styles.fieldError}>{error}</p> : null}
      {duplicate ? (
        <div className={styles.storageError} style={{ position: 'static', marginTop: 12 }}>
          这段内容已经在内容库中。
          <button className={styles.textButton} type="button" onClick={() => void importContent(true)}>
            仍然导入
          </button>
        </div>
      ) : null}
      <div className={styles.dialogFoot}>
        <span className={styles.metaLine}>
          {raw.length.toLocaleString()} 字符 · {Math.ceil(bytes / 1024).toLocaleString()} KB · 正文上限 2 MB
        </span>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={saving || !raw.trim()}
          onClick={() => void importContent()}
        >
          {saving ? '正在解析…' : '开始阅读'}
        </button>
      </div>
    </Dialog>
  )
}

