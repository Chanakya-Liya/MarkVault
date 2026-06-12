import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { applyThemeVars } from '../hooks/useTheme'
import styles from './ThemePicker.module.css'

const COLOR_FIELDS = [
  { key: '--bg',           label: 'Background'   },
  { key: '--surface',      label: 'Surface'       },
  { key: '--surface2',     label: 'Surface Alt'   },
  { key: '--border',       label: 'Border'        },
  { key: '--text',         label: 'Text'          },
  { key: '--text-muted',   label: 'Muted Text'    },
  { key: '--accent',       label: 'Accent'        },
  { key: '--accent-hover', label: 'Accent Hover'  },
]

const isHex = v => /^#[0-9a-fA-F]{6}$/.test(v)

function mkId() {
  return 'custom_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

function ThemeCard({ theme, active, onSelect, onDelete }) {
  const v = theme.vars
  return (
    <button
      className={`${styles.themeCard} ${active ? styles.themeCardActive : ''}`}
      onClick={() => onSelect(theme.id)}
      title={theme.name}
    >
      <div className={styles.preview} style={{ background: v['--bg'] }}>
        <div className={styles.previewSurface}
          style={{ background: v['--surface'], borderColor: v['--border'] }}>
          <div className={styles.previewLine} style={{ background: v['--text'] }} />
          <div className={styles.previewLine}
            style={{ background: v['--text-muted'], width: '55%' }} />
          <div className={styles.previewAccent} style={{ background: v['--accent'] }} />
        </div>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardName}>{theme.name}</span>
        {active && <span className={styles.checkmark}>✓</span>}
        {!theme.builtin && !active && (
          <button
            className={styles.deleteBtn}
            onClick={e => { e.stopPropagation(); onDelete(theme.id) }}
            title="Delete theme"
          >✕</button>
        )}
      </div>
    </button>
  )
}

