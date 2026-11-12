import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Dialog } from '../../components/Dialog'
import type {
  ContentFormat,
  ContentRecord,
  ExtractedEbook,
  OcrClient,
  OcrPhase,
  OcrResult
} from '../../domain/types'
import { parseContent } from '../../domain/parsers'
import {
  MAX_CONTENT_BYTES,
  defaultTitle,
  sha256,
  uniqueId
} from '../../domain/text'
import styles from '../../styles/app.module.css'
import { extractImportFile, MAX_UPLOAD_BYTES } from './officeImport'
import { extractEbook, MAX_EBOOK_BYTES } from './ebookImport'
import { classifyOcrResult, englishWordCount, normalizeOcrText } from '../../services/ocr'

type FormatOption = 'AUTO' | 'TXT' | 'SRT' | 'MD'
type ImportTab = 'paste' | 'file' | 'ocr'

export function ImportDialog({
  contents,
  onClose,
  onSave,
  ocrClient,
  ocrDemoEnabled = import.meta.env.VITE_ENABLE_OCR_DEMO === 'true'
}: {
  contents: ContentRecord[]
  onClose: () => void
  onSave: (content: ContentRecord) => Promise<void>
  ocrClient?: OcrClient
  ocrDemoEnabled?: boolean
}) {
  const [tab, setTab] = useState<ImportTab>('paste')
  const [raw, setRaw] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [ebook, setEbook] = useState<ExtractedEbook | null>(null)
  const [ebookTitle, setEbookTitle] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [fileMessage, setFileMessage] = useState('')
  const [ocrImage, setOcrImage] = useState<File | null>(null)
  const [ocrPhase, setOcrPhase] = useState<OcrPhase>('idle')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrTitle, setOcrTitle] = useState('')
  const [ocrText, setOcrText] = useState('')
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [ocrError, setOcrError] = useState('')
  const [format, setFormat] = useState<FormatOption>('AUTO')
  const [error, setError] = useState('')
  const [extractedFormat, setExtractedFormat] = useState<ContentFormat | null>(null)
  const [duplicate, setDuplicate] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const ocrImageRef = useRef<HTMLInputElement>(null)
  const fileController = useRef<AbortController | null>(null)
  const ocrController = useRef<AbortController | null>(null)
  const ocrRequest = useRef(0)
  const duplicateCandidate = useRef<ContentRecord | null>(null)
  const bytes = useMemo(() => new TextEncoder().encode(raw).byteLength, [raw])
  const ocrPreviewUrl = useMemo(
    () => (ocrImage ? URL.createObjectURL(ocrImage) : ''),
    [ocrImage]
  )

  useEffect(() => {
    return () => {
      if (ocrPreviewUrl) URL.revokeObjectURL(ocrPreviewUrl)
    }
  }, [ocrPreviewUrl])

  useEffect(() => {
    return () => {
      fileController.current?.abort()
      ocrController.current?.abort()
    }
  }, [])

  const buildContent = (
    title: string,
    rawText: string,
    contentFormat: ContentFormat,
    segments: ContentRecord['segments'],
    wordCount: number,
    sourceName: string,
    contentHash: string
  ): ContentRecord => {
    const now = new Date().toISOString()
    return {
      id: uniqueId('content'),
      title: title.trim() || defaultTitle(rawText),
      format: contentFormat,
      rawText,
      segments,
      sourceName,
      contentHash,
      wordCount,
      mode: contentFormat === 'SRT' ? 'subtitle' : 'page',
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now
    }
  }

  const commitContent = async (candidate: ContentRecord, force = false) => {
    setError('')
    setDuplicate(false)
    if (!force && contents.some((content) => content.contentHash === candidate.contentHash)) {
      duplicateCandidate.current = candidate
      setDuplicate(true)
      return
    }
    setSaving(true)
    try {
      await onSave(candidate)
      duplicateCandidate.current = null
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '导入失败，请检查内容。')
    } finally {
      setSaving(false)
    }
  }

  const readFile = async (nextFile: File) => {
    setError('')
    setDuplicate(false)
    fileController.current?.abort()
    const controller = new AbortController()
    fileController.current = controller
    setFile(null)
    setEbook(null)
    setRaw('')
    setExtractedFormat(null)
    setFileMessage('')
    const extension = nextFile.name.toLowerCase().split('.').pop()
    const isEbook = ['epub', 'mobi', 'azw3'].includes(extension ?? '')
    try {
      setFileLoading(true)
      if (isEbook) {
        if (nextFile.size > MAX_EBOOK_BYTES) {
          throw new Error('电子书超过 50 MB，请换用更小的版本。')
        }
        setFileMessage('正在本地解析电子书…')
        const extracted = await extractEbook(nextFile, controller.signal)
        if (controller.signal.aborted) return
        setFile(nextFile)
        setEbook(extracted)
        setEbookTitle(extracted.title)
        setExtractedFormat(extracted.format)
        setFileMessage(
          `已提取 ${extracted.chapterCount} 个章节、${extracted.wordCount.toLocaleString()} 词`
        )
        return
      }
      if (nextFile.size > MAX_UPLOAD_BYTES) {
        throw new Error('文件超过 10 MB，请拆分后再导入。')
      }
      const extracted = await extractImportFile(nextFile)
      if (controller.signal.aborted) return
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
      if (controller.signal.aborted) return
      setExtractedFormat(null)
      setError(
        caught instanceof Error
          ? caught.message
          : '文件无法解析，请检查格式或转换为 UTF-8 后重试。'
      )
    } finally {
      if (fileController.current === controller) {
        fileController.current = null
        setFileLoading(false)
      }
    }
  }

  const importContent = async () => {
    setError('')
    setDuplicate(false)
    if (ebook) {
      await commitContent(
        buildContent(
          ebookTitle,
          ebook.rawText,
          ebook.format,
          ebook.segments,
          ebook.wordCount,
          file?.name ?? `电子书.${ebook.format.toLowerCase()}`,
          await sha256(ebook.rawText)
        )
      )
      return
    }
    if (!raw.trim()) {
      setError('请输入或选择一个文本文件。')
      return
    }
    if (new TextEncoder().encode(raw).byteLength > MAX_CONTENT_BYTES) {
      setError('内容超过 2 MB，请拆分后再导入。')
      return
    }
    try {
      const parsed = parseContent(
        raw,
        extractedFormat ? 'TXT' : format,
        file?.name ?? ''
      )
      const contentHash = await sha256(raw)
      await commitContent(
        buildContent(
          file?.name ? file.name.replace(/\.[^.]+$/, '') : parsed.title,
          raw,
          extractedFormat ?? parsed.format,
          parsed.segments,
          parsed.wordCount,
          file?.name ?? '粘贴内容',
          contentHash
        )
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '导入失败，请检查内容。')
    }
  }

  const selectOcrImage = (image: File) => {
    ocrRequest.current += 1
    ocrController.current?.abort()
    setOcrImage(image)
    setOcrPhase('idle')
    setOcrProgress(0)
    setOcrTitle('')
    setOcrText('')
    setOcrResult(null)
    setOcrError('')
  }

  const cancelOcr = () => {
    ocrRequest.current += 1
    ocrController.current?.abort()
    ocrController.current = null
    setOcrPhase('cancelled')
    setOcrProgress(0)
  }

  const recognizePage = async () => {
    if (!ocrImage || !ocrClient) {
      setOcrError('OCR 当前不可用，请改用粘贴文本。')
      setOcrPhase('failed')
      return
    }
    ocrController.current?.abort()
    const controller = new AbortController()
    const requestId = ++ocrRequest.current
    ocrController.current = controller
    setOcrError('')
    setOcrPhase('model-loading')
    setOcrProgress(0)
    try {
      const result = await ocrClient.recognize(ocrImage, controller.signal, (progress) => {
        if (requestId !== ocrRequest.current) return
        setOcrPhase(progress.phase)
        setOcrProgress(progress.progress)
      })
      if (requestId !== ocrRequest.current || controller.signal.aborted) return
      const phase = classifyOcrResult(result)
      setOcrResult(result)
      setOcrPhase(phase)
      if (phase === 'failed') {
        setOcrText('')
        return
      }
      setOcrText(result.text)
      setOcrTitle(`OCR 书页 ${new Date().toLocaleDateString('zh-CN')}`)
    } catch (caught) {
      if (requestId !== ocrRequest.current || controller.signal.aborted) return
      setOcrPhase('failed')
      setOcrError(
        caught instanceof Error
          ? caught.message
          : '本地 OCR 识别失败，请重试或改用粘贴文本。'
      )
    } finally {
      if (requestId === ocrRequest.current) ocrController.current = null
    }
  }

  const importOcr = async () => {
    const text = normalizeOcrText(ocrText)
    if (!text) {
      setError('请先核对或填写识别出的正文。')
      return
    }
    if (new TextEncoder().encode(text).byteLength > MAX_CONTENT_BYTES) {
      setError('OCR 内容超过 2 MB，请拆分后再导入。')
      return
    }
    try {
      const parsed = parseContent(text, 'TXT', ocrImage?.name ?? '拍照书页')
      await commitContent(
        buildContent(
          ocrTitle,
          text,
          'OCR',
          parsed.segments,
          englishWordCount(text),
          ocrImage?.name || '拍照书页',
          await sha256(text)
        )
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'OCR 内容导入失败。')
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
          onClick={() => {
            setTab('paste')
            setEbook(null)
            setExtractedFormat(null)
          }}
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
        {ocrDemoEnabled ? (
          <button
            className={`${styles.importTab} ${tab === 'ocr' ? styles.activeImportTab : ''}`}
            type="button"
            role="tab"
            aria-selected={tab === 'ocr'}
            onClick={() => setTab('ocr')}
          >
            拍照/选择书页
          </button>
        ) : null}
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
          onClick={() => {
            if (!fileLoading) fileRef.current?.click()
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {fileLoading ? (
            <div>
              <strong>正在处理文件…</strong>
              <p className={styles.metaLine}>电子书只在本地提取文字，不会上传原文件。</p>
            </div>
          ) : file ? (
            <div>
              <strong>{file.name}</strong>
              <p className={styles.metaLine}>
                {Math.round(file.size / 1024)} KB
                {fileMessage ? ` · ${fileMessage}` : ''}
              </p>
            </div>
          ) : (
            <span>
              拖入 .txt / .srt / .md / .csv / .docx / .xlsx，或选择
              .epub / .mobi / .azw3
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            aria-label="选择导入文件"
            accept=".txt,.srt,.md,.csv,.docx,.xlsx,.epub,.mobi,.azw3,text/plain,text/markdown,text/csv,application/epub+zip"
            hidden
            onChange={(event) => {
              const nextFile = event.target.files?.[0]
              if (nextFile) void readFile(nextFile)
            }}
          />
        </div>
        {ebook ? (
          <div className={styles.ebookPreview}>
            <label className={styles.field}>
              <span className={styles.label}>电子书标题</span>
              <input
                className={styles.input}
                aria-label="电子书标题"
                value={ebookTitle}
                maxLength={120}
                onChange={(event) => setEbookTitle(event.target.value)}
              />
            </label>
            <p className={styles.metaLine}>
              {ebook.format} · {ebook.chapterCount} 章 ·{' '}
              {ebook.wordCount.toLocaleString()} 词
            </p>
            <p className={styles.ebookSample}>{ebook.rawText.slice(0, 700)}</p>
            {ebook.warnings.map((warning) => (
              <p className={styles.warningText} key={warning}>
                {warning}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {ocrDemoEnabled ? (
        <div className={styles.importPanel} hidden={tab !== 'ocr'}>
          <div className={styles.ocrPrivacyNote}>
            图片只在本机内存中识别，不会上传到 AI 或远程服务。只有你确认后的文字会进入阅读；
            后续点词仍只发送当前句和相邻上下文。
          </div>
          <div className={styles.ocrChooser}>
            {ocrPreviewUrl ? (
              <div className={styles.ocrPreview}>
                <img src={ocrPreviewUrl} alt="待识别的书页预览" />
                <span className={styles.ocrGuide} aria-hidden="true" />
              </div>
            ) : (
              <div className={styles.ocrEmpty}>让书页完整、平整、光线均匀</div>
            )}
            <div className={styles.ocrActions}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => ocrImageRef.current?.click()}
              >
                {ocrImage ? '重新选择图片' : '拍照或选择书页'}
              </button>
              <input
                ref={ocrImageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                hidden
                aria-label="选择书页图片"
                onChange={(event) => {
                  const image = event.target.files?.[0]
                  if (image) selectOcrImage(image)
                }}
              />
              {ocrImage &&
              !['model-loading', 'recognizing'].includes(ocrPhase) ? (
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={() => void recognizePage()}
                >
                  {ocrPhase === 'idle' ? '开始本地识别' : '重新识别'}
                </button>
              ) : null}
              {['model-loading', 'recognizing'].includes(ocrPhase) ? (
                <button className={styles.textButton} type="button" onClick={cancelOcr}>
                  停止识别
                </button>
              ) : null}
              <button className={styles.textButton} type="button" onClick={() => setTab('paste')}>
                改用粘贴文本
              </button>
            </div>
          </div>

          <div className={styles.ocrStatus} role="status" aria-live="polite">
            {ocrPhase === 'model-loading'
              ? `正在加载本地 OCR 模型 ${Math.round(ocrProgress * 100)}%`
              : null}
            {ocrPhase === 'recognizing'
              ? `正在识别书页 ${Math.round(ocrProgress * 100)}%`
              : null}
            {ocrPhase === 'success' ? '识别完成，请核对标题和正文。' : null}
            {ocrPhase === 'partial' ? '识别部分成功，请重点核对低置信度文字。' : null}
            {ocrPhase === 'failed' ? 'OCR 没有完成，请重试或改用粘贴文本。' : null}
            {ocrPhase === 'cancelled' ? '已停止识别，原图仍保留在本地。' : null}
          </div>

          {ocrError ? <p className={styles.fieldError}>{ocrError}</p> : null}
          {ocrResult && ['success', 'partial'].includes(ocrPhase) ? (
            <div className={styles.ocrResult}>
              <div className={styles.ocrMeta}>
                <span>平均置信度 {Math.round(ocrResult.confidence)}%</span>
                <span>{englishWordCount(ocrResult.text)} 个英文词</span>
              </div>
              {ocrResult.warnings.map((warning) => (
                <p className={styles.warningText} key={warning}>
                  {warning}
                </p>
              ))}
              <label className={styles.field}>
                <span className={styles.label}>标题</span>
                <input
                  className={styles.input}
                  aria-label="OCR 标题"
                  value={ocrTitle}
                  maxLength={120}
                  onChange={(event) => setOcrTitle(event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>识别正文</span>
                <textarea
                  className={`${styles.textarea} ${styles.ocrTextarea}`}
                  aria-label="OCR 识别正文"
                  value={ocrText}
                  onChange={(event) => setOcrText(event.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className={styles.fieldError}>{error}</p> : null}
      {duplicate ? (
        <div className={styles.storageError} style={{ position: 'static', marginTop: 12 }}>
          这段内容已经在内容库中。
          <button
            className={styles.textButton}
            type="button"
            onClick={() => {
              const candidate = duplicateCandidate.current
              if (candidate) void commitContent(candidate, true)
            }}
          >
            仍然导入
          </button>
        </div>
      ) : null}
      <div className={styles.dialogFoot}>
        <span className={styles.metaLine}>
          {tab === 'file' && ebook
            ? `${ebook.rawText.length.toLocaleString()} 字符 · ${Math.ceil(
                new TextEncoder().encode(ebook.rawText).byteLength / 1024
              ).toLocaleString()} KB · 电子书文字上限 10 MB`
            : tab === 'ocr'
              ? `${ocrText.length.toLocaleString()} 字符 · ${
                  Math.ceil(new TextEncoder().encode(ocrText).byteLength / 1024).toLocaleString()
                } KB · 图片仅本地处理`
              : `${raw.length.toLocaleString()} 字符 · ${Math.ceil(bytes / 1024).toLocaleString()} KB · 正文上限 2 MB`}
        </span>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={
            saving ||
            fileLoading ||
            (tab === 'ocr'
              ? !['success', 'partial'].includes(ocrPhase) || !ocrText.trim()
              : tab === 'file' && ebook
                ? !ebookTitle.trim()
                : !raw.trim())
          }
          onClick={() => void (tab === 'ocr' ? importOcr() : importContent())}
        >
          {saving ? '正在解析…' : '开始阅读'}
        </button>
      </div>
    </Dialog>
  )
}

