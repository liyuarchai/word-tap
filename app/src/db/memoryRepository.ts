import type {
  AiCacheRecord,
  AppRepository,
  BackupV1,
  ContentRecord,
  ReviewLog,
  ReviewSession,
  Settings,
  VocabularyRecord
} from '../domain/types'
import { defaultSettings, mergeReadingPreferences } from './repository'

export class MemoryRepository implements AppRepository {
  contents: ContentRecord[] = []
  vocabularies: VocabularyRecord[] = []
  logs: ReviewLog[] = []
  sessions = new Map<string, ReviewSession>()
  settings = defaultSettings()
  cache = new Map<string, AiCacheRecord>()

  async listContents() {
    return [...this.contents].sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))
  }
  async getContent(id: string) {
    return this.contents.find((item) => item.id === id)
  }
  async addContent(content: ContentRecord) {
    this.contents.push(content)
  }
  async updateContent(content: ContentRecord) {
    const index = this.contents.findIndex((item) => item.id === content.id)
    if (index < 0) this.contents.push(content)
    else this.contents[index] = content
  }
  async deleteContent(id: string) {
    this.contents = this.contents.filter((item) => item.id !== id)
  }
  async listVocabulary() {
    return [...this.vocabularies].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  async getVocabulary(id: string) {
    return this.vocabularies.find((item) => item.id === id)
  }
  async putVocabulary(vocabulary: VocabularyRecord) {
    const index = this.vocabularies.findIndex((item) => item.id === vocabulary.id)
    if (index < 0) this.vocabularies.push(vocabulary)
    else this.vocabularies[index] = vocabulary
  }
  async deleteVocabulary(id: string) {
    this.vocabularies = this.vocabularies.filter((item) => item.id !== id)
    this.logs = this.logs.filter((item) => item.vocabularyId !== id)
    for (const session of this.sessions.values()) {
      session.cardIds = session.cardIds.filter((cardId) => cardId !== id)
      session.answeredCardIds = session.answeredCardIds.filter((cardId) => cardId !== id)
    }
  }
  async getSession(localDate: string) {
    return this.sessions.get(localDate)
  }
  async putSession(session: ReviewSession) {
    this.sessions.set(session.localDate, session)
  }
  async putReviewLog(log: ReviewLog) {
    if (!this.logs.some((item) => item.id === log.id)) this.logs.push(log)
  }
  async gradeVocabulary(
    vocabulary: VocabularyRecord,
    session: ReviewSession,
    log: ReviewLog
  ) {
    const persistedSession = this.sessions.get(session.localDate)
    if (persistedSession?.answeredCardIds.includes(vocabulary.id)) {
      throw new Error('这张词卡已经完成评分。')
    }
    await this.putVocabulary(vocabulary)
    await this.putSession(session)
    await this.putReviewLog(log)
  }
  async getSettings() {
    return this.settings
  }
  async saveSettings(settings: Settings) {
    this.settings = settings
  }
  async getAiCache(key: string) {
    return this.cache.get(key)
  }
  async putAiCache(record: AiCacheRecord) {
    this.cache.set(record.key, record)
  }
  async clearAiCache() {
    this.cache.clear()
  }
  async exportBackup(): Promise<BackupV1> {
    return {
      schema: 'wordtap.backup.v1',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      appVersion: '0.1.0',
      data: {
        contents: structuredClone(this.contents),
        vocabularies: structuredClone(this.vocabularies),
        reviewLogs: structuredClone(this.logs),
        reviewSessions: structuredClone([...this.sessions.values()]),
        settings: {
          apiBaseUrl: this.settings.apiBaseUrl,
          model: this.settings.model,
          timeoutSeconds: this.settings.timeoutSeconds,
          readingPreferences: this.settings.readingPreferences
        }
      }
    }
  }
  async previewBackup(backup: BackupV1) {
    const existingContent = new Set(this.contents.map((item) => item.id))
    const existingVocab = new Set(this.vocabularies.map((item) => item.id))
    const existingLogs = new Set(this.logs.map((item) => item.id))
    const existingSessions = new Set(this.sessions.keys())
    return {
      contents: backup.data.contents.length,
      vocabularies: backup.data.vocabularies.length,
      reviewLogs: backup.data.reviewLogs.length,
      reviewSessions: backup.data.reviewSessions.length,
      conflicts:
        backup.data.contents.filter((item) => existingContent.has(item.id)).length +
        backup.data.vocabularies.filter((item) => existingVocab.has(item.id)).length +
        backup.data.reviewLogs.filter((item) => existingLogs.has(item.id)).length +
        backup.data.reviewSessions.filter((item) => existingSessions.has(item.localDate)).length
    }
  }
  async importBackup(backup: BackupV1, mode: 'merge' | 'replace') {
    const preview = await this.previewBackup(backup)
    if (mode === 'replace') {
      this.contents = []
      this.vocabularies = []
      this.logs = []
      this.sessions.clear()
    }
    for (const content of backup.data.contents) {
      const existing = await this.getContent(content.id)
      if (!existing || existing.updatedAt < content.updatedAt) await this.updateContent(content)
    }
    for (const vocab of backup.data.vocabularies) {
      const existing = await this.getVocabulary(vocab.id)
      if (!existing || existing.updatedAt < vocab.updatedAt) await this.putVocabulary(vocab)
    }
    for (const log of backup.data.reviewLogs) await this.putReviewLog(log)
    for (const session of backup.data.reviewSessions) {
      const existing = await this.getSession(session.localDate)
      if (!existing) await this.putSession(session)
      else {
        await this.putSession({
          ...existing,
          cardIds: Array.from(new Set([...existing.cardIds, ...session.cardIds])),
          answeredCardIds: Array.from(
            new Set([...existing.answeredCardIds, ...session.answeredCardIds])
          ),
          ratings: { ...session.ratings, ...existing.ratings },
          updatedAt: new Date().toISOString()
        })
      }
    }
    const importedSettings: Settings = {
      ...this.settings,
      ...backup.data.settings,
      id: 'app',
      updatedAt: new Date().toISOString()
    }
    if (backup.data.settings.readingPreferences) {
      importedSettings.readingPreferences = mergeReadingPreferences(
        backup.data.settings.readingPreferences
      )
    } else {
      delete importedSettings.readingPreferences
    }
    this.settings = importedSettings
    return preview
  }
  async clearAll() {
    this.contents = []
    this.vocabularies = []
    this.logs = []
    this.sessions.clear()
    this.cache.clear()
    this.settings = defaultSettings()
  }
}

