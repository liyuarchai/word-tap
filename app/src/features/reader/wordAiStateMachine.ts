import type { WordExplanation } from '../../domain/types'

export type DictionaryUiState =
  | { phase: 'loading' }
  | {
      phase: 'ready'
      lemma: string
      definition: string
      meta: string
    }
  | { phase: 'not-found' }
  | { phase: 'error'; message: string }

export type AiUiPhase =
  | 'not-configured'
  | 'configured-idle'
  | 'waiting-first'
  | 'streaming'
  | 'complete'
  | 'cache-hit'
  | 'cancelled'
  | 'offline'
  | 'timeout'
  | 'rate-limited'
  | 'server-error'
  | 'invalid-response'
  | 'auth-error'

export type AiUiAction = 'configure' | 'retry' | 'check-network' | 'wait'

export type AiUiState =
  | {
      phase: 'not-configured'
      transport: 'validated-progressive'
      message: string
      action: 'configure'
      localFallbackAvailable: true
    }
  | {
      phase: 'configured-idle'
      transport: 'validated-progressive'
      localFallbackAvailable: true
    }
  | {
      phase: 'waiting-first'
      transport: 'validated-progressive'
      message: string
      action: 'retry'
      localFallbackAvailable: true
    }
  | {
      phase: 'streaming'
      transport: 'validated-progressive'
      message: string
      action: 'retry'
      result: WordExplanation
      revealedFields: Array<keyof WordExplanation>
      localFallbackAvailable: true
    }
  | {
      phase: 'complete'
      transport: 'validated-progressive'
      message: string
      result: WordExplanation
      localFallbackAvailable: true
    }
  | {
      phase: 'cache-hit'
      transport: 'validated-progressive'
      message: string
      result: WordExplanation
      localFallbackAvailable: true
    }
  | {
      phase: 'cancelled'
      transport: 'validated-progressive'
      message: string
      action: 'retry'
      localFallbackAvailable: true
    }
  | {
      phase: 'offline'
      transport: 'validated-progressive'
      message: string
      action: 'check-network'
      localFallbackAvailable: true
    }
  | {
      phase: 'timeout'
      transport: 'validated-progressive'
      message: string
      action: 'retry'
      localFallbackAvailable: true
    }
  | {
      phase: 'rate-limited'
      transport: 'validated-progressive'
      message: string
      action: 'wait'
      httpStatus: 429
      localFallbackAvailable: true
    }
  | {
      phase: 'server-error'
      transport: 'validated-progressive'
      message: string
      action: 'retry'
      httpStatus?: number
      localFallbackAvailable: true
    }
  | {
      phase: 'invalid-response'
      transport: 'validated-progressive'
      message: string
      action: 'retry'
      localFallbackAvailable: true
    }
  | {
      phase: 'auth-error'
      transport: 'validated-progressive'
      message: string
      action: 'configure'
      httpStatus?: number
      localFallbackAvailable: true
    }

export interface WordAiState {
  dictionary: DictionaryUiState
  ai: AiUiState
}

export const WORD_EXPLANATION_FIELDS: Array<keyof WordExplanation> = [
  'contextMeaning',
  'clue',
  'example',
  'exampleZh'
]

export const AI_STATE_COPY = {
  notConfigured: '未配置 API Key；本地词典仍可使用。',
  waiting: '正在结合上下文…',
  streaming: '正在呈现已校验的语境解释…',
  complete: '语境解释已生成。',
  cacheHit: '语境解释 · 已缓存',
  cancelled: '已停止生成；本地释义已保留。',
  offline: '当前网络不可用；本地词典、收藏和复习不受影响。',
  timeout: 'AI 未在设定时间内响应；本地释义已保留。',
  rateLimited: '请求过于频繁或额度受限；请稍后重试。',
  serverError: 'AI 服务暂时不可用。',
  invalidResponse: 'AI 返回内容为空或无法校验。',
  authError: 'API Key 无效或没有模型权限。'
} as const

export function aiAnnouncement(ai: AiUiState): string {
  switch (ai.phase) {
    case 'configured-idle':
      return 'AI 已配置，正在准备语境解释。'
    case 'complete':
      return AI_STATE_COPY.complete
    case 'cache-hit':
      return AI_STATE_COPY.cacheHit
    default:
      return 'message' in ai ? ai.message : ''
  }
}

export type WordAiEvent =
  | { type: 'DICTIONARY_LOAD_STARTED' }
  | {
      type: 'DICTIONARY_READY'
      lemma: string
      definition: string
      meta: string
    }
  | { type: 'DICTIONARY_NOT_FOUND' }
  | { type: 'DICTIONARY_FAILED'; message: string }
  | { type: 'AI_REQUESTED' }
  | { type: 'AI_RETRY_STARTED' }
  | { type: 'AI_WAITING_FIRST' }
  | { type: 'AI_REVEAL_STARTED'; result: WordExplanation }
  | { type: 'AI_REVEAL_FIELD'; field: keyof WordExplanation }
  | { type: 'AI_COMPLETED'; result: WordExplanation }
  | { type: 'AI_CACHE_HIT'; result: WordExplanation }
  | { type: 'AI_CANCELLED' }
  | { type: 'AI_OFFLINE' }
  | { type: 'AI_TIMED_OUT' }
  | { type: 'AI_RATE_LIMITED' }
  | { type: 'AI_SERVER_ERROR'; status?: number }
  | { type: 'AI_INVALID_RESPONSE' }
  | { type: 'AI_AUTH_ERROR'; status?: number }

export function createInitialWordAiState(aiEnabled: boolean): WordAiState {
  return {
    dictionary: { phase: 'loading' },
    ai: aiEnabled
      ? {
          phase: 'configured-idle',
          transport: 'validated-progressive',
          localFallbackAvailable: true
        }
      : {
          phase: 'not-configured',
          transport: 'validated-progressive',
          message: AI_STATE_COPY.notConfigured,
          action: 'configure',
          localFallbackAvailable: true
        }
  }
}

