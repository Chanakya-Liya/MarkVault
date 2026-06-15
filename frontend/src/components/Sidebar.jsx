import { useState, useRef } from 'react'
import { formatRelativeDate, formatFileSize } from '../utils/format'
import styles from './Sidebar.module.css'

const DRAG_MIME = 'application/x-markvault-file-id'

export default function Sidebar({ open, files, activeFileId, onFileSelect, onFileDelete, onFileReorder, onFileRename, onUpload, showToast, locked }) {
  const [search, setSearch] = useState('')
  const [uploadDragging, setUploadDragging] = useState(false)
  const [dragId, setDragId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const fileInputRef = useRef()
  const editInputRef = useRef()

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const totalSize = files.reduce((s, f) => s + f.size, 0)
  const canReorder = !search && !locked

  // File upload drag
  const handleDragOver = (e) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      setUploadDragging(true)
    }
  }
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setUploadDragging(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    setUploadDragging(false)
    if (e.dataTransfer.types.includes('Files')) {
      const fileList = Array.from(e.dataTransfer.files)
      if (fileList.length) onUpload(fileList)
    }
  }

  // Reorder drag
  const handleItemDragStart = (e, id) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData(DRAG_MIME, id)
    setTimeout(() => setDragId(id), 0)
  }
  const handleItemDragOver = (e, id) => {
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (id !== dragOverId) setDragOverId(id)
  }
  const handleItemDrop = (e, targetId) => {
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return
    e.preventDefault()
    e.stopPropagation()
    const sourceId = e.dataTransfer.getData(DRAG_MIME)
    if (sourceId && sourceId !== targetId) {
      const newOrder = [...files]
      const fromIdx = newOrder.findIndex(f => f.id === sourceId)
      const toIdx = newOrder.findIndex(f => f.id === targetId)
      const [moved] = newOrder.splice(fromIdx, 1)
      newOrder.splice(toIdx, 0, moved)
      onFileReorder(newOrder.map(f => f.id))
    }
    setDragId(null)
    setDragOverId(null)
  }
  const handleItemDragEnd = () => {
    setDragId(null)
    setDragOverId(null)
  }

  // Rename
  const startRename = (e, file) => {
    e.stopPropagation()
    setEditingId(file.id)
    setEditName(file.name)
    setTimeout(() => {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }, 0)
  }
  const commitRename = () => {
    const name = editName.trim()
    const original = files.find(f => f.id === editingId)?.name
    setEditingId(null)
    if (name && name !== original) onFileRename(editingId, name)
  }
  const cancelRename = () => setEditingId(null)

  const handleFileInput = (e) => {
    const fileList = Array.from(e.target.files)
    if (fileList.length) onUpload(fileList)
    e.target.value = ''
  }

  const handleDelete = (e, file) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${file.name}"?`)) onFileDelete(file.id)
  }

  return (
    <aside
      className={`${styles.sidebar} ${open ? styles.open : styles.closed}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {uploadDragging && <div className={styles.dropOverlay}>Drop to upload</div>}

      <div className={styles.header}>
        <span className={styles.brand}>MarkVault</span>
        <button
          className={styles.uploadBtn}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload files"
          title="Upload files"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 1v8M4 4l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 11v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" strokeLinecap="round"/>
          </svg>
          Upload
        </button>
        <input ref={fileInputRef} type="file" accept=".md,.markdown" multiple hidden onChange={handleFileInput} />
      </div>

      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="5.5" cy="5.5" r="4"/>
          <path d="M9 9l3 3" strokeLinecap="round"/>
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Filter files…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Filter files"
        />
        {search && (
          <button className={styles.clearSearch} onClick={() => setSearch('')} aria-label="Clear filter">✕</button>
        )}
      </div>

      <div className={styles.listWrap}>
        {locked && (
          <div className={styles.lockOverlay}>
            <span className={styles.lockMsg}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="2" y="5" width="7" height="5" rx="1"/>
                <path d="M3.5 5V3.5a2 2 0 0 1 4 0V5" strokeLinecap="round"/>
              </svg>
              Scroll to bottom to unlock
            </span>
          </div>
        )}
        <ul className={`${styles.fileList} ${locked ? styles.fileListLocked : ''}`}>
          {filtered.length === 0 && (
            <li className={styles.noResults}>
              {search ? 'No matching files' : 'No files yet'}
            </li>
          )}
          {filtered.map(file => (
            <li
              key={file.id}
              className={[
                styles.fileItem,
                file.id === activeFileId ? styles.active : '',
                file.id === dragId ? styles.dragging : '',
                file.id === dragOverId ? styles.dragOver : '',
              ].filter(Boolean).join(' ')}
              onClick={() => !locked && editingId !== file.id && onFileSelect(file.id)}
              draggable={canReorder}
              onDragStart={canReorder ? (e) => handleItemDragStart(e, file.id) : undefined}
              onDragOver={(e) => handleItemDragOver(e, file.id)}
              onDrop={(e) => handleItemDrop(e, file.id)}
              onDragEnd={handleItemDragEnd}
            >
              {canReorder && (
                <div className={styles.dragHandle} aria-hidden="true">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                    <circle cx="2" cy="2" r="1.2"/>
                    <circle cx="6" cy="2" r="1.2"/>
                    <circle cx="2" cy="6" r="1.2"/>
                    <circle cx="6" cy="6" r="1.2"/>
                    <circle cx="2" cy="10" r="1.2"/>
                    <circle cx="6" cy="10" r="1.2"/>
                  </svg>
                </div>
              )}
              <div className={styles.fileInfo}>
                {editingId === file.id ? (
                  <input
                    ref={editInputRef}
                    className={styles.renameInput}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); commitRename() }
                      if (e.key === 'Escape') cancelRename()
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className={styles.fileName} title={file.name}>{file.name}</span>
                )}
                <span className={styles.fileMeta}>
                  {formatRelativeDate(file.upload_date)} · {formatFileSize(file.size)}
                </span>
              </div>
              {editingId !== file.id && (
                <>
                  <button
                    className={styles.renameBtn}
                    onClick={(e) => startRename(e, file)}
                    aria-label={`Rename ${file.name}`}
                    title="Rename"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M9 2l2 2-6 6H3V8l6-6z" strokeLinejoin="round"/>
                      <path d="M8 3l2 2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDelete(e, file)}
                    aria-label={`Delete ${file.name}`}
                    title="Delete"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M2 3h9M5 3V2h3v1M3 3l.6 8h5.8l.6-8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.footer}>
        <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
        <span>{formatFileSize(totalSize)}</span>
      </div>
    </aside>
  )
}
