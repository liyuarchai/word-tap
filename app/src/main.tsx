import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProvider } from './app/AppContext'
import { router } from './app/router'
import { MockAiClient } from './services/mockAi'
import { MockOcrClient, type MockOcrMode } from './services/mockOcr'
import './styles/tokens.css'
import './styles/global.css'

const mockAi = new URLSearchParams(window.location.search).get('mock') === '1'
const ocrMockMode = new URLSearchParams(window.location.search).get('ocrMock')
const mockOcrModes: MockOcrMode[] = ['success', 'partial', 'failed', 'loading']

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider
      aiClient={mockAi ? new MockAiClient('success') : undefined}
      ocrClient={
        mockOcrModes.includes(ocrMockMode as MockOcrMode)
          ? new MockOcrClient(ocrMockMode as MockOcrMode)
          : undefined
      }
    >
      <RouterProvider router={router} />
    </AppProvider>
  </StrictMode>
)

