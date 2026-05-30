import { useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const DAYS_VN = ['T2','T3','T4','T5','T6','T7','CN']
const fmt = h => h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`
const fmtBig = n => {
  const num = parseInt(n || 0)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000)     return `${(num / 1_000).toFixed(0)}K`
  return num > 0 ? num.toString() : '—'
}

function MiniBarChart({ data, peakIdx, color }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-px h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: `${Math.max(4, Math.round(v / max * 100))}%`,
            backgroundColor: i === peakIdx
              ? color === 'violet' ? 'rgba(139,92,246,0.9)' : 'rgba(249,115,22,0.9)'
              : color === 'violet' ? 'rgba(139,92,246,0.25)' : 'rgba(249,115,22,0.25)',
          }}
        />
      ))}
    </div>
  )
}

function ChannelCard({ label, color, data, loading, error, onSearch }) {
  const [input, setInput] = useState('')
  const [limit, setLimit] = useState(30)

  const accentCls = color === 'violet'
    ? { border: 'border-violet-500/30', ring: 'focus:border-violet-500', btn: 'bg-violet-600 hover:bg-violet-500', tag: 'text-violet-400', glow: 'glow-purple-sm' }
    : { border: 'border-orange-500/30', ring: 'focus:border-orange-500', btn: 'bg-orange-600 hover:bg-orange-500', tag: 'text-orange-400', glow: '' }

  const avg = arr => {
    const w = arr.filter(v => parseInt(v.viewCount || 0) > 0)
    return w.length ? Math.round(w.reduce((s, v) => s + parseInt(v.viewCount), 0) / w.length) : 0
  }

  return (
    <div className={`flex-1 min-w-0 rounded-xl border ${data ? accentCls.border : 'border-zinc-800'} bg-zinc-900/50 p-4 flex flex-col gap-3`}>
      {/* Label */}
      <div className={`text-[10px] font-bold uppercase tracking-widest ${accentCls.tag}`}>{label}</div>

      {/* Search */}
      {!data ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && input.trim() && onSearch(input.trim(), limit)}
              placeholder="@channel hoặc URL..."
              disabled={loading}
              className={`flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100
                placeholder:text-zinc-600 focus:outline-none ${accentCls.ring} focus:ring-1 focus:ring-violet-500/20
                disabled:opacity-40 transition-all`}
            />
            <button
              onClick={() => input.trim() && onSearch(input.trim(), limit)}
              disabled={loading || !input.trim()}
              className={`px-3 py-2 rounded-lg text-xs font-medium text-white ${accentCls.btn} ${accentCls.glow}
                disabled:opacity-40 disabled:cursor-not-allowed transition-all`}>
              {loading ? (
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : 'Phân tích'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 w-24">Số video: {limit}</span>
            <input type="range" min={10} max={50} step={5} value={limit}
              onChange={e => setLimit(Number(e.target.value))} disabled={loading}
              className="flex-1 h-1 appearance-none rounded-full bg-zinc-700 accent-violet-500 cursor-pointer disabled:opacity-40"/>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Channel info */}
          <div className="flex items-center gap-2.5">
            {data.channel.thumbnail && (
              <img src={data.channel.thumbnail} alt="" className="w-9 h-9 rounded-full object-cover border border-zinc-700"/>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">{data.channel.name}</p>
              <p className="text-[10px] text-zinc-500">{fmtBig(data.channel.subscriberCount)} subs</p>
            </div>
            <button onClick={() => onSearch(null)}
              className="ml-auto text-zinc-600 hover:text-zinc-300 transition-colors text-xs">✕</button>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Avg views', value: fmtBig(avg(data.videos)), color: accentCls.tag },
              { label: 'Peak hour', value: fmt(data.peakHour), color: accentCls.tag },
              { label: 'Peak day',  value: data.peakDayName, color: accentCls.tag },
              { label: 'Videos',    value: data.analyzedCount, color: 'text-zinc-400' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 rounded-lg px-2.5 py-2 border border-zinc-800">
                <p className="text-[9px] text-zinc-600 uppercase tracking-wider">{s.label}</p>
                <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Mini hour chart */}
          <div>
            <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Giờ đăng (24h)</p>
            <MiniBarChart data={data.hourData} peakIdx={data.peakHour} color={color}/>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CompareSection({ apiBase, apiKey }) {
  const [open, setOpen] = useState(false)
  const [data1, setData1] = useState(null)
  const [data2, setData2] = useState(null)
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [error1, setError1] = useState(null)
  const [error2, setError2] = useState(null)

  const fetchChannel = async (channel, limit, setData, setLoading, setError) => {
    if (!channel) { setData(null); return }
    setLoading(true); setError(null)
    try {
      const headers = {}
      if (apiKey) headers['X-API-Key'] = apiKey
      const res  = await fetch(`${apiBase}/api/analyze?channel=${encodeURIComponent(channel)}&limit=${limit}`, { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Lỗi không xác định')
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Comparison rows
  const compare = data1 && data2 ? [
    {
      label: 'Kênh', fmt: d =>
        <div className="flex items-center gap-1.5">
          {d.channel.thumbnail && <img src={d.channel.thumbnail} alt="" className="w-5 h-5 rounded-full"/>}
          <span className="font-semibold text-zinc-200 text-xs truncate">{d.channel.name}</span>
        </div>,
    },
    { label: 'Subscribers', fmt: d => fmtBig(d.channel.subscriberCount) },
    {
      label: 'Avg views',
      fmt: d => {
        const w = d.videos.filter(v => parseInt(v.viewCount || 0) > 0)
        return fmtBig(w.length ? Math.round(w.reduce((s, v) => s + parseInt(v.viewCount), 0) / w.length) : 0)
      },
      win: (v1, v2) => {
        const parse = s => parseInt((s || '0').replace(/[KMB]/g, m => ({ K: 'e3', M: 'e6', B: 'e9' }[m])) || 0)
        return parse(v1) >= parse(v2) ? 'left' : 'right'
      },
    },
    { label: 'Peak hour',  fmt: d => fmt(d.peakHour) },
    { label: 'Peak day',   fmt: d => d.peakDayName },
    { label: 'Videos analyzed', fmt: d => d.analyzedCount },
    { label: 'Phương thức', fmt: d => d.fetchMethod?.toUpperCase() },
  ] : []

  return (
    <div className="card overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/40 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-zinc-200">So sánh 2 kênh</p>
            <p className="text-xs text-zinc-500">Đối chiếu số liệu hai kênh cạnh nhau</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {/* Content */}
      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-zinc-800">
          <div className="h-4"/>
          {/* Two channel panels */}
          <div className="flex flex-col sm:flex-row gap-4">
            <ChannelCard
              label="Kênh A"
              color="violet"
              data={data1}
              loading={loading1}
              error={error1}
              onSearch={(ch, lim) => fetchChannel(ch, lim, setData1, setLoading1, setError1)}
            />
            <ChannelCard
              label="Kênh B"
              color="orange"
              data={data2}
              loading={loading2}
              error={error2}
              onSearch={(ch, lim) => fetchChannel(ch, lim, setData2, setLoading2, setError2)}
            />
          </div>

          {/* Comparison table */}
          {data1 && data2 && (
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800/60">
                    <th className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider text-left px-4 py-2.5 w-1/3">Tiêu chí</th>
                    <th className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider text-center px-4 py-2.5">Kênh A</th>
                    <th className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider text-center px-4 py-2.5">Kênh B</th>
                  </tr>
                </thead>
                <tbody>
                  {compare.map((row, i) => {
                    const v1 = row.fmt(data1)
                    const v2 = row.fmt(data2)
                    return (
                      <tr key={row.label}
                        className={`border-t border-zinc-800 ${i % 2 === 0 ? '' : 'bg-zinc-900/30'}`}>
                        <td className="text-[11px] text-zinc-500 px-4 py-2.5">{row.label}</td>
                        <td className="text-[11px] text-zinc-200 px-4 py-2.5 text-center">{v1}</td>
                        <td className="text-[11px] text-zinc-200 px-4 py-2.5 text-center">{v2}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(data1 || data2) && !(data1 && data2) && (
            <p className="text-xs text-zinc-600 text-center">← Nhập kênh còn lại để xem bảng so sánh</p>
          )}
        </div>
      )}
    </div>
  )
}
