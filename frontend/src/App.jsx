import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from './hooks/useTheme'
import { useFiles } from './hooks/useFiles'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ViewerPanel from './components/ViewerPanel'
import Toast from './components/Toast'
import styles from './App.module.css'

function EmptyState({ onUpload }) {
  const handleInput = (e) => {
    const fileList = Array.from(e.target.files)
    if (fileList.length) onUpload(fileList)
    e.target.value = ''
  }

  return (
    <div className={styles.emptyState}>
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <rect x="12" y="8" width="46" height="58" rx="4" fill="var(--surface2)" stroke="var(--border)" strokeWidth="2"/>
        <rect x="18" y="20" width="28" height="2" rx="1" fill="var(--border)"/>
        <rect x="18" y="27" width="22" height="2" rx="1" fill="var(--border)"/>
        <rect x="18" y="34" width="26" height="2" rx="1" fill="var(--border)"/>
        <rect x="18" y="41" width="18" height="2" rx="1" fill="var(--border)"/>
        <circle cx="58" cy="58" r="14" fill="var(--accent)" opacity="0.15"/>
        <path d="M58 51v14M51 58h14" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <p className={styles.emptyTitle}>Drop a markdown file to get started</p>
      <p className={styles.emptyHint}>or click below to browse your files</p>
      <label className={styles.uploadBtn}>
        Upload File
        <input type="file" accept=".md,.markdown" multiple hidden onChange={handleInput} />
      </label>
    </div>
  )
}

