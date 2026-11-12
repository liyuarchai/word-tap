import { Dialog } from '../../components/Dialog'
import type { ReadingPreferences } from '../../domain/types'
import styles from '../../styles/app.module.css'
import { READING_THEME_TOKENS } from './readingThemes'

const fontSizes = [16, 18, 20, 22, 24] as const

const themeLabels: Record<ReadingPreferences['theme'], string> = {
  paper: '纸白',
  sepia: '暖褐',
  mint: '薄荷',
  night: '夜间',
  blush: '浅粉'
}

export function ReadingPreferencesPanel({
  preferences,
  onChange,
  onClose
}: {
  preferences: ReadingPreferences
  onChange: (preferences: ReadingPreferences) => void
  onClose: () => void
}) {
  const update = <Key extends keyof ReadingPreferences>(
    key: Key,
    value: ReadingPreferences[Key]
  ) => onChange({ ...preferences, [key]: value })

  return (
    <Dialog title="阅读设置" onClose={onClose}>
      <div className={styles.readingSettingsPanel}>
        <fieldset className={styles.prefGroup}>
          <legend>字号</legend>
          <div className={styles.segmentedControl}>
            {fontSizes.map((size) => (
              <button
                key={size}
                className={`${styles.segmentChoice} ${
                  preferences.fontSize === size ? styles.segmentChoiceActive : ''
                }`}
                type="button"
                aria-pressed={preferences.fontSize === size}
                onClick={() => update('fontSize', size)}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.prefGroup}>
          <legend>边距</legend>
          <div className={styles.segmentedControl}>
            {([
              ['small', '小'],
              ['medium', '中'],
              ['large', '大']
            ] as const).map(([value, label]) => (
              <button
                key={value}
                className={`${styles.segmentChoice} ${
                  preferences.margin === value ? styles.segmentChoiceActive : ''
                }`}
                type="button"
                aria-pressed={preferences.margin === value}
                onClick={() => update('margin', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.prefGroup}>
          <legend>行距</legend>
          <div className={styles.segmentedControl}>
            {([
              ['tight', '紧'],
              ['normal', '标准'],
              ['loose', '松']
            ] as const).map(([value, label]) => (
              <button
                key={value}
                className={`${styles.segmentChoice} ${
                  preferences.lineHeight === value ? styles.segmentChoiceActive : ''
                }`}
                type="button"
                aria-pressed={preferences.lineHeight === value}
                onClick={() => update('lineHeight', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.prefGroup}>
          <legend>字体</legend>
          <div className={styles.segmentedControl}>
            {([
              ['serif', '衬线'],
              ['sans', '无衬线']
            ] as const).map(([value, label]) => (
              <button
                key={value}
                className={`${styles.segmentChoice} ${
                  preferences.fontFamily === value ? styles.segmentChoiceActive : ''
                }`}
                type="button"
                aria-pressed={preferences.fontFamily === value}
                onClick={() => update('fontFamily', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.prefGroup}>
          <legend>首行缩进</legend>
          <button
            className={`${styles.segmentChoice} ${
              preferences.firstLineIndent ? styles.segmentChoiceActive : ''
            }`}
            type="button"
            aria-pressed={preferences.firstLineIndent}
            onClick={() => update('firstLineIndent', !preferences.firstLineIndent)}
          >
            {preferences.firstLineIndent ? '已开启' : '已关闭'}
          </button>
        </fieldset>

        <fieldset className={styles.prefGroup}>
          <legend>亮度</legend>
          <div className={styles.segmentedControl}>
            {([
              ['dim', '柔和'],
              ['normal', '标准'],
              ['bright', '明亮']
            ] as const).map(([value, label]) => (
              <button
                key={value}
                className={`${styles.segmentChoice} ${
                  preferences.brightness === value ? styles.segmentChoiceActive : ''
                }`}
                type="button"
                aria-pressed={preferences.brightness === value}
                onClick={() => update('brightness', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.prefGroup}>
          <legend>颜色</legend>
          <div className={styles.themeChoices}>
            {(Object.keys(themeLabels) as ReadingPreferences['theme'][]).map((theme) => (
              <button
                key={theme}
                className={`${styles.themeChoice} ${
                  preferences.theme === theme ? styles.themeChoiceActive : ''
                }`}
                type="button"
                style={{ background: READING_THEME_TOKENS[theme].bg }}
                aria-label={`主题 ${themeLabels[theme]}`}
                aria-pressed={preferences.theme === theme}
                title={themeLabels[theme]}
                onClick={() => update('theme', theme)}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  )
}
