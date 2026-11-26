import { z } from 'zod'

export const segmentSchema = z.object({
  id: z.string().min(1),
  index: z.number().int().nonnegative(),
  text: z.string(),
  kind: z.enum([
    'subtitle',
    'paragraph',
    'h1',
    'h2',
    'h3',
    'quote',
    'list',
    'code'
  ]),
  startMs: z.number().nonnegative().optional(),
  endMs: z.number().nonnegative().optional()
})

export const contentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  format: z.enum([
    'TXT',
    'SRT',
    'MD',
    'DOCX',
    'XLSX',
    'CSV',
    'EPUB',
    'MOBI',
    'AZW3',
    'OCR'
  ]),
  rawText: z.string(),
  segments: z.array(segmentSchema),
  sourceName: z.string(),
  contentHash: z.string(),
  wordCount: z.number().int().nonnegative(),
  mode: z.enum(['subtitle', 'page']),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastOpenedAt: z.string()
})

export const wordExplanationSchema = z.object({
  contextMeaning: z.string().min(1),
  clue: z.string(),
  example: z.string(),
  exampleZh: z.string()
})

export const vocabularySchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  lemma: z.string().min(1),
  contextSentence: z.string(),
  contentId: z.string().nullable(),
  contentTitle: z.string(),
  segmentId: z.string(),
  segmentIndex: z.number().int().nonnegative(),
  startMs: z.number().nonnegative().optional(),
  sourceName: z.string(),
  localDefinition: z.string(),
  aiDefinition: wordExplanationSchema.optional(),
  userDefinition: z.string(),
  note: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  dueAt: z.string(),
  intervalDays: z.number().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  lastReviewedAt: z.string().optional(),
  lastRating: z.enum(['forgot', 'fuzzy', 'know']).optional()
})

export const reviewLogSchema = z.object({
  id: z.string().min(1),
  vocabularyId: z.string().min(1),
  reviewedAt: z.string(),
  rating: z.enum(['forgot', 'fuzzy', 'know']),
  previousIntervalDays: z.number().nonnegative(),
  nextDueAt: z.string(),
  localDate: z.string()
})

export const reviewSessionSchema = z.object({
  localDate: z.string(),
  cardIds: z.array(z.string()),
  answeredCardIds: z.array(z.string()),
  ratings: z.record(z.string(), z.enum(['forgot', 'fuzzy', 'know'])),
  startedAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional()
})

export const readingSessionSchema = z.object({
  id: z.string().min(1),
  startedAt: z.string(),
  endedAt: z.string(),
  effectiveSeconds: z.number().int().nonnegative(),
  contentId: z.string().min(1),
  contentTitle: z.string(),
  userId: z.string().min(1),
  localDate: z.string(),
  updatedAt: z.string()
})

export const readingPreferencesSchema = z.object({
  fontFamily: z.enum(['serif', 'sans']),
  fontSize: z.union([
    z.literal(16),
    z.literal(18),
    z.literal(20),
    z.literal(22),
    z.literal(24)
  ]),
  margin: z.enum(['small', 'medium', 'large']),
  lineHeight: z.enum(['tight', 'normal', 'loose']),
  firstLineIndent: z.boolean(),
  theme: z.enum(['paper', 'sepia', 'mint', 'night', 'blush']),
  brightness: z.enum(['dim', 'normal', 'bright'])
})

export const settingsSchema = z.object({
  id: z.literal('app'),
  apiBaseUrl: z.string().url(),
  apiKey: z.string(),
  model: z.string().min(1),
  timeoutSeconds: z.union([z.literal(5), z.literal(10), z.literal(20)]),
  readingPreferences: readingPreferencesSchema.optional(),
  updatedAt: z.string()
})

export const aiCacheSchema = z.object({
  key: z.string(),
  operation: z.enum(['word', 'translate', 'analysis']),
  payload: z.unknown(),
  createdAt: z.string()
})

export const backupSchema = z.object({
  schema: z.literal('wordtap.backup.v1'),
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  appVersion: z.string(),
  data: z.object({
    contents: z.array(contentSchema),
    vocabularies: z.array(vocabularySchema),
    reviewLogs: z.array(reviewLogSchema),
    reviewSessions: z.array(reviewSessionSchema),
    readingSessions: z.array(readingSessionSchema).optional(),
    settings: settingsSchema.omit({ id: true, apiKey: true, updatedAt: true })
  })
})

export const translationSchema = z.object({ translation: z.string().min(1) })
export const analysisSchema = z.object({
  mainClause: z.string(),
  logic: z.string(),
  phrases: z.string(),
  hardPoints: z.string(),
  naturalZh: z.string()
})

function firstText(value: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const candidate = value[key]
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    if (Array.isArray(candidate)) {
      const joined = candidate
        .filter((item): item is string => typeof item === 'string')
        .join('；')
        .trim()
      if (joined) return joined
    }
  }
  return ''
}

export const analysisResponseSchema = z
  .unknown()
  .transform((raw) => {
    const value =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {}
    return {
      mainClause: firstText(value, ['mainClause', 'main_clause', 'main', 'skeleton']),
      logic: firstText(value, ['logic', 'logicRelation', 'relationship', 'logic_relation']),
      phrases: firstText(value, ['phrases', 'keyPhrases', 'key_phrases', 'collocations']),
      hardPoints: firstText(value, ['hardPoints', 'hard_points', 'difficulties', 'difficulty']),
      naturalZh: firstText(value, [
        'naturalZh',
        'natural_zh',
        'translation',
        'naturalTranslation'
      ])
    }
  })
  .pipe(analysisSchema)
  .refine((value) => Object.values(value).some(Boolean), {
    message: 'AI 精析结果为空'
  })

