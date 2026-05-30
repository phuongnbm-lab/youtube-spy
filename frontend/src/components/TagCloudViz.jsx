import { useMemo, useState } from 'react'

function fileSlug(name) {
  return (name || 'channel').replace(/[^\wÀ-ɏ一-鿿]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'channel'
}
function today() { return new Date().toISOString().slice(0, 10) }

function exportTagsTxt(tagFreq, channelName) {
  const lines = tagFreq.map(([tag, count]) => `${tag} (${count})`).join('\n')
  const blob = new Blob([`YouTube Spy — Tag Export — ${channelName || 'channel'}\n${'='.repeat(30)}\n\n${lines}`], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${fileSlug(channelName)}_${today()}_tags.txt`; a.click()
  URL.revokeObjectURL(url)
}

export default function TagCloudViz({ videos, channelName }) {
  const [showAll, setShowAll] = useState(false)
  const [copied, setCopied] = useState(false)

  const tagFreq = useMemo(() => {
    const freq = {}
    videos.forEach(v => {
      ;(v.tags || []).forEach(tag => {
        const t = tag.toLowerCase().trim()
        if (t) freq[t] = (freq[t] || 0) + 1
      })
    })
    return Object.entries(freq).sort((a, b) => b[1] - a[1])
  }, [videos])

  if (tagFreq.length < 3) return null

  const maxCount  = tagFreq[0][1]
  const displayed = showAll ? tagFreq : tagFreq.slice(0, 40)

  const getStyle = (count) => {
    const ratio = count / maxCount
    if (ratio > 0.7) return { text: 'text-sky-200 text-lg font-bold',   bg: 'bg-sky-500/20 border-sky-500/40 hover:bg-sky-500/30' }
    if (ratio > 0.4) return { text: 'text-sky-300 text-sm font-semibold', bg: 'bg-sky-500/12 border-sky-500/25 hover:bg-sky-500/20' }
    if (ratio > 0.2) return { text: 'text-sky-400 text-xs font-medium',  bg: 'bg-sky-500/8 border-sky-500/15 hover:bg-sky-500/15' }
    return             { text: 'text-zinc-400 text-xs',                  bg: 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700' }
  }

  // Top 3 for highlight
  const top3 = tagFreq.slice(0, 3)

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Tag Cloud SEO</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Thẻ tag được dùng nhiều nhất — keyword SEO của đối thủ</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600 font-mono">{tagFreq.length} tag</span>
          {/* Copy all */}
          <button
            onClick={() => {
              const text = tagFreq.map(([t]) => t).join(', ')
              navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
            }}
            title="Copy tất cả tag"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] transition-all ${
              copied ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                     : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
            }`}>
            {copied
              ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            }
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {/* Export TXT */}
          <button
            onClick={() => exportTagsTxt(tagFreq, channelName)}
            title="Xuất tag ra file .txt"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] bg-zinc-800 border-zinc-700
              text-zinc-500 hover:text-sky-400 hover:border-sky-500/40 transition-all">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            TXT
          </button>
        </div>
      </div>

      {/* Top 3 podium */}
      <div className="flex gap-2 mb-4">
        {top3.map(([tag, count], i) => {
          const medals = ['🥇','🥈','🥉']
          return (
            <div key={tag}
              className="flex-1 bg-zinc-900 rounded-xl p-2.5 border border-zinc-800 text-center">
              <div className="text-base mb-0.5">{medals[i]}</div>
              <p className="text-xs font-bold text-sky-300 truncate">#{tag}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{count} video</p>
            </div>
          )
        })}
      </div>

      {/* Tag cloud */}
      <div className="flex flex-wrap gap-2 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        {displayed.map(([tag, count]) => {
          const s = getStyle(count)
          return (
            <span key={tag}
              className={`px-2 py-1 rounded-lg border cursor-default transition-colors ${s.text} ${s.bg}`}
              title={`#${tag} · ${count} video`}>
              #{tag}
              <span className="text-[9px] opacity-50 ml-1">{count}</span>
            </span>
          )
        })}
      </div>

      {tagFreq.length > 40 && (
        <button onClick={() => setShowAll(v => !v)}
          className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full text-center">
          {showAll ? '▲ Thu gọn' : `▼ Xem thêm ${tagFreq.length - 40} tag`}
        </button>
      )}
    </div>
  )
}
