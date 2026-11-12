import type { ReadingPreferences } from '../../domain/types'

interface ReadingThemeTokens {
  bg: string
  surface: string
  ink: string
  ink2: string
  ink3: string
  line: string
  accent: string
  accentWeak: string
  highlight: string
}

export const READING_THEME_TOKENS: Record<
  ReadingPreferences['theme'],
  ReadingThemeTokens
> = {
  paper: {
    bg: '#f7f5ef',
    surface: '#fffdf8',
    ink: '#1a1b1e',
    ink2: '#4f545c',
    ink3: '#62676f',
    line: '#e6e1d6',
    accent: '#2f5d50',
    accentWeak: '#e8efec',
    highlight: '#f4e3a8'
  },
  sepia: {
    bg: '#efe2c9',
    surface: '#f8edda',
    ink: '#30291f',
    ink2: '#514536',
    ink3: '#695742',
    line: '#d7c3a3',
    accent: '#77511d',
    accentWeak: '#ead9bc',
    highlight: '#ebcf91'
  },
  mint: {
    bg: '#e6f2ec',
    surface: '#f1faf6',
    ink: '#1f302a',
    ink2: '#40534b',
    ink3: '#4f625a',
    line: '#c6ddd2',
    accent: '#27604f',
    accentWeak: '#d5e8df',
    highlight: '#efdda9'
  },
  night: {
    bg: '#20252d',
    surface: '#292f38',
    ink: '#f1f3f5',
    ink2: '#d2d7dd',
    ink3: '#b8c0ca',
    line: '#424b57',
    accent: '#b4d6ca',
    accentWeak: '#35443f',
    highlight: '#69551f'
  },
  blush: {
    bg: '#f6ebef',
    surface: '#fff7f9',
    ink: '#34272c',
    ink2: '#57474d',
    ink3: '#66545c',
    line: '#e1ccd4',
    accent: '#754652',
    accentWeak: '#ecdbe1',
    highlight: '#efd5a9'
  }
}

export const READING_BRIGHTNESS_TINTS: Record<
  ReadingPreferences['brightness'],
  [number, number, number, number]
> = {
  dim: [28, 24, 18, 0.07],
  normal: [255, 255, 255, 0],
  bright: [255, 255, 255, 0.03]
}

export function readingThemeVariables(
  theme: ReadingPreferences['theme'],
  brightness: ReadingPreferences['brightness']
): Record<string, string> {
  const tokens = READING_THEME_TOKENS[theme]
  const tint = READING_BRIGHTNESS_TINTS[brightness]
  return {
    '--reader-bg': tokens.bg,
    '--reader-surface': tokens.surface,
    '--reader-ink': tokens.ink,
    '--reader-ink-2': tokens.ink2,
    '--reader-ink-3': tokens.ink3,
    '--reader-line': tokens.line,
    '--reader-accent': tokens.accent,
    '--reader-accent-weak': tokens.accentWeak,
    '--reader-highlight': tokens.highlight,
    '--reader-tint':
      tint[3] === 0
        ? 'transparent'
        : `rgb(${tint[0]} ${tint[1]} ${tint[2]} / ${Math.round(tint[3] * 100)}%)`
  }
}
