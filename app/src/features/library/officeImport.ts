import type { ContentFormat } from '../../domain/types'
import { MAX_CONTENT_BYTES } from '../../domain/text'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export interface ExtractedFile {
  rawText: string
  format: ContentFormat
  title: string
}

function baseTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').trim() || '未命名内容'
}

function normalizeParagraphs(text: string): string {
  return text
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n\n')
}

function stringifyCell(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

export function rowsToText(sheets: Array<{ sheet: string; data: unknown[][] }>): string {
  const parts: string[] = []
  for (const sheet of sheets) {
    const rows = sheet.data
      .map((row) => row.map(stringifyCell).filter(Boolean).join(' · '))
      .filter(Boolean)
    if (!rows.length) continue
    parts.push(`# ${sheet.sheet}`)
    parts.push(rows.join('\n\n'))
  }
  return parts.join('\n\n')
}

function assertExtractedSize(text: string) {
  if (new TextEncoder().encode(text).byteLength > MAX_CONTENT_BYTES) {
    throw new Error('文件提取出的文字超过 2 MB，请拆分后再导入。')
  }
}

export async function extractImportFile(file: File): Promise<ExtractedFile> {
  const extension = file.name.toLowerCase().split('.').pop() ?? ''
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('文件超过 10 MB，请拆分后再导入。')
  }
  if (extension === 'doc' || extension === 'xls') {
    throw new Error('暂不支持旧版 .doc/.xls，请另存为 .docx 或 .xlsx 后再导入。')
  }

  const title = baseTitle(file.name)
  if (['txt', 'srt', 'md', 'csv'].includes(extension)) {
    const buffer = await file.arrayBuffer()
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^\uFEFF/, '')
    const format: ContentFormat =
      extension === 'srt' ? 'SRT' : extension === 'md' ? 'MD' : extension === 'csv' ? 'CSV' : 'TXT'
    const rawText =
      extension === 'csv'
        ? decoded
            .replace(/\r/g, '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .join('\n\n')
        : decoded
    assertExtractedSize(rawText)
    return { rawText, format, title }
  }

  if (extension === 'docx') {
    const module = await import('mammoth')
    const mammoth = module.default ?? module
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    const rawText = normalizeParagraphs(result.value)
    if (!rawText) throw new Error('Word 文件中没有找到可阅读的文字。')
    assertExtractedSize(rawText)
    return { rawText, format: 'DOCX', title }
  }

  if (extension === 'xlsx') {
    const module = await import('read-excel-file/browser')
    const sheets = await module.default(file)
    const rawText = rowsToText(sheets)
    if (!rawText) throw new Error('Excel 文件中没有找到可导入的单元格文字。')
    assertExtractedSize(rawText)
    return { rawText, format: 'XLSX', title }
  }

  if (['epub', 'mobi', 'azw3'].includes(extension)) {
    throw new Error('电子书需要使用专用本地解析入口。')
  }
  throw new Error('仅支持 TXT、SRT、Markdown、CSV、DOCX、XLSX、EPUB、MOBI 和 AZW3 文件。')
}

