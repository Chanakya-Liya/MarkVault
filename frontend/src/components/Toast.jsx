import styles from './Toast.module.css'

export default function Toast({ toasts }) {
  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
          {t.type === 'success' && <span className={styles.icon}>✓</span>}
          {t.type === 'info' && <span className={styles.icon}>ℹ</span>}
          {t.type === 'error' && <span className={styles.icon}>✕</span>}
          {t.message}
        </div>
      ))}
    </div>
  )
}
