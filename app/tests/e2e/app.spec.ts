import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import writeExcelFile from 'write-excel-file/node'
import { demoSrt } from './fixtures'

const boundedContextSrt = `1
00:00:00,000 --> 00:00:06,000
A quiet morning opened the story.

2
00:00:06,000 --> 00:00:12,000
The team stayed resilient through a year nobody expected.

3
00:00:12,000 --> 00:00:18,000
I couldn't grasp why she left without a word.

4
00:00:18,000 --> 00:00:24,000
We binge-watched the whole season in one weekend.

5
00:00:24,000 --> 00:00:30,000
FAR-AWAY-SENTINEL belongs after the final target.
`

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

async function importDemo(
  page: import('@playwright/test').Page,
  content = demoSrt
) {
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByLabel('粘贴英文内容').fill(content)
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page).toHaveURL(/\/reader\//)
}

async function configureAi(page: import('@playwright/test').Page) {
  await page.goto('/settings')
  await page.getByRole('button', { name: '配置' }).click()
  await page.getByPlaceholder('粘贴 API Key').fill('test-key')
  await page.getByLabel('接口地址').fill('https://api.example.com/v1')
  await page.getByRole('button', { name: '保存设置' }).click()
}

async function aiCacheCount(page: import('@playwright/test').Page) {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open('wordtap')
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const database = open.result
          const transaction = database.transaction('aiCache', 'readonly')
          const request = transaction.objectStore('aiCache').count()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        }
      })
  )
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
  const chrome = page.locator('header').first()
  await page.waitForTimeout(3300)
  await expect.poll(() => chrome.evaluate((element) => getComputedStyle(element).opacity)).toBe('0')
  await page.getByRole('button', { name: '返回内容库' }).focus()
  await expect.poll(() => chrome.evaluate((element) => getComputedStyle(element).opacity)).toBe('1')
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
  const undersizedWordHits = await page
    .locator('button[class*="wordButton"]')
    .evaluateAll((buttons) =>
      buttons
        .filter((element) => {
          const rect = element.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) return false
          const pseudo = getComputedStyle(element, '::before')
          return parseFloat(pseudo.width) < 24 || parseFloat(pseudo.height) < 24
        })
        .map((element) => element.textContent?.trim())
    )
  expect(undersizedWordHits).toEqual([])
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('article').first()).toHaveCSS('font-size', '17px')
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  const mobilePanel = page.getByRole('complementary', { name: '词卡详情' })
  await expect(mobilePanel).toBeVisible()
  await page.waitForTimeout(400)
  const panelBox = await mobilePanel.boundingBox()
  expect(panelBox?.height).toBeLessThanOrEqual(844 * 0.62)
  await page.screenshot({ path: 'test-results/mobile-reader-panel.png', fullPage: true })
  await page.keyboard.press('Escape')
  const readerUrl = page.url()
  for (const route of [readerUrl, '/library', '/notebook', '/review', '/settings']) {
    await page.goto(route)
    const results = await new AxeBuilder({ page }).analyze()
    expect(
      results.violations.filter(
        (item) => item.impact === 'serious' || item.impact === 'critical'
      ),
      `${route} has serious or critical accessibility violations`
    ).toHaveLength(0)
  }
})

