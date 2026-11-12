import { describe, expect, it } from 'vitest'
import {
  detectEbookFormat,
  documentToSegments,
  extractEbook,
  MAX_EBOOK_BYTES
} from './ebookImport'

const encoder = new TextEncoder()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

function makeZip(entries: Array<{ name: string; text: string }>): Uint8Array {
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let localOffset = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const data = encoder.encode(entry.text)
    const checksum = crc32(data)
    const local = new Uint8Array(30 + name.length + data.length)
    const localView = new DataView(local.buffer)
    writeUint32(localView, 0, 0x04034b50)
    writeUint16(localView, 4, 20)
    writeUint16(localView, 6, 0)
    writeUint16(localView, 8, 0)
    writeUint32(localView, 14, checksum)
    writeUint32(localView, 18, data.length)
    writeUint32(localView, 22, data.length)
    writeUint16(localView, 26, name.length)
    local.set(name, 30)
    local.set(data, 30 + name.length)
    localParts.push(local)

    const central = new Uint8Array(46 + name.length)
    const centralView = new DataView(central.buffer)
    writeUint32(centralView, 0, 0x02014b50)
    writeUint16(centralView, 4, 20)
    writeUint16(centralView, 6, 20)
    writeUint16(centralView, 8, 0)
    writeUint16(centralView, 10, 0)
    writeUint32(centralView, 16, checksum)
    writeUint32(centralView, 20, data.length)
    writeUint32(centralView, 24, data.length)
    writeUint16(centralView, 28, name.length)
    writeUint32(centralView, 42, localOffset)
    central.set(name, 46)
    centralParts.push(central)

    localOffset += local.length
  }

  const centralOffset = localOffset
  const centralSize = centralParts.reduce((total, part) => total + part.length, 0)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  writeUint32(endView, 0, 0x06054b50)
  writeUint16(endView, 8, entries.length)
  writeUint16(endView, 10, entries.length)
  writeUint32(endView, 12, centralSize)
  writeUint32(endView, 16, centralOffset)

  const output = new Uint8Array(localOffset + centralSize + end.length)
  let offset = 0
  for (const part of [...localParts, ...centralParts, end]) {
    output.set(part, offset)
    offset += part.length
  }
  return output
}

function fixtureEpub(): Uint8Array {
  return makeZip([
    { name: 'mimetype', text: 'application/epub+zip' },
    {
      name: 'META-INF/container.xml',
      text: `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    },
    {
      name: 'OEBPS/content.opf',
      text: `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:8dca2d32-7ee3-4c58-a4dc-a8dfa92e2514</dc:identifier>
    <dc:title>Fixture Book</dc:title>
  </metadata>
  <manifest>
    <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter"/>
  </spine>
</package>`
    },
    {
      name: 'OEBPS/chapter.xhtml',
      text: `<html xmlns="http://www.w3.org/1999/xhtml"><body>
        <h1>Chapter One</h1>
        <p>The team stayed resilient through a difficult year.</p>
        <blockquote>Keep reading every day.</blockquote>
        <ul><li>Collect unfamiliar words.</li></ul>
        <script>window.readerInjected = true</script>
      </body></html>`
    }
  ])
}

describe('ebook import', () => {
  it('maps safe semantic HTML blocks into existing reader segments', () => {
    const document = new DOMParser().parseFromString(
      `<html><body><h1>Title</h1><p>Body text.</p><script>bad()</script><blockquote>Quote</blockquote></body></html>`,
      'text/html'
    )
    expect(documentToSegments(document, 0)).toMatchObject([
      { kind: 'h1', text: 'Title', index: 0 },
      { kind: 'paragraph', text: 'Body text.', index: 1 },
      { kind: 'quote', text: 'Quote', index: 2 }
    ])
  })

  it('extracts a real EPUB by spine order and ignores scripts', async () => {
    const epub = fixtureEpub()
    const result = await extractEbook(
      new File([epub.buffer as ArrayBuffer], 'fixture.epub', {
        type: 'application/epub+zip'
      })
    )
    expect(result).toMatchObject({
      title: 'Fixture Book',
      format: 'EPUB',
      chapterCount: 1
    })
    expect(result.rawText).toContain('The team stayed resilient')
    expect(result.rawText).not.toContain('window.readerInjected')
  })

  it('detects MOBI and AZW3 signatures without trusting the extension alone', async () => {
    const bytes = new Uint8Array(80)
    bytes.set(encoder.encode('BOOKMOBI'), 60)
    await expect(
      detectEbookFormat(
        new File([bytes.buffer as ArrayBuffer], 'book.mobi', {
          type: 'application/octet-stream'
        })
      )
    ).resolves.toBe('MOBI')
    await expect(
      detectEbookFormat(
        new File([bytes.buffer as ArrayBuffer], 'book.azw3', {
          type: 'application/octet-stream'
        })
      )
    ).resolves.toBe('AZW3')
    await expect(
      detectEbookFormat(new File(['not a book'], 'book.epub'))
    ).rejects.toThrow('EPUB')
  })

  it('rejects EPUB files carrying Adobe DRM metadata before writing content', async () => {
    const bytes = makeZip([
      { name: 'mimetype', text: 'application/epub+zip' },
      { name: 'META-INF/rights.xml', text: '<rights>encrypted</rights>' }
    ])
    await expect(
      extractEbook(
        new File([bytes.buffer as ArrayBuffer], 'drm.epub', {
          type: 'application/epub+zip'
        })
      )
    ).rejects.toThrow('DRM')
  })

  it('rejects encrypted MOBI files from the PalmDOC header', async () => {
    const bytes = new Uint8Array(100)
    bytes.set(encoder.encode('BOOKMOBI'), 60)
    const view = new DataView(bytes.buffer)
    view.setUint16(76, 1)
    view.setUint32(78, 86)
    view.setUint16(98, 2)
    await expect(
      extractEbook(
        new File([bytes.buffer as ArrayBuffer], 'drm.mobi', {
          type: 'application/octet-stream'
        })
      )
    ).rejects.toThrow('DRM')
  })

  it('rejects an ebook over the 50 MB raw-file limit before parsing', async () => {
    const oversized = {
      name: 'oversized.epub',
      size: MAX_EBOOK_BYTES + 1
    } as File
    await expect(extractEbook(oversized)).rejects.toThrow('超过 50 MB')
  })
})
