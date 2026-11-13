import { describe, expect, it } from 'vitest'
import tokensCss from '../../styles/tokens.css?raw'
import { READING_BRIGHTNESS_LEVELS, READING_THEMES } from './readingThemes'

function token(name: string): string {
  const match = tokensCss.match(new RegExp(`${name}:\\s*([^;]+);`))
  if (!match) throw new Error(`Missing token ${name}`)
  return match[1].trim()
}

function tint(
  level: (typeof READING_BRIGHTNESS_LEVELS)[number]
): [number, number, number, number] {
  const value = token(`--reading-tint-${level}`)
  if (value === 'transparent') return [255, 255, 255, 0]
  const match = value.match(/rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*(\d+)%\)/)
  if (!match) throw new Error(`Invalid tint ${value}`)
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]) / 100
  ]
}

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
  it.each(READING_THEMES)('keeps %s text at AA across all brightness levels', (theme) => {
    const background = token(`--reading-theme-${theme}-bg`)
    const surface = token(`--reading-theme-${theme}-surface`)
    const ink = token(`--reading-theme-${theme}-ink`)
    const ink2 = token(`--reading-theme-${theme}-ink-2`)
    const ink3 = token(`--reading-theme-${theme}-ink-3`)
    for (const level of READING_BRIGHTNESS_LEVELS) {
      const tintColor = tint(level)
      const tintedBackground = composite(rgb(background), tintColor)
      const tintedSurface = composite(rgb(surface), tintColor)
      expect(
        contrast(ink, tintedBackground),
        `${theme}/${level} primary text contrast`
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrast(ink3, tintedBackground),
        `${theme}/${level} muted text contrast`
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrast(ink3, tintedSurface),
        `${theme}/${level} muted surface contrast`
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrast(ink2, tintedBackground),
        `${theme}/${level} secondary text contrast`
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
})
