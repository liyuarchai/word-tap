import Dexie, { type EntityTable } from 'dexie'
import type {
  AiCacheRecord,
  ContentRecord,
  ReviewLog,
  ReviewSession,
  Settings,
  VocabularyRecord
} from '../domain/types'

export class WordTapDatabase extends Dexie {
  contents!: EntityTable<ContentRecord, 'id'>
  vocabularies!: EntityTable<VocabularyRecord, 'id'>
  reviewLogs!: EntityTable<ReviewLog, 'id'>
  reviewSessions!: EntityTable<ReviewSession, 'localDate'>
  settings!: EntityTable<Settings, 'id'>
  aiCache!: EntityTable<AiCacheRecord, 'key'>

  constructor(name = 'wordtap') {
    super(name)
    this.version(1).stores({
      contents: 'id, lastOpenedAt, contentHash, updatedAt',
      vocabularies: 'id, contentId, createdAt, dueAt, updatedAt',
      reviewLogs: 'id, vocabularyId, reviewedAt',
      reviewSessions: 'localDate, updatedAt',
      settings: 'id',
      aiCache: 'key, createdAt'
    })
  }
}

export const db = new WordTapDatabase()


