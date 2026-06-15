import { useEffect, useRef, useState, useCallback } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import Mark from 'mark.js'
import NotePopover from './NotePopover'
import styles from './MarkdownRenderer.module.css'

// Configure marked once
// marked 12.x renderer extensions use the old (pre-token) calling convention:
//   heading(text, level, raw)  — text is rendered HTML, raw is plain text
//   code(code, language)
//   image(href, title, alt)
const renderer = {
  heading(text, level, raw) {
    const slug = (raw || text)
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `<h${level} id="${slug}">${text} <a href="#${slug}" class="heading-anchor" aria-hidden="true">#</a></h${level}>\n`
  },
  code(code, language) {
    const lang = language && hljs.getLanguage(language) ? language : 'plaintext'
    const highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
    return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>\n`
  },
  image(href, title, alt) {
    const cap = alt || title || ''
    return `<figure class="md-figure"><img src="${href}" alt="${alt || ''}"${title ? ` title="${title}"` : ''} />${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>\n`
  },
}

marked.use({ renderer, gfm: true })

function renderMarkdown(content) {
  const raw = marked.parse(content)
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['id', 'class', 'aria-hidden'],
    ALLOW_DATA_ATTR: true,
  })
}

export default function MarkdownRenderer({
  content,
  notes,
  onAddNote,
  onNoteClick,
  onNoteHover,
  notesOpen,
  notesTab,
  searchQuery,
  searchVersion,
  onSearchMatches,
  currentMatchIndex,
  scrollContainerRef,
  onRendered,
  wordCount,
  readTime,
  terms,
  onAddTerm,
}) {
  const containerRef = useRef()
  const [html, setHtml] = useState('')
  const [tooltip, setTooltip] = useState(null)
  const [popover, setPopover] = useState(null)
  const [noteHoverTooltip, setNoteHoverTooltip] = useState(null)
  const [termTooltip, setTermTooltip] = useState(null)
  const [searchScrollKey, setSearchScrollKey] = useState(0)
  const lastHoveredNoteIdRef = useRef(null)
  const noteMarkRef = useRef(null)
  const searchMarkRef = useRef(null)
  const termMarkRef = useRef(null)
  const matchEls = useRef([])

  // Render markdown
  useEffect(() => {
    if (content) setHtml(renderMarkdown(content))
    else setHtml('')
  }, [content])

  // Notify parent after DOM updates
  useEffect(() => {
    if (html) onRendered?.()
  }, [html, onRendered])

  // Add copy buttons after render
  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.querySelectorAll('pre').forEach(pre => {
      if (pre.querySelector('.copy-btn')) return
      const btn = document.createElement('button')
      btn.className = 'copy-btn'
      btn.textContent = 'Copy'
      btn.setAttribute('aria-label', 'Copy code')
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const code = pre.querySelector('code')?.textContent || ''
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = 'Copied!'
          setTimeout(() => { btn.textContent = 'Copy' }, 2000)
        })
      })
      pre.appendChild(btn)
    })
  }, [html])

  // Apply note highlights only when notes sidebar is open
  useEffect(() => {
    if (!containerRef.current) return

    if (!noteMarkRef.current) noteMarkRef.current = new Mark(containerRef.current)
    const marker = noteMarkRef.current

    // 'mv-note' is shared by both note-highlight and question-highlight,
    // letting us unmark both types in one call without touching search-highlight
    marker.unmark({ className: 'mv-note', done: () => {
      if (!notesOpen) return
      const visibleNotes = notes.filter(n => {
        const t = n.type || 'note'
        if (notesTab === 'highlights') return t === 'highlight'
        if (notesTab === 'questions')  return t === 'question'
        return t === 'note'
      })
      visibleNotes.forEach(note => {
        const t = note.type || 'note'
        const className = t === 'question'
          ? 'mv-note question-highlight'
          : t === 'highlight'
          ? `mv-note highlight-mark highlight-color-${note.color || 'yellow'}`
          : `mv-note note-highlight note-color-${note.color || 'yellow'}`
        marker.mark(note.selected_text, {
          className,
          accuracy: { value: 'partially', limiters: [',', '.', '!', '?', ';', ':', ' ', '\n'] },
          separateWordSearch: false,
          acrossElements: true,
          exclude: ['.heading-anchor', '.copy-btn'],
          each: (el) => { el.dataset.noteId = String(note.id) },
        })
      })
    }})
  }, [html, notes, notesOpen, notesTab])

  // Apply term highlights — word-boundary matching, standalone occurrences only
  useEffect(() => {
    if (!containerRef.current) return
    if (!termMarkRef.current) termMarkRef.current = new Mark(containerRef.current)
    const marker = termMarkRef.current

    marker.unmark({ className: 'term-highlight', done: () => {
      if (!terms?.length) return
      terms.forEach(termDef => {
        const escaped = termDef.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Lookbehind/lookahead ensure the term isn't part of a larger word
        const regex = new RegExp(`(?<![a-zA-Z0-9_\\u00C0-\\u024F])${escaped}(?![a-zA-Z0-9_\\u00C0-\\u024F])`, 'gi')
        marker.markRegExp(regex, {
          className: 'term-highlight',
          exclude: ['.heading-anchor', '.copy-btn', '.note-highlight', '.question-highlight'],
          each: (el) => {
            el.dataset.termId = termDef.id
            el.dataset.termDef = termDef.definition
            el.dataset.termText = termDef.term
          },
        })
      })
    }})
  }, [html, terms])

  // Term hover — show definition tooltip
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleOver = (e) => {
      const el = e.target.closest('.term-highlight')
      if (el?.dataset.termDef) {
        const rect = el.getBoundingClientRect()
        setTermTooltip({ x: rect.left + rect.width / 2, y: rect.top, definition: el.dataset.termDef, term: el.dataset.termText })
      } else if (!e.target.closest('.term-highlight')) {
        setTermTooltip(null)
      }
    }
    const handleLeave = () => setTermTooltip(null)
    container.addEventListener('mouseover', handleOver)
    container.addEventListener('mouseleave', handleLeave)
    return () => {
      container.removeEventListener('mouseover', handleOver)
      container.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  // Apply search highlights
  useEffect(() => {
    if (!containerRef.current) return

    if (!searchMarkRef.current) searchMarkRef.current = new Mark(containerRef.current)
    const marker = searchMarkRef.current

    marker.unmark({ className: 'search-highlight' })
    matchEls.current = []

    if (!searchQuery || searchQuery.length < 2) {
      onSearchMatches(0)
      return
    }

    marker.mark(searchQuery, {
      className: 'search-highlight',
      accuracy: 'partially',
      separateWordSearch: false,
      exclude: ['.heading-anchor', '.copy-btn'],
      each: (el) => { matchEls.current.push(el) },
      done: (count) => {
        onSearchMatches(count)
        if (count > 0) setSearchScrollKey(k => k + 1)
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, searchQuery, searchVersion])

  // Scroll to current search match
  useEffect(() => {
    if (!matchEls.current.length) return
    matchEls.current.forEach((el, i) => {
      el.classList.toggle('search-highlight-current', i === currentMatchIndex)
    })
    const current = matchEls.current[currentMatchIndex]
    if (current && scrollContainerRef?.current) {
      current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentMatchIndex, scrollContainerRef, searchScrollKey])

  // Handle note highlight clicks
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleClick = (e) => {
      const mark = e.target.closest('[data-note-id]')
      if (mark?.dataset.noteId) {
        onNoteClick(mark.dataset.noteId)
      }
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [onNoteClick])

  // Hover over note highlights — track hovered note and show tooltip when sidebar is open
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseOver = (e) => {
      const mark = e.target.closest('[data-note-id]')
      const noteId = mark?.dataset.noteId ?? null

      if (noteId === lastHoveredNoteIdRef.current) return
      lastHoveredNoteIdRef.current = noteId
      onNoteHover(noteId)

      if (noteId && notesOpen) {
        const note = notes.find(n => n.id === noteId)
        if (note && mark) {
          const rect = mark.getBoundingClientRect()
          setNoteHoverTooltip({ x: rect.left + rect.width / 2, y: rect.top, content: note.note_content })
        }
      } else {
        setNoteHoverTooltip(null)
      }
    }

    const handleMouseLeave = () => {
      lastHoveredNoteIdRef.current = null
      onNoteHover(null)
      setNoteHoverTooltip(null)
    }

    container.addEventListener('mouseover', handleMouseOver)
    container.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      container.removeEventListener('mouseover', handleMouseOver)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [notes, notesOpen, onNoteHover])

  // Clear hover tooltip when notes sidebar closes
  useEffect(() => {
    if (!notesOpen) setNoteHoverTooltip(null)
  }, [notesOpen])

  // Text selection handler
  const handleMouseUp = useCallback((e) => {
    if (popover) return

    setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setTooltip(null)
        return
      }

      const range = selection.getRangeAt(0)
      if (!containerRef.current?.contains(range.commonAncestorContainer)) {
        setTooltip(null)
        return
      }

      const text = selection.toString().trim()
      if (!text) { setTooltip(null); return }

      // Don't offer "Add Note" if selection overlaps an existing note highlight
      const existingHighlights = containerRef.current.querySelectorAll('[data-note-id]')
      const overlapsNote = Array.from(existingHighlights).some(el => range.intersectsNode(el))
      if (overlapsNote) { setTooltip(null); return }

      const rect = range.getBoundingClientRect()
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        text,
        range: range.cloneRange(),
      })
    }, 10)
  }, [popover])

  const handleAddNoteClick = useCallback(() => {
    if (!tooltip) return

    const plainText = containerRef.current?.textContent || ''
    const { text } = tooltip
    const idx = plainText.indexOf(text)

    const selectionData = {
      selected_text: text,
      context_before: idx >= 0 ? plainText.slice(Math.max(0, idx - 40), idx) : '',
      context_after: idx >= 0 ? plainText.slice(idx + text.length, idx + text.length + 40) : '',
    }

    setPopover({
      x: tooltip.x,
      y: tooltip.y + 8,
      selectionData,
    })
    setTooltip(null)
    window.getSelection()?.removeAllRanges()
  }, [tooltip])

  const handlePopoverSubmit = async (noteData) => {
    if (noteData.type === 'term') {
      await onAddTerm?.({ term: popover.selectionData.selected_text, definition: noteData.definition })
    } else {
      await onAddNote({ ...popover.selectionData, ...noteData })
    }
    setPopover(null)
  }

  // Hide tooltip when clicking elsewhere
  useEffect(() => {
    const hide = (e) => {
      if (!e.target.closest(`.${styles.tooltip}`)) setTooltip(null)
    }
    document.addEventListener('mousedown', hide)
    return () => document.removeEventListener('mousedown', hide)
  }, [])

  if (!content) return null

  return (
    <div className={styles.wrapper}>
      {wordCount > 0 && (
        <div className={styles.readingMeta}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="5.5"/>
            <path d="M6.5 3.5v3.5l2.5 1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          ~{readTime} min read
          <span className={styles.readingMetaDot}>·</span>
          {wordCount.toLocaleString()} words
        </div>
      )}
      <div
        ref={containerRef}
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
        onMouseUp={handleMouseUp}
      />

      {tooltip && (
        <button
          className={styles.tooltip}
          style={{ top: tooltip.y, left: tooltip.x }}
          onClick={handleAddNoteClick}
          aria-label="Add note to selected text"
        >
          + Add Note
        </button>
      )}

      {popover && (
        <NotePopover
          position={{ x: popover.x, y: popover.y }}
          selectedText={popover.selectionData.selected_text}
          onSubmit={handlePopoverSubmit}
          onClose={() => setPopover(null)}
        />
      )}

      {noteHoverTooltip && (
        <div
          className={styles.noteTooltip}
          style={{ top: noteHoverTooltip.y, left: noteHoverTooltip.x }}
        >
          {noteHoverTooltip.content}
        </div>
      )}

      {termTooltip && (
        <div
          className={styles.termTooltip}
          style={{ top: termTooltip.y, left: termTooltip.x }}
        >
          <div className={styles.termTooltipLabel}>{termTooltip.term}</div>
          <div className={styles.termTooltipDef}>{termTooltip.definition}</div>
        </div>
      )}
    </div>
  )
}
