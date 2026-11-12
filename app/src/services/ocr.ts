import type { LoggerMessage } from 'tesseract.js'
import type { OcrClient, OcrPhase, OcrProgress, OcrResult } from '../domain/types'

const MIN_WORDS = 3
const MIN_CONFIDENCE = 50

export function englishWordCount(text: string): number {
  return text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)?.length ?? 0
}

export function normalizeOcrText(text: string): string {
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function classifyOcrResult(result: OcrResult): OcrPhase {
  const wordCount = englishWordCount(result.text)
  if (!result.text.trim() || wordCount === 0) return 'failed'
  if (wordCount < MIN_WORDS || result.confidence < MIN_CONFIDENCE) return 'partial'
  return 'success'
}

function abortError(): DOMException {
  return new DOMException('OCR 已取消', 'AbortError')
}

export class TesseractOcrClient implements OcrClient {
  async recognize(
    image: Blob,
    signal: AbortSignal,
    onProgress?: (progress: OcrProgress) => void
  ): Promise<OcrResult> {
    if (signal.aborted) throw abortError()

    let worker:
      | {
          recognize(image: Blob): Promise<{
            data: { text: string; confidence: number }
          }>
          terminate(): Promise<unknown>
        }
      | undefined
    let aborted = false
    const stopWorker = () => {
      aborted = true
      void worker?.terminate().catch(() => undefined)
    }
    signal.addEventListener('abort', stopWorker, { once: true })
    onProgress?.({ phase: 'model-loading', progress: 0 })

    try {
      const { createWorker, OEM } = await import('tesseract.js')
      if (signal.aborted) throw abortError()
      worker = await createWorker('eng', OEM.LSTM_ONLY, {
        workerPath: '/ocr/worker.min.js',
        corePath: '/ocr/core',
        langPath: '/ocr/lang',
        logger: (message: LoggerMessage) => {
          if (aborted) return
          if (message.status === 'recognizing text') {
            onProgress?.({
              phase: 'recognizing',
              progress: Math.max(0, Math.min(1, message.progress ?? 0))
            })
          } else if (message.progress !== undefined) {
            onProgress?.({
              phase: 'model-loading',
              progress: Math.max(0, Math.min(1, message.progress))
            })
          }
        }
      })
      if (signal.aborted) throw abortError()

      onProgress?.({ phase: 'recognizing', progress: 0 })
      const response = await worker.recognize(image)
      if (signal.aborted) throw abortError()

      const text = normalizeOcrText(response.data.text)
      const confidence = Number.isFinite(response.data.confidence)
        ? response.data.confidence
        : 0
      const wordCount = englishWordCount(text)
      return {
        text,
        confidence,
        wordCount,
        warnings:
          wordCount < MIN_WORDS || confidence < MIN_CONFIDENCE
            ? ['识别质量较低，请核对正文后再开始阅读。']
            : []
      }
    } catch (error) {
      if (signal.aborted || aborted) throw abortError()
      if (error instanceof Error) throw error
      throw new Error('本地 OCR 识别失败，请重试或改用粘贴文本。')
    } finally {
      signal.removeEventListener('abort', stopWorker)
      if (worker) await worker.terminate().catch(() => undefined)
    }
  }
}
