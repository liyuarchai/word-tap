import type { ReadingPreferences } from '../../domain/types'

export const READING_THEMES = [
  'paper',
  'sepia',
  'mint',
  'night',
  'blush'
] as const satisfies ReadonlyArray<ReadingPreferences['theme']>

export const READING_BRIGHTNESS_LEVELS = [
  'dim',
  'normal',
  'bright'
] as const satisfies ReadonlyArray<ReadingPreferences['brightness']>

export const READING_THEME_LABELS: Record<ReadingPreferences['theme'], string> = {
  paper: '纸白',
  sepia: '暖褐',
  mint: '薄荷',
  night: '夜间',
  blush: '浅粉'
}

export function readingThemeBackground(theme: ReadingPreferences['theme']): string {
  return `var(--reading-theme-${theme}-bg)`
}
