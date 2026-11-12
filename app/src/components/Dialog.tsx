import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
import styles from '../styles/app.module.css'

export function Dialog({
  title,
  children,
  onClose,
  small = false
}: {
  title: string
  children: ReactNode
  onClose: () => void
  small?: boolean
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>('input, textarea, select, button')
        ?.focus()
    }, 0)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [onClose])

  return (
    <div
      className={styles.dialogBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${small ? styles.dialogSmall : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className={styles.dialogHead}>
          <h2 className={styles.dialogTitle} id="dialog-title">
            {title}
          </h2>
          <button className={styles.iconButton} type="button" onClick={onClose} aria-label="关闭">
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = '删除',
  danger = true,
  onCancel,
  onConfirm
}: {
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog title={title} onClose={onCancel} small>
      <p className={styles.emptyText}>{description}</p>
      <div className={styles.buttonRow} style={{ justifyContent: 'flex-end', marginTop: 24 }}>
        <button className={styles.textButton} type="button" onClick={onCancel}>
          取消
        </button>
        <button
          className={danger ? styles.dangerButton : styles.textButton}
          type="button"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}

