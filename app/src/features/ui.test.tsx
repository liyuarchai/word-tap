import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppProvider } from '../app/AppContext'
import { MemoryRepository } from '../db/memoryRepository'
import { ReviewHomePage } from './review/ReviewPages'
import { SettingsPage } from './settings/SettingsPage'
import { NotebookPage } from './vocabulary/NotebookPage'
import { ImportDialog } from './library/ImportDialog'
import type { VocabularyRecord } from '../domain/types'
import { MockAiClient } from '../services/mockAi'

const srt = `1
00:00:00,000 --> 00:00:03,000
The team stayed resilient.
`

describe('differentiated UI modules', () => {
  it('imports pasted SRT through the dialog', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(
      <ImportDialog
        contents={[]}
        onClose={() => undefined}
        onSave={onSave}
      />
    )
    await user.type(screen.getByLabelText('粘贴英文内容'), srt)
    await user.click(screen.getByRole('button', { name: '开始阅读' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce())
    expect(onSave.mock.calls[0][0]).toMatchObject({
      format: 'SRT',
      mode: 'subtitle',
      title: '1'
    })
  })

  it('renders empty notebook, review and settings states', async () => {
    render(
      <MemoryRouter>
        <AppProvider repository={new MemoryRepository()}>
          <NotebookPage />
          <ReviewHomePage />
          <SettingsPage />
        </AppProvider>
      </MemoryRouter>
    )
    await waitFor(() =>
      expect(screen.getByText('在阅读中点一个词，它就会出现在这里。')).toBeVisible()
    )
    expect(screen.getByText('今天没有要复习的了。')).toBeVisible()
    expect(screen.getByText('AI 配置')).toBeVisible()
    expect(screen.getByText(/本地优先/)).toBeVisible()
    expect(screen.getByRole('link', { name: '获取 OpenAI API Key' })).toBeVisible()
    expect(screen.getByRole('link', { name: '获取 DeepSeek API Key' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: '使用 DeepSeek 预设' }))
    expect(screen.getByLabelText('接口地址')).toHaveValue('https://api.deepseek.com')
    expect(screen.getByLabelText('模型')).toHaveValue('deepseek-flash')
  })

  it('keeps the notebook search usable with 1,000 vocabulary cards', async () => {
    const repository = new MemoryRepository()
    const now = new Date().toISOString()
    for (let index = 0; index < 1000; index += 1) {
      const record: VocabularyRecord = {
        id: `v-${index}`,
        word: `word-${index}`,
        lemma: `word-${index}`,
        contextSentence: `Context sentence ${index}.`,
        contentId: 'content',
        contentTitle: 'Large notebook',
        segmentId: `seg-${index}`,
        segmentIndex: index,
        sourceName: 'notebook.txt',
        localDefinition: `释义 ${index}`,
        userDefinition: '',
        note: '',
        createdAt: now,
        updatedAt: now,
        dueAt: now,
        intervalDays: 0,
        reviewCount: 0
      }
      await repository.putVocabulary(record)
    }
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AppProvider repository={repository}>
          <NotebookPage />
        </AppProvider>
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText('共 1000 词')).toBeVisible())
    const started = performance.now()
    await user.type(screen.getByLabelText('搜索生词'), 'word-999')
    await waitFor(() => expect(screen.getByText('word-999', { exact: true })).toBeVisible())
    expect(performance.now() - started).toBeLessThan(2500)
  })

  it('keeps the connection-test status in progress while saving settings', async () => {
    class DelayedAiClient extends MockAiClient {
      releaseConnection!: () => void
      connectionWait = new Promise<void>((resolve) => {
        this.releaseConnection = resolve
      })

      override async testConnection(): Promise<void> {
        await this.connectionWait
      }
    }
    const aiClient = new DelayedAiClient()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AppProvider repository={new MemoryRepository()} aiClient={aiClient}>
          <SettingsPage />
        </AppProvider>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: '测试连接' }))
    expect(screen.getAllByText('测试中…')).toHaveLength(2)
    expect(screen.queryByText('未测试')).not.toBeInTheDocument()
    await act(async () => {
      aiClient.releaseConnection()
      await aiClient.connectionWait
    })
    await waitFor(() => expect(screen.getByText('连接成功')).toBeVisible())
  })
})

