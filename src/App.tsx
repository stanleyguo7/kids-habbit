import { useEffect, useMemo, useState } from 'react'
import './App.css'

type User = {
  id: string
  name: string
}

type ToyRecord = {
  id: string
  toyName: string
  amount: number
  date: string
  note?: string
  photoDataUrl?: string
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
  const [toyName, setToyName] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined)

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

  const onPhotoChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const addRecord = () => {
    if (!toyName.trim() || !date || amount === '' || Number(amount) <= 0) return
    const newRecord: ToyRecord = {
      id: crypto.randomUUID(),
      toyName: toyName.trim(),
      amount: Number(amount),
      date,
      note: note.trim() || undefined,
      photoDataUrl,
    }
    setStore((prev) => ({
      ...prev,
      [activeUserId]: [newRecord, ...(prev[activeUserId] ?? [])],
    }))
    setToyName('')
    setAmount('')
    setNote('')
    setPhotoDataUrl(undefined)
    setDate(new Date().toISOString().slice(0, 10))
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
        <h2>玩具记账</h2>
        <p className="sub">{activeUser.name} 的本月购买记录</p>
        <div className="form-grid">
          <label>
            玩具名称
            <input value={toyName} onChange={(e) => setToyName(e.target.value)} placeholder="例如：积木车" />
          </label>
          <label>
            金额（元）
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')} />
          </label>
          <label>
            日期
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            备注（可选）
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：自己攒钱买" />
          </label>
          <label>
            上传玩具照片
            <input type="file" accept="image/*" onChange={(e) => onPhotoChange(e.target.files?.[0])} />
          </label>
          {photoDataUrl && <img className="preview" src={photoDataUrl} alt="预览" />}
        </div>
        <button className="primary" onClick={addRecord}>保存记录</button>
      </section>

      <section className="card">
        <h2>按月查看历史</h2>
        {grouped.length === 0 ? (
          <p className="sub">还没有记录，先添加第一条吧～</p>
        ) : (
          grouped.map((g) => (
            <div key={g.month} className="month-block">
              <h3>{formatMonth(g.month)}</h3>
              <div className="thumbs">
                {g.list.map((item) => (
                  <article key={item.id} className="record">
                    <div className="thumb-wrap">
                      {item.photoDataUrl ? (
                        <img src={item.photoDataUrl} alt={item.toyName} className="thumb" />
                      ) : (
                        <div className="thumb placeholder">无图</div>
                      )}
                    </div>
                    <div className="meta">
                      <strong>{item.toyName}</strong>
                      <span>¥{item.amount}</span>
                      <span>{item.date}</span>
                      {item.note && <em>{item.note}</em>}
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
