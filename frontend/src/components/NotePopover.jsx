import { useState, useEffect, useCallback } from 'react'
import styles from './NotePopover.module.css'

const COLORS = ['yellow', 'green', 'blue', 'pink']

export default function NotePopover({ position, selectedText, onSubmit, onClose }) {
  const [type, setType] = useState('note')   // 'note' | 'question' | 'term'
  const [color, setColor] = useState('yellow')
  const [text, setText] = useState('')
  const [definition, setDefinition] = useState('')
  const [pickMode, setPickMode] = useState(false)

  const selectColor = (c) => { setColor(c); if (type !== 'highlight') setType('note') }
  const selectQuestion = () => setType(prev => prev === 'question' ? 'note' : 'question')
  const selectDefine = () => setType(prev => prev === 'term' ? 'note' : 'term')
  const selectHighlight = () => setType(prev => prev === 'highlight' ? 'note' : 'highlight')

  // Capture document text selection during pick mode
  useEffect(() => {
    if (!pickMode) return
    const handleMouseUp = () => {
      setTimeout(() => {
        const sel = window.getSelection()
        const picked = sel?.toString().trim()
        if (picked) {
          setDefinition(picked)
          setPickMode(false)
          sel?.removeAllRanges()
        }
      }, 10)
    }
    const handleKey = (e) => { if (e.key === 'Escape') setPickMode(false) }
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKey)
    }
  }, [pickMode])

  const handleSubmit = useCallback(() => {
    if (type === 'note' && !text.trim()) return
    if (type === 'term' && !definition.trim()) return
    if (type === 'term') {
      onSubmit({ type: 'term', definition: definition.trim() })
    } else if (type === 'question') {
      onSubmit({ type: 'question', color: 'yellow', note_content: text })
    } else if (type === 'highlight') {
      onSubmit({ type: 'highlight', color, note_content: text })
    } else {
      onSubmit({ type: 'note', color, note_content: text })
    }
  }, [type, text, definition, color, onSubmit])

  const submitLabel = type === 'question' ? 'Flag' : type === 'term' ? 'Define' : type === 'highlight' ? 'Mark' : 'Save'
  const submitDisabled = (type === 'note' && !text.trim()) || (type === 'term' && !definition.trim())

  const popoverStyle = {
    top: position.y,
    left: position.x,
    transform: 'translateX(-50%)',
  }

  if (pickMode) {
    return (
      <div className={styles.pickIndicator}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: 'var(--accent)', flexShrink: 0 }}>
          <path d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2" strokeLinecap="round"/>
          <circle cx="6.5" cy="6.5" r="2.5"/>
        </svg>
        Select text in the document as definition
        <button className={styles.cancelPick} onClick={() => setPickMode(false)}>✕ Cancel</button>
      </div>
    )
  }

  return (
    <>
      <div className={styles.backdrop} onMouseDown={onClose} />

      <div className={styles.popover} style={popoverStyle} onClick={e => e.stopPropagation()}>
        <p className={styles.quote}>
          "{selectedText.length > 60 ? selectedText.slice(0, 60) + '…' : selectedText}"
        </p>

        {type === 'note' && (
          <textarea
            className={styles.textarea}
            placeholder="Add a note…"
            value={text}
            autoFocus
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit() }}
          />
        )}

        {type === 'term' && (
          <div className={styles.definitionRow}>
            <textarea
              className={styles.textarea}
              placeholder="Enter definition…"
              value={definition}
              autoFocus
              onChange={e => setDefinition(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit() }}
            />
            <button className={styles.pickBtn} onClick={() => setPickMode(true)}>
              Pick from document
            </button>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.colors}>
            {COLORS.map(c => (
              <button
                key={c}
                className={`${styles.colorChip} ${styles[c]} ${(type === 'note' || type === 'highlight') && color === c ? styles.selected : ''}`}
                onClick={() => selectColor(c)}
                aria-label={c}
              />
            ))}
            <div className={styles.divider} />
            <button
              className={`${styles.highlightChip} ${type === 'highlight' ? styles.highlightSelected : ''}`}
              onClick={selectHighlight}
              title="Mark as highlight"
            >
              <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor">
                <rect x="2" y="0.5" width="7" height="8" rx="1.5"/>
                <path d="M4 8.5h3l-1.5 2.5z"/>
              </svg>
            </button>
            <button
              className={`${styles.questionChip} ${type === 'question' ? styles.questionSelected : ''}`}
              onClick={selectQuestion}
              title="Flag as question"
            >?</button>
            <button
              className={`${styles.defineChip} ${type === 'term' ? styles.defineSelected : ''}`}
              onClick={selectDefine}
              title="Define term"
            >Aa</button>
          </div>
          <div className={styles.actions}>
            <button className={styles.cancel} onClick={onClose}>Cancel</button>
            <button
              className={`${styles.submit} ${type === 'question' ? styles.submitQuestion : ''} ${type === 'term' ? styles.submitTerm : ''} ${type === 'highlight' ? styles.submitHighlight : ''}`}
              onClick={handleSubmit}
              disabled={submitDisabled}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
