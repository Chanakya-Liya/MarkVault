const express = require('express')
const cors = require('cors')
const filesRouter = require('./routes/files')
const notesRouter = require('./routes/notes')
const termsRouter = require('./routes/terms')

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api', filesRouter)
app.use('/api', notesRouter)
app.use('/api', termsRouter)

app.listen(3001, '0.0.0.0', () => {
  console.log('MarkVault backend running on port 3001')
})
