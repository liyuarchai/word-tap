import { describe, expect, it } from 'vitest'
import { detectFormat, parseContent, parseMarkdown, parseSrt, parseTxt } from './parsers'

const srt = `1
00:00:00,000 --> 00:00:02,500
The team stayed <i>resilient</i>.

2
00:00:02,500 --> 00:00:05,000
I couldn't grasp why she left.

broken block
without timing
`

describe('content parsers', () => {
  it('detects all supported formats', () => {
    expect(detectFormat(srt)).toBe('SRT')
    expect(detectFormat('# Heading\n\nA paragraph.')).toBe('MD')
    expect(detectFormat('Plain English paragraph.')).toBe('TXT')
  })

  it('parses SRT and keeps readable cues while counting broken blocks', () => {
    const result = parseSrt(srt)
    expect(result.segments).toHaveLength(2)
    expect(result.segments[0]).toMatchObject({
      text: 'The team stayed resilient.',
      startMs: 0,
      endMs: 2500,
      kind: 'subtitle'
    })
    expect(result.warnings).toEqual(['有 1 个字幕块未能解析'])
  })

  it('splits TXT into paragraphs', () => {
    expect(parseTxt('First line\nstill first.\n\nSecond.')).toHaveLength(2)
  })

  it('keeps Markdown headings, quotes, lists and code blocks', () => {
    const segments = parseMarkdown(
      '# Heading\n\nA **bold** paragraph.\n\n> A quote\n\n- one\n- two\n\n```js\nconst x = 1\n```'
    )
    expect(segments.map((item) => item.kind)).toEqual(['h1', 'paragraph', 'quote', 'list', 'code'])
  })

  it('rejects empty content', () => {
    expect(() => parseContent('   \n\n ')).toThrow('没有找到可阅读的正文')
  })
})