function errorState(
  phase:
    | 'offline'
    | 'timeout'
    | 'rate-limited'
    | 'server-error'
    | 'invalid-response'
    | 'auth-error',
  status?: number
): AiUiState {
  switch (phase) {
    case 'offline':
      return {
        phase,
        transport: 'validated-progressive',
        message: AI_STATE_COPY.offline,
        action: 'check-network',
        localFallbackAvailable: true
      }
    case 'timeout':
      return {
        phase,
        transport: 'validated-progressive',
        message: AI_STATE_COPY.timeout,
        action: 'retry',
        localFallbackAvailable: true
      }
    case 'rate-limited':
      return {
        phase,
        transport: 'validated-progressive',
        message: AI_STATE_COPY.rateLimited,
        action: 'wait',
        httpStatus: 429,
        localFallbackAvailable: true
      }
    case 'server-error':
      return {
        phase,
        transport: 'validated-progressive',
        message: AI_STATE_COPY.serverError,
        action: 'retry',
        httpStatus: status,
        localFallbackAvailable: true
      }
    case 'invalid-response':
      return {
        phase,
        transport: 'validated-progressive',
        message: AI_STATE_COPY.invalidResponse,
        action: 'retry',
        localFallbackAvailable: true
      }
    case 'auth-error':
      return {
        phase,
        transport: 'validated-progressive',
        message: AI_STATE_COPY.authError,
        action: 'configure',
        httpStatus: status,
        localFallbackAvailable: true
      }
  }
}

export function wordAiReducer(
  state: WordAiState,
  event: WordAiEvent
): WordAiState {
  switch (event.type) {
    case 'DICTIONARY_LOAD_STARTED':
      return { ...state, dictionary: { phase: 'loading' } }
    case 'DICTIONARY_READY':
      return {
        ...state,
        dictionary: {
          phase: 'ready',
          lemma: event.lemma,
          definition: event.definition,
          meta: event.meta
        }
      }
    case 'DICTIONARY_NOT_FOUND':
      return { ...state, dictionary: { phase: 'not-found' } }
    case 'DICTIONARY_FAILED':
      return {
        ...state,
        dictionary: { phase: 'error', message: event.message }
      }
    case 'AI_REQUESTED':
      if (state.dictionary.phase === 'loading') return state
      if (state.ai.phase !== 'configured-idle') return state
      return {
        ...state,
        ai: {
          phase: 'waiting-first',
          transport: 'validated-progressive',
          message: AI_STATE_COPY.waiting,
          action: 'retry',
          localFallbackAvailable: true
        }
      }
    case 'AI_RETRY_STARTED':
      if (
        ![
          'cancelled',
          'offline',
          'timeout',
          'rate-limited',
          'server-error',
          'invalid-response'
        ].includes(state.ai.phase)
      ) {
        return state
      }
      return {
        ...state,
        ai: {
          phase: 'waiting-first',
          transport: 'validated-progressive',
          message: AI_STATE_COPY.waiting,
          action: 'retry',
          localFallbackAvailable: true
        }
      }
    case 'AI_WAITING_FIRST':
      if (
        state.ai.phase !== 'configured-idle' &&
        state.ai.phase !== 'waiting-first'
      ) {
        return state
      }
      return wordAiReducer(state, { type: 'AI_REQUESTED' })
    case 'AI_REVEAL_STARTED':
      if (state.ai.phase !== 'waiting-first') return state
      return {
        ...state,
        ai: {
          phase: 'streaming',
          transport: 'validated-progressive',
          message: AI_STATE_COPY.streaming,
          action: 'retry',
          result: event.result,
          revealedFields: [],
          localFallbackAvailable: true
        }
      }
    case 'AI_REVEAL_FIELD':
      if (state.ai.phase !== 'streaming') return state
      if (state.ai.revealedFields.includes(event.field)) return state
      return {
        ...state,
        ai: {
          ...state.ai,
          revealedFields: [...state.ai.revealedFields, event.field]
        }
      }
    case 'AI_COMPLETED':
      if (state.ai.phase !== 'streaming') return state
      return {
        ...state,
        ai: {
          phase: 'complete',
          transport: 'validated-progressive',
          message: AI_STATE_COPY.complete,
          result: event.result,
          localFallbackAvailable: true
        }
      }
    case 'AI_CACHE_HIT':
      return {
        ...state,
        ai: {
          phase: 'cache-hit',
          transport: 'validated-progressive',
          message: AI_STATE_COPY.cacheHit,
          result: event.result,
          localFallbackAvailable: true
        }
      }
    case 'AI_CANCELLED':
      if (
        state.ai.phase !== 'waiting-first' &&
        state.ai.phase !== 'streaming'
      ) {
        return state
      }
      return {
        ...state,
        ai: {
          phase: 'cancelled',
          transport: 'validated-progressive',
          message: AI_STATE_COPY.cancelled,
          action: 'retry',
          localFallbackAvailable: true
        }
      }
    case 'AI_OFFLINE':
      return { ...state, ai: errorState('offline') }
    case 'AI_TIMED_OUT':
      return { ...state, ai: errorState('timeout') }
    case 'AI_RATE_LIMITED':
      return { ...state, ai: errorState('rate-limited') }
    case 'AI_SERVER_ERROR':
      return { ...state, ai: errorState('server-error', event.status) }
    case 'AI_INVALID_RESPONSE':
      return { ...state, ai: errorState('invalid-response') }
    case 'AI_AUTH_ERROR':
      return { ...state, ai: errorState('auth-error', event.status) }
  }
}

