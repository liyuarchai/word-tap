import type { ParsedContent, Segment } from './types'
import { countWords, defaultTitle, stripSrtMarkup } from './text'

export function detectFormat(raw: string, fileName = ''): 'TXT' | 'SRT' | 'MD' {
  const extension = fileName.toLowerCase().split('.').pop()
  if (extension === 'srt' || /\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{3}/.test(raw)) {
    return 'SRT'
  }
  if (extension === 'md' || /^#{1,6}\s+\S/m.test(raw) || /^>\s+\S/m.test(raw) || /^(-|\*|\d+\.)\s+\S/m.test(raw)) {
    return 'MD'
  }
  return 'TXT'
}

function timestampToMs(value: string): number {
  const match = value.match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})/)
  if (!match) return 0
  return (
    Number(match[1]) * 3_600_000 +
    Number(match[2]) * 60_000 +
    Number(match[3]) * 1_000 +
    Number(match[4])
  )
}

export function parseSrt(raw: string): { segments: Segment[]; warnings: string[] } {
  const blocks = raw.replace(/\r/g, '').trim().split(/\n{2,}/)
  const segments: Segment[] = []
  let skipped = 0

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (!lines.length) continue
    let cursor = /^\d+$/.test(lines[0]) ? 1 : 0
    const timing = lines[cursor]?.match(
      /^(\d{1,2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{3})/
    )
    if (!timing) {
      skipped += 1
      continue
    }
    cursor += 1
    const text = stripSrtMarkup(lines.slice(cursor).join(' '))
    if (!text) {
      skipped += 1
      continue
    }
    const index = segments.length
    segments.push({
      id: `seg_${index}`,
      index,
      text,
      kind: 'subtitle',
      startMs: timestampToMs(timing[1]),
      endMs: timestampToMs(timing[2])
    })
  }

  return {
    segments,
    warnings: skipped ? [`有 ${skipped} 个字幕块未能解析`] : []
  }
}

export function parseTxt(raw: string): Segment[] {
  return raw
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, ' ').trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `seg_${index}`,
      index,
      text,
      kind: 'paragraph'
    }))
}

export function parseMarkdown(raw: string): Segment[] {
  const lines = raw.replace(/\r/g, '').split('\n')
  const segments: Segment[] = []
  let buffer: string[] = []
  let codeFence = false
  let codeBuffer: string[] = []

  const push = (text: string, kind: Segment['kind']) => {
    const value = text.trim()
    if (!value) return
    const index = segments.length
    segments.push({ id: `seg_${index}`, index, text: value, kind })
  }

  const flush = () => {
    if (!buffer.length) return
    const text = buffer.join('\n').trim()
    buffer = []
    if (!text) return
    if (text.split('\n').every((line) => /^>\s?/.test(line))) {
      push(text.split('\n').map((line) => line.replace(/^>\s?/, '')).join(' '), 'quote')
    } else if (text.split('\n').every((line) => /^([-*+]|\d+\.)\s+/.test(line))) {
      push(text, 'list')
    } else {
      push(text, 'paragraph')
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      if (codeFence) {
        push(codeBuffer.join('\n'), 'code')
        codeBuffer = []
      } else {
        flush()
      }
      codeFence = !codeFence
      continue
    }
    if (codeFence) {
      codeBuffer.push(line)
      continue
    }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flush()
      push(heading[2], `h${heading[1].length}` as Segment['kind'])
      continue
    }
    if (!trimmed) {
      flush()
      continue
    }
    buffer.push(line)
  }
  flush()
  if (codeFence && codeBuffer.length) push(codeBuffer.join('\n'), 'code')
  return segments
}

export function parseContent(
  raw: string,
  requestedFormat: 'AUTO' | 'TXT' | 'SRT' | 'MD' = 'AUTO',
  sourceName = ''
): ParsedContent {
  const format = requestedFormat === 'AUTO' ? detectFormat(raw, sourceName) : requestedFormat
  let segments: Segment[]
  let warnings: string[] = []

  if (format === 'SRT') {
    const result = parseSrt(raw)
    segments = result.segments
    warnings = result.warnings
  } else if (format === 'MD') {
    segments = parseMarkdown(raw)
  } else {
    segments = parseTxt(raw)
  }

  if (!segments.length) {
    throw new Error('没有找到可阅读的正文，请检查内容或格式。')
  }

  return {
    format,
    title: defaultTitle(raw),
    segments,
    wordCount: segments.reduce((sum, segment) => sum + countWords(segment.text), 0),
    warnings
  }
}

