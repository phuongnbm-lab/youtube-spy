const MONTHS_VN = ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12']

function parseDate(publishedAt) {
  const [datePart] = (publishedAt || '').split(' ')
  const [d, m, y] = datePart.split('/').map(Number)
  return new Date(y, m - 1, d)
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`
}

export default function UploadStats({ videos }) {
  if (!videos || videos.length < 2) return null

  // Sort by date ascending
  const sorted = [...videos].sort((a, b) => parseDate(a.publishedAt) - parseDate(b.publishedAt))

  const firstDate = parseDate(sorted[0].publishedAt)
  const lastDate  = parseDate(sorted[sorted.length - 1].publishedAt)
  const dayRange  = Math.max(1, Math.round((lastDate - firstDate) / 86400000))
  const weekRange = Math.max(1, dayRange / 7)
  const avgPerWeek = (sorted.length / weekRange).toFixed(1)

  // Most active month
  const monthMap = {}
  sorted.forEach(v => {
    const key = `${v.year}-${String(v.month).padStart(2,'0')}`
    monthMap[key] = (monthMap[key] || 0) + 1
  })
  const topMonthEntry = Object.entries(monthMap).sort((a, b) => b[1] - a[1])[0]
  const [topMonthKey, topMonthCount] = topMonthEntry || ['', 0]
  const [tmYear, tmMonth] = topMonthKey.split('-')
  const topMonthLabel = tmMonth ? `${MONTHS_VN[parseInt(tmMonth) - 1]} ${tmYear}` : ''

  // Longest consecutive-week streak
  const weekSet = new Set(sorted.map(v => isoWeek(parseDate(v.publishedAt))))
  const weekArr = [...weekSet].sort()
  let maxStreak = 1, curStreak = 1
  for (let i = 1; i < weekArr.length; i++) {
    const [yr1, w1] = weekArr[i - 1].split('-W').map(Number)
    const [yr2, w2] = weekArr[i].split('-W').map(Number)
    const isConsec = (yr2 === yr1 && w2 === w1 + 1) || (yr2 === yr1 + 1 && w1 >= 52 && w2 === 1)
    curStreak = isConsec ? curStreak + 1 : 1
    maxStreak = Math.max(maxStreak, curStreak)
  }

  // Last 8 months bar chart data
  const last8 = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
  const maxMonthCount = Math.max(...last8.map(([, c]) => c), 1)

  // Date range display
  const fmtDate = d => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Tần suất đăng bài</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Phân tích lịch trình và độ đều đặn của kênh</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Trung bình/tuần</p>
          <p className="text-xl font-bold text-indigo-400">{avgPerWeek}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">video/tuần</p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Streak dài nhất</p>
          <p className="text-xl font-bold text-violet-400">{maxStreak}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">tuần liên tiếp</p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Tháng đỉnh</p>
          <p className="text-base font-bold text-amber-400 leading-tight">{topMonthLabel}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">{topMonthCount} video</p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Khoảng thời gian</p>
          <p className="text-base font-bold text-zinc-300 leading-tight">{dayRange}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">ngày phân tích</p>
        </div>
      </div>

      {/* Mini bar chart — video count per month */}
      {last8.length > 1 && (
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Video theo tháng (8 tháng gần nhất)</p>
          <div className="flex items-end gap-1.5 h-16">
            {last8.map(([key, count]) => {
              const [yr, mo] = key.split('-')
              const pct = Math.round(count / maxMonthCount * 100)
              const isTop = count === maxMonthCount
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </span>
                  <div className="w-full flex items-end" style={{ height: '40px' }}>
                    <div
                      className={`w-full rounded-t transition-all ${isTop ? 'bg-indigo-500' : 'bg-zinc-700 group-hover:bg-zinc-600'}`}
                      style={{ height: `${Math.max(10, pct)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-600 truncate w-full text-center">
                    {MONTHS_VN[parseInt(mo) - 1]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-zinc-700 mt-3">
        Dữ liệu từ {fmtDate(firstDate)} → {fmtDate(lastDate)} · {sorted.length} video được phân tích
      </p>
    </div>
  )
}
