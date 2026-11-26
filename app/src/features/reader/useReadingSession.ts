import { useEffect } from 'react'
import type { AppRepository, ContentRecord, ReadingSessionRecord } from '../../domain/types'
import {
  READING_FLUSH_INTERVAL_MS
} from '../../domain/readingStats'
import { ReadingSessionTimer } from '../../domain/readingTimer'
import { localDateKey } from '../../domain/review'

export const LOCAL_READER_ID = 'wordtap-local-reader'
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'touchstart'] as const

export function useReadingSession(
  repository: AppRepository,
  content: ContentRecord | null
) {
  const contentId = content?.id
  const contentTitle = content?.title

  useEffect(() => {
    if (!contentId || !contentTitle) return

    let disposed = false
    let flushQueue = Promise.resolve()
    let windowFocused = true
    let timer: ReadingSessionTimer
    let sessionId = ''
    let currentLocalDate = ''
    let sessionStartedAtMs = Date.now()
    let lastPersistedSeconds = 0
    let lastFlushAt = sessionStartedAtMs

    const startSession = (atMs: number) => {
      sessionStartedAtMs = atMs
      sessionId = `reading_${crypto.randomUUID()}`
      currentLocalDate = localDateKey(new Date(atMs))
      timer = new ReadingSessionTimer(atMs)
      lastPersistedSeconds = 0
      lastFlushAt = atMs
      timer.setEligible(document.visibilityState === 'visible' && windowFocused)
    }

    const setEligible = () => {
      timer.setEligible(document.visibilityState === 'visible' && windowFocused)
    }

    const noteActivity = () => {
      timer.interact()
      if (document.visibilityState === 'visible' && windowFocused) {
        timer.setEligible(true)
      }
    }

    const flush = () => {
      const snapshot = timer.snapshot()
      if (snapshot.effectiveSeconds <= lastPersistedSeconds) return
      lastPersistedSeconds = snapshot.effectiveSeconds
      lastFlushAt = Date.now()
      const record: ReadingSessionRecord = {
        id: sessionId,
        ...snapshot,
        effectiveSeconds: snapshot.effectiveSeconds,
        contentId,
        contentTitle,
        userId: LOCAL_READER_ID,
        localDate: currentLocalDate,
        updatedAt: new Date().toISOString()
      }
      flushQueue = flushQueue
        .catch(() => undefined)
        .then(() => repository.putReadingSession(record))
        .catch(() => undefined)
    }

    const onVisibilityChange = () => {
      setEligible()
      if (document.visibilityState === 'visible') noteActivity()
      else flush()
    }
    const onBlur = () => {
      windowFocused = false
      timer.setEligible(false)
      flush()
    }
    const onFocus = () => {
      windowFocused = true
      timer.setEligible(true)
      noteActivity()
    }
    const onPageHide = () => flush()
    const interval = window.setInterval(() => {
      const now = new Date()
      if (localDateKey(now) !== currentLocalDate) {
        flush()
        startSession(now.getTime())
      }
      timer.tick()
      if (
        Date.now() - lastFlushAt >= READING_FLUSH_INTERVAL_MS &&
        timer.snapshot().effectiveSeconds > lastPersistedSeconds
      ) {
        flush()
      }
    }, 1_000)

    startSession(sessionStartedAtMs)
    setEligible()
    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, noteActivity, { passive: true })
    }
    document.addEventListener('scroll', noteActivity, {
      capture: true,
      passive: true
    })
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      if (!disposed) flush()
      disposed = true
      window.clearInterval(interval)
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, noteActivity)
      }
      document.removeEventListener('scroll', noteActivity, true)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [contentId, contentTitle, repository])
}
