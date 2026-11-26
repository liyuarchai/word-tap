import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProvider } from '../../app/AppContext'
import { MemoryRepository } from '../../db/memoryRepository'
import { localDateKey, startOfLocalDay } from '../../domain/review'
import type {
  ContentRecord,
  ReadingSessionRecord
} from '../../domain/types'
import { ReadingStatsPage } from './ReadingStatsPage'

function content(id: string, title: string): ContentRecord {
  return {
    id,
    title,
    format: 'TXT',
    rawText: 'Reading content.',
    segments: [{ id: `${id}-segment`, index: 0, text: 'Reading content.', kind: 'paragraph' }],
    sourceName: `${id}.txt`,
    contentHash: `${id}-hash`,
    wordCount: 2,
    mode: 'page',
    createdAt: '2026-11-23T00:00:00.000Z',
    updatedAt: '2026-11-23T00:00:00.000Z',
    lastOpenedAt: '2026-11-23T00:00:00.000Z'
  }
}

function session(
  id: string,
  contentId: string,
  contentTitle: string,
  localDate: string,
  startedAt: string,
  effectiveSeconds: number
): ReadingSessionRecord {
  return {
    id,
    contentId,
    contentTitle,
    localDate,
    startedAt,
    endedAt: new Date(new Date(startedAt).getTime() + effectiveSeconds * 1000).toISOString(),
    effectiveSeconds,
    userId: 'wordtap-local-reader',
    updatedAt: startedAt
  }
}

function renderStats(repository: MemoryRepository) {
  render(
    <MemoryRouter initialEntries={['/stats']}>
      <AppProvider repository={repository}>
        <ReadingStatsPage />
      </AppProvider>
    </MemoryRouter>
  )
}

describe('ReadingStatsPage', () => {
  it('shows a complete empty state with unavailable period navigation', async () => {
    renderStats(new MemoryRepository())
    expect(await screen.findByText('还没有阅读记录。')).toBeVisible()
    expect(screen.getByRole('button', { name: '上一周期' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '下一周期' })).toBeDisabled()
    expect(screen.queryByRole('group', { name: '阅读时长分布图' })).not.toBeInTheDocument()
  })

  it('uses the same totals for the overview and local content ranking', async () => {
    const user = userEvent.setup()
    const repository = new MemoryRepository()
    const today = startOfLocalDay()
    const mondayOffset = (today.getDay() + 6) % 7
    const monday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - mondayOffset
    )
    const mondayMorning = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate(),
      9
    )
    const tuesdayMorning = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + 1,
      10
    )
    const mondayKey = localDateKey(mondayMorning)
    const tuesdayKey = localDateKey(tuesdayMorning)
    repository.contents.push(
      content('content-a', 'A'),
      content('content-b', 'A much longer content title for the ranking')
    )
    repository.readingSessions.push(
      session(
        'a1',
        'content-a',
        'A',
        mondayKey,
        mondayMorning.toISOString(),
        600
      ),
      session(
        'a2',
        'content-a',
        'A',
        mondayKey,
        new Date(mondayMorning.getTime() + 11 * 60_000).toISOString(),
        300
      ),
      session(
        'b1',
        'content-b',
        'A much longer content title for the ranking',
        tuesdayKey,
        tuesdayMorning.toISOString(),
        600
      )
    )
    renderStats(repository)

    expect(await screen.findByRole('heading', { name: '25 分钟' })).toBeVisible()
    expect(screen.getByText(/比上一周期|上一周期暂无数据/)).toBeVisible()
    expect(screen.getByText('阅读会话').parentElement).toHaveTextContent('2')
    await user.click(screen.getByRole('button', { name: '时长排行' }))

    const ranking = screen.getByRole('list', { name: '阅读时长排行' })
    const rows = within(ranking).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('A')
    expect(rows[0]).toHaveTextContent('15分')
    expect(rows[1]).toHaveTextContent('A much longer content title')
    expect(screen.getByText(/仅按当前浏览器中的本地阅读会话结算/)).toBeVisible()
  })

  it('offers a retry state instead of leaving the page blank', async () => {
    class RetryRepository extends MemoryRepository {
      calls = 0

      override async listReadingSessions() {
        this.calls += 1
        if (this.calls === 1) throw new Error('temporary')
        return super.listReadingSessions()
      }
    }
    const user = userEvent.setup()
    renderStats(new RetryRepository())

    await waitFor(() =>
      expect(screen.getByText('阅读记录暂时没有载入。')).toBeVisible()
    )
    await user.click(screen.getByRole('button', { name: '重新载入' }))
    expect(await screen.findByText('还没有阅读记录。')).toBeVisible()
  })

  it('renders a large content ranking without dropping duration rows', async () => {
    const user = userEvent.setup()
    const repository = new MemoryRepository()
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    monday.setHours(9, 0, 0, 0)
    const day = localDateKey(monday)

    for (let index = 0; index < 60; index += 1) {
      const id = `content-${index}`
      const title = `Content ${index} with a deliberately long ranking title`
      repository.contents.push(content(id, title))
      repository.readingSessions.push(
        session(
          `session-${index}`,
          id,
          title,
          day,
          new Date(monday.getTime() + index * 60_000).toISOString(),
          60 + index
        )
      )
    }

    renderStats(repository)
    await screen.findByText('总阅读时长')
    await user.click(screen.getByRole('button', { name: '时长排行' }))
    const ranking = screen.getByRole('list', { name: '阅读时长排行' })
    expect(within(ranking).getAllByRole('listitem')).toHaveLength(60)
    expect(within(ranking).getAllByText(/次会话$/)).toHaveLength(60)
  })
})
