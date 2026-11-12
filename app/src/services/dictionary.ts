import type { DictionaryEntry, DictionaryFile } from '../domain/types'
import { normalizeWord, splitWords } from '../domain/text'

let dictionaryPromise: Promise<DictionaryFile> | null = null

export async function loadDictionary(): Promise<DictionaryFile> {
  if (!dictionaryPromise) {
    dictionaryPromise = fetch('/dictionary/dictionary.json').then(async (response) => {
      if (!response.ok) throw new Error('本地词典加载失败')
      return (await response.json()) as DictionaryFile
    })
  }
  return dictionaryPromise
}

function suffixCandidates(word: string): string[] {
  const values = [word]
  if (word.endsWith("'s")) values.push(word.slice(0, -2))
  if (word.endsWith('ies') && word.length > 4) values.push(`${word.slice(0, -3)}y`)
  if (word.endsWith('ing') && word.length > 5) {
    values.push(word.slice(0, -3), `${word.slice(0, -3)}e`)
  }
  if (word.endsWith('ed') && word.length > 4) {
    values.push(word.slice(0, -2), `${word.slice(0, -1)}`)
  }
  if (word.endsWith('es') && word.length > 4) values.push(word.slice(0, -2))
  if (word.endsWith('s') && word.length > 3) values.push(word.slice(0, -1))
  if (word.endsWith('er') && word.length > 4) values.push(word.slice(0, -2))
  if (word.endsWith('est') && word.length > 5) values.push(word.slice(0, -3))
  return Array.from(new Set(values))
}

export async function lookupWord(
  word: string
): Promise<{ entry: DictionaryEntry; lemma: string } | null> {
  const dictionary = await loadDictionary()
  const normalized = normalizeWord(word)
  for (const candidate of suffixCandidates(normalized)) {
    const direct = dictionary.entries[candidate]
    if (direct) return { entry: direct, lemma: direct.lemma || candidate }
    const lemma = dictionary.forms[candidate]
    if (lemma && dictionary.entries[lemma]) {
      return { entry: dictionary.entries[lemma], lemma }
    }
  }
  return null
}

export function resetDictionaryForTests() {
  dictionaryPromise = null
}

export async function buildLocalGloss(sentence: string): Promise<string> {
  const words = Array.from(
    new Set(
      splitWords(sentence)
        .map((token) => token.word?.toLowerCase())
        .filter((word): word is string => Boolean(word))
    )
  ).slice(0, 16)
  const pairs = await Promise.all(
    words.map(async (word) => {
      const result = await lookupWord(word)
      if (!result) return null
      const firstMeaning = result.entry.translation
        .split('\n')
        .map((line) => line.replace(/^[a-z]+\.\s*/i, '').trim())
        .find(Boolean)
      return firstMeaning ? `${word}：${firstMeaning}` : null
    })
  )
  return pairs.filter(Boolean).join('；')
}

