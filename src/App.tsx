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

function App() {
  const [activeUserId, setActiveUserId] = useState<string>(USERS[0].id)
  const [store, setStore] = useState<Store>({})
  const [uploading, setUploading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    const raw = localStorage.getItem(APP_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { activeUserId?: string; recordsByUser?: Store }
      if (parsed.activeUserId) setActiveUserId(parsed.activeUserId)
      if (parsed.recordsByUser) setStore(parsed.recordsByUser)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(APP_KEY, JSON.stringify({ activeUserId, recordsByUser: store }))
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

  const onPhotosChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    const results = await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<ToyRecord>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              resolve({
                id: crypto.randomUUID(),
                date: `${selectedMonth}-01`,
                photoDataUrl: reader.result as string,
              })
            }
            reader.readAsDataURL(file)
          }),
      ),
    )

    setStore((prev) => ({
      ...prev,
      [activeUserId]: [...results, ...(prev[activeUserId] ?? [])],
    }))

    setUploading(false)
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
          <input type="file" accept="image/*" multiple onChange={(e) => onPhotosChange(e.target.files)} />
        </label>
        {uploading && <p className="sub">上传处理中...</p>}
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
