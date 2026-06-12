import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as filesApi from '../api/files'
import { useNotes } from '../hooks/useNotes'
import MarkdownRenderer from './MarkdownRenderer'
import TOCPanel from './TOCPanel'
import NotesSidebar from './NotesSidebar'
import styles from './ViewerPanel.module.css'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function ViewerPanel({
  panelId, fileId, isActive,
  onFocus, onClose, onScrollProgress,
  tocOpen, notesOpen, searchOpen,
  onSetTocOpen, onSetNotesOpen, onSetSearchOpen,
  onNoteCountChange, showToast,
}) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef()
  const searchInputRef = useRef()
  const { notes, addNote, editNote, removeNote } = useNotes(fileId, showToast)

  // Search state
  const [searchInput, setSearchInput] = useState('')
  const [searchMatchCount, setSearchMatchCount] = useState(0)
  const [currentMatch, setCurrentMatch] = useState(0)
  const [searchVersion, setSearchVersion] = useState(0)
  const debouncedSearch = useDebounce(searchInput, 150)

  // TOC state
  const [tocItems, setTocItems] = useState([])
  const [activeTocId, setActiveTocId] = useState('')

  // Focus search input when bar opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  // Notes interaction
  const [hoveredNoteId, setHoveredNoteId] = useState(null)
  const [pulseNoteId, setPulseNoteId] = useState(null)

  // Sync note count up
  useEffect(() => {
    onNoteCountChange(notes.length)
  }, [notes.length, onNoteCountChange])

  // Fetch file content
  useEffect(() => {
    if (!fileId) { setFile(null); return }
    setLoading(true)
    filesApi.getFile(fileId)
      .then(setFile)
      .catch(() => showToast('Storage error', 'error'))
      .finally(() => setLoading(false))
  }, [fileId, showToast])

  // Clear search when file changes
  useEffect(() => {
    setSearchInput('')
    setSearchMatchCount(0)
    setCurrentMatch(0)
    setTocItems([])
    setActiveTocId('')
  }, [fileId])

  // Clear search match state when search closes
  useEffect(() => {
    if (!searchOpen) {
      setSearchInput('')
    }
  }, [searchOpen])

  // Extract TOC headings from rendered HTML
  const handleRendered = useCallback(() => {
    if (!scrollRef.current) return
    const headings = scrollRef.current.querySelectorAll('h1[id], h2[id], h3[id], h4[id]')
    const items = Array.from(headings).map(h => ({
      id: h.id,
      text: h.textContent.replace('#', '').trim(),
      level: parseInt(h.tagName[1]),
    }))
    setTocItems(items)
  }, [])

  // Observe headings for active TOC item
  useEffect(() => {
    if (!tocOpen || !tocItems.length || !scrollRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length) setActiveTocId(visible[0].target.id)
      },
      { root: scrollRef.current, rootMargin: '-10% 0% -60% 0%', threshold: 0 }
    )

    tocItems.forEach(item => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [tocOpen, tocItems])

  // Hover note highlighting
  useEffect(() => {
    document.querySelectorAll('.note-highlight').forEach(el => {
      el.classList.toggle('note-highlight-hover', el.dataset.noteId === hoveredNoteId)
    })
  }, [hoveredNoteId])

  const handleScrollProgress = useCallback((e) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    if (max <= 0) return
    onScrollProgress(Math.min(100, Math.round((el.scrollTop / max) * 100)))
  }, [onScrollProgress])

  const handleTOCClick = useCallback((id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleNoteHover = useCallback((noteId) => {
    setHoveredNoteId(noteId)
  }, [])

  const handleNoteClick = useCallback((noteId) => {
    onSetNotesOpen(true)
    setPulseNoteId(noteId)
    setTimeout(() => setPulseNoteId(null), 700)

    // Defer scroll until after any re-render caused by onSetNotesOpen
    setTimeout(() => {
      const mark = scrollRef.current?.querySelector(`[data-note-id="${noteId}"]`)
      if (mark) mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }, [onSetNotesOpen])

  const handleSearchNext = () => {
    setCurrentMatch(i => (i + 1) % Math.max(1, searchMatchCount))
  }
  const handleSearchPrev = () => {
    setCurrentMatch(i => (i - 1 + Math.max(1, searchMatchCount)) % Math.max(1, searchMatchCount))
  }
  const handleSearchClear = () => {
    setSearchInput('')
    onSetSearchOpen(false)
  }

  const wordCount = useMemo(() => {
    if (!file?.content) return 0
    return file.content.split(/\s+/).filter(Boolean).length
  }, [file?.content])

  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  // Empty panel (no file selected)
  if (!fileId) {
    return (
      <div
        className={`${styles.panel} ${isActive ? styles.active : ''}`}
        onClick={onFocus}
      >
        <div className={styles.emptyPanel}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="8" y="4" width="24" height="32" rx="3" stroke="var(--border)" strokeWidth="2"/>
            <rect x="13" y="12" width="14" height="1.5" rx="0.75" fill="var(--border)"/>
            <rect x="13" y="17" width="10" height="1.5" rx="0.75" fill="var(--border)"/>
            <rect x="13" y="22" width="12" height="1.5" rx="0.75" fill="var(--border)"/>
          </svg>
          <p>Select a file to read</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${styles.panel} ${isActive ? styles.active : ''}`}
      onClick={onFocus}
    >
      {/* Panel header */}
      <div className={styles.panelHeader}>
        <span className={styles.panelFileName} title={file?.name}>{file?.name || '…'}</span>
        {file && (
          <span className={styles.panelMeta}>
            {wordCount.toLocaleString()} words · ~{readTime} min read
          </span>
        )}
        <button className={styles.closeBtn} onClick={(e) => { e.stopPropagation(); onClose() }} aria-label="Close panel">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Search bar */}
      <div className={`${styles.searchBar} ${searchOpen ? styles.searchBarOpen : ''}`} onClick={e => e.stopPropagation()}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
          <circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l3 3" strokeLinecap="round"/>
        </svg>
        <input
          ref={searchInputRef}
          className={styles.searchInput}
          type="text"
          value={searchInput}
          onChange={e => { setSearchInput(e.target.value); setCurrentMatch(0) }}
          placeholder="Search in file…"
          onKeyDown={e => { if (e.key === 'Escape') handleSearchClear(); if (e.key === 'Enter') { e.shiftKey ? handleSearchPrev() : handleSearchNext() } }}
          aria-label="Search in file"
        />
        <span className={styles.matchCount}>
          {searchMatchCount > 0 ? `${currentMatch + 1}/${searchMatchCount}` : (searchInput.length >= 2 ? '0/0' : '')}
        </span>
        <button className={styles.searchNav} onClick={handleSearchPrev} aria-label="Previous match">▲</button>
        <button className={styles.searchNav} onClick={handleSearchNext} aria-label="Next match">▼</button>
        <button className={styles.searchNav} onClick={handleSearchClear} aria-label="Close search">✕</button>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {tocOpen && <TOCPanel items={tocItems} activeId={activeTocId} onItemClick={handleTOCClick} />}

        <div
          ref={scrollRef}
          className={styles.scroll}
          onScroll={handleScrollProgress}
        >
          {loading ? (
            <div className={styles.loading}>Loading…</div>
          ) : (
            <MarkdownRenderer
              content={file?.content}
              notes={notes}
              onAddNote={addNote}
              onNoteClick={handleNoteClick}
              onNoteHover={handleNoteHover}
              notesOpen={notesOpen}
              searchQuery={debouncedSearch}
              searchVersion={searchVersion}
              onSearchMatches={setSearchMatchCount}
              currentMatchIndex={currentMatch}
              scrollContainerRef={scrollRef}
              onRendered={handleRendered}
            />
          )}
        </div>

        {notesOpen && (
          <NotesSidebar
            notes={notes}
            onEdit={editNote}
            onDelete={removeNote}
            onHoverNote={handleNoteHover}
            onClickNote={handleNoteClick}
            pulseNoteId={pulseNoteId}
          />
        )}
      </div>
    </div>
  )
}
