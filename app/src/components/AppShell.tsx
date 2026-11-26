import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../app/useApp'
import { Icon, type IconName } from './Icon'
import styles from '../styles/app.module.css'

const items: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/library', label: '内容库', icon: 'library' },
  { to: '/notebook', label: '生词本', icon: 'notebook' },
  { to: '/review', label: '今日复习', icon: 'review' },
  { to: '/stats', label: '阅读统计', icon: 'stats' },
  { to: '/settings', label: '设置', icon: 'settings' }
]

export function AppShell() {
  const { storageError, message } = useApp()
  return (
    <div className={styles.appFrame}>
      <nav className={styles.rail} aria-label="主导航">
        <div className={styles.brandMark} aria-hidden="true">
          W
        </div>
        <div className={styles.railLinks}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.railLink} ${isActive ? styles.activeRail : ''}`
              }
              aria-label={item.label}
            >
              <Icon name={item.icon} />
              <span className={styles.railLabel}>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className={styles.contentArea}>
        {storageError ? (
          <div className={styles.storageError} role="alert">
            {storageError}
          </div>
        ) : null}
        <Outlet />
      </main>

      <nav className={styles.tabbar} aria-label="移动导航">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.tabLink} ${isActive ? styles.activeTab : ''}`
            }
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.srOnly} aria-live="polite">
        {message}
      </div>
      {message ? <div className={styles.toast}>{message}</div> : null}
    </div>
  )
}

