const express = require('express')
const { nanoid } = require('nanoid')
const db = require('../db')

const router = express.Router()

router.get('/files', (req, res) => {
  try {
    const files = db.prepare('SELECT id, name, upload_date, size, sort_order FROM files ORDER BY sort_order ASC, upload_date DESC').all()
    res.json(files)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/files', (req, res) => {
  try {
    const { name, content } = req.body
    if (!name || content === undefined) return res.status(400).json({ error: 'name and content required' })

    const id = nanoid()
    const upload_date = new Date().toISOString()
    const size = Buffer.byteLength(content, 'utf8')
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM files').get()
    const sort_order = (maxOrder.m ?? -1) + 1

    db.prepare('INSERT INTO files (id, name, content, upload_date, size, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, content, upload_date, size, sort_order)
    const file = db.prepare('SELECT id, name, upload_date, size, sort_order FROM files WHERE id = ?').get(id)
    res.status(201).json(file)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Must be before /:id to avoid being matched as id='reorder'
router.patch('/files/reorder', (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' })
    const update = db.prepare('UPDATE files SET sort_order = ? WHERE id = ?')
    db.transaction((ids) => { ids.forEach((id, i) => update.run(i, id)) })(ids)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/files/:id', (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })
    const result = db.prepare('UPDATE files SET name = ? WHERE id = ?').run(name, req.params.id)
    if (result.changes === 0) return res.status(404).json({ error: 'File not found' })
    const file = db.prepare('SELECT id, name, upload_date, size, sort_order FROM files WHERE id = ?').get(req.params.id)
    res.json(file)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/files/:id', (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id)
    if (!file) return res.status(404).json({ error: 'File not found' })
    res.json(file)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/files/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id)
    if (result.changes === 0) return res.status(404).json({ error: 'File not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
