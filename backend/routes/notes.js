const express = require('express')
const { nanoid } = require('nanoid')
const db = require('../db')

const router = express.Router()

const VALID_COLORS = ['yellow', 'green', 'blue', 'pink']
const VALID_TYPES  = ['note', 'question']

router.get('/files/:id/notes', (req, res) => {
  try {
    const notes = db.prepare('SELECT * FROM inline_notes WHERE file_id = ? ORDER BY created_at').all(req.params.id)
    res.json(notes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/files/:id/notes', (req, res) => {
  try {
    const { selected_text, context_before, context_after, note_content, color, type } = req.body
    const noteType = VALID_TYPES.includes(type) ? type : 'note'

    if (!selected_text) return res.status(400).json({ error: 'selected_text required' })
    if (noteType === 'note' && !note_content) return res.status(400).json({ error: 'note_content required for notes' })

    const id = nanoid()
    const created_at = new Date().toISOString()
    const noteColor = VALID_COLORS.includes(color) ? color : 'yellow'
    const content = note_content || ''

    db.prepare(`
      INSERT INTO inline_notes (id, file_id, selected_text, context_before, context_after, note_content, color, created_at, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, selected_text, context_before || '', context_after || '', content, noteColor, created_at, noteType)

    const note = db.prepare('SELECT * FROM inline_notes WHERE id = ?').get(id)
    res.status(201).json(note)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/notes/:id', (req, res) => {
  try {
    const { note_content } = req.body
    if (note_content === undefined || note_content === null) return res.status(400).json({ error: 'note_content required' })

    const result = db.prepare('UPDATE inline_notes SET note_content = ? WHERE id = ?').run(note_content, req.params.id)
    if (result.changes === 0) return res.status(404).json({ error: 'Note not found' })

    const note = db.prepare('SELECT * FROM inline_notes WHERE id = ?').get(req.params.id)
    res.json(note)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/notes/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM inline_notes WHERE id = ?').run(req.params.id)
    if (result.changes === 0) return res.status(404).json({ error: 'Note not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
