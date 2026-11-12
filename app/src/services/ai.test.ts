import { describe, expect, it, vi } from 'vitest'
import type { Settings } from '../domain/types'
import { HttpAiClient } from './ai'

const settings: Settings = {
  id: 'app',
  apiBaseUrl: 'https://api.example.com/v1',
  apiKey: 'test-key',
  model: 'test-model',
  timeoutSeconds: 10,
  updatedAt: new Date().toISOString()
}

describe('HttpAiClient', () => {
  it('sends Bearer auth and validates JSON responses', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  contextMeaning: '有韧性的',
                  clue: '描述团队状态',
                  example: 'They stayed resilient.',
                  exampleZh: '他们坚持住了。'
                })
              }
            }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const client = new HttpAiClient(settings)
    const result = await client.explainWord(
      { word: 'resilient', lemma: 'resilient', sentence: 'They stayed resilient.' },
      new AbortController().signal
    )
    expect(result.contextMeaning).toBe('有韧性的')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' })
      })
    )
  })

  it('reports missing keys without making a request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const client = new HttpAiClient({ ...settings, apiKey: '' })
    await expect(
      client.translateSentence(
        { sentence: 'Hello.' },
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: 'missing-key' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps rate-limit responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 429 }))
    const client = new HttpAiClient(settings)
    await expect(
      client.analyzeSentence({ sentence: 'Hello.' }, new AbortController().signal)
    ).rejects.toMatchObject({ code: 'rate-limit' })
  })

  it('maps authentication failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 401 }))
    const client = new HttpAiClient(settings)
    await expect(
      client.translateSentence({ sentence: 'Hello.' }, new AbortController().signal)
    ).rejects.toMatchObject({ code: 'auth' })
  })

  it('maps forbidden responses to auth errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 403 }))
    const client = new HttpAiClient(settings)
    await expect(
      client.translateSentence({ sentence: 'Hello.' }, new AbortController().signal)
    ).rejects.toMatchObject({ code: 'auth' })
  })

  it('retries a 5xx response once and then succeeds', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"translation":"你好。"}' } }]
          }),
          { status: 200 }
        )
      )
    const client = new HttpAiClient(settings)
    await expect(
      client.translateSentence({ sentence: 'Hello.' }, new AbortController().signal)
    ).resolves.toEqual({ translation: '你好。' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('maps invalid model output', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'not-json' } }]
        }),
        { status: 200 }
      )
    )
    const client = new HttpAiClient(settings)
    await expect(
      client.translateSentence({ sentence: 'Hello.' }, new AbortController().signal)
    ).rejects.toMatchObject({ code: 'invalid-response' })
  })

  it('maps an aborted request to timeout', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      if (init?.signal?.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'))
      }
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError'))
        )
      })
    })
    const client = new HttpAiClient(settings)
    const controller = new AbortController()
    controller.abort()
    await expect(
      client.translateSentence({ sentence: 'Hello.' }, controller.signal)
    ).rejects.toMatchObject({ code: 'timeout' })
  })

  it('distinguishes browser network or CORS failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const client = new HttpAiClient(settings)
    await expect(
      client.translateSentence({ sentence: 'Hello.' }, new AbortController().signal)
    ).rejects.toMatchObject({ code: 'network' })
  })

  it('normalizes common DeepSeek sentence-analysis field names', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  main_clause: 'The team stayed resilient',
                  logic: 'through 引出经历的时间范围',
                  key_phrases: 'stay resilient, through a year',
                  difficulties: 'resilient 的语境义',
                  translation: '这个团队在艰难的一年里始终坚持着。'
                })
              }
            }
          ]
        }),
        { status: 200 }
      )
    )
    const client = new HttpAiClient(settings)
    await expect(
      client.analyzeSentence(
        { sentence: 'The team stayed resilient through a year.' },
        new AbortController().signal
      )
    ).resolves.toEqual({
      mainClause: 'The team stayed resilient',
      logic: 'through 引出经历的时间范围',
      phrases: 'stay resilient, through a year',
      hardPoints: 'resilient 的语境义',
      naturalZh: '这个团队在艰难的一年里始终坚持着。'
    })
  })

  it('enables DeepSeek JSON output for sentence analysis', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  mainClause: 'Main',
                  logic: '',
                  phrases: '',
                  hardPoints: '',
                  naturalZh: '自然表达'
                })
              }
            }
          ]
        }),
        { status: 200 }
      )
    )
    const client = new HttpAiClient({
      ...settings,
      apiBaseUrl: 'https://api.deepseek.com',
      model: 'deepseek-flash'
    })
    await client.analyzeSentence({ sentence: 'A sentence.' }, new AbortController().signal)
    const request = fetchMock.mock.calls[0][1] as RequestInit
    expect(JSON.parse(String(request.body))).toMatchObject({
      response_format: { type: 'json_object' },
      max_tokens: 800
    })
  })
})


