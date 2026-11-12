import { expect, test } from '@playwright/test'
import { demoSrt } from './fixtures'

test('@api serves the offline app shell and local dictionary after first load', async ({
  page,
  context
}) => {
  const dictionaryResponse = page.waitForResponse((response) =>
    response.url().endsWith('/dictionary/dictionary.json')
  )
  await page.goto('/library')
  await dictionaryResponse
  await page.getByRole('button', { name: '导入内容' }).click()
  await page.getByLabel('粘贴英文内容').fill(demoSrt)
  await page.getByRole('button', { name: '开始阅读' }).click()
  await expect(page).toHaveURL(/\/reader\//)
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker?.ready
    return Boolean(registration?.active)
  })
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: 'resilient', exact: true }).click()
  await expect(page.getByText('本地词典', { exact: true }).last()).toBeVisible()
  await expect(page.getByText('正在查询本地词典…')).toBeHidden()
  await context.setOffline(false)
})

