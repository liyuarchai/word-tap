/// <reference types="node" />

import { readFile } from 'node:fs/promises'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  AI_EVAL_SCRIPT_VERSION,
  computeCost,
  createResultCsv,
  createTemplateCsv,
  parseEvalCases,
  parseEvalConfigFromEnv,
  runEvalCase,
  sanitizeProviderDomain,
  validateDictionaryMisses,
  type EvalCase,
  type EvalCaseSet,
  type EvalRunConfig
} from '../../../scripts/ai-eval-lib'

const config: EvalRunConfig = {
  baseUrl: 'https://api.example.com/v1',
  apiKey: 'secret-eval-key',
  model: 'eval-model',
  timeoutMs: 100,
  inputUsdPerMillionTokens: 0.5,
  outputUsdPerMillionTokens: 1.5
}

const explanation = {
  contextMeaning: '河岸',
  clue: 'river 和 water 说明这里是河岸',
  example: 'We rested on the river bank.',
  exampleZh: '我们在河岸上休息。',
  reviewQuestion: 'What does “bank” refer to in this sentence?'
}

async function loadCaseSet(): Promise<EvalCaseSet> {
  return parseEvalCases(
    JSON.parse(
      await readFile(resolve(process.cwd(), '../docs/ai-quality/eval-cases.json'), 'utf8')
    )
  )
}

