import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import sqlite3 from 'sqlite3'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, 'data')
const uploadDir = path.join(__dirname, 'uploads')
fs.mkdirSync(dataDir, { recursive: true })
fs.mkdirSync(uploadDir, { recursive: true })

const db = new sqlite3.Database(path.join(dataDir, 'kids-habbit.db'))
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS toy_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      month TEXT NOT NULL,
      image_path TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `)
})

const app = express()
app.use(cors())
app.use('/uploads', express.static(uploadDir))

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg') || '.jpg'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})
const upload = multer({ storage })

app.get('/api/records/:userId', (req, res) => {
  db.all(
    'SELECT id, user_id as userId, month, image_path as imagePath, created_at as createdAt FROM toy_records WHERE user_id = ? ORDER BY id DESC',
    [req.params.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(rows)
    },
  )
})

app.post('/api/records/:userId', upload.array('photos', 20), (req, res) => {
  const { userId } = req.params
  const { month } = req.body
  if (!month) return res.status(400).json({ error: 'month required' })
  const files = req.files || []
  if (!files.length) return res.status(400).json({ error: 'photos required' })

  const createdAt = new Date().toISOString()
  const stmt = db.prepare('INSERT INTO toy_records (user_id, month, image_path, created_at) VALUES (?, ?, ?, ?)')

  for (const file of files) {
    stmt.run(userId, month, `/uploads/${file.filename}`, createdAt)
  }
  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ ok: true, count: files.length })
  })
})

const port = process.env.PORT || 8787
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
