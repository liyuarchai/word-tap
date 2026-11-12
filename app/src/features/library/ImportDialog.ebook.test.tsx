import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImportDialog } from './ImportDialog'

vi.mock('./ebookImport', () => ({
  MAX_EBOOK_BYTES: 50 * 1024 * 1024,
  extractEbook: vi.fn().mockResolvedValue({
    title: 'Imported Book',
    format: 'EPUB',
    rawText: 'The team stayed resilient.\n\nKeep reading every day.',
    segments: [
      { id: 'ebook_0_0', index: 0, kind: 'paragraph', text: 'The team stayed resilient.' },
      { id: 'ebook_0_1', index: 1, kind: 'paragraph', text: 'Keep reading every day.' }
    ],
    wordCount: 8,
    chapterCount: 1,
    warnings: []
  })
}))

describe('ebook import dialog', () => {
  it('previews extracted text, allows a title edit and writes only after confirmation', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(
      <ImportDialog contents={[]} onClose={() => undefined} onSave={onSave} />
    )
    await user.click(screen.getByRole('tab', { name: '文件' }))
    await user.upload(
      screen.getByLabelText('选择导入文件'),
      new File(['epub'], 'book.epub', { type: 'application/epub+zip' })
    )
    await waitFor(() => expect(screen.getByLabelText('电子书标题')).toHaveValue('Imported Book'))
    expect(screen.getByText(/已提取 1 个章节、8 词/)).toBeVisible()
    expect(onSave).not.toHaveBeenCalled()
    await user.clear(screen.getByLabelText('电子书标题'))
    await user.type(screen.getByLabelText('电子书标题'), 'Edited Book')
    await user.click(screen.getByRole('button', { name: '开始阅读' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce())
    expect(onSave.mock.calls[0][0]).toMatchObject({
      title: 'Edited Book',
      format: 'EPUB',
      mode: 'page'
    })
  })
})
