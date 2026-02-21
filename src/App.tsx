import { useEffect, useMemo, useState } from 'react'
import './App.css'

type User = {
  id: string
  name: string
}

type ToyRecord = {
  id: string
  date: string
  photoDataUrl: string
}

const USERS: User[] = [
  { id: 'xiaoyuan', name: '小元' },
  { id: 'xiaoman', name: '小满' },
]

const APP_KEY = 'kids-habbit:v1'
type Store = Record<string, ToyRecord[]>

const monthKey = (date: string) => date.slice(0, 7)

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  return `${y}年${Number(m)}月`
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('图片解码失败'))
    el.src = original
  })

  const maxWidth = 1280
  const scale = Math.min(1, maxWidth / img.width)
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return original
  ctx.drawImage(img, 0, 0, w, h)

  return canvas.toDataURL('image/jpeg', 0.78)
}

function App() {
  const [activeUserId, setActiveUserId] = useState<string>(USERS[0].id)
  const [store, setStore] = useState<Store>({})
  const [uploading, setUploading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [error, setError] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(APP_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { activeUserId?: string; recordsByUser?: Store }
      if (parsed.activeUserId) setActiveUserId(parsed.activeUserId)
      if (parsed.recordsByUser) setStore(parsed.recordsByUser)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(APP_KEY, JSON.stringify({ activeUserId, recordsByUser: store }))
      setError('')
    } catch {
      setError('存储空间不足：请先删除一部分历史照片（建议后续迁移 IndexedDB）')
    }
  }, [activeUserId, store])

  const activeUser = USERS.find((u) => u.id === activeUserId)!
  const records = store[activeUserId] ?? []

  const grouped = useMemo(() => {
    const map = new Map<string, ToyRecord[]>()
    for (const r of records) {
      const mk = monthKey(r.date)
      if (!map.has(mk)) map.set(mk, [])
      map.get(mk)!.push(r)
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, list]) => ({ month, list: list.sort((a, b) => b.date.localeCompare(a.date)) }))
  }, [records])

  const onPhotosChange = async (files: FileList | null, inputEl?: HTMLInputElement) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')

    try {
      const results = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: crypto.randomUUID(),
          date: `${selectedMonth}-01`,
          photoDataUrl: await compressImageToDataUrl(file),
        })),
      )

      setStore((prev) => ({
        ...prev,
        [activeUserId]: [...results, ...(prev[activeUserId] ?? [])],
      }))
    } catch {
      setError('上传失败，请重试')
    } finally {
      setUploading(false)
      if (inputEl) inputEl.value = ''
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>孩子习惯小程序</h1>
        <p>先从“玩具记账”开始，后续可以加更多小工具</p>
      </header>

      <section className="card">
        <div className="row between">
          <h2>当前用户</h2>
          <select value={activeUserId} onChange={(e) => setActiveUserId(e.target.value)}>
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="card">
        <h2>玩具记账（极速版）</h2>
        <p className="sub">{activeUser.name}：不需要输入文字，先选月份，再上传照片（可多张）</p>
        <label>
          记录月份
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
        </label>
        <label>
          上传玩具照片（可多选）
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onPhotosChange(e.target.files, e.currentTarget)}
          />
        </label>
        {uploading && <p className="sub">上传处理中...</p>}
        {error && <p className="sub" style={{ color: '#dc2626' }}>{error}</p>}
      </section>

      <section className="card">
        <h2>按月查看历史</h2>
        {grouped.length === 0 ? (
          <p className="sub">还没有记录，先上传第一张吧～</p>
        ) : (
          grouped.map((g) => (
            <div key={g.month} className="month-block">
              <h3>{formatMonth(g.month)}</h3>
              <div className="thumbs">
                {g.list.map((item) => (
                  <article key={item.id} className="record">
                    <div className="thumb-wrap">
                      <img src={item.photoDataUrl} alt="玩具照片" className="thumb" />
                    </div>
                    <div className="meta">
                      <span>{item.date}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}

export default App
