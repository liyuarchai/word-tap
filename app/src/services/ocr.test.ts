import { describe, expect, it } from 'vitest'
import { classifyOcrResult, englishWordCount, normalizeOcrText } from './ocr'

describe('OCR result parsing', () => {
  it('normalizes spacing and preserves paragraph boundaries', () => {
    expect(normalizeOcrText('  The   team stayed resilient. \r\n\r\n\r\nKeep   reading.  ')).toBe(
      'The team stayed resilient.\n\nKeep reading.'
    )
  })

  it('counts English words without counting punctuation or numbers', () => {
    expect(englishWordCount("The team's binge-watched show ended in 2026.")).toBe(6)
  })

  it('classifies empty and very short results as failed or partial', () => {
    expect(
      classifyOcrResult({ text: '', confidence: 0, wordCount: 0, warnings: [] })
    ).toBe('failed')
    expect(
      classifyOcrResult({ text: 'Resilient', confidence: 92, wordCount: 1, warnings: [] })
    ).toBe('partial')
    expect(
      classifyOcrResult({
        text: 'The team stayed resilient',
        confidence: 35,
        wordCount: 4,
        warnings: []
      })
    ).toBe('partial')
  })

  it('accepts a readable English page only above both thresholds', () => {
    expect(
      classifyOcrResult({
        text: 'The team stayed resilient through a difficult year.',
        confidence: 78,
        wordCount: 8,
        warnings: []
      })
    ).toBe('success')
  })
})
