import type { VocabularyRecord } from '../domain/types'
import { escapeMarkdown } from '../domain/text'
import { formatDueDate } from '../domain/review'

export function vocabularyToMarkdown(items: VocabularyRecord[], title = 'Word Tap'): string {
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const blocks = sorted.map((item) => {
    const lines = [
      `## ${escapeMarkdown(item.word)}`,
      '',
      `> ${escapeMarkdown(item.contextSentence)}`,
      '',
      `- 本地释义：${escapeMarkdown(item.userDefinition || item.localDefinition || '未收录')}`
    ]
    if (item.aiDefinition) {
      lines.push(
        `- 语境释义：${escapeMarkdown(item.aiDefinition.contextMeaning)}`,
        `- 例句：${escapeMarkdown(item.aiDefinition.example)}`,
        `- 例句译文：${escapeMarkdown(item.aiDefinition.exampleZh)}`
      )
    }
    lines.push(
      `- 来源：${escapeMarkdown(item.sourceName || item.contentTitle)}${item.startMs === undefined ? '' : ` · ${formatDuration(item.startMs)}`}`,
      `- 收集时间：${formatDateTime(item.createdAt)}`,
      `- 下次复习：${formatDueDate(item.dueAt)}`
    )
    if (item.note) lines.push('', '### 备注', escapeMarkdown(item.note))
    return lines.join('\n')
  })

  return [
    '---',
    `title: "${escapeMarkdown(title)}"`,
    `exported_at: "${new Date().toISOString()}"`,
    `cards: ${items.length}`,
    '---',
    '',
    `# ${escapeMarkdown(title)}`,
    '',
    blocks.join('\n\n')
  ].join('\n')
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function todayFileStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

