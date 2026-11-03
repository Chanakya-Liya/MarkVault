const express = require('express')
const cors = require('cors')
const path = require('path')
const filesRouter = require('./routes/files')
const notesRouter = require('./routes/notes')
const termsRouter = require('./routes/terms')

function createServer({ port = 3001, host = '0.0.0.0', staticDir } = {}) {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '10mb' }))

  app.use('/api', filesRouter)
  app.use('/api', notesRouter)
  app.use('/api', termsRouter)

  // Desktop app serves the built frontend from the same origin
  if (staticDir) {
    app.use(express.static(staticDir))
    app.get('*', (req, res) => res.sendFile(path.join(staticDir, 'index.html')))
  }

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host)
    server.once('error', reject)
    server.once('listening', () => resolve({ server, port: server.address().port }))
  })
}

module.exports = { createServer }

if (require.main === module) {
  createServer().then(() => console.log('MarkVault backend running on port 3001'))
}
