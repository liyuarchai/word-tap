import type { OcrClient, OcrProgress, OcrResult } from '../domain/types'

export type MockOcrMode = 'success' | 'partial' | 'failed' | 'loading'

const sampleText =
  'Learning a language becomes easier when every word appears inside a meaningful sentence.\n\nKeep reading, tap unfamiliar words, and review them tomorrow.'

export class MockOcrClient implements OcrClient {
  constructor(private readonly mode: MockOcrMode = 'success') {}

  async recognize(
    _image: Blob,
    signal: AbortSignal,
    onProgress?: (progress: OcrProgress) => void
  ): Promise<OcrResult> {
    onProgress?.({ phase: 'model-loading', progress: 0.4 })
    if (this.mode === 'loading') {
      await new Promise<void>((_, reject) => {
        signal.addEventListener(
          'abort',
          () => reject(new DOMException('OCR 已取消', 'AbortError')),
          { once: true }
        )
      })
    }
    await new Promise((resolve) => window.setTimeout(resolve, 40))
    if (signal.aborted) throw new DOMException('OCR 已取消', 'AbortError')
    onProgress?.({ phase: 'recognizing', progress: 0.6 })
    await new Promise((resolve) => window.setTimeout(resolve, 40))
    if (signal.aborted) throw new DOMException('OCR 已取消', 'AbortError')

    if (this.mode === 'failed') {
      return { text: '', confidence: 0, wordCount: 0, warnings: ['没有识别到可读文字。'] }
    }
    if (this.mode === 'partial') {
      return {
        text: 'Resilient',
        confidence: 38,
        wordCount: 1,
        warnings: ['识别质量较低，请核对正文后再开始阅读。']
      }
    }
    return {
      text: sampleText,
      confidence: 91,
      wordCount: 22,
      warnings: []
    }
  }
}
