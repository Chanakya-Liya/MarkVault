const fs = require('fs')
const path = require('path')
const { nanoid } = require('nanoid')
const db = require('./db')

const FILE_COLUMNS = 'id, name, upload_date, size, sort_order'

function insertFile(name, content, sourcePath = null) {
  const id = nanoid()
  const upload_date = new Date().toISOString()
  const size = Buffer.byteLength(content, 'utf8')
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM files').get()
  const sort_order = (maxOrder.m ?? -1) + 1

  db.prepare('INSERT INTO files (id, name, content, upload_date, size, sort_order, source_path) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, content, upload_date, size, sort_order, sourcePath)
  return db.prepare(`SELECT ${FILE_COLUMNS} FROM files WHERE id = ?`).get(id)
}

function uniqueName(name) {
  const taken = new Set(db.prepare('SELECT name FROM files').all().map(r => r.name))
  if (!taken.has(name)) return name
  const ext = path.extname(name)
  const base = name.slice(0, name.length - ext.length)
  let counter = 2
  while (taken.has(`${base}(${counter})${ext}`)) counter++
  return `${base}(${counter})${ext}`
}

// Adds a file from disk to the library, or refreshes the existing entry for that path
function importFromPath(absPath) {
  const resolved = path.resolve(absPath)
  const key = resolved.toLowerCase()
  const content = fs.readFileSync(resolved, 'utf8')

  const existing = db.prepare('SELECT id, content FROM files WHERE source_path = ?').get(key)
  if (existing) {
    if (existing.content !== content) {
      db.prepare('UPDATE files SET content = ?, size = ? WHERE id = ?')
        .run(content, Buffer.byteLength(content, 'utf8'), existing.id)
    }
    return db.prepare(`SELECT ${FILE_COLUMNS} FROM files WHERE id = ?`).get(existing.id)
  }

  return insertFile(uniqueName(path.basename(resolved)), content, key)
}

module.exports = { importFromPath, insertFile }
