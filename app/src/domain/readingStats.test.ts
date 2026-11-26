import { describe, expect, it } from 'vitest'
import {
  formatReadingDuration,
  getReadingPeriod,
  mergeShortReadingSessions,
  rankReadingContent,
  shiftReadingAnchor,
  summarizeReadingSessions
} from './readingStats'
import { ReadingSessionTimer } from './readingTimer'
import type { ReadingSessionRecord } from './types'

function session(
  id: string,
  contentId: string,
  contentTitle: string,
  localDate: string,
  startedAt: string,
  endedAt: string,
  effectiveSeconds: number
): ReadingSessionRecord {
  return {
    id,
    contentId,
    contentTitle,
    localDate,
    startedAt,
    endedAt,
    effectiveSeconds,
    userId: 'wordtap-local-reader',
    updatedAt: endedAt
  }
}

describe('reading session timer', () => {
  it('counts only eligible time, pauses after 60 seconds idle and resumes on interaction', () => {
    const timer = new ReadingSessionTimer(0)
    for (let second = 1; second <= 60; second += 1) timer.tick(second * 1_000)
    expect(timer.snapshot(60_000).effectiveSeconds).toBe(60)

    timer.tick(61_000)
    expect(timer.snapshot(61_000).effectiveSeconds).toBe(60)

    timer.interact(61_000)
    timer.tick(62_000)
    expect(timer.snapshot(62_000).effectiveSeconds).toBe(61)

    timer.setEligible(false, 62_000)
    timer.tick(72_000)
    expect(timer.snapshot(72_000).effectiveSeconds).toBe(61)
  })

  it('caps a throttled tick so a suspended tab does not add hidden time', () => {
    const timer = new ReadingSessionTimer(0)
    timer.tick(30_000)
    expect(timer.snapshot(30_000).effectiveSeconds).toBe(2)
  })
})

describe('reading statistics ranges', () => {
  const now = new Date(2026, 10, 26, 12, 0, 0)

  it('uses local week, month and year boundaries', () => {
    const week = getReadingPeriod('week', now, now, [])
    expect(week).toMatchObject({
      startDate: '2026-11-23',
      endDateExclusive: '2026-11-30',
      canGoNext: false
    })

    const month = getReadingPeriod('month', now, now, [])
    expect(month).toMatchObject({
      startDate: '2026-11-01',
      endDateExclusive: '2026-12-01'
    })

    const year = getReadingPeriod('year', now, now, [])
    expect(year).toMatchObject({
      startDate: '2026-01-01',
      endDateExclusive: '2027-01-01'
    })

    const previousMonthAnchor = shiftReadingAnchor('month', now, -1)
    const previousMonth = getReadingPeriod('month', previousMonthAnchor, now, [])
    expect(previousMonth.canGoNext).toBe(true)
  })

  it('starts the all-time period from the first real session', () => {
    const all = getReadingPeriod(
      'all',
      now,
      now,
      [
        session(
          's1',
          'c1',
          'First',
          '2024-05-03',
          '2024-05-03T08:00:00+08:00',
          '2024-05-03T08:10:00+08:00',
          600
        )
      ]
    )
    expect(all.startDate).toBe('2024-05-03')
    expect(all.endDateExclusive).toBe('2026-11-27')
    expect(all.canGoPrevious).toBe(false)
    expect(all.canGoNext).toBe(false)
  })
})

describe('reading statistics aggregation', () => {
  const now = new Date(2026, 10, 26, 12, 0, 0)
  const sessions = [
    session(
      'a',
      'c1',
      'A',
      '2026-11-23',
      '2026-11-23T09:00:00+08:00',
      '2026-11-23T09:10:00+08:00',
      600
    ),
    session(
      'b',
      'c1',
      'A',
      '2026-11-23',
      '2026-11-23T09:11:00+08:00',
      '2026-11-23T09:16:00+08:00',
      300
    ),
    session(
      'c',
      'c2',
      'A much longer content title',
      '2026-11-24',
      '2026-11-24T10:00:00+08:00',
      '2026-11-24T10:10:00+08:00',
      600
    )
  ]

  it('merges adjacent short sessions and computes the same totals used by ranking', () => {
    expect(mergeShortReadingSessions(sessions)).toHaveLength(2)
    const summary = summarizeReadingSessions(sessions, 'week', now, now)
    expect(summary).toMatchObject({
      totalSeconds: 1500,
      readingDays: 2,
      sessionCount: 2,
      contentCount: 2
    })
    expect(summary.buckets.find((bucket) => bucket.key === '2026-11-23')?.seconds).toBe(
      900
    )
    expect(summary.longestBucket?.key).toBe('2026-11-23')
    expect(summary.ranking[0]).toMatchObject({
      contentId: 'c1',
      seconds: 900,
      sessionCount: 1,
      rank: 1
    })
  })

  it('computes previous-period trend without inventing a value from zero', () => {
    const previous = session(
      'previous',
      'c3',
      'Previous',
      '2026-11-16',
      '2026-11-16T09:00:00+08:00',
      '2026-11-16T09:10:00+08:00',
      1000
    )
    const summary = summarizeReadingSessions([...sessions, previous], 'week', now, now)
    expect(summary.previousSeconds).toBe(1000)
    expect(summary.trendPercent).toBe(50)
  })

  it('uses competition ranking for ties and keeps long names intact in the data', () => {
    const ranking = rankReadingContent([
      session('1', 'a', 'A', '2026-11-23', '2026-11-23T09:00:00+08:00', '2026-11-23T09:05:00+08:00', 300),
      session('2', 'b', 'B', '2026-11-23', '2026-11-23T10:00:00+08:00', '2026-11-23T10:05:00+08:00', 300),
      session('3', 'c', 'A very long content title that should be truncated by the UI', '2026-11-23', '2026-11-23T11:00:00+08:00', '2026-11-23T11:03:00+08:00', 200)
    ])
    expect(ranking.map((item) => item.rank)).toEqual([1, 1, 3])
    expect(ranking[0].tied).toBe(true)
    expect(ranking[2].contentTitle).toContain('long content title')
  })
})

describe('duration formatting', () => {
  it('uses stable Chinese units for empty, minute and hour values', () => {
    expect(formatReadingDuration(0)).toBe('0 分钟')
    expect(formatReadingDuration(30)).toBe('不到 1 分钟')
    expect(formatReadingDuration(3_600)).toBe('1 小时')
    expect(formatReadingDuration(5_460)).toBe('1 小时 31 分钟')
  })
})
