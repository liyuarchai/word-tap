/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_OCR_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'foliate-js/epub.js' {
  export class EPUB {
    constructor(options: {
      loadText(path: string): Promise<string>
      loadBlob(path: string): Promise<Blob>
      getSize(path: string): number
      sha1?: (text: string) => Promise<Uint8Array>
    })
    metadata?: { title?: string }
    sections: Array<{
      linear?: string
      createDocument(): Promise<Document>
    }>
    init(): Promise<this>
    destroy?(): void
  }
}

declare module 'foliate-js/mobi.js' {
  export const isMOBI: (file: Blob) => Promise<boolean>
  export class MOBI {
    constructor(options: { unzlib(data: Uint8Array): Promise<Uint8Array> })
    open(file: Blob): Promise<{
      metadata?: { title?: string }
      sections: Array<{ createDocument(): Promise<Document> }>
    }>
  }
}

declare module 'foliate-js/vendor/fflate.js' {
  export function unzlibSync(data: Uint8Array): Uint8Array
}

declare module 'foliate-js/vendor/zip.js' {
  export class BlobReader {
    constructor(blob: Blob)
  }
  export class ZipReader {
    constructor(reader: BlobReader)
    getEntries(): Promise<
      Array<{
        filename: string
        uncompressedSize: number
        getData(writer: unknown, options?: Record<string, unknown>): Promise<unknown>
      }>
    >
    close(): Promise<void>
  }
  export class TextWriter {
    constructor(encoding?: string)
  }
  export class BlobWriter {
    constructor(contentType?: string)
  }
}

