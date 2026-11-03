const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('markvault', {
  getPendingFile: () => ipcRenderer.invoke('get-pending-file'),
  onOpenFile: (cb) => {
    const handler = (_e, id) => cb(id)
    ipcRenderer.on('open-file', handler)
    return () => ipcRenderer.removeListener('open-file', handler)
  },
})
