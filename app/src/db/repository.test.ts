import { beforeEach, describe, expect, it } from 'vitest'
import type {
  ContentRecord,
  ReadingSessionRecord,
  VocabularyRecord
} from '../domain/types'
import { db } from './db'
import { DexieRepository } from './repository'
import { localDateKey, scheduleVocabulary } from '../domain/review'

const now = '2026-11-04T10:00:00.000Z'

const content: ContentRecord = {
  id: 'c1',
  title: 'Demo',
  format: 'SRT',
  rawText: '1\n00:00:00,000 --> 00:00:02,000\nHello resilient world.',
  segments: [
    {
      id: 'seg_0',
      index: 0,
      text: 'Hello resilient world.',
      kind: 'subtitle',
      startMs: 0,
      endMs: 2000
    }
  ],
  sourceName: 'demo.srt',
  contentHash: 'hash',
  wordCount: 3,
  mode: 'subtitle',
  createdAt: now,
  updatedAt: now,
  lastOpenedAt: now
}

const vocabulary: VocabularyRecord = {
  id: 'v1',
  word: 'resilient',
  lemma: 'resilient',
  contextSentence: 'Hello resilient world.',
  contentId: 'c1',
  contentTitle: 'Demo',
  segmentId: 'seg_0',
  segmentIndex: 0,
  sourceName: 'demo.srt',
  localDefinition: '有韧性的',
  userDefinition: '',
  note: '',
  createdAt: now,
  updatedAt: now,
  dueAt: now,
  intervalDays: 0,
  reviewCount: 0
}

const readingSession: ReadingSessionRecord = {
  id: 'reading-1',
  startedAt: now,
  endedAt: '2026-11-04T10:00:20.000Z',
  effectiveSeconds: 20,
  contentId: 'c1',
  contentTitle: 'Demo',
  userId: 'wordtap-local-reader',
  localDate: '2026-11-04',
  updatedAt: '2026-11-04T10:00:20.000Z'
}

describe('Dexie repository', () => {
  const repository = new DexieRepository()

  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('persists content and vocabulary through a reopen', async () => {
    await repository.addContent(content)
    await repository.putVocabulary(vocabulary)
    db.close()
    await db.open()
    expect(await repository.getContent('c1')).toMatchObject({ title: 'Demo' })
    expect(await repository.getVocabulary('v1')).toMatchObject({ word: 'resilient' })
  })

  it('keeps a vocabulary snapshot when its content is deleted', async () => {
    await repository.addContent(content)
    await repository.putVocabulary(vocabulary)
    await repository.deleteContent('c1')
    expect(await repository.getContent('c1')).toBeUndefined()
    expect(await repository.getVocabulary('v1')).toBeDefined()
  })

  it('upserts one reading session idempotently and preserves it in backups', async () => {
    await repository.putReadingSession(readingSession)
    await repository.putReadingSession({
      ...readingSession,
      effectiveSeconds: 40,
      endedAt: '2026-11-04T10:00:40.000Z',
      updatedAt: '2026-11-04T10:00:40.000Z'
    })
    expect(await repository.listReadingSessions()).toEqual([
      expect.objectContaining({ id: 'reading-1', effectiveSeconds: 40 })
    ])

    const backup = await repository.exportBackup()
    expect(backup.data.readingSessions).toEqual([
      expect.objectContaining({ id: 'reading-1', effectiveSeconds: 40 })
    ])
  })

  it('round-trips a JSON backup without an API key', async () => {
    await repository.addContent(content)
    await repository.putVocabulary(vocabulary)
    await repository.saveSettings({
      id: 'app',
      apiBaseUrl: 'https://api.example.com/v1',
      apiKey: 'secret-key',
      model: 'test-model',
      timeoutSeconds: 10,
      updatedAt: now
    })
    const backup = await repository.exportBackup()
    expect(JSON.stringify(backup)).not.toContain('secret-key')
    await db.delete()
    await db.open()
    const preview = await repository.importBackup(backup, 'replace')
    expect(preview.contents).toBe(1)
    expect(await repository.getVocabulary('v1')).toBeDefined()
  })

  it('preserves absence of reading preferences so the reader can apply legacy defaults', async () => {
    await db.settings.put({
      id: 'app',
      apiBaseUrl: 'https://api.example.com/v1',
      apiKey: 'secret-key',
      model: 'test-model',
      timeoutSeconds: 10,
      updatedAt: now
    })
    expect((await repository.getSettings()).readingPreferences).toBeUndefined()
  })

  it('backs up non-sensitive reading preferences but never the API key', async () => {
    await repository.saveSettings({
      id: 'app',
      apiBaseUrl: 'https://api.example.com/v1',
      apiKey: 'secret-key',
      model: 'test-model',
      timeoutSeconds: 10,
      readingPreferences: {
        fontFamily: 'sans',
        fontSize: 22,
        margin: 'large',
        lineHeight: 'loose',
        firstLineIndent: true,
        theme: 'night',
        brightness: 'dim'
      },
      updatedAt: now
    })
    const backup = await repository.exportBackup()
    expect(backup.data.settings.readingPreferences).toMatchObject({
      fontSize: 22,
      theme: 'night'
    })
    expect(JSON.stringify(backup)).not.toContain('secret-key')
  })

  it('imports an older backup without reading preferences using current defaults', async () => {
    await repository.saveSettings({
      id: 'app',
      apiBaseUrl: 'https://api.example.com/v1',
      apiKey: 'local-key',
      model: 'test-model',
      timeoutSeconds: 10,
      readingPreferences: {
        fontFamily: 'sans',
        fontSize: 24,
        margin: 'large',
        lineHeight: 'loose',
        firstLineIndent: true,
        theme: 'sepia',
        brightness: 'dim'
      },
      updatedAt: now
    })
    const backup = await repository.exportBackup()
    delete backup.data.settings.readingPreferences
    await repository.importBackup(backup, 'replace')
    expect(await repository.getSettings()).toMatchObject({ apiKey: 'local-key' })
    expect((await repository.getSettings()).readingPreferences).toBeUndefined()
  })

  it('does not corrupt data when an invalid backup is rejected', async () => {
    await repository.addContent(content)
    await expect(
      repository.importBackup(
        { schema: 'wordtap.backup.v1', schemaVersion: 1 } as never,
        'replace'
      )
    ).rejects.toBeTruthy()
    expect(await repository.getContent('c1')).toBeDefined()
  })

  it('grades once and rejects a repeated rating for the same card', async () => {
    await repository.putVocabulary(vocabulary)
    const now = new Date()
    const localDate = localDateKey(now)
    await repository.putSession({
      localDate,
      cardIds: ['v1'],
      answeredCardIds: [],
      ratings: {},
      startedAt: now.toISOString(),
      updatedAt: now.toISOString()
    })
    const graded = scheduleVocabulary(vocabulary, 'know', now)
    const nextSession = {
      localDate,
      cardIds: ['v1'],
      answeredCardIds: ['v1'],
      ratings: { v1: 'know' as const },
      startedAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
    const log = {
      id: 'log1',
      vocabularyId: 'v1',
      reviewedAt: now.toISOString(),
      rating: 'know' as const,
      previousIntervalDays: 0,
      nextDueAt: graded.dueAt,
      localDate
    }
    await repository.gradeVocabulary(graded, nextSession, log)
    await expect(repository.gradeVocabulary(graded, nextSession, { ...log, id: 'log2' }))
      .rejects.toThrow('已经完成评分')
  })
})

