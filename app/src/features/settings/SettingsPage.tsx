import { useRef, useState } from 'react'
import { useApp } from '../../app/useApp'
import { ConfirmDialog, Dialog } from '../../components/Dialog'
import { backupSchema } from '../../domain/schemas'
import type { BackupV1, ImportPreview, Settings } from '../../domain/types'
import { withTimeout } from '../../services/ai'
import { downloadFile, todayFileStamp, vocabularyToMarkdown } from '../../services/export'
import styles from '../../styles/app.module.css'

export function SettingsPage() {
  const {
    settings,
    vocabulary,
    repository,
    refresh,
    saveSettings,
    aiClient,
    notify
  } = useApp()
  const [form, setForm] = useState<Settings>(settings)
  const [editingKey, setEditingKey] = useState(false)
  const [testStatus, setTestStatus] = useState('未测试')
  const [testing, setTesting] = useState(false)
  const [backup, setBackup] = useState<BackupV1 | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [replaceConfirm, setReplaceConfirm] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [error, setError] = useState('')
  const backupInput = useRef<HTMLInputElement>(null)

  const persistSettings = async (resetTestStatus: boolean) => {
    setError('')
    try {
      const normalized = {
        ...form,
        apiBaseUrl: form.apiBaseUrl.trim().replace(/\/+$/, ''),
        model: form.model.trim(),
        apiKey: form.apiKey.trim()
      }
      if (!/^https?:\/\//.test(normalized.apiBaseUrl)) {
        throw new Error('接口地址必须以 http:// 或 https:// 开头。')
      }
      if (!normalized.model) throw new Error('请填写模型名称。')
      await saveSettings(normalized)
      setEditingKey(false)
      if (resetTestStatus) setTestStatus('未测试')
      return true
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '设置保存失败。')
      return false
    }
  }

  const save = () => {
    void persistSettings(true)
  }

  const test = async () => {
    setTesting(true)
    setTestStatus('测试中…')
    try {
      if (!(await persistSettings(false))) {
        setTestStatus('未测试')
        return
      }
      await withTimeout(form.timeoutSeconds, (signal) => aiClient.testConnection(signal))
      setTestStatus('连接成功')
    } catch (caught) {
      setTestStatus(caught instanceof Error ? caught.message : '连接失败')
    } finally {
      setTesting(false)
    }
  }

  const exportMarkdown = () => {
    if (!vocabulary.length) {
      notify('没有可导出的生词')
      return
    }
    downloadFile(
      `Word-Tap-${todayFileStamp()}.md`,
      vocabularyToMarkdown(vocabulary),
      'text/markdown;charset=utf-8'
    )
    notify('Markdown 已导出')
  }

  const exportJson = async () => {
    const data = await repository.exportBackup()
    downloadFile(
      `Word-Tap-${todayFileStamp()}.json`,
      JSON.stringify(data, null, 2),
      'application/json;charset=utf-8'
    )
    notify('JSON 备份已导出')
  }

  const readBackup = async (file: File) => {
    setError('')
    try {
      const parsed = backupSchema.parse(JSON.parse(await file.text())) as BackupV1
      const result = await repository.previewBackup(parsed)
      setBackup(parsed)
      setPreview(result)
    } catch {
      setError('备份文件无效或已损坏，现有数据没有变化。')
    }
  }

  const importBackup = async (mode: 'merge' | 'replace') => {
    if (!backup) return
    try {
      await repository.importBackup(backup, mode)
      await refresh()
      setBackup(null)
      setPreview(null)
      setReplaceConfirm(false)
      notify(mode === 'merge' ? '备份已合并' : '本地数据已覆盖')
    } catch {
      setError('导入失败，现有数据没有变化。')
    }
  }

  const clearCache = async () => {
    await repository.clearAiCache()
    notify('AI 缓存已清除')
  }

  const clearAll = async () => {
    await repository.clearAll()
    await refresh()
    setClearConfirm(false)
    notify('全部本地数据已清除')
  }

  return (
    <div className={styles.narrowPage}>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>设置</h1>
        <button className={styles.textButton} type="button" onClick={() => void save()}>
          保存设置
        </button>
      </header>

      <section className={styles.settingsSection}>
        <h2 className={styles.settingsHead}>AI 配置</h2>
        <div className={styles.buttonRow} style={{ marginBottom: 16 }}>
          <button
            className={styles.textButton}
            type="button"
            onClick={() =>
              {
                setForm({
                  ...form,
                  apiBaseUrl: 'https://api.openai.com/v1',
                  model: 'gpt-4o-mini'
                })
                setTestStatus('未测试')
              }
            }
          >
            使用 OpenAI 预设
          </button>
          <button
            className={styles.textButton}
            type="button"
            onClick={() =>
              {
                setForm({
                  ...form,
                  apiBaseUrl: 'https://api.deepseek.com',
                  model: 'deepseek-flash'
                })
                setTestStatus('未测试')
              }
            }
          >
            使用 DeepSeek 预设
          </button>
        </div>
        <div className={styles.settingsRow}>
          <label className={styles.settingsLabel} htmlFor="apiBaseUrl">
            接口地址
          </label>
          <input
            id="apiBaseUrl"
            className={styles.input}
            type="url"
            value={form.apiBaseUrl}
            onChange={(event) => {
              setForm({ ...form, apiBaseUrl: event.target.value })
              setTestStatus('未测试')
            }}
          />
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>API Key</span>
          <div>
            {editingKey ? (
              <input
                className={styles.input}
                type="password"
                autoComplete="off"
                placeholder="粘贴 API Key"
                value={form.apiKey}
                onChange={(event) => {
                  setForm({ ...form, apiKey: event.target.value })
                  setTestStatus('未测试')
                }}
              />
            ) : (
              <span className={styles.maskedKey}>
                {form.apiKey
                  ? `${form.apiKey.slice(0, 3)}••••••••••••${form.apiKey.slice(-4)}`
                  : '未配置'}
              </span>
            )}
          </div>
          <button
            className={styles.textButton}
            type="button"
            onClick={() => {
              if (editingKey) setForm({ ...form, apiKey: '' })
              setEditingKey(!editingKey)
            }}
          >
            {editingKey ? '清除' : form.apiKey ? '更换' : '配置'}
          </button>
        </div>
        <div className={styles.settingsRow}>
          <label className={styles.settingsLabel} htmlFor="model">
            模型
          </label>
          <input
            id="model"
            className={styles.input}
            value={form.model}
            onChange={(event) => {
              setForm({ ...form, model: event.target.value })
              setTestStatus('未测试')
            }}
          />
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>超时</span>
          <div className={styles.timeoutOptions}>
            {([5, 10, 20] as const).map((seconds) => (
              <button
                key={seconds}
                className={`${styles.timeoutButton} ${
                  form.timeoutSeconds === seconds ? styles.activeTimeout : ''
                }`}
                type="button"
                aria-pressed={form.timeoutSeconds === seconds}
                onClick={() => {
                  setForm({ ...form, timeoutSeconds: seconds })
                  setTestStatus('未测试')
                }}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>
        <div className={styles.settingsRow}>
          <span />
          <span className={styles.settingsDescription}>
            API Key 只存储在当前浏览器，不会进入任何导出文件。共用设备时请注意访问风险。
          </span>
          <button
            className={styles.textButton}
            type="button"
            disabled={testing}
            onClick={() => void test()}
          >
            {testing ? '测试中…' : '测试连接'}
          </button>
        </div>
        <p className={styles.settingsDescription}>{testStatus}</p>
        <div className={styles.buttonRow} style={{ marginTop: 12 }}>
          <a
            className={styles.textButton}
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
          >
            获取 OpenAI API Key
          </a>
          <a
            className={styles.textButton}
            href="https://platform.openai.com/settings/organization/billing/overview"
            target="_blank"
            rel="noreferrer"
          >
            查看 API 计费
          </a>
          <a
            className={styles.textButton}
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noreferrer"
          >
            获取 DeepSeek API Key
          </a>
        </div>
        {error ? <p className={styles.fieldError}>{error}</p> : null}
      </section>

      <section className={styles.settingsSection}>
        <h2 className={styles.settingsHead}>数据</h2>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Obsidian Markdown</span>
          <span className={styles.settingsDescription}>导出全部生词，包含上下文和复习日期。</span>
          <button className={styles.textButton} type="button" onClick={exportMarkdown}>
            导出
          </button>
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>完整 JSON 备份</span>
          <span className={styles.settingsDescription}>包含内容、生词和复习记录，不含 API Key。</span>
          <button className={styles.textButton} type="button" onClick={() => void exportJson()}>
            导出
          </button>
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>恢复备份</span>
          <span className={styles.settingsDescription}>导入前会校验并展示数量及冲突。</span>
          <button
            className={styles.textButton}
            type="button"
            onClick={() => backupInput.current?.click()}
          >
            导入
          </button>
          <input
            ref={backupInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void readBackup(file)
              event.currentTarget.value = ''
            }}
          />
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>AI 缓存</span>
          <span className={styles.settingsDescription}>只影响后续请求速度，不删除生词。</span>
          <button className={styles.textButton} type="button" onClick={() => void clearCache()}>
            清除
          </button>
        </div>
      </section>

      <section className={styles.settingsSection}>
        <h2 className={styles.settingsHead}>危险区</h2>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>清除全部本地数据</span>
          <span className={styles.settingsDescription}>
            包含内容、生词、复习记录、设置和 API Key，建议先导出备份。
          </span>
          <button className={styles.dangerButton} type="button" onClick={() => setClearConfirm(true)}>
            清除
          </button>
        </div>
      </section>

      <section className={styles.settingsSection}>
        <h2 className={styles.settingsHead}>关于</h2>
        <p className={styles.settingsDescription}>Word Tap 0.1.0 · 本地优先</p>
        <p className={styles.settingsDescription}>
          本地词典来源：skywind3000/ECDICT · MIT · 30,000 高频词子集
        </p>
      </section>

      {backup && preview ? (
        <Dialog title="导入备份" onClose={() => setBackup(null)} small>
          <div className={styles.previewGrid}>
            <div className={styles.previewItem}>
              <span className={styles.sectionLabel}>内容</span>
              <div className={styles.previewValue}>{preview.contents}</div>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.sectionLabel}>生词</span>
              <div className={styles.previewValue}>{preview.vocabularies}</div>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.sectionLabel}>复习记录</span>
              <div className={styles.previewValue}>{preview.reviewLogs}</div>
            </div>
            <div className={styles.previewItem}>
              <span className={styles.sectionLabel}>冲突</span>
              <div className={styles.previewValue}>{preview.conflicts}</div>
            </div>
          </div>
          <p className={styles.settingsDescription}>
            合并会保留当前数据并按更新时间处理冲突；覆盖会替换本地业务数据，但保留当前 API Key。
          </p>
          <div className={styles.buttonRow} style={{ justifyContent: 'flex-end', marginTop: 22 }}>
            <button className={styles.textButton} type="button" onClick={() => setBackup(null)}>
              取消
            </button>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => void importBackup('merge')}
            >
              合并导入
            </button>
            <button className={styles.dangerButton} type="button" onClick={() => setReplaceConfirm(true)}>
              覆盖本地
            </button>
          </div>
        </Dialog>
      ) : null}

      {replaceConfirm ? (
        <ConfirmDialog
          title="确认覆盖"
          description="本地内容、生词和复习记录会被备份数据替换，API Key 会保留。"
          confirmLabel="覆盖本地"
          onCancel={() => setReplaceConfirm(false)}
          onConfirm={() => void importBackup('replace')}
        />
      ) : null}
      {clearConfirm ? (
        <ConfirmDialog
          title="清除全部本地数据"
          description="包含内容、生词、复习记录、设置和 API Key。建议先导出 JSON 备份。"
          confirmLabel="全部清除"
          onCancel={() => setClearConfirm(false)}
          onConfirm={() => void clearAll()}
        />
      ) : null}
    </div>
  )
}

