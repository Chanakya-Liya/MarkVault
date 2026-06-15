import { useRef, useEffect, useState } from 'react'
import { formatRelativeDate } from '../utils/format'
import styles from './NotesSidebar.module.css'

function NoteCard({ note, editingId, editText, onStartEdit, onCommitEdit, onEditTextChange, onCancelEdit, onDelete, onHover, onClick, cardRefs }) {
  const isEditing = editingId === note.id

  return (
    <li
      ref={el => { cardRefs.current[note.id] = el }}
      className={`${styles.card} ${note.type === 'question' ? styles.questionCard : styles[`border-${note.color}`]}`}
      onMouseEnter={() => onHover(note.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(note.id)}
    >
      {note.type === 'question' && <span className={styles.questionBadge}>?</span>}

      <p className={styles.quote}>
        "{note.selected_text.length > 80 ? note.selected_text.slice(0, 80) + '…' : note.selected_text}"
      </p>

      {isEditing ? (
        <textarea
          className={styles.editArea}
          value={editText}
          autoFocus
          onChange={e => onEditTextChange(e.target.value)}
          onBlur={() => onCommitEdit(note.id)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onCommitEdit(note.id) }
            if (e.key === 'Escape') onCancelEdit()
          }}
          onClick={e => e.stopPropagation()}
          placeholder={note.type === 'question' ? 'Add clarification…' : ''}
        />
      ) : note.note_content ? (
        <p className={styles.content} onClick={e => { e.stopPropagation(); onStartEdit(note) }}>
          {note.note_content}
        </p>
      ) : (
        <p className={styles.emptyContent} onClick={e => { e.stopPropagation(); onStartEdit(note) }}>
          Add a clarification…
        </p>
      )}

      <div className={styles.footer}>
        <span className={styles.date}>{formatRelativeDate(note.created_at)}</span>
        <button
          className={styles.deleteBtn}
          onClick={e => { e.stopPropagation(); onDelete(note.id) }}
          aria-label="Delete"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M2 3h8M5 3V2h2v1M2.5 3l.5 7h5l.5-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </li>
  )
}

