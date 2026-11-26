import { localDateKey, startOfLocalDay } from './review'
import type { ReadingSessionRecord } from './types'

export type ReadingRangePreset = 'week' | 'month' | 'year' | 'all'

export const READING_RANGE_OPTIONS: Array<{
  value: ReadingRangePreset
  label: string
}> = [
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
  { value: 'all', label: '全部' }
]

export const SHORT_SESSION_MERGE_SECONDS = 120
export const READING_IDLE_TIMEOUT_MS = 60_000
export const READING_FLUSH_INTERVAL_MS = 10_000
export const READING_MAX_TICK_MS = 2_000

export interface ReadingPeriod {
  preset: ReadingRangePreset
  startDate: string
  endDateExclusive: string
  previousStartDate?: string
  previousEndDateExclusive?: string
  label: string
  canGoPrevious: boolean
  canGoNext: boolean
}

export interface ReadingChartBucket {
  key: string
  label: string
  fullLabel: string
  seconds: number
  startDate: string
  endDateExclusive: string
}

export interface ReadingContentRank {
  contentId: string
  contentTitle: string
  seconds: number
  sessionCount: number
  rank: number
  tied: boolean
}

export interface ReadingSummary {
  period: ReadingPeriod
  totalSeconds: number
  averageSeconds: number
  previousSeconds: number
  trendPercent: number | null
  readingDays: number
  sessionCount: number
  contentCount: number
  buckets: ReadingChartBucket[]
  longestBucket?: ReadingChartBucket
  ranking: ReadingContentRank[]
  topContent?: ReadingContentRank
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function addYears(date: Date, amount: number): Date {
  return new Date(date.getFullYear() + amount, 0, 1)
}

function parseLocalDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function inclusiveEnd(start: Date): Date {
  return addDays(start, -1)
}

function daysBetween(start: Date, endExclusive: Date): number {
  return Math.max(1, Math.round((endExclusive.getTime() - start.getTime()) / 86_400_000))
}

function rangeOverlapsToday(
  period: Pick<ReadingPeriod, 'endDateExclusive'>,
  now: Date
) {
  return parseLocalDateKey(period.endDateExclusive) > startOfLocalDay(now)
}

function formatDay(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatPeriodLabel(preset: ReadingRangePreset, start: Date, end: Date): string {
  if (preset === 'month') return `${start.getFullYear()}年${start.getMonth() + 1}月`
  if (preset === 'year') return `${start.getFullYear()}年`
  if (preset === 'all') {
    return start.getFullYear() === end.getFullYear()
      ? `${start.getFullYear()}年`
      : `${start.getFullYear()}年–${end.getFullYear()}年`
  }
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()
  if (sameMonth) {
    return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日–${end.getDate()}日`
  }
  if (sameYear) {
    return `${start.getFullYear()}年${formatDay(start)}–${formatDay(end)}`
  }
  return `${start.getFullYear()}年${formatDay(start)}–${end.getFullYear()}年${formatDay(end)}`
}

function periodStart(preset: ReadingRangePreset, anchor: Date, sessions: ReadingSessionRecord[]) {
  if (preset === 'week') {
    const day = startOfLocalDay(anchor)
    const mondayOffset = (day.getDay() + 6) % 7
    return addDays(day, -mondayOffset)
  }
  if (preset === 'month') return new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  if (preset === 'year') return new Date(anchor.getFullYear(), 0, 1)
  const firstDate = sessions
    .map((session) => session.localDate)
    .filter(Boolean)
    .sort()[0]
  return firstDate ? parseLocalDateKey(firstDate) : startOfLocalDay(anchor)
}

function periodEnd(preset: ReadingRangePreset, start: Date, now: Date): Date {
  if (preset === 'week') return addDays(start, 7)
  if (preset === 'month') return addMonths(start, 1)
  if (preset === 'year') return addYears(start, 1)
  return addDays(startOfLocalDay(now), 1)
}

export function getReadingPeriod(
  preset: ReadingRangePreset,
  anchor: Date,
  now: Date,
  sessions: ReadingSessionRecord[]
): ReadingPeriod {
  const start = periodStart(preset, anchor, sessions)
  const endExclusive = periodEnd(preset, start, now)
  const base = {
    preset,
    startDate: localDateKey(start),
    endDateExclusive: localDateKey(endExclusive),
    label: formatPeriodLabel(preset, start, inclusiveEnd(endExclusive))
  }
  const current = rangeOverlapsToday(base, now)

  if (preset === 'all') {
    return {
      ...base,
      canGoPrevious: false,
      canGoNext: false
    }
  }

  const previousStart =
    preset === 'week'
      ? addDays(start, -7)
      : preset === 'month'
        ? addMonths(start, -1)
        : addYears(start, -1)
  const previousEnd = start

  return {
    ...base,
    previousStartDate: localDateKey(previousStart),
    previousEndDateExclusive: localDateKey(previousEnd),
    canGoPrevious: sessions.some((session) => session.localDate < base.startDate),
    canGoNext: !current
  }
}

export function shiftReadingAnchor(
  preset: ReadingRangePreset,
  anchor: Date,
  direction: -1 | 1
): Date {
  if (preset === 'week') return addDays(anchor, direction * 7)
  if (preset === 'month') return addMonths(anchor, direction)
  if (preset === 'year') return addYears(anchor, direction)
  return anchor
}

export function sessionsInPeriod(
  sessions: ReadingSessionRecord[],
  startDate: string,
  endDateExclusive: string
): ReadingSessionRecord[] {
  return sessions.filter(
    (session) => session.localDate >= startDate && session.localDate < endDateExclusive
  )
}

function monthBuckets(start: Date, endExclusive: Date): ReadingChartBucket[] {
  const buckets: ReadingChartBucket[] = []
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor < endExclusive) {
    const next = addMonths(cursor, 1)
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    buckets.push({
      key,
      label: `${cursor.getMonth() + 1}月`,
      fullLabel: `${cursor.getFullYear()}年${cursor.getMonth() + 1}月`,
      seconds: 0,
      startDate: localDateKey(cursor),
      endDateExclusive: localDateKey(next)
    })
    cursor = next
  }
  return buckets
}

function yearBuckets(start: Date, endExclusive: Date): ReadingChartBucket[] {
  const buckets: ReadingChartBucket[] = []
  let cursor = new Date(start.getFullYear(), 0, 1)
  while (cursor < endExclusive) {
    const next = addYears(cursor, 1)
    buckets.push({
      key: String(cursor.getFullYear()),
      label: `${cursor.getFullYear()}`,
      fullLabel: `${cursor.getFullYear()}年`,
      seconds: 0,
      startDate: localDateKey(cursor),
      endDateExclusive: localDateKey(next)
    })
    cursor = next
  }
  return buckets
}

function createBuckets(period: ReadingPeriod): ReadingChartBucket[] {
  const start = parseLocalDateKey(period.startDate)
  const endExclusive = parseLocalDateKey(period.endDateExclusive)

  if (period.preset === 'week') {
    const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']
    return weekdayLabels.map((label, index) => {
      const current = addDays(start, index)
      return {
        key: localDateKey(current),
        label,
        fullLabel: `周${label} · ${formatDay(current)}`,
        seconds: 0,
        startDate: localDateKey(current),
        endDateExclusive: localDateKey(addDays(current, 1))
      }
    })
  }

  if (period.preset === 'month') {
    return Array.from({ length: daysBetween(start, endExclusive) }, (_, index) => {
      const current = addDays(start, index)
      return {
        key: localDateKey(current),
        label: String(current.getDate()),
        fullLabel: `${current.getMonth() + 1}月${current.getDate()}日`,
        seconds: 0,
        startDate: localDateKey(current),
        endDateExclusive: localDateKey(addDays(current, 1))
      }
    })
  }

  if (period.preset === 'year') return monthBuckets(start, endExclusive)

  const months = monthBuckets(start, endExclusive)
  return months.length <= 13 ? months : yearBuckets(start, endExclusive)
}

export function mergeShortReadingSessions(
  sessions: ReadingSessionRecord[],
  mergeGapSeconds = SHORT_SESSION_MERGE_SECONDS
): ReadingSessionRecord[] {
  const unique = Array.from(
    new Map(sessions.map((session) => [session.id, session])).values()
  ).sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  const merged: ReadingSessionRecord[] = []

  for (const session of unique) {
    const previous = merged.at(-1)
    const gapMs =
      previous === undefined
        ? Number.POSITIVE_INFINITY
        : new Date(session.startedAt).getTime() - new Date(previous.endedAt).getTime()
    if (
      previous &&
      previous.contentId === session.contentId &&
      previous.userId === session.userId &&
      gapMs >= 0 &&
      gapMs <= mergeGapSeconds * 1000
    ) {
      previous.endedAt =
        new Date(previous.endedAt) > new Date(session.endedAt)
          ? previous.endedAt
          : session.endedAt
      previous.effectiveSeconds += session.effectiveSeconds
      previous.updatedAt =
        previous.updatedAt > session.updatedAt ? previous.updatedAt : session.updatedAt
      continue
    }
    merged.push({ ...session })
  }

  return merged
}

export function rankReadingContent(sessions: ReadingSessionRecord[]): ReadingContentRank[] {
  const totals = new Map<
    string,
    { contentTitle: string; seconds: number; sessionIds: Set<string> }
  >()
  for (const session of sessions) {
    const current = totals.get(session.contentId) ?? {
      contentTitle: session.contentTitle,
      seconds: 0,
      sessionIds: new Set<string>()
    }
    current.seconds += session.effectiveSeconds
    current.sessionIds.add(session.id)
    if (!current.contentTitle) current.contentTitle = session.contentTitle
    totals.set(session.contentId, current)
  }

  const sorted = [...totals.entries()]
    .map(([contentId, value]) => ({
      contentId,
      contentTitle: value.contentTitle || '未命名内容',
      seconds: value.seconds,
      sessionCount: value.sessionIds.size
    }))
    .sort(
      (left, right) =>
        right.seconds - left.seconds ||
        left.contentTitle.localeCompare(right.contentTitle, 'zh-CN')
    )

  return sorted.map((entry, index) => {
    const rank =
      index > 0 && sorted[index - 1].seconds === entry.seconds
        ? 1
        : index + 1
    const tied =
      (index > 0 && sorted[index - 1].seconds === entry.seconds) ||
      (index < sorted.length - 1 && sorted[index + 1].seconds === entry.seconds)
    return {
      ...entry,
      rank: index > 0 && tied ? rank : index + 1,
      tied
    }
  })
}

export function summarizeReadingSessions(
  sessions: ReadingSessionRecord[],
  preset: ReadingRangePreset,
  anchor: Date,
  now = new Date()
): ReadingSummary {
  const period = getReadingPeriod(preset, anchor, now, sessions)
  const currentSessions = sessionsInPeriod(
    sessions,
    period.startDate,
    period.endDateExclusive
  )
  const previousSessions =
    period.previousStartDate && period.previousEndDateExclusive
      ? sessionsInPeriod(
          sessions,
          period.previousStartDate,
          period.previousEndDateExclusive
        )
      : []
  const totalSeconds = currentSessions.reduce(
    (sum, session) => sum + session.effectiveSeconds,
    0
  )
  const previousSeconds = previousSessions.reduce(
    (sum, session) => sum + session.effectiveSeconds,
    0
  )
  const elapsedEnd =
    parseLocalDateKey(period.endDateExclusive) > addDays(startOfLocalDay(now), 1)
      ? addDays(startOfLocalDay(now), 1)
      : parseLocalDateKey(period.endDateExclusive)
  const averageSeconds = Math.round(
    totalSeconds /
      daysBetween(parseLocalDateKey(period.startDate), elapsedEnd)
  )
  const buckets = createBuckets(period)

  for (const session of currentSessions) {
    const bucket = buckets.find(
      (item) =>
        session.localDate >= item.startDate &&
        session.localDate < item.endDateExclusive
    )
    if (bucket) bucket.seconds += session.effectiveSeconds
  }

  const merged = mergeShortReadingSessions(currentSessions)
  const ranking = rankReadingContent(merged)
  const longestBucket = [...buckets]
    .filter((bucket) => bucket.seconds > 0)
    .sort((left, right) => right.seconds - left.seconds)[0]

  return {
    period,
    totalSeconds,
    averageSeconds,
    previousSeconds,
    trendPercent:
      previousSeconds > 0
        ? Math.round(((totalSeconds - previousSeconds) / previousSeconds) * 100)
        : null,
    readingDays: new Set(
      currentSessions
        .filter((session) => session.effectiveSeconds > 0)
        .map((session) => session.localDate)
    ).size,
    sessionCount: merged.filter((session) => session.effectiveSeconds > 0).length,
    contentCount: ranking.length,
    buckets,
    longestBucket,
    ranking,
    topContent: ranking[0]
  }
}

export function formatReadingDuration(seconds: number): string {
  if (seconds < 60) return seconds > 0 ? '不到 1 分钟' : '0 分钟'
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (!hours) return `${minutes} 分钟`
  if (!minutes) return `${hours} 小时`
  return `${hours} 小时 ${minutes} 分钟`
}

export function formatReadingDurationCompact(seconds: number): string {
  if (seconds < 60) return seconds > 0 ? '<1分' : '0分'
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (!hours) return `${minutes}分`
  if (!minutes) return `${hours}时`
  return `${hours}时${minutes}分`
}
