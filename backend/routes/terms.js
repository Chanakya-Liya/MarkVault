const express = require('express')
const { nanoid } = require('nanoid')
const db = require('../db')

const router = express.Router()

router.get('/files/:id/terms', (req, res) => {
  try {
    const terms = db.prepare(
      'SELECT * FROM term_definitions WHERE file_id = ? ORDER BY created_at'
    ).all(req.params.id)
    res.json(terms)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/files/:id/terms', (req, res) => {
  try {
    const { term, definition } = req.body
    if (!term?.trim()) return res.status(400).json({ error: 'term required' })
    if (!definition?.trim()) return res.status(400).json({ error: 'definition required' })

    const id = nanoid()
    const created_at = new Date().toISOString()
    db.prepare(
      'INSERT INTO term_definitions (id, file_id, term, definition, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.params.id, term.trim(), definition.trim(), created_at)

    res.status(201).json(db.prepare('SELECT * FROM term_definitions WHERE id = ?').get(id))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/terms/:id', (req, res) => {
  try {
    const { definition } = req.body
    if (!definition?.trim()) return res.status(400).json({ error: 'definition required' })

    const result = db.prepare(
      'UPDATE term_definitions SET definition = ? WHERE id = ?'
    ).run(definition.trim(), req.params.id)
    if (result.changes === 0) return res.status(404).json({ error: 'Term not found' })

    res.json(db.prepare('SELECT * FROM term_definitions WHERE id = ?').get(req.params.id))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/terms/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM term_definitions WHERE id = ?').run(req.params.id)
    if (result.changes === 0) return res.status(404).json({ error: 'Term not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
