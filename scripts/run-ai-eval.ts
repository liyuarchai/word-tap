import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import {
  AI_EVAL_CASE_SET_VERSION,
  AI_EVAL_SCRIPT_VERSION,
  createResultCsv,
  createTemplateCsv,
  EvalRunError,
  parseEvalConfigFromEnv,
  parseEvalCases,
  runEvalCase,
  sanitizeProviderDomain,
  type EvalResult,
  type EvalCaseSet,
  type EvalRunConfig,
  validateDictionaryMisses
} from './ai-eval-lib'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appRoot = join(repoRoot, 'app')
const casePath = join(repoRoot, 'docs', 'ai-quality', 'eval-cases.json')
const templatePath = join(repoRoot, 'docs', 'ai-quality', 'results-template.csv')
const dictionaryPath = join(appRoot, 'public', 'dictionary', 'dictionary.json')

async function loadCases(): Promise<EvalCaseSet> {
  return parseEvalCases(JSON.parse(await readFile(casePath, 'utf8')))
}

async function loadAndValidateDictionaryMisses(caseSet: EvalCaseSet) {
  const dictionary = JSON.parse(await readFile(dictionaryPath, 'utf8')) as {
    entries: Record<string, unknown>
    forms: Record<string, string>
  }
  validateDictionaryMisses(caseSet, dictionary)
}

async function writeTemplate(caseSet: EvalCaseSet) {
  await writeFile(templatePath, createTemplateCsv(caseSet.cases))
  console.log(`Wrote ${caseSet.cases.length} NOT_RUN rows to ${templatePath}`)
}

async function readLocalMetrics(): Promise<Map<string, number>> {
  const path = process.env.WORDTAP_EVAL_LOCAL_METRICS_FILE?.trim()
  if (!path) return new Map()
  try {
    const payload = JSON.parse(await readFile(resolve(appRoot, path), 'utf8')) as {
      caseId?: unknown
      localFirstResponseMs?: unknown
    }
    if (
      typeof payload.caseId === 'string' &&
      typeof payload.localFirstResponseMs === 'number'
    ) {
      return new Map([[payload.caseId, payload.localFirstResponseMs]])
    }
  } catch {
    console.warn('Local metrics could not be read; using not_measured.')
  }
  return new Map()
}

function runId(): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  return `${stamp}-${randomBytes(3).toString('hex')}`
}

async function main() {
  const caseSet = await loadCases()
  await loadAndValidateDictionaryMisses(caseSet)

  if (process.argv.includes('--write-template')) {
    await writeTemplate(caseSet)
    return
  }
  if (process.argv.includes('--validate-only')) {
    console.log(
      `Validated ${caseSet.cases.length} cases, 10/10/10/5/5 categories and dictionary misses.`
    )
    return
  }

  let config: EvalRunConfig
  try {
    config = parseEvalConfigFromEnv(process.env)
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Invalid provider configuration')
    process.exitCode = 2
    return
  }

  const outputDir = resolve(
    repoRoot,
    process.env.WORDTAP_EVAL_OUTPUT_DIR?.trim() || 'eval-results'
  )
  const run = runId()
  const startedAt = new Date().toISOString()
  const domain = sanitizeProviderDomain(config.baseUrl)
  const localMetrics = await readLocalMetrics()
  const jsonlPath = join(outputDir, `${run}.jsonl`)
  await mkdir(outputDir, { recursive: true })
  const concurrencyValue = Number(process.env.WORDTAP_EVAL_CONCURRENCY || 1)
  if (!Number.isFinite(concurrencyValue) || concurrencyValue < 1) {
    throw new Error('WORDTAP_EVAL_CONCURRENCY must be at least 1')
  }
  const concurrency = Math.floor(concurrencyValue)
  const cancellation = new AbortController()
  const cancel = () => cancellation.abort('cancelled')
  process.once('SIGINT', cancel)
  const results: EvalResult[] = new Array(caseSet.cases.length)
  let cursor = 0
  let completed = 0
  const worker = async () => {
    while (true) {
      const index = cursor++
      if (index >= caseSet.cases.length) return
      const item = caseSet.cases[index]
      const result = await runEvalCase(
        config,
        item,
        run,
        {
          fetchImpl: fetch,
          localFirstResponseMs: localMetrics.get(item.id) ?? 'not_measured',
          signal: cancellation.signal
        }
      )
      results[index] = result
      await appendFile(jsonlPath, `${JSON.stringify(result)}\n`)
      completed += 1
      console.log(`[${completed}/${caseSet.cases.length}] ${item.id}: ${result.runStatus}`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, 5) }, () => worker()))
  process.removeListener('SIGINT', cancel)

  const completedAt = new Date().toISOString()
  const summary = {
    schema: 'wordtap.ai-eval-run.v1',
    runId: run,
    runStatus: results.every((item) => item.runStatus === 'COMPLETED')
      ? 'COMPLETED'
      : 'PARTIAL',
    startedAt,
    completedAt,
    providerDomain: domain,
    model: config.model,
    caseSetVersion: AI_EVAL_CASE_SET_VERSION,
    scriptVersion: AI_EVAL_SCRIPT_VERSION,
    casesRequested: caseSet.cases.length,
    casesCompleted: results.filter((item) => item.runStatus === 'COMPLETED').length,
    casesFailed: results.filter((item) => item.runStatus === 'FAILED').length,
    humanReviewStatus: 'NOT_RUN',
    cacheStatus: 'bypass'
  }
  await writeFile(join(outputDir, `${run}.summary.json`), `${JSON.stringify(summary, null, 2)}\n`)
  await writeFile(
    join(outputDir, `${run}.csv`),
    createResultCsv(results, caseSet.caseSetVersion)
  )
  console.log(`Results written to ${outputDir}`)
}

main().catch((error: unknown) => {
  if (error instanceof EvalRunError) {
    console.error(`${error.type}: ${error.message}`)
  } else {
    console.error(error instanceof Error ? error.message : 'Evaluation failed')
  }
  process.exitCode = 1
})
