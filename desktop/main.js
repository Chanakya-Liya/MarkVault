const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron')
const fs = require('fs')
const path = require('path')

const PORT = 47823
const MD_RE = /\.(md|markdown)$/i

const userData = app.getPath('userData')
const dbPath = path.join(userData, 'markvault.db')
const statePath = path.join(userData, 'window-state.json')
const backendDir = app.isPackaged ? path.join(__dirname, 'backend') : path.join(__dirname, '..', 'backend')
const frontendDir = app.isPackaged ? path.join(process.resourcesPath, 'frontend') : path.join(__dirname, '..', 'frontend', 'dist')
const defaultLegacyDb = app.isPackaged ? null : path.join(__dirname, '..', 'data', 'markvault.db')

let win = null
let serverUrl = null
let importFromPath = null
let pendingFileId = null

function mdPathsFrom(argv) {
  return argv.slice(app.isPackaged ? 1 : 2).filter(a => MD_RE.test(a) && fs.existsSync(a))
}

function openPaths(paths) {
  for (const p of paths) {
    try {
      const file = importFromPath(p)
      if (win && !win.isDestroyed() && !win.webContents.isLoading()) win.webContents.send('open-file', file.id)
      else pendingFileId = file.id
    } catch (err) {
      dialog.showErrorBox('MarkVault', `Could not open ${p}\n${err.message}`)
    }
  }
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(statePath, 'utf8')) } catch { return {} }
}

function createWindow() {
  const state = loadState()
  win = new BrowserWindow({
    width: state.width || 1280,
    height: state.height || 820,
    x: state.x,
    y: state.y,
    title: 'MarkVault',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  if (state.maximized) win.maximize()

  win.on('close', () => {
    try {
      const b = win.getNormalBounds()
      fs.writeFileSync(statePath, JSON.stringify({ ...b, maximized: win.isMaximized() }))
    } catch {}
  })
  win.on('closed', () => { win = null })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(serverUrl)) {
      e.preventDefault()
      if (/^https?:/i.test(url)) shell.openExternal(url)
    }
  })

  win.loadURL(serverUrl)
}

// Copies a MarkVault database into place using SQLite's backup API (WAL-safe)
async function copyLibrary(src, dest) {
  const Database = require('better-sqlite3')
  const source = new Database(src, { readonly: true, fileMustExist: true })
  try { await source.backup(dest) } finally { source.close() }
}

async function pickLibrary() {
  const res = await dialog.showOpenDialog({
    title: 'Select markvault.db',
    properties: ['openFile'],
    filters: [{ name: 'MarkVault database', extensions: ['db'] }],
    defaultPath: defaultLegacyDb && fs.existsSync(defaultLegacyDb) ? defaultLegacyDb : undefined,
  })
  return res.canceled ? null : res.filePaths[0]
}

async function firstRunImport() {
  if (fs.existsSync(dbPath)) return
  let src = defaultLegacyDb && fs.existsSync(defaultLegacyDb) ? defaultLegacyDb : null
  const choice = dialog.showMessageBoxSync({
    type: 'question',
    title: 'MarkVault',
    message: 'Import your existing MarkVault library?',
    detail: src ? `Found: ${src}` : 'Choose the markvault.db from your Docker setup (the "data" folder), or start fresh.',
    buttons: [src ? 'Import' : 'Browse…', 'Start fresh'],
    defaultId: 0,
    cancelId: 1,
  })
  if (choice !== 0) return
  if (!src) src = await pickLibrary()
  if (!src) return
  try {
    fs.mkdirSync(userData, { recursive: true })
    await copyLibrary(src, dbPath)
  } catch (err) {
    dialog.showErrorBox('MarkVault', `Import failed: ${err.message}`)
  }
}

async function menuImportLibrary() {
  const src = await pickLibrary()
  if (!src) return
  const ok = dialog.showMessageBoxSync(win, {
    type: 'warning',
    message: 'Replace your current library?',
    detail: 'This overwrites the current MarkVault library with the selected database, then restarts the app.',
    buttons: ['Replace', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
  })
  if (ok !== 0) return
  try {
    const tmp = dbPath + '.import'
    fs.rmSync(tmp, { force: true })
    await copyLibrary(src, tmp)
    app.once('quit', () => {
      for (const ext of ['', '-wal', '-shm']) fs.rmSync(dbPath + ext, { force: true })
      fs.renameSync(tmp, dbPath)
    })
    app.relaunch()
    app.quit()
  } catch (err) {
    dialog.showErrorBox('MarkVault', `Import failed: ${err.message}`)
  }
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const res = await dialog.showOpenDialog(win, {
              properties: ['openFile', 'multiSelections'],
              filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
            })
            if (!res.canceled) openPaths(res.filePaths)
          },
        },
        { label: 'Import library…', click: menuImportLibrary },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { role: 'viewMenu' },
  ]))
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', (_e, argv) => openPaths(mdPathsFrom(argv)))

  ipcMain.handle('get-pending-file', () => {
    const id = pendingFileId
    pendingFileId = null
    return id
  })

  app.whenReady().then(async () => {
    await firstRunImport()
    process.env.DB_PATH = dbPath
    fs.mkdirSync(userData, { recursive: true })

    const { createServer } = require(path.join(backendDir, 'server.js'))
    ;({ importFromPath } = require(path.join(backendDir, 'importPath.js')))

    let started
    try {
      started = await createServer({ port: PORT, host: '127.0.0.1', staticDir: frontendDir })
    } catch {
      started = await createServer({ port: 0, host: '127.0.0.1', staticDir: frontendDir })
    }
    serverUrl = `http://127.0.0.1:${started.port}`

    buildMenu()
    const initial = mdPathsFrom(process.argv)
    createWindow()
    openPaths(initial)
  })

  app.on('window-all-closed', () => app.quit())
}