test('@visual OCR page becomes editable reading and reading preferences persist', async ({
  page
}) => {
  const remoteRequests: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST') remoteRequests.push(request.url())
  })
  await reset(page, true)
  await page.goto('/library?mock=1&ocrMock=success')
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByRole('tab', { name: '拍照/选择书页' }).click()
  await page.getByLabel('选择书页图片').setInputFiles({
    name: 'page.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zr8sAAAAASUVORK5CYII=',
      'base64'
    )
  })
  await page.getByRole('button', { name: '开始本地识别' }).click()
  await expect(page.getByText('识别完成，请核对标题和正文。')).toBeVisible()
  const body = page.getByLabel('OCR 识别正文')
  await body.fill(
    'The team stayed resilient through a difficult year.\n\nKeep reading every day.'
  )
  await page.getByLabel('OCR 标题').fill('Camera page')
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page).toHaveURL(/\/reader\//)
  const storedContents = await page.evaluate(
    () =>
      new Promise<unknown[]>((resolve, reject) => {
        const open = indexedDB.open('wordtap')
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const request = open.result
            .transaction('contents', 'readonly')
            .objectStore('contents')
            .getAll()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        }
      })
  )
  expect(storedContents).toEqual([
    expect.objectContaining({ format: 'OCR', title: 'Camera page' })
  ])
  expect(JSON.stringify(storedContents)).not.toContain('data:image')
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  await expect(page.getByRole('complementary', { name: '词卡详情' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '返回内容库' }).focus()
  await page.getByRole('button', { name: '阅读设置' }).click()
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    const settingsBox = await page.getByRole('dialog', { name: '阅读设置' }).boundingBox()
    expect(settingsBox?.width).toBeLessThanOrEqual(width)
    expect(settingsBox?.y ?? 844).toBeGreaterThan(0)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      )
    ).toBe(false)
  }
  const settingsAxe = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze()
  expect(
    settingsAxe.violations.filter(
      (item) => item.impact === 'serious' || item.impact === 'critical'
    )
  ).toHaveLength(0)
  await page.getByRole('button', { name: '24' }).click()
  await page.getByRole('button', { name: '主题 夜间' }).click()
  await page.getByRole('button', { name: '大' }).click()
  await page.getByRole('button', { name: '松' }).click()
  await page.keyboard.press('Escape')
  await page.reload()
  const reader = page.locator('[data-theme]')
  await expect(reader).toHaveAttribute('data-theme', 'night')
  await expect(reader).toHaveAttribute('data-margin', 'large')
  const readerArticle = page.locator('article').first()
  await expect(readerArticle).toHaveCSS('font-size', '24px')
  const beforePanel = await readerArticle.boundingBox()
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  await expect(page.getByRole('complementary', { name: '词卡详情' })).toBeVisible()
  const afterPanel = await readerArticle.boundingBox()
  expect(afterPanel?.x).toBe(beforePanel?.x)
  expect(afterPanel?.width).toBe(beforePanel?.width)
  await page.keyboard.press('Escape')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  expect(overflow).toBe(false)
  expect(remoteRequests).toEqual([])
})

test('@visual failed OCR keeps the local preview and creates no library content', async ({
  page
}) => {
  await reset(page, true)
  await page.goto('/library?mock=1&ocrMock=failed')
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByRole('tab', { name: '拍照/选择书页' }).click()
  await page.getByLabel('选择书页图片').setInputFiles({
    name: 'blank.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zr8sAAAAASUVORK5CYII=',
      'base64'
    )
  })
  await page.getByRole('button', { name: '开始本地识别' }).click()
  await expect(page.getByText('OCR 没有完成，请重试或改用粘贴文本。')).toBeVisible()
  await expect(page.getByAltText('待识别的书页预览')).toBeVisible()
  await expect(page.getByRole('button', { name: '开始阅读' })).toBeDisabled()
  await page.getByRole('button', { name: '关闭' }).click()
  await expect(page.getByText('还没有内容。')).toBeVisible()
})

test('@ocr-live Tesseract recognizes a generated English page without uploading it', async ({
  page,
  context
}) => {
  test.slow()
  await reset(page, true)
  const fixturePage = await context.newPage()
  await fixturePage.setViewportSize({ width: 1000, height: 360 })
  await fixturePage.setContent(`
    <style>
      body { margin: 0; background: white; color: #111; }
      main { padding: 64px 72px; font: 62px/1.35 Arial, sans-serif; }
    </style>
    <main>The team stayed resilient.<br>Keep reading every day.</main>
  `)
  const image = await fixturePage.screenshot({ type: 'png' })
  await fixturePage.close()

  await page.goto('/library?mock=1')
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByRole('tab', { name: '拍照/选择书页' }).click()
  await page.getByLabel('选择书页图片').setInputFiles({
    name: 'english-page.png',
    mimeType: 'image/png',
    buffer: image
  })
  await page.getByRole('button', { name: '开始本地识别' }).click()
  const result = page.getByLabel('OCR 识别正文')
  await expect(result).toBeVisible({ timeout: 60_000 })
  await expect(result).toHaveValue(/resilient/i)
  await expect(page.getByText(/平均置信度 \d+%/)).toBeVisible()
})

test('@ebook-live imports a public-domain MOBI sample when provided locally', async ({
  page
}) => {
  const sample =
    process.env.WORDTAP_LIVE_MOBI ??
    resolve('live-fixtures/pride-and-prejudice.mobi')
  test.skip(!existsSync(sample), 'Place a public-domain MOBI sample in live-fixtures.')
  test.slow()
  await reset(page)
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByRole('tab', { name: '文件' }).click()
  await page.getByLabel('选择导入文件').setInputFiles(sample!)
  await expect(page.getByLabel('电子书标题')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/已提取 \d+ 个章节/)).toBeVisible()
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page).toHaveURL(/\/reader\//)
  await expect(page.getByRole('button', { name: 'Project', exact: true }).first()).toBeVisible()
})

