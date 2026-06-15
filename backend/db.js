const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'markvault.db')
const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    content     TEXT NOT NULL,
    upload_date TEXT NOT NULL,
    size        INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inline_notes (
    id              TEXT PRIMARY KEY,
    file_id         TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    selected_text   TEXT NOT NULL,
    context_before  TEXT NOT NULL,
    context_after   TEXT NOT NULL,
    note_content    TEXT NOT NULL,
    color           TEXT NOT NULL DEFAULT 'yellow',
    created_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS term_definitions (
    id         TEXT PRIMARY KEY,
    file_id    TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    term       TEXT NOT NULL,
    definition TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`)

// Migrations — safe to run on every start
try { db.exec(`ALTER TABLE inline_notes ADD COLUMN type TEXT NOT NULL DEFAULT 'note'`) } catch {}
try { db.exec(`ALTER TABLE files ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`) } catch {}
// Backfill sort_order for existing files using upload_date order
try {
  const rows = db.prepare(`SELECT id FROM files WHERE sort_order = 0 ORDER BY upload_date ASC`).all()
  if (rows.length > 1) {
    const update = db.prepare(`UPDATE files SET sort_order = ? WHERE id = ?`)
    db.transaction((rows) => { rows.forEach((r, i) => update.run(i, r.id)) })(rows)
  }
} catch {}

module.exports = db
