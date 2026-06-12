import { useState, useRef } from 'react'
import { formatRelativeDate, formatFileSize } from '../utils/format'
import styles from './Sidebar.module.css'

export default function Sidebar({ open, files, activeFileId, onFileSelect, onFileDelete, onUpload, showToast }) {
  const [search, setSearch] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef()

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const totalSize = files.reduce((s, f) => s + f.size, 0)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const fileList = Array.from(e.dataTransfer.files)
    if (fileList.length) onUpload(fileList)
  }

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
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {dragging && <div className={styles.dropOverlay}>Drop to upload</div>}

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

      <ul className={styles.fileList}>
        {filtered.length === 0 && (
          <li className={styles.noResults}>
            {search ? 'No matching files' : 'No files yet'}
          </li>
        )}
        {filtered.map(file => (
          <li
            key={file.id}
            className={`${styles.fileItem} ${file.id === activeFileId ? styles.active : ''}`}
            onClick={() => onFileSelect(file.id)}
          >
            <div className={styles.fileInfo}>
              <span className={styles.fileName} title={file.name}>{file.name}</span>
              <span className={styles.fileMeta}>
                {formatRelativeDate(file.upload_date)} · {formatFileSize(file.size)}
              </span>
            </div>
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
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
        <span>{formatFileSize(totalSize)}</span>
      </div>
    </aside>
  )
}
