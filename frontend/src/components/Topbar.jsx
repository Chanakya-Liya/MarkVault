import ThemePicker from './ThemePicker'
import styles from './Topbar.module.css'

function IconBtn({ label, onClick, active, children, badge }) {
  return (
    <button
      className={`${styles.iconBtn} ${active ? styles.active : ''}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
      {badge > 0 && <span className={styles.badge}>{badge > 99 ? '99+' : badge}</span>}
    </button>
  )
}

export default function Topbar({
  sidebarOpen, onToggleSidebar,
  activeFileName,
  splitView, onToggleSplitView,
  themeId, allThemes, onSetTheme, onAddTheme, onDeleteTheme,
  tocOpen, notesOpen, searchOpen,
  onToggleTOC, onToggleNotes, onToggleSearch,
  noteCount, hasFile,
  focusMode, onToggleFocus,
  readingLock, onToggleLock,
  dimMode, onToggleDim,
  jumpMode, onToggleJump,
}) {
  if (focusMode) {
    return (
      <header className={`${styles.topbar} ${styles.topbarHidden}`} aria-hidden="true" />
    )
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <IconBtn label="Toggle sidebar" onClick={onToggleSidebar}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect y="3" width="16" height="1.5" rx="0.75"/>
            <rect y="7.25" width="16" height="1.5" rx="0.75"/>
            <rect y="11.5" width="16" height="1.5" rx="0.75"/>
          </svg>
        </IconBtn>
      </div>

      <div className={styles.center}>
        <span className={styles.title}>
          {activeFileName || 'MarkVault'}
        </span>
      </div>

      <div className={styles.right}>
        {hasFile && (
          <>
            <IconBtn label="Search in file" onClick={onToggleSearch} active={searchOpen}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="6" cy="6" r="4.5"/>
                <path d="M10 10l3.5 3.5" strokeLinecap="round"/>
              </svg>
            </IconBtn>
            <IconBtn label="Table of contents" onClick={onToggleTOC} active={tocOpen}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
                <rect x="0" y="2" width="15" height="1.5" rx="0.75"/>
                <rect x="2" y="6" width="13" height="1.5" rx="0.75"/>
                <rect x="2" y="10" width="13" height="1.5" rx="0.75"/>
              </svg>
            </IconBtn>
            <IconBtn label="Notes" onClick={onToggleNotes} active={notesOpen} badge={noteCount}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M2 2h11v9H8l-4 3V11H2V2z" strokeLinejoin="round"/>
              </svg>
            </IconBtn>

            <div className={styles.sep} />

            <IconBtn label={dimMode ? 'Disable dim mode' : 'Dim read text'} onClick={onToggleDim} active={dimMode}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="1.5" y="2.5" width="12" height="10" rx="1.5"/>
                <line x1="7.5" y1="2.5" x2="7.5" y2="12.5" strokeWidth="1.3" strokeDasharray="2 1.5"/>
                <rect x="1.5" y="2.5" width="6" height="10" rx="1.5" fill="currentColor" fillOpacity="0.18" stroke="none"/>
              </svg>
            </IconBtn>
            <IconBtn label={jumpMode ? 'Disable paragraph jump' : 'Paragraph jump (Space)'} onClick={onToggleJump} active={jumpMode}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M2.5 4.5l4 3.5-4 3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.5 4.5l4 3.5-4 3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
              </svg>
            </IconBtn>
          </>
        )}

        <div className={styles.sep} />

        <IconBtn label={focusMode ? 'Exit focus mode' : 'Focus mode'} onClick={onToggleFocus} active={focusMode}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="7.5" cy="7.5" r="6"/>
            <circle cx="7.5" cy="7.5" r="2.3" fill="currentColor" stroke="none"/>
          </svg>
        </IconBtn>
        <IconBtn label={readingLock ? 'Disable reading lock' : 'Reading lock'} onClick={onToggleLock} active={readingLock}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="3" y="7" width="9" height="6.5" rx="1.5"/>
            <path d="M5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round"/>
          </svg>
        </IconBtn>

        <div className={styles.sep} />

        <IconBtn label={splitView ? 'Single view' : 'Split view'} onClick={onToggleSplitView} active={splitView}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
            <rect x="0" y="1" width="6.5" height="13" rx="1"/>
            <rect x="8.5" y="1" width="6.5" height="13" rx="1"/>
          </svg>
        </IconBtn>
        <ThemePicker
          themeId={themeId}
          allThemes={allThemes}
          onSetTheme={onSetTheme}
          onAddTheme={onAddTheme}
          onDeleteTheme={onDeleteTheme}
        />
      </div>
    </header>
  )
}