export default function App() {
  const [toasts, setToasts] = useState([])
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3300)
  }, [])

  const { themeId, allThemes, setTheme, addCustomTheme, deleteCustomTheme } = useTheme()
  const { files, fetchFiles, uploadFiles, removeFile } = useFiles(showToast)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [splitView, setSplitView] = useState(false)
  const [panel1FileId, setPanel1FileId] = useState(null)
  const [panel2FileId, setPanel2FileId] = useState(null)
  const [activePanel, setActivePanel] = useState(1)
  const [readingProgress, setReadingProgress] = useState(0)
  const [noteCounts, setNoteCounts] = useState({ 1: 0, 2: 0 })

  const [panelUI, setPanelUI] = useState({
    1: { tocOpen: false, notesOpen: false, searchOpen: false },
    2: { tocOpen: false, notesOpen: false, searchOpen: false },
  })

  // Resize state
  const [splitRatio, setSplitRatio] = useState(0.5)
  const [singlePanelWidth, setSinglePanelWidth] = useState(100)
  const panelsRef = useRef()
  // Refs so drag handlers always read fresh values without needing deps
  const splitRatioRef = useRef(0.5)
  const singleWidthRef = useRef(100)
  splitRatioRef.current = splitRatio
  singleWidthRef.current = singlePanelWidth

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const handleFileSelect = useCallback((fileId) => {
    if (splitView) {
      if (activePanel === 1) setPanel1FileId(fileId)
      else setPanel2FileId(fileId)
    } else {
      setPanel1FileId(fileId)
    }
  }, [splitView, activePanel])

  const handleFileDelete = useCallback(async (fileId) => {
    await removeFile(fileId)
    if (panel1FileId === fileId) setPanel1FileId(null)
    if (panel2FileId === fileId) setPanel2FileId(null)
  }, [removeFile, panel1FileId, panel2FileId])

  const handleUpload = useCallback((fileList) => {
    uploadFiles(fileList, files)
  }, [uploadFiles, files])

  const handleToggleSplitView = () => {
    setSplitView(v => {
      if (v) {
        setPanel2FileId(null)
        setActivePanel(1)
        setPanelUI(prev => ({ ...prev, 2: { tocOpen: false, notesOpen: false, searchOpen: false } }))
      }
      return !v
    })
  }

  const toggleActiveUI = (key) => {
    setPanelUI(prev => ({
      ...prev,
      [activePanel]: { ...prev[activePanel], [key]: !prev[activePanel][key] }
    }))
  }

  const setPanelUIKey = (panelId, key, value) => {
    setPanelUI(prev => ({ ...prev, [panelId]: { ...prev[panelId], [key]: value } }))
  }

  const handleResizeStart = useCallback((e, type, side) => {
    e.preventDefault()
    e.stopPropagation()
    const containerWidth = panelsRef.current.getBoundingClientRect().width
    const startX = e.clientX
    const startRatio = splitRatioRef.current
    const startWidth = singleWidthRef.current

    const onMouseMove = (me) => {
      const delta = me.clientX - startX
      if (type === 'split') {
        setSplitRatio(Math.min(0.85, Math.max(0.15, startRatio + delta / containerWidth)))
      } else {
        const deltaPercent = (delta / containerWidth) * 100
        const next = side === 'right'
          ? startWidth + deltaPercent
          : startWidth - deltaPercent
        setSinglePanelWidth(Math.min(100, Math.max(20, next)))
      }
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  const activePanelFileId = activePanel === 1 ? panel1FileId : panel2FileId
  const activeFile = files.find(f => f.id === activePanelFileId)

  return (
    <div className={styles.app}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${readingProgress}%` }} />
      </div>

      <Topbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        activeFileName={activeFile?.name}
        splitView={splitView}
        onToggleSplitView={handleToggleSplitView}
        themeId={themeId}
        allThemes={allThemes}
        onSetTheme={setTheme}
        onAddTheme={addCustomTheme}
        onDeleteTheme={deleteCustomTheme}
        tocOpen={panelUI[activePanel].tocOpen}
        notesOpen={panelUI[activePanel].notesOpen}
        searchOpen={panelUI[activePanel].searchOpen}
        onToggleTOC={() => toggleActiveUI('tocOpen')}
        onToggleNotes={() => toggleActiveUI('notesOpen')}
        onToggleSearch={() => toggleActiveUI('searchOpen')}
        noteCount={noteCounts[activePanel]}
        hasFile={!!activePanelFileId}
      />

      <div className={styles.body}>
        <Sidebar
          open={sidebarOpen}
          files={files}
          activeFileId={activePanelFileId}
          onFileSelect={handleFileSelect}
          onFileDelete={handleFileDelete}
          onUpload={handleUpload}
          showToast={showToast}
        />

        <main className={styles.main}>
          {files.length === 0 && !panel1FileId ? (
            <EmptyState onUpload={handleUpload} />
          ) : (
            <div ref={panelsRef} className={styles.panels}>
              {!splitView ? (
                <div
                  className={styles.singleWrapper}
                  style={{ width: `${singlePanelWidth}%` }}
                >
                  <div
                    className={`${styles.resizeHandle} ${styles.handleLeft}`}
                    onMouseDown={e => handleResizeStart(e, 'single', 'left')}
                  />
                  <ViewerPanel
                    panelId={1}
                    fileId={panel1FileId}
                    isActive={activePanel === 1}
                    onFocus={() => setActivePanel(1)}
                    onClose={() => setPanel1FileId(null)}
                    onScrollProgress={setReadingProgress}
                    tocOpen={panelUI[1].tocOpen}
                    notesOpen={panelUI[1].notesOpen}
                    searchOpen={panelUI[1].searchOpen}
                    onSetTocOpen={(v) => setPanelUIKey(1, 'tocOpen', v)}
                    onSetNotesOpen={(v) => setPanelUIKey(1, 'notesOpen', v)}
                    onSetSearchOpen={(v) => setPanelUIKey(1, 'searchOpen', v)}
                    onNoteCountChange={(count) => setNoteCounts(prev => ({ ...prev, 1: count }))}
                    showToast={showToast}
                  />
                  <div
                    className={`${styles.resizeHandle} ${styles.handleRight}`}
                    onMouseDown={e => handleResizeStart(e, 'single', 'right')}
                  />
                </div>
              ) : (
                <>
                  <div style={{ flex: splitRatio, minWidth: 0, overflow: 'hidden', height: '100%' }}>
                    <ViewerPanel
                      panelId={1}
                      fileId={panel1FileId}
                      isActive={activePanel === 1}
                      onFocus={() => setActivePanel(1)}
                      onClose={() => setPanel1FileId(null)}
                      onScrollProgress={setReadingProgress}
                      tocOpen={panelUI[1].tocOpen}
                      notesOpen={panelUI[1].notesOpen}
                      searchOpen={panelUI[1].searchOpen}
                      onSetTocOpen={(v) => setPanelUIKey(1, 'tocOpen', v)}
                      onSetNotesOpen={(v) => setPanelUIKey(1, 'notesOpen', v)}
                      onSetSearchOpen={(v) => setPanelUIKey(1, 'searchOpen', v)}
                      onNoteCountChange={(count) => setNoteCounts(prev => ({ ...prev, 1: count }))}
                      showToast={showToast}
                    />
                  </div>
                  <div
                    className={styles.splitDivider}
                    onMouseDown={e => handleResizeStart(e, 'split')}
                  />
                  <div style={{ flex: 1 - splitRatio, minWidth: 0, overflow: 'hidden', height: '100%' }}>
                    <ViewerPanel
                      panelId={2}
                      fileId={panel2FileId}
                      isActive={activePanel === 2}
                      onFocus={() => setActivePanel(2)}
                      onClose={() => setPanel2FileId(null)}
                      onScrollProgress={setReadingProgress}
                      tocOpen={panelUI[2].tocOpen}
                      notesOpen={panelUI[2].notesOpen}
                      searchOpen={panelUI[2].searchOpen}
                      onSetTocOpen={(v) => setPanelUIKey(2, 'tocOpen', v)}
                      onSetNotesOpen={(v) => setPanelUIKey(2, 'notesOpen', v)}
                      onSetSearchOpen={(v) => setPanelUIKey(2, 'searchOpen', v)}
                      onNoteCountChange={(count) => setNoteCounts(prev => ({ ...prev, 2: count }))}
                      showToast={showToast}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      <Toast toasts={toasts} />
    </div>
  )
}
