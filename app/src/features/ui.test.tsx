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
import { ReadingPreferencesPanel } from './reader/ReadingPreferencesPanel'
import type { OcrClient, VocabularyRecord } from '../domain/types'
import { DEFAULT_READING_PREFERENCES } from '../domain/types'
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

  it('keeps the OCR experiment hidden when its feature flag is disabled', () => {
    render(
      <ImportDialog
        contents={[]}
        ocrDemoEnabled={false}
        onClose={() => undefined}
        onSave={vi.fn()}
      />
    )
    expect(screen.queryByRole('tab', { name: '拍照/选择书页' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '粘贴' })).toBeVisible()
    expect(screen.getByRole('tab', { name: '文件' })).toBeVisible()
  })

  it('exposes EPUB, MOBI and AZW3 without replacing the existing file input', async () => {
    const user = userEvent.setup()
    render(
      <ImportDialog contents={[]} onClose={() => undefined} onSave={vi.fn()} />
    )
    await user.click(screen.getByRole('tab', { name: '文件' }))
    expect(screen.getByLabelText('选择导入文件')).toHaveAttribute(
      'accept',
      expect.stringContaining('.epub')
    )
    expect(screen.getByLabelText('选择导入文件').getAttribute('accept')).toContain('.mobi')
    expect(screen.getByLabelText('选择导入文件').getAttribute('accept')).toContain('.azw3')
  })

  it('turns a locally recognized page into editable text and one OCR content write', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const ocrClient: OcrClient = {
      recognize: vi.fn().mockResolvedValue({
        text: 'The team stayed resilient through a difficult year.',
        confidence: 88,
        wordCount: 8,
        warnings: []
      })
    }
    render(
      <ImportDialog
        contents={[]}
        ocrClient={ocrClient}
        ocrDemoEnabled
        onClose={() => undefined}
        onSave={onSave}
      />
    )
    await user.click(screen.getByRole('tab', { name: '拍照/选择书页' }))
    await user.upload(
      screen.getByLabelText('选择书页图片'),
      new File(['image'], 'page.jpg', { type: 'image/jpeg' })
    )
    expect(screen.getByAltText('待识别的书页预览')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '开始本地识别' }))
    await waitFor(() => expect(screen.getByLabelText('OCR 识别正文')).toBeVisible())
    expect(onSave).not.toHaveBeenCalled()
    await user.clear(screen.getByLabelText('OCR 标题'))
    await user.type(screen.getByLabelText('OCR 标题'), 'Edited page')
    await user.click(screen.getByRole('button', { name: '开始阅读' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce())
    expect(onSave.mock.calls[0][0]).toMatchObject({
      title: 'Edited page',
      format: 'OCR',
      sourceName: 'page.jpg'
    })
  })

  it('retains the page preview and writes nothing when OCR finds no text', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const ocrClient: OcrClient = {
      recognize: vi.fn().mockResolvedValue({
        text: '',
        confidence: 0,
        wordCount: 0,
        warnings: []
      })
    }
    render(
      <ImportDialog
        contents={[]}
        ocrClient={ocrClient}
        ocrDemoEnabled
        onClose={() => undefined}
        onSave={onSave}
      />
    )
    await user.click(screen.getByRole('tab', { name: '拍照/选择书页' }))
    await user.upload(
      screen.getByLabelText('选择书页图片'),
      new File(['image'], 'blank.png', { type: 'image/png' })
    )
    await user.click(screen.getByRole('button', { name: '开始本地识别' }))
    await waitFor(() => expect(screen.getByText('OCR 没有完成，请重试或改用粘贴文本。')).toBeVisible())
    expect(screen.getByAltText('待识别的书页预览')).toBeVisible()
    expect(screen.getByRole('button', { name: '开始阅读' })).toBeDisabled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('cancels OCR without writing content and keeps the source image', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const ocrClient: OcrClient = {
      recognize: vi.fn(
        (_image: Blob, signal: AbortSignal) =>
          new Promise<never>((_, reject) => {
            signal.addEventListener(
              'abort',
              () => reject(new DOMException('OCR 已取消', 'AbortError')),
              { once: true }
            )
          })
      )
    }
    render(
      <ImportDialog
        contents={[]}
        ocrClient={ocrClient}
        ocrDemoEnabled
        onClose={() => undefined}
        onSave={onSave}
      />
    )
    await user.click(screen.getByRole('tab', { name: '拍照/选择书页' }))
    await user.upload(
      screen.getByLabelText('选择书页图片'),
      new File(['image'], 'page.jpg', { type: 'image/jpeg' })
    )
    await user.click(screen.getByRole('button', { name: '开始本地识别' }))
    await user.click(screen.getByRole('button', { name: '停止识别' }))
    await waitFor(() => expect(screen.getByText('已停止识别，原图仍保留在本地。')).toBeVisible())
    expect(screen.getByAltText('待识别的书页预览')).toBeVisible()
    expect(onSave).not.toHaveBeenCalled()
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

  it('offers accessible reading typography and theme controls', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ReadingPreferencesPanel
        preferences={DEFAULT_READING_PREFERENCES}
        onChange={onChange}
        onClose={() => undefined}
      />
    )
    await user.click(screen.getByRole('button', { name: '24' }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ fontSize: 24 })
    )
    await user.click(screen.getByRole('button', { name: '主题 夜间' }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme: 'night' })
    )
    expect(screen.getByRole('dialog', { name: '阅读设置' })).toBeVisible()
  })
})

