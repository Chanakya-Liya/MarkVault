const API = '/api'

export async function getTerms(fileId) {
  const res = await fetch(`${API}/files/${fileId}/terms`)
  if (!res.ok) throw new Error('Failed to fetch terms')
  return res.json()
}

export async function createTerm(fileId, data) {
  const res = await fetch(`${API}/files/${fileId}/terms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create term')
  return res.json()
}

export async function updateTerm(termId, definition) {
  const res = await fetch(`${API}/terms/${termId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ definition }),
  })
  if (!res.ok) throw new Error('Failed to update term')
  return res.json()
}

export async function deleteTerm(termId) {
  const res = await fetch(`${API}/terms/${termId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete term')
  return res.json()
}
