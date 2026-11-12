import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import type {
  AiClient,
  AppRepository,
  ContentRecord,
  OcrClient,
  Settings,
  VocabularyRecord
} from '../domain/types'
import { DexieRepository, defaultSettings } from '../db/repository'
import { HttpAiClient } from '../services/ai'
import { loadDictionary } from '../services/dictionary'
import { TesseractOcrClient } from '../services/ocr'
import { AppContext, type AppContextValue } from './appContextValue'

export function AppProvider({
  children,
  repository: injectedRepository,
  aiClient: injectedAiClient,
  ocrClient: injectedOcrClient
}: {
  children: ReactNode
  repository?: AppRepository
  aiClient?: AiClient
  ocrClient?: OcrClient
}) {
  const repository = useMemo(
    () => injectedRepository ?? new DexieRepository(),
    [injectedRepository]
  )
  const initialSettings = useMemo(() => defaultSettings(), [])
  const [contents, setContents] = useState<ContentRecord[]>([])
  const [vocabulary, setVocabulary] = useState<VocabularyRecord[]>([])
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState('')
  const [message, setMessage] = useState('')
  const aiClient = useMemo<AiClient>(
    () => injectedAiClient ?? new HttpAiClient(settings),
    [injectedAiClient, settings]
  )
  const ocrClient = useMemo<OcrClient>(
    () => injectedOcrClient ?? new TesseractOcrClient(),
    [injectedOcrClient]
  )

  const notify = useCallback((nextMessage: string) => {
    setMessage(nextMessage)
    window.setTimeout(() => setMessage((current) => (current === nextMessage ? '' : current)), 2800)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [nextContents, nextVocabulary, nextSettings] = await Promise.all([
        repository.listContents(),
        repository.listVocabulary(),
        repository.getSettings()
      ])
      setContents(nextContents)
      setVocabulary(nextVocabulary)
      setSettings(nextSettings)
      setStorageError('')
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? `本地存储读写失败：${error.message}`
          : '本地存储读写失败，请先导出备份。'
      )
    } finally {
      setLoading(false)
    }
  }, [repository])

  useEffect(() => {
    // The repository is an external data source; loading it necessarily updates state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
    void loadDictionary().catch(() => undefined)
  }, [refresh])

  const saveSettings = useCallback(
    async (nextSettings: Settings) => {
      const withDate = { ...nextSettings, updatedAt: new Date().toISOString() }
      await repository.saveSettings(withDate)
      setSettings(withDate)
      notify('设置已保存')
    },
    [notify, repository]
  )

  const aiEnabled = Boolean(injectedAiClient) || Boolean(settings.apiKey.trim())
  const value = useMemo<AppContextValue>(
    () => ({
      repository,
      aiClient,
      ocrClient,
      contents,
      vocabulary,
      settings,
      loading,
      storageError,
      aiEnabled,
      refresh,
      saveSettings,
      notify,
      message
    }),
    [
      repository,
      aiClient,
      ocrClient,
      contents,
      vocabulary,
      settings,
      loading,
      storageError,
      aiEnabled,
      refresh,
      saveSettings,
      notify,
      message
    ]
  )

  return <AppContext value={value}>{children}</AppContext>
}

