import { useState, useCallback } from 'react'
import * as filesApi from '../api/files'

export function useFiles(showToast) {
  const [files, setFiles] = useState([])

  const fetchFiles = useCallback(async () => {
    try {
      const data = await filesApi.getFiles()
      setFiles(data)
    } catch {
      showToast('Storage error', 'error')
    }
  }, [showToast])

  const uploadFiles = useCallback(async (fileList, currentFiles) => {
    const uploaded = []
    const usedNames = new Set(currentFiles.map(f => f.name))
    for (const file of fileList) {
      if (!file.name.match(/\.(md|markdown)$/i)) {
        showToast('Only .md files allowed', 'error')
        continue
      }
      if (file.size > 1024 * 1024) {
        showToast(`${file.name} is over 1MB — uploading anyway`, 'info')
      }
      const content = await file.text()

      let name = file.name
      if (usedNames.has(name)) {
        const ext = name.match(/\.(md|markdown)$/i)[0]
        const base = name.slice(0, name.length - ext.length)
        let counter = 2
        while (usedNames.has(`${base}(${counter})${ext}`)) counter++
        name = `${base}(${counter})${ext}`
      }
      usedNames.add(name)

      try {
        const created = await filesApi.uploadFile(name, content)
        uploaded.push(created)
        showToast('File uploaded', 'success')
      } catch {
        showToast('Upload failed', 'error')
      }
    }
    if (uploaded.length) await fetchFiles()
    return uploaded
  }, [fetchFiles, showToast])

  const removeFile = useCallback(async (id) => {
    try {
      await filesApi.deleteFile(id)
      setFiles(prev => prev.filter(f => f.id !== id))
      showToast('File deleted', 'info')
    } catch {
      showToast('Storage error', 'error')
    }
  }, [showToast])

  const reorderFiles = useCallback(async (ids) => {
    // Optimistic update
    setFiles(prev => ids.map(id => prev.find(f => f.id === id)).filter(Boolean))
    try {
      await filesApi.reorderFiles(ids)
    } catch {
      showToast('Failed to save order', 'error')
      await fetchFiles()
    }
  }, [fetchFiles, showToast])

  const renameFile = useCallback(async (id, name) => {
    try {
      const updated = await filesApi.renameFile(id, name)
      setFiles(prev => prev.map(f => f.id === id ? { ...f, name: updated.name } : f))
      showToast('File renamed', 'success')
    } catch {
      showToast('Rename failed', 'error')
    }
  }, [showToast])

  return { files, fetchFiles, uploadFiles, removeFile, reorderFiles, renameFile }
}
