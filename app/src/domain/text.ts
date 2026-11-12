export const MAX_CONTENT_BYTES = 2 * 1024 * 1024
export const WORD_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g

export function countWords(text: string): number {
  return Array.from(text.matchAll(WORD_PATTERN)).length
}

export function stripSrtMarkup(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/\{\\[^}]+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeWord(word: string): string {
  return word.trim().toLocaleLowerCase('en-US').replace(/’/g, "'")
}

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function uniqueId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

export function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_{}[\]()#+.!|>~-])/g, '\\$1')
}

export function splitWords(text: string): Array<{ text: string; word?: string }> {
  const tokens: Array<{ text: string; word?: string }> = []
  let cursor = 0
  for (const match of text.matchAll(WORD_PATTERN)) {
    const index = match.index ?? 0
    if (index > cursor) tokens.push({ text: text.slice(cursor, index) })
    tokens.push({ text: match[0], word: match[0] })
    cursor = index + match[0].length
  }
  if (cursor < text.length) tokens.push({ text: text.slice(cursor) })
  return tokens
}

export function defaultTitle(raw: string): string {
  const firstLine = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/^#{1,6}\s+/, '').trim())
    .find(Boolean)
  return (firstLine || '未命名内容').slice(0, 40)
}

