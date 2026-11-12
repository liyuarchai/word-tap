import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import writeExcelFile from 'write-excel-file/node'
import { demoSrt } from './fixtures'

async function reset(page: import('@playwright/test').Page, mock = false) {
  const target = mock ? '/library?mock=1' : '/library'
  await page.goto(target)
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('wordtap')
      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
      request.onblocked = () => resolve()
    })
  })
  await page.goto(target)
}

async function importDemo(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByLabel('粘贴英文内容').fill(demoSrt)
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page).toHaveURL(/\/reader\//)
}

test('@smoke routes, navigation and unknown content render', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/library$/)
  await page.getByRole('link', { name: '生词本' }).first().click()
  await expect(page).toHaveURL(/\/notebook$/)
  await page.getByRole('link', { name: '今日复习' }).first().click()
  await expect(page).toHaveURL(/\/review$/)
  await page.getByRole('link', { name: '设置' }).first().click()
  await expect(page).toHaveURL(/\/settings$/)
  await page.goto('/reader/missing')
  await expect(page.getByText('内容没有找到。')).toBeVisible()
})

test('@visual responsive app has no horizontal overflow and word panel does not move text', async ({
  page
}) => {
  await reset(page)
  for (const viewport of [
    { width: 320, height: 800 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 600, height: 960 },
    { width: 820, height: 1180 },
    { width: 1024, height: 768 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 }
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/library')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflow).toBe(false)
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await importDemo(page)
  const column = page.locator('article').first()
  const before = await column.boundingBox()
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  await expect(page.getByRole('complementary', { name: '词卡详情' })).toBeVisible()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'test-results/desktop-reader-panel.png', fullPage: true })
  const after = await column.boundingBox()
  expect(after?.x).toBe(before?.x)
  expect(after?.width).toBe(before?.width)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('complementary', { name: '词卡详情' })).toBeHidden()
  const undersizedControls = await page
    .locator('button:not([class*="wordButton"]), a[href]')
    .evaluateAll((controls) =>
      controls
        .filter((element) => {
          const rect = element.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)
        })
        .map((element) => element.textContent?.trim())
    )
  expect(undersizedControls).toEqual([])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  const mobilePanel = page.getByRole('complementary', { name: '词卡详情' })
  await expect(mobilePanel).toBeVisible()
  await page.waitForTimeout(400)
  const panelBox = await mobilePanel.boundingBox()
  expect(panelBox?.height).toBeLessThanOrEqual(844 * 0.62)
  await page.screenshot({ path: 'test-results/mobile-reader-panel.png', fullPage: true })
  await page.keyboard.press('Escape')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter((item) => item.impact === 'critical')).toHaveLength(0)
})

