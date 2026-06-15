import { useState, useEffect, useCallback } from 'react'
import * as termsApi from '../api/terms'

export function useTerms(fileId, showToast) {
  const [terms, setTerms] = useState([])

  useEffect(() => {
    if (!fileId) { setTerms([]); return }
    termsApi.getTerms(fileId).then(setTerms).catch(() => {})
  }, [fileId])

  const addTerm = useCallback(async ({ term, definition }) => {
    try {
      const created = await termsApi.createTerm(fileId, { term, definition })
      setTerms(prev => [...prev, created])
    } catch {
      showToast('Failed to save term', 'error')
    }
  }, [fileId, showToast])

  const editTerm = useCallback(async (termId, definition) => {
    try {
      const updated = await termsApi.updateTerm(termId, definition)
      setTerms(prev => prev.map(t => t.id === termId ? updated : t))
    } catch {
      showToast('Failed to update term', 'error')
    }
  }, [showToast])

  const removeTerm = useCallback(async (termId) => {
    try {
      await termsApi.deleteTerm(termId)
      setTerms(prev => prev.filter(t => t.id !== termId))
    } catch {
      showToast('Failed to delete term', 'error')
    }
  }, [showToast])

  return { terms, addTerm, editTerm, removeTerm }
}
