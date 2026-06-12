import { useState, useCallback, useEffect } from 'react'
import * as notesApi from '../api/notes'

export function useNotes(fileId, showToast) {
  const [notes, setNotes] = useState([])

  const fetchNotes = useCallback(async () => {
    if (!fileId) return setNotes([])
    try {
      const data = await notesApi.getNotes(fileId)
      setNotes(data)
    } catch {
      showToast('Storage error', 'error')
    }
  }, [fileId, showToast])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const addNote = useCallback(async (data) => {
    try {
      const note = await notesApi.createNote(fileId, data)
      setNotes(prev => [...prev, note])
      showToast('Note saved', 'success')
      return note
    } catch {
      showToast('Storage error', 'error')
    }
  }, [fileId, showToast])

  const editNote = useCallback(async (noteId, content) => {
    try {
      const updated = await notesApi.updateNote(noteId, content)
      setNotes(prev => prev.map(n => (n.id === noteId ? updated : n)))
    } catch {
      showToast('Storage error', 'error')
    }
  }, [showToast])

  const removeNote = useCallback(async (noteId) => {
    try {
      await notesApi.deleteNote(noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
      showToast('Note deleted', 'info')
    } catch {
      showToast('Storage error', 'error')
    }
  }, [showToast])

  return { notes, fetchNotes, addNote, editNote, removeNote }
}
