import type { Rating, VocabularyRecord } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_DAILY_CARDS = 50

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function endOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function isDueToday(vocabulary: VocabularyRecord, now = new Date()): boolean {
  return new Date(vocabulary.dueAt).getTime() <= endOfLocalDay(now).getTime()
}

export function dueVocabulary(
  vocabulary: VocabularyRecord[],
  now = new Date()
): VocabularyRecord[] {
  return vocabulary
    .filter((item) => isDueToday(item, now))
    .sort(
      (a, b) =>
        new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime() ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
}

export function dueBatch(
  vocabulary: VocabularyRecord[],
  now = new Date()
): { batch: VocabularyRecord[]; remaining: number } {
  const due = dueVocabulary(vocabulary, now)
  return {
    batch: due.slice(0, MAX_DAILY_CARDS),
    remaining: Math.max(0, due.length - MAX_DAILY_CARDS)
  }
}

export function nextInterval(currentDays: number, rating: Rating): number {
  if (rating === 'forgot') return 0
  if (rating === 'fuzzy') return 1
  if (currentDays < 3) return 3
  if (currentDays < 7) return 7
  if (currentDays < 14) return 14
  return 30
}

export function scheduleVocabulary(
  vocabulary: VocabularyRecord,
  rating: Rating,
  now = new Date()
): VocabularyRecord {
  const nextDays = nextInterval(vocabulary.intervalDays, rating)
  const dueAt =
    rating === 'forgot'
      ? new Date(now.getTime() + 10 * 60 * 1000)
      : new Date(now.getTime() + nextDays * DAY_MS)

  return {
    ...vocabulary,
    intervalDays: nextDays,
    dueAt: dueAt.toISOString(),
    lastReviewedAt: now.toISOString(),
    lastRating: rating,
    reviewCount: vocabulary.reviewCount + 1,
    updatedAt: now.toISOString()
  }
}

export function nextUpcomingDate(vocabulary: VocabularyRecord[], now = new Date()): string | null {
  const upcoming = vocabulary
    .map((item) => new Date(item.dueAt))
    .filter((date) => date.getTime() > endOfLocalDay(now).getTime())
    .sort((a, b) => a.getTime() - b.getTime())
  return upcoming[0]?.toISOString() ?? null
}

export function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric'
  }).format(new Date(value))
}

export function formatTime(ms?: number): string {
  if (ms === undefined) return ''
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