export default function ThemePicker({ themeId, allThemes, onSetTheme, onAddTheme, onDeleteTheme }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [creatorOpen, setCreatorOpen] = useState(false)
  const [draft, setDraft] = useState(null)
  const [nameError, setNameError] = useState('')

  const btnRef = useRef()
  const dropdownRef = useRef()
  const creatorRef = useRef()
  const closeTimerRef = useRef()
  const prevThemeRef = useRef(themeId)

  const cancelClose = () => clearTimeout(closeTimerRef.current)
  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setDropdownOpen(false), 220)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!dropdownOpen && !creatorOpen) return
    const handler = (e) => {
      const inBtn      = btnRef.current?.contains(e.target)
      const inDropdown = dropdownRef.current?.contains(e.target)
      const inCreator  = creatorRef.current?.contains(e.target)
      if (!inBtn && !inDropdown && !inCreator) {
        setDropdownOpen(false)
        if (creatorOpen) {
          // cancel: restore previous theme
          onSetTheme(prevThemeRef.current)
          setCreatorOpen(false)
          setDraft(null)
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen, creatorOpen, onSetTheme])

  const openDropdown = () => {
    if (creatorOpen) return
    cancelClose()
    setDropdownOpen(true)
  }

  const openCreator = () => {
    prevThemeRef.current = themeId
    const current = allThemes.find(t => t.id === themeId) || allThemes[0]
    setDraft({ id: mkId(), name: '', dark: current.dark, vars: { ...current.vars }, custom: true })
    setNameError('')
    setDropdownOpen(false)
    setCreatorOpen(true)
  }

  const cancelCreator = useCallback(() => {
    onSetTheme(prevThemeRef.current)
    setCreatorOpen(false)
    setDraft(null)
  }, [onSetTheme])

  const handleDraftColor = useCallback((key, value) => {
    setDraft(prev => {
      const next = { ...prev, vars: { ...prev.vars, [key]: value } }
      applyThemeVars(next)
      return next
    })
  }, [])

  const handleHexInput = useCallback((key, raw) => {
    setDraft(prev => {
      const next = { ...prev, vars: { ...prev.vars, [key]: raw } }
      if (isHex(raw)) applyThemeVars(next)
      return next
    })
  }, [])

  const handleDarkToggle = useCallback((dark) => {
    setDraft(prev => {
      const next = { ...prev, dark }
      applyThemeVars(next)
      return next
    })
  }, [])

  const saveTheme = () => {
    if (!draft.name.trim()) { setNameError('Please enter a name'); return }
    onAddTheme({ ...draft, name: draft.name.trim() })
    setCreatorOpen(false)
    setDraft(null)
  }

  return (
    <>
      {/* Palette button */}
      <div
        ref={btnRef}
        className={styles.btnWrap}
        onMouseEnter={openDropdown}
        onMouseLeave={scheduleClose}
      >
        <button
          className={`${styles.btn} ${(dropdownOpen || creatorOpen) ? styles.btnActive : ''}`}
          aria-label="Pick theme"
          title="Pick theme"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3a9 9 0 1 0 9 9 1 1 0 0 0-1-1h-1.56A6 6 0 1 1 12 6V5a1 1 0 0 0-1-1 9.01 9.01 0 0 0-9 9 9 9 0 0 0 9 9 10 10 0 0 0 10-10 1 1 0 0 0-1-1A8 8 0 0 1 12 3z" opacity="0"/>
            <circle cx="7.5" cy="14.5" r="1.5"/>
            <circle cx="9.5" cy="9.5" r="1.5"/>
            <circle cx="14.5" cy="7.5" r="1.5"/>
            <circle cx="17.5" cy="12" r="1.5"/>
            <path d="M21.54 11A10 10 0 1 0 13 21.54V20a1 1 0 0 0-1-1 8 8 0 1 1 8-8 1 1 0 0 0 1 1h1.54a10 10 0 0 0-.54-1z" opacity="0"/>
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
          </svg>
        </button>
      </div>

      {/* Dropdown portal */}
      {dropdownOpen && createPortal(
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className={styles.dropdownHeader}>Themes</div>
          <div className={styles.themeGrid}>
            {allThemes.map(t => (
              <ThemeCard
                key={t.id}
                theme={t}
                active={t.id === themeId}
                onSelect={onSetTheme}
                onDelete={onDeleteTheme}
              />
            ))}
          </div>
          <div className={styles.dropdownFooter}>
            <button className={styles.newBtn} onClick={openCreator}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 1v10M1 6h10"/>
              </svg>
              New theme
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Creator portal */}
      {creatorOpen && draft && createPortal(
        <div ref={creatorRef} className={styles.creator}>
          <div className={styles.creatorHeader}>
            <span>Create Theme</span>
            <button className={styles.closeBtn} onClick={cancelCreator} aria-label="Cancel">✕</button>
          </div>

          <div className={styles.creatorBody}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Name</label>
              <input
                autoFocus
                type="text"
                className={`${styles.nameInput} ${nameError ? styles.nameInputErr : ''}`}
                value={draft.name}
                onChange={e => { setDraft(p => ({ ...p, name: e.target.value })); setNameError('') }}
                placeholder="My theme"
              />
              {nameError && <span className={styles.errMsg}>{nameError}</span>}
            </div>

            <label className={styles.darkToggle}>
              <input
                type="checkbox"
                checked={draft.dark}
                onChange={e => handleDarkToggle(e.target.checked)}
              />
              <span>Dark theme</span>
              <span className={styles.darkHint}>(adjusts shadows & syntax highlight)</span>
            </label>

            <div className={styles.colorSection}>
              {COLOR_FIELDS.map(({ key, label }) => (
                <div key={key} className={styles.colorRow}>
                  <span className={styles.colorLabel}>{label}</span>
                  <div className={styles.colorControls}>
                    <div className={styles.swatch} style={{ background: draft.vars[key] }}>
                      <input
                        type="color"
                        value={isHex(draft.vars[key]) ? draft.vars[key] : '#000000'}
                        onChange={e => handleDraftColor(key, e.target.value)}
                        className={styles.colorNative}
                        title={`Pick ${label}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={draft.vars[key]}
                      onChange={e => handleHexInput(key, e.target.value)}
                      className={`${styles.hexInput} ${!isHex(draft.vars[key]) ? styles.hexInputErr : ''}`}
                      maxLength={7}
                      spellCheck={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.creatorFooter}>
            <button className={styles.cancelBtn} onClick={cancelCreator}>Cancel</button>
            <button className={styles.saveBtn} onClick={saveTheme}>Save Theme</button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
