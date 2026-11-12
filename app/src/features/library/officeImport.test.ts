import { describe, expect, it, vi } from 'vitest'
import { extractImportFile, rowsToText } from './officeImport'

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({
      value: 'The team stayed resilient.\n\nThis is a second paragraph.',
      messages: []
    })
  }
}))

vi.mock('read-excel-file/browser', () => ({
  default: vi.fn().mockResolvedValue([
    {
      sheet: 'Vocabulary',
      data: [
        ['Word', 'Meaning'],
        ['resilient', '有韧性的']
      ]
    }
  ])
}))

describe('document and spreadsheet import', () => {
  it('extracts readable paragraphs from CSV rows', async () => {
    const file = new File(
      ['word,meaning\nresilient,有韧性的\ngrasp,理解'],
      'vocabulary.csv',
      { type: 'text/csv' }
    )
    const result = await extractImportFile(file)
    expect(result).toMatchObject({ format: 'CSV', title: 'vocabulary' })
    expect(result.rawText).toContain('word,meaning\n\nresilient,有韧性的')
  })

  it('converts spreadsheet sheets and rows into readable paragraphs', () => {
    const text = rowsToText([
      {
        sheet: 'Vocabulary',
        data: [
          ['Word', 'Meaning'],
          ['resilient', '有韧性的'],
          [null, null]
        ]
      }
    ])
    expect(text).toContain('# Vocabulary')
    expect(text).toContain('resilient · 有韧性的')
  })

  it('explains legacy binary Office formats instead of producing garbage', async () => {
    const file = new File(['legacy'], 'notes.doc')
    await expect(extractImportFile(file)).rejects.toThrow('另存为 .docx 或 .xlsx')
  })

  it('rejects invalid UTF-8 text files', async () => {
    const file = new File([new Uint8Array([0xff, 0xfe])], 'invalid.txt')
    await expect(extractImportFile(file)).rejects.toThrow()
  })

  it('extracts paragraphs from DOCX', async () => {
    const result = await extractImportFile(new File(['docx'], 'article.docx'))
    expect(result.format).toBe('DOCX')
    expect(result.title).toBe('article')
    expect(result.rawText).toContain('The team stayed resilient.\n\nThis is a second paragraph.')
  })

  it('extracts workbook cells from XLSX', async () => {
    const result = await extractImportFile(new File(['xlsx'], 'vocabulary.xlsx'))
    expect(result.format).toBe('XLSX')
    expect(result.rawText).toContain('# Vocabulary')
    expect(result.rawText).toContain('resilient · 有韧性的')
  })
})