export default function NotesSidebar({
  notes, onEdit, onDelete, onHoverNote, onClickNote, pulseNoteId,
  activeTab, onTabChange,
  terms, onEditTerm, onDeleteTerm,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editingTermId, setEditingTermId] = useState(null)
  const [editTermText, setEditTermText] = useState('')
  const cardRefs = useRef({})

  const noteItems      = notes.filter(n => n.type !== 'question' && n.type !== 'highlight')
  const questionItems  = notes.filter(n => n.type === 'question')
  const highlightItems = notes.filter(n => n.type === 'highlight')
  const visibleItems   = activeTab === 'questions' ? questionItems : noteItems

  useEffect(() => {
    if (!pulseNoteId || !cardRefs.current[pulseNoteId]) return
    const el = cardRefs.current[pulseNoteId]
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    el.classList.remove(styles.pulse)
    void el.offsetWidth
    el.classList.add(styles.pulse)
  }, [pulseNoteId])

  const startEdit  = (note) => { setEditingId(note.id); setEditText(note.note_content) }
  const cancelEdit = () => setEditingId(null)
  const commitEdit = (noteId) => {
    const note = notes.find(n => n.id === noteId)
    if (note?.type !== 'question' && !editText.trim()) { setEditingId(null); return }
    onEdit(noteId, editText)
    setEditingId(null)
  }

  const commitTermEdit = (termId) => {
    if (editTermText.trim()) onEditTerm(termId, editTermText.trim())
    setEditingTermId(null)
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'notes' ? styles.tabActive : ''}`}
          onClick={() => onTabChange('notes')}
        >
          Notes
          {noteItems.length > 0 && <span className={styles.tabCount}>{noteItems.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'questions' ? styles.tabActiveQ : ''}`}
          onClick={() => onTabChange('questions')}
        >
          Questions
          {questionItems.length > 0 && <span className={`${styles.tabCount} ${styles.tabCountQ}`}>{questionItems.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'highlights' ? styles.tabActiveH : ''}`}
          onClick={() => onTabChange('highlights')}
        >
          Highlights
          {highlightItems.length > 0 && <span className={`${styles.tabCount} ${styles.tabCountH}`}>{highlightItems.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'terms' ? styles.tabActiveT : ''}`}
          onClick={() => onTabChange('terms')}
        >
          Terms
          {terms?.length > 0 && <span className={`${styles.tabCount} ${styles.tabCountT}`}>{terms.length}</span>}
        </button>
      </div>

      {activeTab !== 'terms' && activeTab !== 'highlights' && (visibleItems.length === 0 ? (
        <div className={styles.empty}>
          {activeTab === 'questions' ? (
            <>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <circle cx="18" cy="18" r="15" stroke="var(--border)" strokeWidth="2"/>
                <text x="18" y="24" textAnchor="middle" fill="var(--border)" fontSize="16" fontWeight="700">?</text>
              </svg>
              <p>Select text and tap ? to flag sections you want to clarify</p>
            </>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <rect x="6" y="6" width="28" height="28" rx="4" stroke="var(--border)" strokeWidth="2"/>
                <path d="M13 16h14M13 20h10M13 24h8" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>Select text to add a note</p>
            </>
          )}
        </div>
      ) : (
        <ul className={styles.list}>
          {visibleItems.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              editingId={editingId}
              editText={editText}
              onStartEdit={startEdit}
              onCommitEdit={commitEdit}
              onEditTextChange={setEditText}
              onCancelEdit={cancelEdit}
              onDelete={onDelete}
              onHover={onHoverNote}
              onClick={onClickNote}
              cardRefs={cardRefs}
            />
          ))}
        </ul>
      ))}
      {activeTab === 'highlights' && (
        highlightItems.length === 0 ? (
          <div className={styles.empty}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <rect x="12" y="4" width="12" height="20" rx="3" stroke="var(--border)" strokeWidth="2"/>
              <path d="M16 24l2 5 2-5" stroke="var(--border)" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <p>Select text and click the marker icon to highlight important parts</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {highlightItems.map(note => (
              <li
                key={note.id}
                className={`${styles.card} ${styles[`highlightBorder-${note.color}`]}`}
                onClick={() => onClickNote(note.id)}
                onMouseEnter={() => onHoverNote(note.id)}
                onMouseLeave={() => onHoverNote(null)}
              >
                <span className={`${styles.highlightSwatch} ${styles[`swatch-${note.color}`]}`} />
                <p className={styles.quote}>
                  "{note.selected_text.length > 120 ? note.selected_text.slice(0, 120) + '…' : note.selected_text}"
                </p>
                {note.note_content && (
                  <p className={styles.content}>{note.note_content}</p>
                )}
                <div className={styles.footer}>
                  <span className={styles.date}>{formatRelativeDate(note.created_at)}</span>
                  <button
                    className={styles.deleteBtn}
                    onClick={e => { e.stopPropagation(); onDelete(note.id) }}
                    aria-label="Delete highlight"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M2 3h8M5 3V2h2v1M2.5 3l.5 7h5l.5-7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
      {activeTab === 'terms' && (
        terms?.length === 0 ? (
          <div className={styles.empty}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="28" height="28" rx="4" stroke="var(--border)" strokeWidth="2"/>
              <text x="18" y="24" textAnchor="middle" fill="var(--border)" fontSize="13" fontWeight="700">Aa</text>
            </svg>
            <p>Highlight a word and click Aa to define it</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {(terms || []).map(t => (
              <li
                key={t.id}
                className={`${styles.card} ${styles.termCard}`}
                onClick={() => {
                  const el = document.querySelector(`[data-term-id="${t.id}"]`)
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              >
                <span className={styles.termWord}>{t.term}</span>
                {editingTermId === t.id ? (
                  <textarea
                    className={styles.editArea}
                    value={editTermText}
                    autoFocus
                    onChange={e => setEditTermText(e.target.value)}
                    onBlur={() => commitTermEdit(t.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTermEdit(t.id) }
                      if (e.key === 'Escape') setEditingTermId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <p
                    className={styles.content}
                    onClick={e => { e.stopPropagation(); setEditingTermId(t.id); setEditTermText(t.definition) }}
                  >
                    {t.definition}
                  </p>
                )}
                <div className={styles.footer}>
                  <span className={styles.date}>{formatRelativeDate(t.created_at)}</span>
                  <button
                    className={styles.deleteBtn}
                    onClick={e => { e.stopPropagation(); onDeleteTerm(t.id) }}
                    aria-label="Delete term"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M2 3h8M5 3V2h2v1M2.5 3l.5 7h5l.5-7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </aside>
  )
}
