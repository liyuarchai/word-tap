import { createHash } from 'node:crypto'
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse'

interface Candidate {
  word: string
  phonetic: string
  definition: string
  translation: string
  pos: string
  bnc: string
  frq: string
  exchange: string
  rank: number
}

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const input = process.argv[2] ?? join(root, 'node_modules', 'ecdict', 'assets', 'ecdict.csv')
const output = join(root, 'public', 'dictionary', 'dictionary.json')
const MAX_ENTRIES = 30_000
const DEMO_LEMMAS = new Set([
  'resilient',
  'resiliency',
  'grasp',
  'binge-watch',
  'binge-watched',
  'binge-watching'
])

if (!existsSync(input)) throw new Error(`ECDICT CSV not found: ${input}`)

function rankOf(record: Record<string, string>): number {
  const values = [record.frq, record.bnc]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
  return values.length ? Math.min(...values) : Number.POSITIVE_INFINITY
}

function shouldReplace(candidate: Candidate, existing?: Candidate): boolean {
  if (!existing) return true
  if (candidate.rank !== existing.rank) return candidate.rank < existing.rank
  return candidate.translation.length > existing.translation.length
}

function cleanText(value: string | undefined): string {
  return (value ?? "")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "")
    .trim();
}

async function main() {
  const selected = new Map<string, Candidate>()
  const demoEntries = new Map<string, Candidate>()
  let rows = 0

  await new Promise<void>((resolvePromise, rejectPromise) => {
    createReadStream(input)
      .pipe(parse({ columns: true, skip_empty_lines: true, relax_column_count: true }))
      .on('data', (record: Record<string, string>) => {
        rows += 1
        const word = record.word?.trim()
        const translation = cleanText(record.translation)
        if (!word || !translation) return
        const candidate: Candidate = {
          word,
          phonetic: cleanText(record.phonetic),
          definition: cleanText(record.definition),
          translation,
          pos: cleanText(record.pos),
          bnc: cleanText(record.bnc),
          frq: cleanText(record.frq),
          exchange: cleanText(record.exchange),
          rank: rankOf(record)
        }
        const key = word.toLowerCase().replace(/’/g, "'")
        if (DEMO_LEMMAS.has(key)) demoEntries.set(key, candidate)
        if (!Number.isFinite(candidate.rank)) return
        if (shouldReplace(candidate, selected.get(key))) selected.set(key, candidate)
      })
      .on('end', resolvePromise)
      .on('error', rejectPromise)
  })

  const top = [...selected.values()]
    .sort((a, b) => a.rank - b.rank || a.word.localeCompare(b.word, 'en'))
    .slice(0, MAX_ENTRIES)
  for (const candidate of demoEntries.values()) {
    const key = candidate.word.toLowerCase()
    const index = top.findIndex((item) => item.word.toLowerCase() === key)
    if (index < 0) top.push(candidate)
    else top[index] = candidate
  }

  const entries = Object.fromEntries(
    top.map((candidate) => [
      candidate.word.toLowerCase(),
      {
        word: candidate.word,
        lemma: candidate.word.toLowerCase(),
        phonetic: candidate.phonetic,
        pos: candidate.pos,
        translation: candidate.translation,
        definition: candidate.definition,
        exchange: candidate.exchange
      }
    ])
  )
  const forms: Record<string, string> = {}
  for (const entry of Object.values(entries)) {
    for (const part of entry.exchange.split('/')) {
      const [, values = ''] = part.split(':', 2)
      for (const value of values.split(',').map((item) => item.trim()).filter(Boolean)) {
        forms[value.toLowerCase().replace(/’/g, "'")] = entry.lemma
      }
    }
  }
  forms['binge-watched'] = 'binge-watch'
  forms['binge-watching'] = 'binge-watch'

  const payload = JSON.stringify({ entries, forms })
  const outputHash = createHash('sha256').update(payload).digest('hex')
  const sourceHash = createHash('sha256').update(readFileSync(input)).digest('hex')
  const generatedAt = statSync(input).mtime.toISOString()
  const result = {
    meta: {
      source: 'skywind3000/ECDICT via npm ecdict@0.0.4',
      license: 'MIT',
      sourceVersion: 'ecdict@0.0.4',
      generatedAt,
      entryCount: Object.keys(entries).length,
      sourceHash,
      outputHash
    },
    entries,
    forms
  }
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, JSON.stringify(result), 'utf8')
  writeFileSync(
    join(dirname(output), 'dictionary-meta.json'),
    JSON.stringify(result.meta, null, 2),
    'utf8'
  )
  console.log(`Generated ${result.meta.entryCount} entries from ${rows} CSV rows`)
  console.log(`Output: ${output}`)
  console.log(`SHA-256: ${outputHash}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

