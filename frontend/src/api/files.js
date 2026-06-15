const API = '/api'

export async function getFiles() {
  const res = await fetch(`${API}/files`)
  if (!res.ok) throw new Error('Failed to fetch files')
  return res.json()
}

export async function getFile(id) {
  const res = await fetch(`${API}/files/${id}`)
  if (!res.ok) throw new Error('Failed to fetch file')
  return res.json()
}

export async function uploadFile(name, content) {
  const res = await fetch(`${API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, content }),
  })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

export async function deleteFile(id) {
  const res = await fetch(`${API}/files/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
  return res.json()
}

export async function reorderFiles(ids) {
  const res = await fetch(`${API}/files/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error('Reorder failed')
  return res.json()
}

export async function renameFile(id, name) {
  const res = await fetch(`${API}/files/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Rename failed')
  return res.json()
}
