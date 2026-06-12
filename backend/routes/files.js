const express = require('express')
const { nanoid } = require('nanoid')
const db = require('../db')

const router = express.Router()

router.get('/files', (req, res) => {
  try {
    const files = db.prepare('SELECT id, name, upload_date, size FROM files ORDER BY upload_date DESC').all()
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

    db.prepare('INSERT INTO files (id, name, content, upload_date, size) VALUES (?, ?, ?, ?, ?)').run(id, name, content, upload_date, size)
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id)
    res.status(201).json(file)
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
