import { describe, expect, it } from 'vitest'
import { AiClientError } from '../domain/types'
import { MockAiClient, type MockAiMode } from './mockAi'

describe('MockAiClient', () => {
  it('returns deterministic contextual explanations', async () => {
    const result = await new MockAiClient('success').explainWord(
      {
        word: 'resilient',
        lemma: 'resilient',
        sentence: 'The team stayed resilient through a hard year.'
      },
      new AbortController().signal
    )
    expect(result.contextMeaning).toContain('恢复')
  })

  it.each<MockAiMode>(['missing-key', 'offline', 'network', 'timeout', 'rate-limit', 'server', 'invalid-response'])(
    'maps %s failures',
    async (mode) => {
      await expect(
        new MockAiClient(mode).translateSentence(
          { sentence: 'Hello.' },
          new AbortController().signal
        )
      ).rejects.toBeInstanceOf(AiClientError)
    }
  )
})

