import { backupSchema, settingsSchema } from '../domain/schemas'
import type {
  AiCacheRecord,
  AppRepository,
  BackupV1,
  ContentRecord,
  ImportPreview,
  ReadingSessionRecord,
  ReviewLog,
  ReviewSession,
  Settings,
  VocabularyRecord
} from '../domain/types'
import {
  DEFAULT_READING_PREFERENCES,
  type ReadingPreferences
} from '../domain/types'
import { db } from './db'

export const defaultSettings = (): Settings => ({
  id: 'app',
  apiBaseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  timeoutSeconds: 10,
  updatedAt: new Date().toISOString()
})

export function mergeReadingPreferences(
  preferences?: Partial<ReadingPreferences>
): ReadingPreferences {
  return { ...DEFAULT_READING_PREFERENCES, ...preferences }
}

function backupPreview(backup: BackupV1, current: {
  contents: ContentRecord[]
  vocabularies: VocabularyRecord[]
  reviewLogs: ReviewLog[]
  reviewSessions: ReviewSession[]
  readingSessions: ReadingSessionRecord[]
}): ImportPreview {
  const contentIds = new Set(current.contents.map((item) => item.id))
  const vocabIds = new Set(current.vocabularies.map((item) => item.id))
  const logIds = new Set(current.reviewLogs.map((item) => item.id))
  const sessionDates = new Set(current.reviewSessions.map((item) => item.localDate))
  const readingSessionIds = new Set(current.readingSessions.map((item) => item.id))
  const conflicts =
    backup.data.contents.filter((item) => contentIds.has(item.id)).length +
    backup.data.vocabularies.filter((item) => vocabIds.has(item.id)).length +
    backup.data.reviewLogs.filter((item) => logIds.has(item.id)).length +
    backup.data.reviewSessions.filter((item) => sessionDates.has(item.localDate)).length +
    (backup.data.readingSessions ?? []).filter((item) =>
      readingSessionIds.has(item.id)
    ).length

  return {
    contents: backup.data.contents.length,
    vocabularies: backup.data.vocabularies.length,
    reviewLogs: backup.data.reviewLogs.length,
    reviewSessions: backup.data.reviewSessions.length,
    conflicts
  }
}

export class DexieRepository implements AppRepository {
  async listContents() {
    return db.contents.orderBy('lastOpenedAt').reverse().toArray()
  }

  async getContent(id: string) {
    return db.contents.get(id)
  }

  async addContent(content: ContentRecord) {
    await db.contents.add(content)
  }

  async updateContent(content: ContentRecord) {
    await db.contents.put(content)
  }

  async deleteContent(id: string) {
    await db.contents.delete(id)
  }

  async listVocabulary() {
    return db.vocabularies.orderBy('createdAt').reverse().toArray()
  }

  async getVocabulary(id: string) {
    return db.vocabularies.get(id)
  }

  async putVocabulary(vocabulary: VocabularyRecord) {
    await db.vocabularies.put(vocabulary)
  }

  async deleteVocabulary(id: string) {
    await db.transaction('rw', [db.vocabularies, db.reviewLogs, db.reviewSessions], async () => {
      await db.vocabularies.delete(id)
      await db.reviewLogs.where('vocabularyId').equals(id).delete()
      const sessions = await db.reviewSessions.toArray()
      for (const session of sessions) {
        if (!session.cardIds.includes(id)) continue
        await db.reviewSessions.put({
          ...session,
          cardIds: session.cardIds.filter((cardId) => cardId !== id),
          answeredCardIds: session.answeredCardIds.filter((cardId) => cardId !== id),
          ratings: Object.fromEntries(
            Object.entries(session.ratings).filter(([cardId]) => cardId !== id)
          ),
          updatedAt: new Date().toISOString()
        })
      }
    })
  }

  async getSession(localDate: string) {
    return db.reviewSessions.get(localDate)
  }

  async putSession(session: ReviewSession) {
    await db.reviewSessions.put(session)
  }

  async putReviewLog(log: ReviewLog) {
    await db.reviewLogs.put(log)
  }

  async listReadingSessions() {
    return db.readingSessions.orderBy('startedAt').toArray()
  }

  async putReadingSession(session: ReadingSessionRecord) {
    await db.readingSessions.put(session)
  }

  async gradeVocabulary(
    vocabulary: VocabularyRecord,
    session: ReviewSession,
    log: ReviewLog
  ) {
    await db.transaction(
      'rw',
      [db.vocabularies, db.reviewSessions, db.reviewLogs],
      async () => {
        const current = await db.vocabularies.get(vocabulary.id)
        const persistedSession = await db.reviewSessions.get(session.localDate)
        if (!current || persistedSession?.answeredCardIds.includes(vocabulary.id)) {
          throw new Error('这张词卡已经完成评分。')
        }
        await db.vocabularies.put(vocabulary)
        await db.reviewSessions.put(session)
        await db.reviewLogs.put(log)
      }
    )
  }

  async getSettings() {
    const stored = await db.settings.get('app')
    if (!stored) return defaultSettings()
    return settingsSchema.parse({ ...defaultSettings(), ...stored })
  }