test('@ebook-live imports a public-domain EPUB sample when provided locally', async ({
  page
}) => {
  const sample =
    process.env.WORDTAP_LIVE_EPUB ?? resolve('live-fixtures/pride-and-prejudice.epub')
  test.skip(!existsSync(sample), 'Place a public-domain EPUB sample in live-fixtures.')
  test.slow()
  await reset(page)
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByRole('tab', { name: '文件' }).click()
  await page.getByLabel('选择导入文件').setInputFiles(sample)
  await expect(page.getByLabel('电子书标题')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/已提取 \d+ 个章节/)).toBeVisible()
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page).toHaveURL(/\/reader\//)
  await expect(page.getByRole('button', { name: 'Project', exact: true }).first()).toBeVisible()
})

test('@ebook-live imports a public-domain KF8/AZW3 sample when provided locally', async ({
  page
}) => {
  const sample =
    process.env.WORDTAP_LIVE_AZW3 ?? resolve('live-fixtures/pride-and-prejudice.azw3')
  test.skip(!existsSync(sample), 'Place a public-domain AZW3 sample in live-fixtures.')
  test.slow()
  await reset(page)
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByRole('tab', { name: '文件' }).click()
  await page.getByLabel('选择导入文件').setInputFiles(sample)
  await expect(page.getByLabel('电子书标题')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/已提取 \d+ 个章节/)).toBeVisible()
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page).toHaveURL(/\/reader\//)
  await expect(page.getByRole('button', { name: 'Project', exact: true }).first()).toBeVisible()
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
  await page.getByLabel('选择导入文件').setInputFiles({
    name: 'vocabulary.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('word,meaning\nresilient,有韧性的')
  })
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page.getByRole('button', { name: 'resilient', exact: true })).toBeVisible()

  await page.getByRole('button', { name: '返回内容库' }).click()
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByRole('tab', { name: '文件' }).click()
  await page.getByLabel('选择导入文件').setInputFiles(
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
  await page.getByLabel('选择导入文件').setInputFiles({
    name: 'vocabulary.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: workbook
  })
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page.getByText('resilient · 有韧性的')).toBeVisible()
})

test('@mock saved vocabulary can be opened from the reader', async ({ page }) => {
  await reset(page, true)
  await importDemo(page)
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  await page.getByRole('button', { name: '加入生词本' }).click()
  await page.getByRole('button', { name: '已在生词本 · 查看' }).click()
  await expect(page).toHaveURL(/\/notebook$/)
  const drawer = page.getByRole('complementary', { name: '词卡详情' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByLabel('备注')).toBeVisible()
  await drawer.getByRole('button', { name: '关闭' }).click()

  await page.goto('/notebook?card=missing-card')
  await expect(page.getByText('词卡不存在或已删除').last()).toBeVisible()
  await expect(page).toHaveURL(/\/notebook$/)
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
  const requestKinds: string[] = []
  await page.route('https://api.example.com/v1/chat/completions', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type,authorization'
        }
      })
      return
    }
    requestCount += 1
    requestBody = route.request().postDataJSON() as Record<string, unknown>
    const isAnalysis = JSON.stringify(requestBody).includes('句法老师')
    requestKinds.push(isAnalysis ? 'analysis' : 'word-or-translation')
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
  await importDemo(page, boundedContextSrt)
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  await expect(page.getByText('在困难后仍能恢复的')).toBeVisible()
  expect(requestBody).toMatchObject({ model: 'gpt-4o-mini', stream: false, temperature: 0.2 })
  const wordRequest = JSON.stringify(requestBody)
  expect(wordRequest).toContain('A quiet morning opened the story.')
  expect(wordRequest).toContain("I couldn't grasp why she left without a word.")
  expect(wordRequest).not.toContain('FAR-AWAY-SENTINEL')
  expect(wordRequest).not.toContain('00:00:12,000')
  expect(wordRequest).not.toContain('contentTitle')
  expect(wordRequest).not.toContain('rawText')
  expect(requestCount, requestKinds.join(',')).toBe(1)
  await expect.poll(() => aiCacheCount(page)).toBe(1)
  await expect(page.getByRole('button', { name: '停止生成' })).toHaveCount(0)
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
  await expect(
    page.getByRole('paragraph').filter({ hasText: '请求过于频繁' })
  ).toBeVisible()
  await expect(page.getByText('本地词典', { exact: true }).last()).toBeVisible()
})

