import { describe, expect, it } from 'vitest'
import type { WordExplanation } from '../../domain/types'
import {
  AI_STATE_COPY,
  aiAnnouncement,
  createInitialWordAiState,
  wordAiReducer,
  WORD_EXPLANATION_FIELDS,
  type WordAiState
} from './wordAiStateMachine'

const result: WordExplanation = {
  contextMeaning: '语境释义',
  clue: '语境线索',
  example: 'Example sentence.',
  exampleZh: '例句译文。'
}

function readyState(): WordAiState {
  return wordAiReducer(createInitialWordAiState(true), {
    type: 'DICTIONARY_READY',
    lemma: 'resilient',
    definition: '有韧性的',
    meta: '/rɪˈzɪliənt/ · adj.'
  })
}

describe('word AI state machine', () => {
  it('starts with localized dictionary and configuration states', () => {
    const configured = createInitialWordAiState(true)
    expect(configured.dictionary.phase).toBe('loading')
    expect(configured.ai.phase).toBe('configured-idle')

    const noKey = createInitialWordAiState(false)
    expect(noKey.ai).toMatchObject({
      phase: 'not-configured',
      message: AI_STATE_COPY.notConfigured,
      localFallbackAvailable: true
    })
  })

  it('does not start AI while the dictionary is loading', () => {
    const state = createInitialWordAiState(true)
    expect(wordAiReducer(state, { type: 'AI_REQUESTED' })).toBe(state)
  })

  it('automatically transitions through waiting, progressive reveal and completion', () => {
    let state = readyState()
    state = wordAiReducer(state, { type: 'AI_REQUESTED' })
    expect(state.ai.phase).toBe('waiting-first')
    state = wordAiReducer(state, { type: 'AI_REVEAL_STARTED', result })
    expect(state.ai.phase).toBe('streaming')
    const firstAnnouncement = aiAnnouncement(state.ai)

    for (const field of WORD_EXPLANATION_FIELDS) {
      state = wordAiReducer(state, { type: 'AI_REVEAL_FIELD', field })
      expect(aiAnnouncement(state.ai)).toBe(firstAnnouncement)
    }
    state = wordAiReducer(state, { type: 'AI_COMPLETED', result })
    expect(state.ai).toMatchObject({
      phase: 'complete',
      result,
      localFallbackAvailable: true
    })
    expect(aiAnnouncement(state.ai)).toBe(AI_STATE_COPY.complete)
  })

  it('keeps cache hits distinct from network completion', () => {
    const state = wordAiReducer(readyState(), { type: 'AI_CACHE_HIT', result })
    expect(state.ai).toMatchObject({
      phase: 'cache-hit',
      message: AI_STATE_COPY.cacheHit,
      result
    })
    expect(state.ai.phase).not.toBe('complete')
  })

  it('clears AI result on cancellation and allows retry only from active states', () => {
    let state = readyState()
    state = wordAiReducer(state, { type: 'AI_REQUESTED' })
    state = wordAiReducer(state, { type: 'AI_REVEAL_STARTED', result })
    state = wordAiReducer(state, { type: 'AI_CANCELLED' })
    expect(state.ai).toMatchObject({
      phase: 'cancelled',
      message: AI_STATE_COPY.cancelled,
      localFallbackAvailable: true
    })
    expect(state.ai).not.toHaveProperty('result')
  })

  it.each([
    ['offline', { type: 'AI_OFFLINE' as const }, AI_STATE_COPY.offline],
    ['timeout', { type: 'AI_TIMED_OUT' as const }, AI_STATE_COPY.timeout],
    ['rate-limited', { type: 'AI_RATE_LIMITED' as const }, AI_STATE_COPY.rateLimited],
    [
      'server-error',
      { type: 'AI_SERVER_ERROR' as const, status: 503 },
      AI_STATE_COPY.serverError
    ],
    [
      'invalid-response',
      { type: 'AI_INVALID_RESPONSE' as const },
      AI_STATE_COPY.invalidResponse
    ],
    [
      'auth-error',
      { type: 'AI_AUTH_ERROR' as const, status: 401 },
      AI_STATE_COPY.authError
    ]
  ])('maps %s without affecting local fallback', (phase, event, message) => {
    const state = wordAiReducer(readyState(), event)
    expect(state.dictionary.phase).toBe('ready')
    expect(state.ai.phase).toBe(phase)
    expect('message' in state.ai ? state.ai.message : '').toBe(message)
    expect(state.ai.localFallbackAvailable).toBe(true)
  })

  it('tracks dictionary not-found and failure independently', () => {
    const notFound = wordAiReducer(createInitialWordAiState(false), {
      type: 'DICTIONARY_NOT_FOUND'
    })
    expect(notFound.dictionary.phase).toBe('not-found')
    expect(notFound.ai.phase).toBe('not-configured')

    const failed = wordAiReducer(createInitialWordAiState(true), {
      type: 'DICTIONARY_FAILED',
      message: '本地词典加载失败'
    })
    expect(failed.dictionary).toEqual({
      phase: 'error',
      message: '本地词典加载失败'
    })
    expect(failed.ai.phase).toBe('configured-idle')
  })

  it('retries from recoverable failures but not from authentication errors', () => {
    const timeout = wordAiReducer(readyState(), { type: 'AI_TIMED_OUT' })
    expect(
      wordAiReducer(timeout, { type: 'AI_RETRY_STARTED' }).ai.phase
    ).toBe('waiting-first')

    const auth = wordAiReducer(readyState(), {
      type: 'AI_AUTH_ERROR',
      status: 401
    })
    expect(wordAiReducer(auth, { type: 'AI_RETRY_STARTED' })).toBe(auth)
  })

  it('requires a validated streaming phase before network completion', () => {
    const waiting = wordAiReducer(readyState(), { type: 'AI_REQUESTED' })
    expect(wordAiReducer(waiting, { type: 'AI_COMPLETED', result })).toBe(waiting)
  })

  it('ignores invalid transitions without corrupting state', () => {
    const idle = createInitialWordAiState(true)
    expect(wordAiReducer(idle, { type: 'AI_COMPLETED', result })).toBe(idle)
    expect(wordAiReducer(idle, { type: 'AI_CANCELLED' })).toBe(idle)
    expect(wordAiReducer(idle, { type: 'AI_CACHE_HIT', result })).not.toBe(idle)
  })
})

