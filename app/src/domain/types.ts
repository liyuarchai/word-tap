export type ContentFormat = 'TXT' | 'SRT' | 'MD' | 'DOCX' | 'XLSX' | 'CSV'
export type ReadingMode = 'subtitle' | 'page'
export type Rating = 'forgot' | 'fuzzy' | 'know'
export type SegmentKind =
  | 'subtitle'
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'list'
  | 'code'

export interface Segment {
  id: string
  index: number
  text: string
  kind: SegmentKind
  startMs?: number
  endMs?: number
}

export interface ContentRecord {
  id: string
  title: string
  format: ContentFormat
  rawText: string
  segments: Segment[]
  sourceName: string
  contentHash: string
  wordCount: number
  mode: ReadingMode
  createdAt: string
  updatedAt: string
  lastOpenedAt: string
}

export interface WordExplanation {
  contextMeaning: string
  clue: string
  example: string
  exampleZh: string
}

export interface SentenceTranslation {
  translation: string
}

export interface SentenceAnalysis {
  mainClause: string
  logic: string
  phrases: string
  hardPoints: string
  naturalZh: string
}

export interface VocabularyRecord {
  id: string
  word: string
  lemma: string
  contextSentence: string
  contentId: string | null
  contentTitle: string
  segmentId: string
  segmentIndex: number
  startMs?: number
  sourceName: string
  localDefinition: string
  aiDefinition?: WordExplanation
  userDefinition: string
  note: string
  createdAt: string
  updatedAt: string
  dueAt: string
  intervalDays: number
  reviewCount: number
  lastReviewedAt?: string
  lastRating?: Rating
}

export interface ReviewLog {
  id: string
  vocabularyId: string
  reviewedAt: string
  rating: Rating
  previousIntervalDays: number
  nextDueAt: string
  localDate: string
}

export interface ReviewSession {
  localDate: string
  cardIds: string[]
  answeredCardIds: string[]
  ratings: Record<string, Rating>
  startedAt: string
  updatedAt: string
  completedAt?: string
}

export interface Settings {
  id: 'app'
  apiBaseUrl: string
  apiKey: string
  model: string
  timeoutSeconds: 5 | 10 | 20
  updatedAt: string
}

export interface AiCacheRecord {
  key: string
  operation: 'word' | 'translate' | 'analysis'
  payload: unknown
  createdAt: string
}

export interface DictionaryEntry {
  word: string
  lemma: string
  phonetic: string
  pos: string
  translation: string
  definition: string
  exchange: string
}

export interface DictionaryFile {
  meta: {
    source: string
    license: string
    sourceVersion: string
    generatedAt: string
    entryCount: number
    sourceHash: string
    outputHash: string
  }
  entries: Record<string, DictionaryEntry>
  forms: Record<string, string>
}

export interface ParsedContent {
  format: ContentFormat
  title: string
  segments: Segment[]
  wordCount: number
  warnings: string[]
}

export interface WordExplainInput {
  word: string
  lemma: string
  sentence: string
  contextBefore?: string
  contextAfter?: string
}

export interface SentenceInput {
  sentence: string
  contextBefore?: string
  contextAfter?: string
}

export type AiErrorCode =
  | 'missing-key'
  | 'auth'
  | 'offline'
  | 'network'
  | 'timeout'
  | 'rate-limit'
  | 'server'
  | 'invalid-response'

export class AiClientError extends Error {
  code: AiErrorCode

  constructor(code: AiErrorCode, message: string) {
    super(message)
    this.name = 'AiClientError'
    this.code = code
  }
}

export interface AiClient {
  explainWord(input: WordExplainInput, signal: AbortSignal): Promise<WordExplanation>
  translateSentence(input: SentenceInput, signal: AbortSignal): Promise<SentenceTranslation>
  analyzeSentence(input: SentenceInput, signal: AbortSignal): Promise<SentenceAnalysis>
  testConnection(signal: AbortSignal): Promise<void>
}

export interface BackupV1 {
  schema: 'wordtap.backup.v1'
  schemaVersion: 1
  exportedAt: string
  appVersion: string
  data: {
    contents: ContentRecord[]
    vocabularies: VocabularyRecord[]
    reviewLogs: ReviewLog[]
    reviewSessions: ReviewSession[]
    settings: Omit<Settings, 'id' | 'apiKey' | 'updatedAt'>
  }
}

export interface ImportPreview {
  contents: number
  vocabularies: number
  reviewLogs: number
  reviewSessions: number
  conflicts: number
}

export interface AppRepository {
  listContents(): Promise<ContentRecord[]>
  getContent(id: string): Promise<ContentRecord | undefined>
  addContent(content: ContentRecord): Promise<void>
  updateContent(content: ContentRecord): Promise<void>
  deleteContent(id: string): Promise<void>
  listVocabulary(): Promise<VocabularyRecord[]>
  getVocabulary(id: string): Promise<VocabularyRecord | undefined>
  putVocabulary(vocabulary: VocabularyRecord): Promise<void>
  deleteVocabulary(id: string): Promise<void>
  getSession(localDate: string): Promise<ReviewSession | undefined>
  putSession(session: ReviewSession): Promise<void>
  putReviewLog(log: ReviewLog): Promise<void>
  gradeVocabulary(
    vocabulary: VocabularyRecord,
    session: ReviewSession,
    log: ReviewLog
  ): Promise<void>
  getSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<void>
  getAiCache(key: string): Promise<AiCacheRecord | undefined>
  putAiCache(record: AiCacheRecord): Promise<void>
  clearAiCache(): Promise<void>
  exportBackup(): Promise<BackupV1>
  previewBackup(backup: BackupV1): Promise<ImportPreview>
  importBackup(backup: BackupV1, mode: 'merge' | 'replace'): Promise<ImportPreview>
  clearAll(): Promise<void>
}