test('@mock import, collect three words, edit, review and export Obsidian', async ({ page }) => {
  await reset(page, true)
  await importDemo(page)
  for (const word of ['resilient', 'grasp', 'binge-watched']) {
    await page.getByRole('button', { name: word, exact: true }).click()
    await expect(page.getByRole('complementary', { name: '词卡详情' })).toBeVisible()
    await page.getByRole('button', { name: '加入生词本' }).click()
    await expect(page.getByRole('button', { name: '已在生词本 · 查看' })).toBeVisible()
    await page.keyboard.press('Escape')
  }
  await page.goto('/notebook')
  await expect(page.getByText('resilient', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /resilient/ }).first().click()
  const note = page.getByLabel('备注')
  await note.fill('注意与 resistant 区分')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.goto('/review')
  await expect(page.getByText('3', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: '开始复习' }).click()
  await expect(page.getByRole('button', { name: '显示答案' })).toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: /认识/ })).toBeVisible()
  await page.keyboard.press('3')
  await expect(page.getByText(/第 2 张 \/ 共 3 张/)).toBeVisible()
  await page.reload()
  await expect(page.getByText(/第 2 张 \/ 共 3 张/)).toBeVisible()
  for (let index = 0; index < 2; index += 1) {
    await page.getByRole('button', { name: '显示答案' }).click()
    await page.getByRole('button', { name: /认识/ }).click()
  }
  await expect(page.getByText('今天做完了。')).toBeVisible()
  await page.goto('/settings')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出', exact: true }).first().click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^Word-Tap-\d{4}-\d{2}-\d{2}\.md$/)

  const jsonDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出', exact: true }).nth(1).click()
  const jsonDownload = await jsonDownloadPromise
  const jsonPath = await jsonDownload.path()
  expect(jsonPath).toBeTruthy()
  const backupText = await readFile(jsonPath!, 'utf8')
  expect(JSON.parse(backupText)).toMatchObject({
    schema: 'wordtap.backup.v1',
    schemaVersion: 1
  })
  expect(backupText).not.toContain('"apiKey"')

  await page
    .locator('input[type="file"][accept*="json"]')
    .setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backupText) })
  await expect(page.getByRole('heading', { name: '导入备份' })).toBeVisible()
  await page.getByRole('button', { name: '合并导入' }).click()
  await expect(page.getByText('备份已合并').last()).toBeVisible()

  await page.goto('/library')
  await page.getByRole('button', { name: '重命名本篇' }).click()
  await page.getByLabel('标题').fill('Renamed demo')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByText('Renamed demo')).toBeVisible()
  await page.getByRole('button', { name: '删除本篇' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '删除', exact: true }).click()
  await expect(page.getByText('还没有内容。')).toBeVisible()
  await page.goto('/notebook')
  await expect(page.getByText('resilient', { exact: true })).toBeVisible()

  await page.goto('/library')
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByRole('tab', { name: '文件' }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: 'vocabulary.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('word,meaning\nresilient,有韧性的')
  })
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page.getByRole('button', { name: 'resilient', exact: true })).toBeVisible()

  await page.getByRole('button', { name: '返回内容库' }).click()
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByRole('tab', { name: '文件' }).click()
  await page.locator('input[type="file"]').setInputFiles(
    resolve('node_modules/mammoth/test/test-data/single-paragraph.docx')
  )
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page.getByText('Walking on imported air')).toBeVisible()

  const workbook = await writeExcelFile([
    ['Word', 'Meaning'],
    ['resilient', '有韧性的']
  ]).toBuffer()
  await page.getByRole('button', { name: '返回内容库' }).click()
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByRole('tab', { name: '文件' }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: 'vocabulary.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: workbook
  })
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page.getByText('resilient · 有韧性的')).toBeVisible()
})

test('@api sends real request shape and falls back on errors', async ({ page }) => {
  await reset(page)
  await page.goto('/settings')
  await page.getByRole('button', { name: '配置' }).click()
  await page.getByPlaceholder('粘贴 API Key').fill('test-key')
  await page.getByLabel('接口地址').fill('https://api.example.com/v1')
  await page.getByRole('button', { name: '保存设置' }).click()

  let requestBody: Record<string, unknown> | null = null
  let requestCount = 0
  await page.route('https://api.example.com/v1/chat/completions', async (route) => {
    requestCount += 1
    requestBody = route.request().postDataJSON() as Record<string, unknown>
    const isAnalysis = JSON.stringify(requestBody).includes('句法老师')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify(
                isAnalysis
                  ? {
                      mainClause: 'The team stayed resilient',
                      logic: 'through 表示经历的时间范围',
                      phrases: 'stay resilient',
                      hardPoints: 'resilient 的语境义',
                      naturalZh: '这个团队始终坚持着。'
                    }
                  : {
                      contextMeaning: '在困难后仍能恢复的',
                      clue: 'stay resilient',
                      example: 'She stayed resilient.',
                      exampleZh: '她仍然坚强。'
                    }
              )
            }
          }
        ]
      })
    })
  })
  await page.goto('/library')
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByLabel('粘贴英文内容').fill(demoSrt)
  await page.getByRole('button', { name: '开始阅读' }).click()
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  await expect(page.getByText('在困难后仍能恢复的')).toBeVisible()
  expect(requestBody).toMatchObject({ model: 'gpt-4o-mini', stream: false, temperature: 0.2 })
  expect(requestCount).toBe(1)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  await expect(page.getByText('在困难后仍能恢复的')).toBeVisible()
  expect(requestCount).toBe(1)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '深入分析' }).first().click()
  await expect(page.getByText(/主干：/)).toBeVisible()

  await page.unroute('https://api.example.com/v1/chat/completions')
  await page.route('https://api.example.com/v1/chat/completions', (route) =>
    route.fulfill({ status: 429, body: '' })
  )
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'grasp', exact: true }).click()
  await expect(page.getByText(/请求过于频繁/)).toBeVisible()
  await expect(page.getByText('本地词典', { exact: true }).last()).toBeVisible()
})

