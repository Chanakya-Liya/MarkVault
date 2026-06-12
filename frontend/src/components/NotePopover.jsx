import { useState, useEffect, useRef } from 'react'
import styles from './NotePopover.module.css'

const COLORS = ['yellow', 'green', 'blue', 'pink']

export default function NotePopover({ position, selectedText, onSubmit, onClose }) {
  const [text, setText] = useState('')
  const [color, setColor] = useState('yellow')
  const textareaRef = useRef()
  const popoverRef = useRef()

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSubmit({ note_content: text.trim(), color })
  }

  // Clamp position to stay within viewport
  const style = {
    top: Math.min(position.y, window.innerHeight - 220),
    left: Math.min(Math.max(position.x - 150, 8), window.innerWidth - 310),
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={popoverRef} className={styles.popover} style={style}>
        <div className={styles.quote}>"{selectedText.length > 60 ? selectedText.slice(0, 60) + '…' : selectedText}"</div>
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a note…"
            rows={3}
          />
          <div className={styles.footer}>
            <div className={styles.colors}>
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorChip} ${styles[c]} ${color === c ? styles.selected : ''}`}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
              <button type="submit" className={styles.submit} disabled={!text.trim()}>Save</button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
