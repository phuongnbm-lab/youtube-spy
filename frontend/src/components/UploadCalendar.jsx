import { useMemo, useState } from 'react'

const MONTHS_VN = ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12']
const DAYS_SHORT = ['CN','T2','T3','T4','T5','T6','T7']

function parseDate(s) {
  const [datePart] = (s || '').split(' ')
  const [d, m, y] = datePart.split('/').map(Number)
  return isNaN(y) ? null : new Date(y, m - 1, d)
}

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

export default function UploadCalendar({ videos }) {
  const [tooltip, setTooltip] = useState(null) // {x, y, date, vids}

  const { dayMap, weeks, monthLabels, minDate, maxDate } = useMemo(() => {
    if (!videos.length) return { dayMap: {}, weeks: [], monthLabels: [], minDate: null, maxDate: null }

    // Build day → videos map
    const dayMap = {}
    videos.forEach(v => {
      const d = parseDate(v.publishedAt)
      if (!d) return
      const key = toKey(d)
      ;(dayMap[key] = dayMap[key] || []).push(v)
    })

    // Date range: earliest video to latest (or max 52 weeks)
    const dates = Object.keys(dayMap).sort()
    if (!dates.length) return { dayMap: {}, weeks: [], monthLabels: [], minDate: null, maxDate: null }

    const rawMin  = new Date(dates[0])
    const rawMax  = new Date(dates[dates.length - 1])
    const daySpan = Math.round((rawMax - rawMin) / 86400000)
    const COLS    = Math.min(53, Math.ceil(daySpan / 7) + 2) // max 53 weeks

    // Start from Sunday before rawMin
    const startDay = new Date(rawMin)
    startDay.setDate(startDay.getDate() - startDay.getDay()) // back to Sunday

    // Build weeks × 7 grid
    const weeks = []
    const monthLabels = [] // [{col, label}]
    let prevMonth = -1

    for (let col = 0; col < COLS; col++) {
      const week = []
      for (let row = 0; row < 7; row++) {
        const d = addDays(startDay, col * 7 + row)
        week.push(d)
        if (row === 0 && d.getMonth() !== prevMonth) {
          monthLabels.push({ col, label: MONTHS_VN[d.getMonth()] })
          prevMonth = d.getMonth()
        }
      }
      weeks.push(week)
    }

    return { dayMap, weeks, monthLabels, minDate: rawMin, maxDate: rawMax }
  }, [videos])

  if (!weeks.length) return null

  const maxCount = Math.max(...Object.values(dayMap).map(a => a.length), 1)

  const cellColor = (count) => {
    if (!count) return 'bg-zinc-800/70'
    const ratio = count / maxCount
    if (ratio >= 0.75) return 'bg-violet-400'
    if (ratio >= 0.5)  return 'bg-violet-500/80'
    if (ratio >= 0.25) return 'bg-violet-600/70'
    return 'bg-violet-700/60'
  }

  const totalDays  = Object.keys(dayMap).length
  const totalVids  = videos.length
  const maxInDay   = maxCount
  const busyDay    = Object.entries(dayMap).sort((a,b)=>b[1].length-a[1].length)[0]

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Lịch đăng bài</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{totalVids} video trên {totalDays} ngày</p>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span>Ít</span>
          {['bg-zinc-800/70','bg-violet-700/60','bg-violet-600/70','bg-violet-500/80','bg-violet-400'].map((c,i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`}/>
          ))}
          <span>Nhiều</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-0.5 min-w-max">
          {/* Month labels */}
          <div className="flex gap-0.5 mb-1 ml-6">
            {(() => {
              const els = []
              for (let col = 0; col < weeks.length; col++) {
                const ml = monthLabels.find(m => m.col === col)
                els.push(
                  <div key={col} className="w-3 text-[9px] text-zinc-600 overflow-visible whitespace-nowrap">
                    {ml ? ml.label : ''}
                  </div>
                )
              }
              return els
            })()}
          </div>

          {/* 7 rows (Sun–Sat) */}
          {[0,1,2,3,4,5,6].map(row => (
            <div key={row} className="flex items-center gap-0.5">
              <span className="text-[9px] text-zinc-700 w-5 text-right mr-1 shrink-0">
                {row % 2 === 1 ? DAYS_SHORT[row] : ''}
              </span>
              {weeks.map((week, col) => {
                const d = week[row]
                const key = toKey(d)
                const vids = dayMap[key] || []
                const count = vids.length
                return (
                  <div
                    key={col}
                    className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-violet-400 hover:ring-offset-1 hover:ring-offset-zinc-950 ${cellColor(count)}`}
                    onMouseEnter={e => {
                      if (count > 0) setTooltip({ key, d, vids })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    title={count > 0 ? `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} — ${count} video` : ''}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip video list */}
      {tooltip && (
        <div className="mt-3 bg-zinc-900 rounded-xl border border-violet-500/20 p-3 animate-in fade-in">
          <p className="text-[10px] text-violet-400 font-semibold mb-2">
            📅 {tooltip.d.getDate()}/{tooltip.d.getMonth()+1}/{tooltip.d.getFullYear()} — {tooltip.vids.length} video
          </p>
          <div className="flex flex-col gap-1.5">
            {tooltip.vids.map(v => (
              <a key={v.videoId} href={`https://youtube.com/watch?v=${v.videoId}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-violet-300 transition-colors group">
                {v.thumbnail && <img src={v.thumbnail} alt="" className="w-10 h-[22px] rounded object-cover shrink-0"/>}
                <span className="text-xs text-zinc-400 group-hover:text-violet-300 truncate">{v.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="mt-4 flex gap-3 flex-wrap">
        {[
          { label: 'Ngày có video', value: totalDays },
          { label: 'Nhiều nhất/ngày', value: maxInDay },
          { label: 'Ngày bận nhất', value: busyDay ? busyDay[0] : '—' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">
            <p className="text-[10px] text-zinc-600">{s.label}</p>
            <p className="text-xs font-semibold text-zinc-300">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
