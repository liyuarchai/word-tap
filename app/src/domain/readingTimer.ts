import { READING_IDLE_TIMEOUT_MS, READING_MAX_TICK_MS } from './readingStats'

export class ReadingSessionTimer {
  readonly startedAtMs: number
  private effectiveMs = 0
  private lastTickMs: number
  private lastInteractionMs: number
  private eligible = true

  constructor(
    startedAtMs = Date.now(),
    private idleTimeoutMs = READING_IDLE_TIMEOUT_MS,
    private maxTickMs = READING_MAX_TICK_MS
  ) {
    this.startedAtMs = startedAtMs
    this.lastTickMs = startedAtMs
    this.lastInteractionMs = startedAtMs
  }

  setEligible(eligible: boolean, atMs = Date.now()) {
    if (this.eligible === eligible) return
    this.eligible = eligible
    this.lastTickMs = atMs
  }

  interact(atMs = Date.now()) {
    this.lastInteractionMs = atMs
    if (!this.eligible) this.lastTickMs = atMs
  }

  tick(atMs = Date.now()) {
    const elapsed = Math.max(0, Math.min(atMs - this.lastTickMs, this.maxTickMs))
    if (this.eligible && atMs - this.lastInteractionMs <= this.idleTimeoutMs) {
      this.effectiveMs += elapsed
    }
    this.lastTickMs = atMs
  }

  snapshot(atMs = Date.now()) {
    this.tick(atMs)
    return {
      startedAt: new Date(this.startedAtMs).toISOString(),
      endedAt: new Date(atMs).toISOString(),
      effectiveSeconds: Math.floor(this.effectiveMs / 1000)
    }
  }
}
