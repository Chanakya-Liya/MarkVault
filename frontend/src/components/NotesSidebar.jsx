import { useState, useRef, useEffect } from 'react'
import { formatRelativeDate } from '../utils/format'
import styles from './NotesSidebar.module.css'

export default function NotesSidebar({ notes, onEdit, onDelete, onHoverNote, onClickNote, pulseNoteId }) {
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const cardRefs = useRef({})

  useEffect(() => {
    if (pulseNoteId && cardRefs.current[pulseNoteId]) {
      const el = cardRefs.current[pulseNoteId]
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      el.classList.remove(styles.pulse)
      void el.offsetWidth
      el.classList.add(styles.pulse)
    }
  }, [pulseNoteId])

  const startEdit = (note) => {
    setEditingId(note.id)
    setEditText(note.note_content)
  }

  const commitEdit = (noteId) => {
    if (editText.trim()) onEdit(noteId, editText.trim())
    setEditingId(null)
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>Notes <span className={styles.count}>{notes.length}</span></div>

      {notes.length === 0 ? (
        <div className={styles.empty}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="6" y="6" width="28" height="28" rx="4" stroke="var(--border)" strokeWidth="2"/>
            <path d="M13 16h14M13 20h10M13 24h8" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p>Select text to add a note</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {notes.map(note => (
            <li
              key={note.id}
              ref={el => { cardRefs.current[note.id] = el }}
              className={`${styles.card} ${styles[`border-${note.color}`]}`}
              onMouseEnter={() => onHoverNote(note.id)}
              onMouseLeave={() => onHoverNote(null)}
              onClick={() => onClickNote(note.id)}
            >
              <p className={styles.quote}>
                "{note.selected_text.length > 80 ? note.selected_text.slice(0, 80) + '…' : note.selected_text}"
              </p>

              {editingId === note.id ? (
                <textarea
                  className={styles.editArea}
                  value={editText}
                  autoFocus
                  onChange={e => setEditText(e.target.value)}
                  onBlur={() => commitEdit(note.id)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(note.id) } if (e.key === 'Escape') setEditingId(null) }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <p className={styles.content} onClick={(e) => { e.stopPropagation(); startEdit(note) }}>
                  {note.note_content}
                </p>
              )}

              <div className={styles.footer}>
                <span className={styles.date}>{formatRelativeDate(note.created_at)}</span>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                  aria-label="Delete note"
                  title="Delete note"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M2 3h8M5 3V2h2v1M2.5 3l.5 7h5l.5-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
