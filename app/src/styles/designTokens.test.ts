import { describe, expect, it } from 'vitest'
import tokensCss from './tokens.css?raw'
import globalCss from './global.css?raw'

const cssSources = import.meta.glob('./*.css', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>
const tsxSources = import.meta.glob('../**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>
const tsSources = import.meta.glob('../**/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

function token(name: string): string {
  const match = tokensCss.match(new RegExp(`${name}:\\s*([^;]+);`))
  if (!match) throw new Error(`Missing token ${name}`)
  return match[1].trim()
}

function rgb(value: string): [number, number, number] {
  const match = value.match(/^#([0-9a-fA-F]{6})$/)
  if (!match) throw new Error(`Expected a hex color: ${value}`)
  return [
    Number.parseInt(match[1].slice(0, 2), 16),
    Number.parseInt(match[1].slice(2, 4), 16),
    Number.parseInt(match[1].slice(4, 6), 16)
  ]
}

function luminance(value: string): number {
  const channels = rgb(value).map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrast(first: string, second: string): number {
  const lighter = Math.max(luminance(first), luminance(second))
  const darker = Math.min(luminance(first), luminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

describe('design tokens', () => {
  it('defines the complete semantic token families', () => {
    for (const name of [
      '--paper',
      '--paper-raised',
      '--ink',
      '--ink-2',
      '--ink-3',
      '--selection-bg',
      '--context-bg',
      '--ai-bg',
      '--cache-bg',
      '--success-bg',
      '--warning-bg',
      '--danger-bg',
      '--font-reading',
      '--font-ui',
      '--space-1',
      '--space-10',
      '--radius-control',
      '--shadow-raised',
      '--motion-standard',
      '--focus-ring'
    ]) {
      expect(token(name), name).toBeTruthy()
    }
  })

  it('keeps key text, status and focus colors at accessible contrast', () => {
    const pairs = [
      ['--ink', '--paper', 4.5],
      ['--ink-3', '--paper', 4.5],
      ['--paper-raised', '--accent', 4.5],
      ['--ai-ink', '--ai-bg', 4.5],
      ['--cache-ink', '--cache-bg', 4.5],
      ['--success-ink', '--success-bg', 4.5],
      ['--warning-ink', '--warning-bg', 4.5],
      ['--danger-ink', '--danger-bg', 4.5],
      ['--focus-ring', '--paper', 3]
    ] as const
    for (const [foreground, background, minimum] of pairs) {
      expect(
        contrast(token(foreground), token(background)),
        `${foreground} on ${background}`
      ).toBeGreaterThanOrEqual(minimum)
    }
  })

  it('keeps raw colors out of CSS Modules and TSX components', () => {
    const violations: string[] = []
    for (const [path, source] of Object.entries(cssSources)) {
      if (path.endsWith('/tokens.css')) continue
      const matches = source.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g)
      if (matches) violations.push(`${path}: ${[...new Set(matches)].join(', ')}`)
    }
    for (const [path, source] of Object.entries({ ...tsxSources, ...tsSources })) {
      if (path.includes('.test.')) continue
      const matches = source.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g)
      if (matches) violations.push(`${path}: ${[...new Set(matches)].join(', ')}`)
    }
    expect(violations).toEqual([])
  })

  it('uses a 4/8 spacing scale and reduced-motion fallback', () => {
    const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
    spacing.forEach((value, index) => {
      expect(token(`--space-${index + 1}`)).toBe(`${value}px`)
    })
    expect(globalCss).toContain('prefers-reduced-motion: reduce')
    expect(globalCss).toContain('transition-duration: 0.01ms !important')
    expect(globalCss).toContain('animation-duration: 0.01ms !important')
  })
})
