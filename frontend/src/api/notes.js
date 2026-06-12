const API = '/api'

export async function getNotes(fileId) {
  const res = await fetch(`${API}/files/${fileId}/notes`)
  if (!res.ok) throw new Error('Failed to fetch notes')
  return res.json()
}

export async function createNote(fileId, data) {
  const res = await fetch(`${API}/files/${fileId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create note')
  return res.json()
}

export async function updateNote(noteId, noteContent) {
  const res = await fetch(`${API}/notes/${noteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note_content: noteContent }),
  })
  if (!res.ok) throw new Error('Failed to update note')
  return res.json()
}

export async function deleteNote(noteId) {
  const res = await fetch(`${API}/notes/${noteId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete note')
  return res.json()
}
