import type {
  ExtractedEbook,
  Segment,
  SegmentKind
} from '../../domain/types'
import { englishWordCount } from '../../services/ocr'

export const MAX_EBOOK_BYTES = 50 * 1024 * 1024
export const MAX_EBOOK_TEXT_BYTES = 10 * 1024 * 1024
const BLOCK_SELECTOR = 'h1,h2,h3,p,blockquote,li,pre'
const IGNORED_SELECTOR = 'script,style,noscript,template,iframe,object,embed,svg,audio,video'

function abortError(): DOMException {
  return new DOMException('电子书导入已取消', 'AbortError')
}

function baseTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').trim() || '未命名电子书'
}

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function kindForElement(element: Element): SegmentKind | null {
  const tag = element.tagName.toLowerCase()
  if (tag === 'h1') return 'h1'
  if (tag === 'h2') return 'h2'
  if (tag === 'h3') return 'h3'
  if (tag === 'blockquote') return 'quote'
  if (tag === 'li') return 'list'
  if (tag === 'pre') return 'code'
  return 'paragraph'
}

export function documentToSegments(document: Document, chapterIndex: number): Segment[] {
  const body = document.body ?? document.documentElement
  if (!body) return []
  const segments: Segment[] = []
  for (const element of Array.from(body.querySelectorAll(BLOCK_SELECTOR))) {
    if (element.closest(IGNORED_SELECTOR)) continue
    const parentBlock = element.parentElement?.closest(BLOCK_SELECTOR)
    if (parentBlock && parentBlock !== element) continue
    const kind = kindForElement(element)
    if (!kind) continue
    const text = normalizeText(element.textContent ?? '')
    if (!text) continue
    segments.push({
      id: `ebook_${chapterIndex}_${segments.length}`,
      index: segments.length,
      text,
      kind
    })
  }
  return segments
}

function assertTextLimit(rawText: string) {
  if (new TextEncoder().encode(rawText).byteLength > MAX_EBOOK_TEXT_BYTES) {
    throw new Error('电子书提取出的文字超过 10 MB，请换用更小的版本。')
  }
}

export async function detectEbookFormat(file: File): Promise<ExtractedEbook['format']> {
  const extension = file.name.toLowerCase().split('.').pop()
  if (!['epub', 'mobi', 'azw3'].includes(extension ?? '')) {
    throw new Error('仅支持无 DRM 的 EPUB、MOBI 和 AZW3 电子书。')
  }

  const signature = new Uint8Array(await file.slice(0, 80).arrayBuffer())
  if (extension === 'epub') {
    const isZip =
      signature[0] === 0x50 &&
      signature[1] === 0x4b &&
      [0x03, 0x05, 0x07].includes(signature[2])
    if (!isZip) throw new Error('EPUB 文件结构无效或文件已损坏。')
    return 'EPUB'
  }

  const magic = new TextDecoder().decode(signature.slice(60, 68))
  if (magic !== 'BOOKMOBI') {
    throw new Error(`${extension!.toUpperCase()} 文件结构无效或不是受支持的版本。`)
  }
  return extension === 'azw3' ? 'AZW3' : 'MOBI'
}

async function assertMobiNotEncrypted(file: File) {
  const header = new Uint8Array(await file.slice(0, 86).arrayBuffer())
  if (header.length < 86) throw new Error('MOBI 文件头不完整或文件已损坏。')
  const view = new DataView(header.buffer)
  const recordZeroOffset = view.getUint32(78)
  const recordZero = new Uint8Array(
    await file.slice(recordZeroOffset, recordZeroOffset + 14).arrayBuffer()
  )
  if (recordZero.length < 14) throw new Error('MOBI 文件头不完整或文件已损坏。')
  const encryption = new DataView(recordZero.buffer).getUint16(12)
  if (encryption !== 0) {
    throw new Error('这个 MOBI/AZW3 文件带 DRM 或加密保护，无法导入。')
  }
}