test('@api discards late translation and analysis responses and reuses validated cache', async ({
  page
}) => {
  await reset(page)
  await page.goto('/settings')
  await page.getByRole('button', { name: '配置' }).click()
  await page.getByPlaceholder('粘贴 API Key').fill('test-key')
  await page.getByLabel('接口地址').fill('https://api.example.com/v1')
  await page.getByRole('button', { name: '保存设置' }).click()

  let translateCalls = 0
  let analysisCalls = 0
  await page.route('https://api.example.com/v1/chat/completions', async (route) => {
    const body = JSON.stringify(route.request().postDataJSON())
    if (body.includes('英译中')) {
      const call = ++translateCalls
      await new Promise((resolve) => setTimeout(resolve, call === 1 ? 700 : 50))
      const translation = call === 1 ? '旧译文' : '新译文'
      try {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [
              { message: { content: JSON.stringify({ translation }) } }
            ]
          })
        })
      } catch {
        // The first request is intentionally aborted by the second click.
      }
      return
    }
    if (body.includes('句法老师')) {
      const call = ++analysisCalls
      await new Promise((resolve) => setTimeout(resolve, call === 1 ? 700 : 50))
      const mainClause = call === 1 ? '旧主干' : '新主干'
      try {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    mainClause,
                    logic: '',
                    phrases: '',
                    hardPoints: '',
                    naturalZh: ''
                  })
                }
              }
            ]
          })
        })
      } catch {
        // The first request is intentionally aborted by the second click.
      }
      return
    }
    await route.fulfill({ status: 500, body: '' })
  })

  await page.goto('/library')
  await importDemo(page)
  await page.getByRole('button', { name: '翻译本句' }).first().click()
  await page.waitForTimeout(50)
  await page.getByRole('button', { name: '重新翻译' }).first().click()
  await expect(page.getByText('新译文')).toBeVisible()
  await page.waitForTimeout(800)
  await expect(page.getByText('旧译文')).toHaveCount(0)

  await page.reload()
  await page.getByRole('button', { name: '翻译本句' }).first().click()
  await expect(page.getByText('新译文')).toBeVisible()
  expect(translateCalls).toBe(2)

  await page.getByRole('button', { name: '深入分析' }).first().click()
  await page.waitForTimeout(50)
  await page.getByRole('button', { name: '深入分析' }).first().click()
  await expect(page.getByText(/主干：新主干/)).toBeVisible()
  await page.waitForTimeout(800)
  await expect(page.getByText(/主干：旧主干/)).toHaveCount(0)
  expect(analysisCalls).toBe(2)
})

test('@mock AI state machine keeps local reading and review available without a key', async ({
  page
}) => {
  await reset(page)
  await importDemo(page)
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  const panel = page.getByRole('complementary', { name: '词卡详情' })
  await expect(panel.getByRole('status')).toHaveCount(1)
  await expect(
    panel.getByRole('paragraph').filter({
      hasText: '未配置 API Key；本地词典仍可使用。'
    })
  ).toBeVisible()
  await expect(panel.getByRole('link', { name: '去配置' })).toBeVisible()
  await panel.getByRole('button', { name: '加入生词本' }).click()
  await page.goto('/review')
  await expect(page.getByText('张词卡今天到期')).toBeVisible()
})

test('@mock offline AI failure keeps local dictionary and collection available', async ({
  page,
  context
}) => {
  await reset(page)
  await configureAi(page)
  await page.goto('/library')
  await importDemo(page)
  await context.setOffline(true)
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  const panel = page.getByRole('complementary', { name: '词卡详情' })
  await expect(
    panel.getByRole('paragraph').filter({
      hasText: '当前网络不可用；本地词典、收藏和复习不受影响。'
    })
  ).toBeVisible()
  await expect(panel.getByRole('button', { name: '加入生词本' })).toBeVisible()
  await context.setOffline(false)
})

