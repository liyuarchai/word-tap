import { describe, expect, it } from 'vitest'
import type { VocabularyRecord } from './types'
import {
  dueBatch,
  nextInterval,
  scheduleVocabulary
} from './review'

function card(id: string, dueAt: string, intervalDays = 0): VocabularyRecord {
  return {
    id,
    word: id,
    lemma: id,
    contextSentence: `Context for ${id}.`,
    contentId: 'content',
    contentTitle: 'Demo',
    segmentId: 'seg_0',
    segmentIndex: 0,
    sourceName: 'demo.srt',
    localDefinition: '释义',
    userDefinition: '',
    note: '',
    createdAt: '2026-11-04T00:00:00.000Z',
    updatedAt: '2026-11-04T00:00:00.000Z',
    dueAt,
    intervalDays,
    reviewCount: 0
  }
}

describe('review scheduling', () => {
  it('uses the fixed recognition ladder', () => {
    expect(nextInterval(0, 'know')).toBe(3)
    expect(nextInterval(1, 'know')).toBe(3)
    expect(nextInterval(3, 'know')).toBe(7)
    expect(nextInterval(7, 'know')).toBe(14)
    expect(nextInterval(14, 'know')).toBe(30)
    expect(nextInterval(30, 'know')).toBe(30)
    expect(nextInterval(9, 'fuzzy')).toBe(1)
    expect(nextInterval(9, 'forgot')).toBe(0)
  })

  it('schedules forgot ten minutes later', () => {
    const now = new Date('2026-11-04T12:00:00.000Z')
    const result = scheduleVocabulary(card('focus', now.toISOString()), 'forgot', now)
    expect(result.dueAt).toBe('2026-11-04T12:10:00.000Z')
    expect(result.reviewCount).toBe(1)
  })

  it('caps a daily batch at 50 and reports the remainder', () => {
    const due = Array.from({ length: 55 }, (_, index) =>
      card(`word-${index}`, `2026-11-04T${String(index % 20).padStart(2, '0')}:00:00.000Z`)
    )
    const result = dueBatch(due, new Date('2026-11-04T20:00:00.000Z'))
    expect(result.batch).toHaveLength(50)
    expect(result.remaining).toBe(5)
  })
})

