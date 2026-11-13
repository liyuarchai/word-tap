import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DesignSystemPage } from './DesignSystemPage'

describe('DesignSystemPage', () => {
  it('renders the complete portfolio design-system narrative', () => {
    render(<DesignSystemPage />)
    expect(screen.getByRole('heading', { level: 1, name: /阅读，不与噪声争夺注意力/ })).toBeVisible()
    for (const heading of [
      '颜色与字体',
      '选中词与上下文',
      '本地释义与 AI 释义',
      '阅读边注与降级矩阵',
      '按钮、输入与反馈',
      '桌面侧栏与移动边注'
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    }
    expect(screen.getAllByText('本地词典').length).toBeGreaterThan(0)
    expect(screen.getAllByText('AI 语境解释').length).toBeGreaterThan(0)
    expect(screen.getAllByText('已缓存').length).toBeGreaterThan(0)
    expect(screen.getByText('✓ 已保存')).toBeVisible()
    expect(screen.getByText('请求超时')).toBeVisible()
    expect(screen.getByText('响应结构非法')).toBeVisible()
    expect(screen.getByText('正在加载本地词典…')).toBeVisible()
    expect(screen.getByText('还没有内容。')).toBeVisible()
    expect(screen.queryByText(/apiKey/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^\s*\{.*\}\s*$/)).not.toBeInTheDocument()
  })

  it('keeps control examples keyboard accessible', async () => {
    const user = userEvent.setup()
    render(<DesignSystemPage />)
    await user.tab()
    expect(screen.getByRole('link', { name: '01 Foundations' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: '02 Reading marks' })).toHaveFocus()
  })
})