function sseResponse(
  content: string,
  usage: { input_tokens: number; output_tokens: number } | null,
  malformed = false
): Response {
  const event = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`
  const split = Math.max(1, Math.floor(content.length / 2))
  const body = [
    event({ choices: [{ delta: { content: content.slice(0, split) } }] }),
    event({ choices: [{ delta: { content: content.slice(split) } }] }),
    ...(usage ? [event({ choices: [], usage })] : []),
    malformed ? 'data: {broken\n\n' : 'data: [DONE]\n\n'
  ].join('')
  const bytes = new TextEncoder().encode(body)
  const chunks = [bytes.slice(0, 17), bytes.slice(17, 83), bytes.slice(83)]
  return new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(chunk))
        controller.close()
      }
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
  )
}

describe('AI evaluation case package', () => {
  it('validates the fixed 40-case distribution and dictionary misses', async () => {
    const caseSet = await loadCaseSet()
    expect(caseSet.cases).toHaveLength(40)
    expect(
      Object.fromEntries(
        [...new Set(caseSet.cases.map((item) => item.category))].map((category) => [
          category,
          caseSet.cases.filter((item) => item.category === category).length
        ])
      )
    ).toMatchObject({
      polysemy: 10,
      collocation: 10,
      register: 10,
      'slang-or-proper-noun': 5,
      'dictionary-miss': 5
    })
    expect(
      caseSet.cases
        .filter((item) => item.category === 'register')
        .map((item) => item.register)
    ).toEqual(expect.arrayContaining(['formal', 'informal']))
    const dictionary = JSON.parse(
      await readFile(
        resolve(process.cwd(), 'public/dictionary/dictionary.json'),
        'utf8'
      )
    )
    expect(() => validateDictionaryMisses(caseSet, dictionary)).not.toThrow()
  })

  it('creates a 40-row NOT_RUN template without fabricated metrics', async () => {
    const caseSet = await loadCaseSet()
    const csv = createTemplateCsv(caseSet.cases)
    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(41)
    expect(lines.filter((line) => line.includes(',NOT_RUN,'))).toHaveLength(40)
    expect(csv).not.toContain('api.example.com')
    expect(csv).not.toContain('eval-model')
    expect(csv).not.toContain(',0,')
  })

  it('validates provider configuration without embedding secrets', () => {
    expect(() => parseEvalConfigFromEnv({})).toThrow('WORDTAP_EVAL_BASE_URL')
    expect(() =>
      parseEvalConfigFromEnv({
        WORDTAP_EVAL_BASE_URL: 'https://api.example.com/v1?key=leak',
        WORDTAP_EVAL_API_KEY: 'secret',
        WORDTAP_EVAL_MODEL: 'model'
      })
    ).toThrow('query')
    const parsed = parseEvalConfigFromEnv({
      WORDTAP_EVAL_BASE_URL: 'https://api.example.com/v1',
      WORDTAP_EVAL_API_KEY: 'secret',
      WORDTAP_EVAL_MODEL: 'model',
      WORDTAP_EVAL_INPUT_USD_PER_MTOK: '0.25',
      WORDTAP_EVAL_OUTPUT_USD_PER_MTOK: '1.5'
    })
    expect(parsed).toMatchObject({ model: 'model', timeoutMs: 20000 })
    expect(sanitizeProviderDomain(parsed.baseUrl)).toBe('api.example.com')
  })

  it('computes cost only when usage and both prices are present', () => {
    expect(
      computeCost({ inputTokens: 1_000_000, outputTokens: 500_000 }, 0.5, 1.5)
    ).toBe(1.25)
    expect(computeCost({ inputTokens: null, outputTokens: 10 }, 0.5, 1.5)).toBe(
      'not_computed'
    )
    expect(computeCost({ inputTokens: 10, outputTokens: 10 })).toBe('not_computed')
  })
})

describe('AI evaluation runner', () => {
  it('stops before network or result writes when provider env is missing', () => {
    const temp = mkdtempSync(resolve(tmpdir(), 'wordtap-ai-eval-'))
    const output = resolve(temp, 'results')
    const env = { ...process.env }
    for (const key of Object.keys(env)) {
      if (key.startsWith('WORDTAP_EVAL_')) delete env[key]
    }
    env.WORDTAP_EVAL_OUTPUT_DIR = output
    try {
      const result = spawnSync(
        process.execPath,
        [
          resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs'),
          resolve(process.cwd(), '../scripts/run-ai-eval.ts')
        ],
        { cwd: process.cwd(), env, encoding: 'utf8' }
      )
      expect(result.status).toBe(2)
      expect(`${result.stdout}${result.stderr}`).toContain('WORDTAP_EVAL_BASE_URL')
      expect(existsSync(output)).toBe(false)
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  })

  it('parses fragmented SSE, records first token and provider usage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse(JSON.stringify(explanation), {
        input_tokens: 120,
        output_tokens: 45
      })
    )
    const result = await runEvalCase(config, (await loadCaseSet()).cases[0], 'run-1', {
      fetchImpl: fetchMock,
      localFirstResponseMs: 12
    })
    expect(result).toMatchObject({
      runStatus: 'COMPLETED',
      caseSetVersion: '1.0.0',
      scriptVersion: AI_EVAL_SCRIPT_VERSION,
      providerDomain: 'api.example.com',
      localFirstResponseMs: 12,
      output: explanation,
      metrics: {
        inputTokens: 120,
        outputTokens: 45,
        cacheStatus: 'bypass',
        errorType: 'none'
      }
    })
    expect(typeof result.metrics.aiFirstTokenMs).toBe('number')
    expect(typeof result.metrics.aiTotalMs).toBe('number')
    expect(JSON.stringify(result)).not.toContain('secret-eval-key')
  })

  it('marks non-stream responses and missing usage accurately', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(explanation) } }]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const result = await runEvalCase(config, (await loadCaseSet()).cases[0], 'run-2', {
      fetchImpl: fetchMock
    })
    expect(result.metrics).toMatchObject({
      aiFirstTokenMs: 'not_measured',
      inputTokens: 'not_reported',
      outputTokens: 'not_reported',
      estimatedCostUsd: 'not_computed'
    })
  })

  it('retries a 5xx once and records auth/rate errors', async () => {
    const success = sseResponse(JSON.stringify(explanation), {
      input_tokens: 1,
      output_tokens: 1
    })
    const retryFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(success)
    await expect(
      runEvalCase(config, (await loadCaseSet()).cases[0], 'run-3', {
        fetchImpl: retryFetch
      })
    ).resolves.toMatchObject({ runStatus: 'COMPLETED' })
    expect(retryFetch).toHaveBeenCalledTimes(2)

    await expect(
      runEvalCase(config, (await loadCaseSet()).cases[0], 'run-4', {
        fetchImpl: vi.fn().mockResolvedValue(new Response('', { status: 401 }))
      })
    ).resolves.toMatchObject({
      runStatus: 'FAILED',
      metrics: { errorType: 'auth' }
    })
    await expect(
      runEvalCase(config, (await loadCaseSet()).cases[0], 'run-5', {
        fetchImpl: vi.fn().mockResolvedValue(new Response('', { status: 429 }))
      })
    ).resolves.toMatchObject({
      runStatus: 'FAILED',
      metrics: { errorType: 'rate-limit' }
    })
  })

  it('classifies timeout, network, cancellation, malformed SSE and invalid JSON', async () => {
    const waitingFetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError'))
        )
      })
    })
    const firstCase = (await loadCaseSet()).cases[0]
    await expect(
      runEvalCase({ ...config, timeoutMs: 5 }, firstCase, 'run-timeout', {
        fetchImpl: waitingFetch as typeof fetch
      })
    ).resolves.toMatchObject({ runStatus: 'FAILED', metrics: { errorType: 'timeout' } })

    await expect(
      runEvalCase(config, firstCase, 'run-network', {
        fetchImpl: vi.fn().mockRejectedValue(new TypeError('fetch failed'))
      })
    ).resolves.toMatchObject({ runStatus: 'FAILED', metrics: { errorType: 'network' } })

    const cancel = new AbortController()
    const pending = runEvalCase(
      { ...config, timeoutMs: 1000 },
      firstCase,
      'run-cancel',
      { fetchImpl: waitingFetch as typeof fetch, signal: cancel.signal }
    )
    cancel.abort('cancelled')
    await expect(pending).resolves.toMatchObject({
      runStatus: 'FAILED',
      metrics: { errorType: 'cancelled' }
    })

    await expect(
      runEvalCase(config, firstCase, 'run-sse', {
        fetchImpl: vi
          .fn()
          .mockResolvedValue(
            sseResponse(JSON.stringify(explanation), null, true)
          )
      })
    ).resolves.toMatchObject({
      runStatus: 'FAILED',
      metrics: { errorType: 'stream-parse' }
    })

    await expect(
      runEvalCase(config, firstCase, 'run-json', {
        fetchImpl: vi
          .fn()
          .mockResolvedValue(sseResponse('not-json', null))
      })
    ).resolves.toMatchObject({
      runStatus: 'FAILED',
      metrics: { errorType: 'invalid-response' }
    })
  })

  it('writes actual outputs without API keys or invented human scores', async () => {
    const firstCase: EvalCase = (await loadCaseSet()).cases[0]
    const result = await runEvalCase(config, firstCase, 'run-csv', {
      fetchImpl: vi
        .fn()
        .mockResolvedValue(
          sseResponse(JSON.stringify(explanation), {
            input_tokens: 12,
            output_tokens: 8
          })
        )
    })
    const csv = createResultCsv([result], AI_EVAL_SCRIPT_VERSION)
    expect(csv).toContain('COMPLETED')
    expect(csv).toContain('河岸')
    expect(csv).not.toContain('secret-eval-key')
    expect(csv.split('\n')[1].split(',')[16]).toBe('')
  })
})