  async saveSettings(settings: Settings) {
    const parsed = settingsSchema.parse(settings)
    if (parsed.readingPreferences) {
      parsed.readingPreferences = mergeReadingPreferences(parsed.readingPreferences)
    }
    await db.settings.put(parsed)
  }

  async getAiCache(key: string) {
    return db.aiCache.get(key)
  }

  async putAiCache(record: AiCacheRecord) {
    await db.aiCache.put(record)
  }

  async clearAiCache() {
    await db.aiCache.clear()
  }

  async exportBackup(): Promise<BackupV1> {
    const [
      contents,
      vocabularies,
      reviewLogs,
      reviewSessions,
      readingSessions,
      settings
    ] = await Promise.all([
      db.contents.toArray(),
      db.vocabularies.toArray(),
      db.reviewLogs.toArray(),
      db.reviewSessions.toArray(),
      db.readingSessions.toArray(),
      this.getSettings()
    ])
    return {
      schema: 'wordtap.backup.v1',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      appVersion: '0.1.0',
      data: {
        contents,
        vocabularies,
        reviewLogs,
        reviewSessions,
        readingSessions,
        settings: {
          apiBaseUrl: settings.apiBaseUrl,
          model: settings.model,
          timeoutSeconds: settings.timeoutSeconds,
          readingPreferences: settings.readingPreferences
        }
      }
    }
  }

  async previewBackup(backup: BackupV1) {
    const data = backupSchema.parse(backup)
    const current = {
      contents: await db.contents.toArray(),
      vocabularies: await db.vocabularies.toArray(),
      reviewLogs: await db.reviewLogs.toArray(),
      reviewSessions: await db.reviewSessions.toArray(),
      readingSessions: await db.readingSessions.toArray()
    }
    return backupPreview(data as BackupV1, current)
  }

  async importBackup(backup: BackupV1, mode: 'merge' | 'replace') {
    const parsed = backupSchema.parse(backup) as BackupV1
    const current = {
      contents: await db.contents.toArray(),
      vocabularies: await db.vocabularies.toArray(),
      reviewLogs: await db.reviewLogs.toArray(),
      reviewSessions: await db.reviewSessions.toArray(),
      readingSessions: await db.readingSessions.toArray()
    }
    const preview = backupPreview(parsed, current)
    const localSettings = await this.getSettings()

    await db.transaction(
      'rw',
      [
        db.contents,
        db.vocabularies,
        db.reviewLogs,
        db.reviewSessions,
        db.readingSessions,
        db.settings
      ],
      async () => {
        if (mode === 'replace') {
          await Promise.all([
            db.contents.clear(),
            db.vocabularies.clear(),
            db.reviewLogs.clear(),
            db.reviewSessions.clear(),
            db.readingSessions.clear()
          ])
        }

        for (const content of parsed.data.contents) {
          const existing = await db.contents.get(content.id)
          if (!existing || !existing.updatedAt || existing.updatedAt < content.updatedAt) {
            await db.contents.put(content)
          }
        }
        for (const vocabulary of parsed.data.vocabularies) {
          const existing = await db.vocabularies.get(vocabulary.id)
          if (
            !existing ||
            !existing.updatedAt ||
            existing.updatedAt < vocabulary.updatedAt
          ) {
            await db.vocabularies.put(vocabulary)
          }
        }
        for (const log of parsed.data.reviewLogs) {
          if (!(await db.reviewLogs.get(log.id))) await db.reviewLogs.put(log)
        }
        for (const session of parsed.data.reviewSessions) {
          const existing = await db.reviewSessions.get(session.localDate)
          if (!existing) {
            await db.reviewSessions.put(session)
          } else {
            await db.reviewSessions.put({
              ...(existing.updatedAt < session.updatedAt ? session : existing),
              cardIds: Array.from(new Set([...existing.cardIds, ...session.cardIds])),
              answeredCardIds: Array.from(
                new Set([...existing.answeredCardIds, ...session.answeredCardIds])
              ),
              ratings: { ...session.ratings, ...existing.ratings },
              updatedAt: new Date().toISOString()
            })
          }
        }
        for (const session of parsed.data.readingSessions ?? []) {
          const existing = await db.readingSessions.get(session.id)
          if (!existing || existing.updatedAt < session.updatedAt) {
            await db.readingSessions.put(session)
          }
        }
        const importedSettings: Settings = {
          ...parsed.data.settings,
          id: 'app',
          apiKey: localSettings.apiKey,
          updatedAt: new Date().toISOString()
        }
        if (parsed.data.settings.readingPreferences) {
          importedSettings.readingPreferences = mergeReadingPreferences(
            parsed.data.settings.readingPreferences
          )
        }
        await db.settings.put(importedSettings)
      }
    )
    return preview
  }

  async clearAll() {
    await db.transaction(
      'rw',
      [
        db.contents,
        db.vocabularies,
        db.reviewLogs,
        db.reviewSessions,
        db.readingSessions,
        db.settings,
        db.aiCache
      ],
      async () => {
        await Promise.all([
          db.contents.clear(),
          db.vocabularies.clear(),
          db.reviewLogs.clear(),
          db.reviewSessions.clear(),
          db.readingSessions.clear(),
          db.settings.clear(),
          db.aiCache.clear()
        ])
      }
    )
  }
}


