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
  panelId, fileId, isActive, isSinglePanel,
  onFocus, onClose, onScrollProgress,
  tocOpen, notesOpen, searchOpen,
  onSetTocOpen, onSetNotesOpen, onSetSearchOpen,
  onNoteCountChange, showToast,
  dimMode, jumpMode, focusMode,
  onReachBottom, onSectionComplete,
}) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef()
  const scrollRef = useRef()
  const scrollWrapperRef = useRef()
  const searchInputRef = useRef()
  const hasCalledReachBottom = useRef(false)
  const passedHeadingIds = useRef(new Set())
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
  const [notesTab, setNotesTab] = useState('notes')

  // Dim mode
  const [dimThreshold, setDimThreshold] = useState(40)

  // Sidebar float detection — only in single-panel mode
  const [floatToc, setFloatToc] = useState(false)
  const [floatNotes, setFloatNotes] = useState(false)

  useEffect(() => {
    if (!isSinglePanel) {
      setFloatToc(false)
      setFloatNotes(false)
      return
    }
    const panel = panelRef.current
    if (!panel) return
    const wrapper = panel.parentElement
    const panelsEl = wrapper?.parentElement
    if (!wrapper || !panelsEl) return

    const check = () => {
      const sideSpace = (panelsEl.clientWidth - wrapper.clientWidth) / 2
      setFloatToc(sideSpace >= 228)
      setFloatNotes(sideSpace >= 288)
    }

    check()
    const ro = new ResizeObserver(check)
    ro.observe(wrapper)
    ro.observe(panelsEl)
    return () => ro.disconnect()
  }, [isSinglePanel])

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

  // Reset per-file state on file change
  useEffect(() => {
    setSearchInput('')
    setSearchMatchCount(0)
    setCurrentMatch(0)
    setTocItems([])
    setActiveTocId('')
    hasCalledReachBottom.current = false
    passedHeadingIds.current = new Set()
  }, [fileId])

  // Clear search when bar closes
  useEffect(() => {
    if (!searchOpen) setSearchInput('')
  }, [searchOpen])

  // Extract TOC headings
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

  // Active TOC item
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

  // Section checkpoints — fire onSectionComplete once per heading passed
  useEffect(() => {
    if (!scrollRef.current || !tocItems.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting && entry.rootBounds && entry.boundingClientRect.bottom < entry.rootBounds.top) {
            const id = entry.target.id
            if (!passedHeadingIds.current.has(id)) {
              passedHeadingIds.current.add(id)
              onSectionComplete?.()
            }
          }
        })
      },
      { root: scrollRef.current, threshold: 0 }
    )
    tocItems.forEach(item => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [tocItems, onSectionComplete])

  // Hover note highlighting
  useEffect(() => {
    document.querySelectorAll('.note-highlight').forEach(el => {
      el.classList.toggle('note-highlight-hover', el.dataset.noteId === hoveredNoteId)
    })
  }, [hoveredNoteId])

  // Scroll progress + reach-bottom detection
  const handleScrollProgress = useCallback((e) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    if (max <= 0) return
    const pct = Math.min(100, Math.round((el.scrollTop / max) * 100))
    onScrollProgress(pct)
    if (pct >= 95 && !hasCalledReachBottom.current) {
      hasCalledReachBottom.current = true
      onReachBottom?.()
    }
  }, [onScrollProgress, onReachBottom])

  // Paragraph jump — Space key
  const jumpToNext = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const els = Array.from(container.querySelectorAll(
      '.markdown-body > p, .markdown-body > h1, .markdown-body > h2, ' +
      '.markdown-body > h3, .markdown-body > h4, .markdown-body > blockquote, ' +
      '.markdown-body > pre, .markdown-body > ul, .markdown-body > ol, .markdown-body > figure'
    ))
    const mid = container.scrollTop + container.clientHeight * 0.5
    const next = els.find(el => el.offsetTop > mid + 30)
    if (next) {
      next.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    if (!jumpMode) return
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === ' ') {
        e.preventDefault()
        jumpToNext()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [jumpMode, jumpToNext])

  // Dim threshold drag
  const handleDimLineDragStart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const wrapper = scrollWrapperRef.current
    if (!wrapper) return
    const onMouseMove = (me) => {
      const rect = wrapper.getBoundingClientRect()
      const pct = ((me.clientY - rect.top) / rect.height) * 100
      setDimThreshold(Math.min(92, Math.max(4, pct)))
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  const handleTOCClick = useCallback((id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleNoteHover = useCallback((noteId) => {
    setHoveredNoteId(noteId)
  }, [])

  const handleNoteClick = useCallback((noteId) => {
    onSetNotesOpen(true)
    const note = notes.find(n => n.id === noteId || n.id === Number(noteId))
    if (note?.type === 'question') setNotesTab('questions')
    else setNotesTab('notes')
    setPulseNoteId(noteId)
    setTimeout(() => setPulseNoteId(null), 700)
    setTimeout(() => {
      const mark = scrollRef.current?.querySelector(`[data-note-id="${noteId}"]`)
      if (mark) mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }, [onSetNotesOpen, notes])

  const handleSearchNext = () => setCurrentMatch(i => (i + 1) % Math.max(1, searchMatchCount))
  const handleSearchPrev = () => setCurrentMatch(i => (i - 1 + Math.max(1, searchMatchCount)) % Math.max(1, searchMatchCount))
  const handleSearchClear = () => { setSearchInput(''); onSetSearchOpen(false) }

  const wordCount = useMemo(() => {
    if (!file?.content) return 0
    return file.content.split(/\s+/).filter(Boolean).length
  }, [file?.content])

  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  const sidebarProps = {
    notes, onEdit: editNote, onDelete: removeNote,
    onHoverNote: handleNoteHover, onClickNote: handleNoteClick,
    pulseNoteId, activeTab: notesTab, onTabChange: setNotesTab,
  }

  // Empty panel
  if (!fileId) {
    return (
      <div className={`${styles.panel} ${isActive ? styles.active : ''}`} onClick={onFocus}>
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

  const isFloating = floatToc || floatNotes

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isActive ? styles.active : ''} ${isFloating ? styles.panelOverflow : ''}`}
      onClick={onFocus}
    >
      {/* Panel header — hidden in focus mode */}
      {!focusMode && (
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
      )}

      {/* Search bar — hidden in focus mode */}
      {!focusMode && (
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
      )}

      {/* Body */}
      <div className={styles.body}>
        {tocOpen && !floatToc && <TOCPanel items={tocItems} activeId={activeTocId} onItemClick={handleTOCClick} />}

        <div ref={scrollWrapperRef} className={styles.scrollWrapper}>
          {/* Dim mode overlay + draggable threshold line */}
          {dimMode && (
            <>
              <div
                className={styles.dimOverlay}
                style={{ height: `${dimThreshold}%` }}
              />
              <div
                className={styles.dimLine}
                style={{ top: `${dimThreshold}%` }}
                onMouseDown={handleDimLineDragStart}
                title="Drag to adjust dim threshold"
              >
                <div className={styles.dimLineHandle}>
                  <svg width="16" height="5" viewBox="0 0 16 5" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <line x1="2" y1="1.5" x2="14" y2="1.5" strokeLinecap="round"/>
                    <line x1="2" y1="3.5" x2="14" y2="3.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </>
          )}
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
                wordCount={wordCount}
                readTime={readTime}
              />
            )}
          </div>
        </div>

        {notesOpen && !floatNotes && <NotesSidebar {...sidebarProps} />}
      </div>

      {/* Floating sidebars */}
      {tocOpen && floatToc && (
        <div className={styles.floatLeft}>
          <TOCPanel items={tocItems} activeId={activeTocId} onItemClick={handleTOCClick} />
        </div>
      )}
      {notesOpen && floatNotes && (
        <div className={styles.floatRight}>
          <NotesSidebar {...sidebarProps} />
        </div>
      )}
    </div>
  )
}
