import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRepository } from '../../db/memoryRepository'
import type { ContentRecord } from '../../domain/types'
import { useReadingSession } from './useReadingSession'

const content: ContentRecord = {
  id: 'reading-content',
  title: 'Reading timer',
  format: 'TXT',
  rawText: 'A sentence for timing.',
  segments: [{ id: 'seg-0', index: 0, text: 'A sentence for timing.', kind: 'paragraph' }],
  sourceName: 'timer.txt',
  contentHash: 'timer-hash',
  wordCount: 5,
  mode: 'page',
  createdAt: '2026-11-26T00:00:00.000Z',
  updatedAt: '2026-11-26T00:00:00.000Z',
  lastOpenedAt: '2026-11-26T00:00:00.000Z'
}

function Harness({ repository }: { repository: MemoryRepository }) {
  useReadingSession(repository, content)
  return null
}

async function settle() {
  await act(async () => {
    for (let index = 0; index < 10; index += 1) await Promise.resolve()
  })
}

describe('useReadingSession', () => {
  let visible = true

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 26, 9, 0, 0))
    visible = true
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (visible ? 'visible' : 'hidden')
    })
    Object.defineProperty(document, 'hasFocus', {
      configurable: true,
      value: () => true
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('persists cumulative time, pauses when hidden and resumes after interaction', async () => {
    const repository = new MemoryRepository()
    const view = render(<Harness repository={repository} />)

    await act(async () => {
      vi.advanceTimersByTime(20_000)
    })
    await settle()
    expect(repository.readingSessions[0]?.effectiveSeconds).toBeGreaterThanOrEqual(20)

    visible = false
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      vi.advanceTimersByTime(20_000)
    })
    expect(repository.readingSessions[0]?.effectiveSeconds).toBeGreaterThanOrEqual(20)
    expect(repository.readingSessions[0]?.effectiveSeconds).toBeLessThan(40)

    visible = true
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      window.dispatchEvent(new Event('pointermove'))
      vi.advanceTimersByTime(5_000)
      view.unmount()
    })
    await settle()
    expect(repository.readingSessions[0]?.effectiveSeconds).toBeGreaterThanOrEqual(25)
  })

  it('stops counting after 60 seconds without interaction', async () => {
    const repository = new MemoryRepository()
    const view = render(<Harness repository={repository} />)

    await act(async () => {
      vi.advanceTimersByTime(70_000)
    })
    await settle()
    expect(repository.readingSessions[0]?.effectiveSeconds).toBe(60)

    await act(async () => {
      window.dispatchEvent(new Event('keydown'))
      vi.advanceTimersByTime(5_000)
      view.unmount()
    })
    await settle()
    expect(repository.readingSessions[0]?.effectiveSeconds).toBeGreaterThanOrEqual(65)
  })

  it('splits a session at the local midnight boundary', async () => {
    vi.setSystemTime(new Date(2026, 10, 26, 23, 59, 55))
    const repository = new MemoryRepository()
    const view = render(<Harness repository={repository} />)

    await act(async () => {
      for (let second = 0; second < 10; second += 1) {
        vi.advanceTimersByTime(1_000)
      }
      view.unmount()
    })
    await settle()
    expect(repository.readingSessions.map((session) => session.localDate).sort()).toEqual([
      '2026-11-26',
      '2026-11-27'
    ])
  })
})