test('@api stop cancels waiting AI, writes no cache, retries, and then serves cache', async ({
  page
}) => {
  await reset(page)
  await configureAi(page)

  let requestCount = 0
  let notifyStarted!: () => void
  const firstRequestStarted = new Promise<void>((resolve) => {
    notifyStarted = resolve
  })
  let releaseFirst!: () => void
  const firstRequestGate = new Promise<void>((resolve) => {
    releaseFirst = resolve
  })

  await page.route('https://api.example.com/v1/chat/completions', async (route) => {
    requestCount += 1
    if (requestCount === 1) {
      notifyStarted()
      await firstRequestGate
    }
    try {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  contextMeaning: '在困难后仍能恢复的',
                  clue: 'stay resilient',
                  example: 'She stayed resilient.',
                  exampleZh: '她仍然坚强。'
                })
              }
            }
          ]
        })
      })
    } catch {
      // The first request is intentionally aborted by the stop button.
    }
  })

  await page.goto('/library')
  await importDemo(page)
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  await firstRequestStarted
  const panel = page.getByRole('complementary', { name: '词卡详情' })
  await expect(panel.getByRole('button', { name: '停止生成' })).toBeVisible()
  const saveButton = panel.getByRole('button', { name: '加入生词本' })
  const waitingTop = (await saveButton.boundingBox())?.y

  await panel.getByRole('button', { name: '停止生成' }).click()
  await expect(
    panel.getByRole('paragraph').filter({
      hasText: '已停止生成；本地释义已保留。'
    })
  ).toBeVisible()
  await expect(panel.getByRole('button', { name: '停止生成' })).toHaveCount(0)
  releaseFirst()
  await expect.poll(() => aiCacheCount(page)).toBe(0)

  await panel.getByRole('button', { name: '重新生成' }).click()
  await expect(panel.getByText('在困难后仍能恢复的')).toBeVisible()
  await expect.poll(() => aiCacheCount(page)).toBe(1)
  const completedTop = (await saveButton.boundingBox())?.y
  expect(Math.abs((completedTop ?? 0) - (waitingTop ?? 0))).toBeLessThanOrEqual(8)

  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  await expect(panel.getByText('语境 · 已缓存')).toBeVisible()
  expect(requestCount).toBe(2)
})

test('@api distinguishes 5xx and invalid AI responses while preserving local content', async ({
  page
}) => {
  await reset(page)
  await configureAi(page)

  let serverCalls = 0
  await page.route('https://api.example.com/v1/chat/completions', async (route) => {
    const body = JSON.stringify(route.request().postDataJSON())
    if (body.includes('单词：grasp')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { content: 'not-json' } }]
        })
      })
      return
    }
    serverCalls += 1
    await route.fulfill({ status: 503, body: '' })
  })

  await page.goto('/library')
  await importDemo(page)
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  const panel = page.getByRole('complementary', { name: '词卡详情' })
  await expect(
    panel.getByRole('paragraph').filter({ hasText: 'AI 服务暂时不可用。' })
  ).toBeVisible()
  expect(serverCalls).toBe(2)
  await expect(panel.getByRole('button', { name: '重试' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'grasp', exact: true }).click()
  await expect(
    panel.getByRole('paragraph').filter({
      hasText: 'AI 返回内容为空或无法校验。'
    })
  ).toBeVisible()
  await expect(panel.getByRole('button', { name: '加入生词本' })).toBeVisible()
})

test('@api stop during validated progressive reveal clears output and skips cache', async ({
  page
}) => {
  await reset(page)
  await configureAi(page)
  let requestCount = 0
  await page.route('https://api.example.com/v1/chat/completions', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type,authorization'
        }
      })
      return
    }
    requestCount += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                contextMeaning: '在困难后仍能恢复的',
                clue: 'stay resilient',
                example: 'She stayed resilient.',
                exampleZh: '她仍然坚强。'
              })
            }
          }
        ]
      })
    })
  })

  await page.goto('/library')
  await importDemo(page)
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  const panel = page.getByRole('complementary', { name: '词卡详情' })
  await expect(
    panel.getByRole('paragraph').filter({
      hasText: '正在呈现已校验的语境解释…'
    })
  ).toBeVisible()
  const liveStatus = panel.getByRole('status')
  await expect(liveStatus).toHaveCount(1)
  const streamingAnnouncement = await liveStatus.textContent()
  await expect(panel.getByText('在困难后仍能恢复的')).toBeVisible()
  await expect(liveStatus).toHaveText(streamingAnnouncement ?? '')
  await panel.getByRole('button', { name: '停止生成' }).click()
  await expect(
    panel.getByRole('paragraph').filter({
      hasText: '已停止生成；本地释义已保留。'
    })
  ).toBeVisible()
  await expect.poll(() => aiCacheCount(page)).toBe(0)
  expect(requestCount).toBe(1)
})

