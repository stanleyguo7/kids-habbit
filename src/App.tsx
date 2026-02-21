import { useEffect, useMemo, useState } from 'react'
import './App.css'

type User = { id: string; name: string }
type ToyRecord = { id: number; userId: string; month: string; imagePath: string; createdAt: string }

const USERS: User[] = [
  { id: 'xiaoyuan', name: '小元' },
  { id: 'xiaoman', name: '小满' },
]

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  return `${y}年${Number(m)}月`
}

function App() {
  const [activeUserId, setActiveUserId] = useState(USERS[0].id)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [records, setRecords] = useState<ToyRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const activeUser = USERS.find((u) => u.id === activeUserId)!

  const loadRecords = async (userId: string) => {
    const res = await fetch(`/api/records/${userId}`)
    if (!res.ok) throw new Error('加载失败')
    const data = (await res.json()) as ToyRecord[]
    setRecords(data)
  }

  useEffect(() => {
    loadRecords(activeUserId).catch(() => setError('加载记录失败，请确认后端已启动'))
  }, [activeUserId])

  const grouped = useMemo(() => {
    const map = new Map<string, ToyRecord[]>()
    for (const r of records) {
      if (!map.has(r.month)) map.set(r.month, [])
      map.get(r.month)!.push(r)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [records])

  const onPhotosChange = async (files: FileList | null, inputEl?: HTMLInputElement) => {
    if (!files?.length) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('month', selectedMonth)
      Array.from(files).forEach((f) => fd.append('photos', f))

      const res = await fetch(`/api/records/${activeUserId}`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) throw new Error('上传失败')
      await loadRecords(activeUserId)
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
        <p>玩具记账（SQLite 版）</p>
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
        <h2>上传玩具照片</h2>
        <p className="sub">{activeUser.name}：选择月份后可一次上传多张</p>
        <label>
          记录月份
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
        </label>
        <label>
          上传照片（可多选）
          <input type="file" accept="image/*" multiple onChange={(e) => onPhotosChange(e.target.files, e.currentTarget)} />
        </label>
        {uploading && <p className="sub">上传处理中...</p>}
        {error && <p className="sub" style={{ color: '#dc2626' }}>{error}</p>}
      </section>

      <section className="card">
        <h2>按月查看历史</h2>
        {grouped.length === 0 ? (
          <p className="sub">还没有记录，先上传第一张吧～</p>
        ) : (
          grouped.map(([month, list]) => (
            <div key={month} className="month-block">
              <h3>{formatMonth(month)}</h3>
              <div className="thumbs">
                {list.map((item) => (
                  <article key={item.id} className="record">
                    <div className="thumb-wrap">
                      <img src={item.imagePath} alt="玩具照片" className="thumb" />
                    </div>
                    <div className="meta">
                      <span>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
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
