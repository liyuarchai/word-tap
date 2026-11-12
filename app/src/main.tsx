import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProvider } from './app/AppContext'
import { router } from './app/router'
import { MockAiClient } from './services/mockAi'
import './styles/tokens.css'
import './styles/global.css'

const mockAi = new URLSearchParams(window.location.search).get('mock') === '1'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider aiClient={mockAi ? new MockAiClient('success') : undefined}>
      <RouterProvider router={router} />
    </AppProvider>
  </StrictMode>
)

