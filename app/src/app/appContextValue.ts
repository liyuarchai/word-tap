import { createContext } from 'react'
import type {
  AiClient,
  AppRepository,
  ContentRecord,
  Settings,
  VocabularyRecord
} from '../domain/types'

export interface AppContextValue {
  repository: AppRepository
  aiClient: AiClient
  contents: ContentRecord[]
  vocabulary: VocabularyRecord[]
  settings: Settings
  loading: boolean
  storageError: string
  aiEnabled: boolean
  refresh: () => Promise<void>
  saveSettings: (settings: Settings) => Promise<void>
  notify: (message: string) => void
  message: string
}

export const AppContext = createContext<AppContextValue | null>(null)

