import { describe, expect, it } from 'vitest'
import {
  READING_BRIGHTNESS_TINTS,
  READING_THEME_TOKENS
} from './readingThemes'

const themes = Object.keys(READING_THEME_TOKENS) as Array<
  keyof typeof READING_THEME_TOKENS
>
const brightnessLevels = Object.keys(READING_BRIGHTNESS_TINTS) as Array<
  keyof typeof READING_BRIGHTNESS_TINTS
>

function rgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ]
}

function composite(
  background: [number, number, number],
  tint: [number, number, number, number]
): string {
  return `#${background
    .map((channel, index) =>
      Math.round(channel * (1 - tint[3]) + tint[index] * tint[3])
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

function luminance(hex: string): number {
  const channels = rgb(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrast(first: string, second: string): number {
  const lighter = Math.max(luminance(first), luminance(second))
  const darker = Math.min(luminance(first), luminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

describe('reading theme contrast', () => {
  it.each(themes)('keeps %s text at AA across all brightness levels', (theme) => {
    const tokens = READING_THEME_TOKENS[theme]
    for (const level of brightnessLevels) {
      const tint = READING_BRIGHTNESS_TINTS[level]
      const tintedBackground = composite(rgb(tokens.bg), tint)
      const tintedSurface = composite(rgb(tokens.surface), tint)
      expect(
        contrast(tokens.ink, tintedBackground),
        `${theme}/${level} primary text contrast`
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrast(tokens.ink3, tintedBackground),
        `${theme}/${level} muted text contrast`
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrast(tokens.ink3, tintedSurface),
        `${theme}/${level} muted surface contrast`
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrast(tokens.ink2, tintedBackground),
        `${theme}/${level} secondary text contrast`
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
})
