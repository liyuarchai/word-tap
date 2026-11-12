import {
  AiClientError,
  type AiClient,
  type SentenceAnalysis,
  type SentenceInput,
  type SentenceTranslation,
  type WordExplainInput,
  type WordExplanation
} from '../domain/types'

export type MockAiMode =
  | 'success'
  | 'missing-key'
  | 'offline'
  | 'network'
  | 'timeout'
  | 'rate-limit'
  | 'server'
  | 'invalid-response'
  | 'loading'

const explanations: Record<string, WordExplanation> = {
  resilient: {
    contextMeaning: '在困难后仍能恢复、坚持住的',
    clue: 'stay resilient 描述团队经历艰难一年后的状态。',
    example: 'She stayed resilient after the setback.',
    exampleZh: '经历挫折后，她依然坚强。'
  },
  grasp: {
    contextMeaning: '理解、想明白',
    clue: 'grasp why 指理解某个原因，不是用手抓住。',
    example: 'I finally grasped what he meant.',
    exampleZh: '我终于明白了他的意思。'
  },
  'binge-watch': {
    contextMeaning: '一口气连续观看剧集',
    clue: '这里与 the whole season 搭配，表示连续刷完整季。',
    example: 'They binge-watched the first season.',
    exampleZh: '他们一口气看完了第一季。'
  }
}

export class MockAiClient implements AiClient {
  mode: MockAiMode

  constructor(mode: MockAiMode = 'success') {
    this.mode = mode
  }

  private wait(signal: AbortSignal) {
    if (this.mode === 'loading') {
      return new Promise<void>((_, reject) => {
        signal.addEventListener('abort', () =>
          reject(new AiClientError('timeout', 'AI 响应超时，已切换本地释义'))
        )
      })
    }
    if (this.mode === 'offline') throw new AiClientError('offline', '当前处于离线状态')
    if (this.mode === 'network') {
      throw new AiClientError('network', '网络请求失败，可能由断网、代理或跨域限制导致')
    }
    if (this.mode === 'missing-key') {
      throw new AiClientError('missing-key', '配置 API Key 可查看语境释义与例句')
    }
    if (this.mode === 'timeout') {
      throw new AiClientError('timeout', 'AI 响应超时，已切换本地释义')
    }
    if (this.mode === 'rate-limit') {
      throw new AiClientError('rate-limit', 'AI 请求过于频繁，请稍后重试')
    }
    if (this.mode === 'server') throw new AiClientError('server', 'AI 服务暂不可用')
    if (this.mode === 'invalid-response') {
      throw new AiClientError('invalid-response', 'AI 暂未给出可靠结果')
    }
    return Promise.resolve()
  }

  async explainWord(input: WordExplainInput, signal: AbortSignal): Promise<WordExplanation> {
    await this.wait(signal)
    return (
      explanations[input.lemma.toLowerCase()] ??
      explanations[input.word.toLowerCase()] ?? {
        contextMeaning: '结合当前语境，该词表示正在发生的事情。',
        clue: `它在“${input.sentence.slice(0, 42)}…”中承担具体描述作用。`,
        example: `They used "${input.word}" naturally in conversation.`,
        exampleZh: `他们在对话中自然地使用了“${input.word}”。`
      }
    )
  }

  async translateSentence(input: SentenceInput, signal: AbortSignal): Promise<SentenceTranslation> {
    await this.wait(signal)
    return { translation: `【模拟译文】${input.sentence}` }
  }

  async analyzeSentence(input: SentenceInput, signal: AbortSignal): Promise<SentenceAnalysis> {
    await this.wait(signal)
    return {
      mainClause: `句子围绕“${input.sentence.slice(0, 36)}…”展开。`,
      logic: '先给出主要信息，再用从句补充原因或条件。',
      phrases: '关注动词与介词搭配，以及从句引导词。',
      hardPoints: '注意一词多义和长句中的修饰关系。',
      naturalZh: `【模拟精析】${input.sentence}`
    }
  }

  async testConnection(signal: AbortSignal) {
    await this.wait(signal)
  }
}

