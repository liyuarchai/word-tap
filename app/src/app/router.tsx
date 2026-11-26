import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { LibraryPage } from '../features/library/LibraryPage'
import { ReaderPage } from '../features/reader/ReaderPage'
import { NotebookPage } from '../features/vocabulary/NotebookPage'
import { ReviewHomePage, ReviewSessionPage } from '../features/review/ReviewPages'
import { SettingsPage } from '../features/settings/SettingsPage'
import { ReadingStatsPage } from '../features/stats/ReadingStatsPage'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/library" replace /> },
      { path: '/library', element: <LibraryPage /> },
      { path: '/notebook', element: <NotebookPage /> },
      { path: '/review', element: <ReviewHomePage /> },
      { path: '/stats', element: <ReadingStatsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      {
        path: '/design-system',
        lazy: async () => {
          const { DesignSystemPage } = await import(
            '../features/design-system/DesignSystemPage'
          )
          return { Component: DesignSystemPage }
        }
      }
    ]
  },
  { path: '/reader/:contentId', element: <ReaderPage /> },
  { path: '/review/card', element: <ReviewSessionPage /> },
  { path: '*', element: <Navigate to="/library" replace /> }
])

