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
}) {
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
          </>
        )}
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