async function extractEpub(file: File, signal?: AbortSignal): Promise<ExtractedEbook> {
  const { EPUB } = await import('foliate-js/epub.js')
  const { BlobReader, BlobWriter, TextWriter, ZipReader } = await import(
    'foliate-js/vendor/zip.js'
  )
  const zip = new ZipReader(new BlobReader(file))
  let destroyBook: (() => void) | undefined
  try {
    const entries = await zip.getEntries()
    const byName = new Map(entries.map((entry) => [entry.filename, entry]))
    if (byName.has('META-INF/rights.xml') || byName.has('META-INF/sinf.xml')) {
      throw new Error('这个 EPUB 带 DRM 保护，无法导入。')
    }

    const encryptionEntry = byName.get('META-INF/encryption.xml')
    if (encryptionEntry) {
      const xml = (await encryptionEntry.getData(new TextWriter())) as string
      const document = new DOMParser().parseFromString(xml, 'application/xml')
      const references = Array.from(document.getElementsByTagName('*'))
        .filter((element) => element.localName === 'CipherReference')
        .map((element) => element.getAttribute('URI') ?? '')
      const encryptedReadingContent = references.some(
        (uri) => !/\.(?:ttf|otf|woff2?)(?:[?#].*)?$/i.test(uri)
      )
      if (encryptedReadingContent) {
        throw new Error('这个 EPUB 的正文已加密或带 DRM 保护，无法导入。')
      }
    }

    const textCache = new Map<string, Promise<string>>()
    const blobCache = new Map<string, Promise<Blob>>()
    const zipOptions = { useWebWorkers: false, useCompressionStream: true }
    const loadText = async (path: string) => {
      let pending = textCache.get(path)
      if (!pending) {
        const entry = byName.get(path)
        pending = entry
          ? (entry.getData(new TextWriter(), zipOptions) as Promise<string>)
          : Promise.resolve('')
        textCache.set(path, pending)
      }
      return pending
    }
    const loadBlob = async (path: string) => {
      let pending = blobCache.get(path)
      if (!pending) {
        const entry = byName.get(path)
        pending = entry
          ? (entry.getData(new BlobWriter('application/octet-stream'), zipOptions) as Promise<Blob>)
          : Promise.resolve(new Blob())
        blobCache.set(path, pending)
      }
      return pending
    }
    const getSize = (path: string) => byName.get(path)?.uncompressedSize ?? 0
    const book = await new EPUB({ loadText, loadBlob, getSize }).init()
    destroyBook = () => book.destroy?.()
    if (signal?.aborted) throw abortError()

    const segments: Segment[] = []
    const warnings: string[] = []
    let chapterCount = 0
    for (const [chapterIndex, section] of book.sections.entries()) {
      if (signal?.aborted) throw abortError()
      if (section.linear === 'no') continue
      try {
        const document = await section.createDocument()
        const chapterSegments = documentToSegments(document, chapterIndex)
        if (chapterSegments.length) {
          const offset = segments.length
          segments.push(
            ...chapterSegments.map((segment, index) => ({
              ...segment,
              index: offset + index
            }))
          )
          chapterCount += 1
        }
      } catch {
        warnings.push(`第 ${chapterIndex + 1} 个章节无法读取，已跳过。`)
      }
    }
    if (!segments.length) {
      throw new Error('EPUB 中没有找到可阅读的文字，或文件受 DRM 保护。')
    }
    const rawText = segments.map((segment) => segment.text).join('\n\n')
    assertTextLimit(rawText)
    return {
      title:
        typeof book.metadata?.title === 'string' && book.metadata.title.trim()
          ? book.metadata.title.trim()
          : baseTitle(file.name),
      format: 'EPUB',
      rawText,
      segments,
      wordCount: englishWordCount(rawText),
      chapterCount,
      warnings
    }
  } finally {
    destroyBook?.()
    await zip.close().catch(() => undefined)
  }
}

async function extractMobi(
  file: File,
  format: 'MOBI' | 'AZW3',
  signal?: AbortSignal
): Promise<ExtractedEbook> {
  await assertMobiNotEncrypted(file)
  const [{ MOBI }, { unzlibSync }] = await Promise.all([
    import('foliate-js/mobi.js'),
    import('foliate-js/vendor/fflate.js')
  ])
  const book = await new MOBI({
    unzlib: async (data: Uint8Array) => unzlibSync(data)
  }).open(file)
  if (signal?.aborted) throw abortError()

  const segments: Segment[] = []
  const warnings: string[] = []
  let chapterCount = 0
  for (const [chapterIndex, section] of book.sections.entries()) {
    if (signal?.aborted) throw abortError()
    try {
      const document = await section.createDocument()
      const chapterSegments = documentToSegments(document, chapterIndex)
      if (chapterSegments.length) {
        const offset = segments.length
        segments.push(
          ...chapterSegments.map((segment, index) => ({
            ...segment,
            index: offset + index
          }))
        )
        chapterCount += 1
      }
    } catch {
      warnings.push(`第 ${chapterIndex + 1} 个章节无法读取，已跳过。`)
    }
  }
  if (!segments.length) {
    throw new Error(`${format} 中没有找到可阅读的文字，或文件受 DRM 保护。`)
  }
  const rawText = segments.map((segment) => segment.text).join('\n\n')
  assertTextLimit(rawText)
  return {
    title:
      typeof book.metadata?.title === 'string' && book.metadata.title.trim()
        ? book.metadata.title.trim()
        : baseTitle(file.name),
    format,
    rawText,
    segments,
    wordCount: englishWordCount(rawText),
    chapterCount,
    warnings
  }
}

export async function extractEbook(
  file: File,
  signal?: AbortSignal
): Promise<ExtractedEbook> {
  if (file.size > MAX_EBOOK_BYTES) {
    throw new Error('电子书超过 50 MB，请换用更小的版本。')
  }
  if (signal?.aborted) throw abortError()
  const format = await detectEbookFormat(file)
  if (signal?.aborted) throw abortError()
  try {
    return format === 'EPUB'
      ? await extractEpub(file, signal)
      : await extractMobi(file, format, signal)
  } catch (error) {
    if (signal?.aborted) throw abortError()
    if (error instanceof Error) throw error
    throw new Error('电子书解析失败，请检查格式、DRM 或文件完整性。')
  }
}
