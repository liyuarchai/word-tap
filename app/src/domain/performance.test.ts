import { describe, expect, it } from 'vitest'
import { parseContent } from './parsers'

describe('import performance', () => {
  it('parses a 2 MB English text within the MVP target', () => {
    const sentence =
      'The team stayed resilient through a difficult year. I could grasp the reason. '
    const raw = sentence.repeat(Math.ceil((2 * 1024 * 1024) / sentence.length)).slice(0, 2 * 1024 * 1024)
    const started = performance.now()
    const parsed = parseContent(raw)
    const duration = performance.now() - started
    expect(parsed.wordCount).toBeGreaterThan(200_000)
    expect(duration).toBeLessThan(2000)
  })
})

