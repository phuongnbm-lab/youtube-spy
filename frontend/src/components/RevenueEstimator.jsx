import { useState, useMemo } from 'react'

const NICHES = [
  { label: '🎭 Giải trí / Vlog',     rpmMin: 0.5, rpmMax: 2  },
  { label: '🎮 Gaming',               rpmMin: 1,   rpmMax: 4  },
  { label: '📚 Giáo dục',             rpmMin: 2,   rpmMax: 6  },
  { label: '💻 Công nghệ / AI',       rpmMin: 3,   rpmMax: 8  },
  { label: '💰 Tài chính / Đầu tư',  rpmMin: 5,   rpmMax: 15 },
  { label: '💄 Sức khoẻ / Làm đẹp',  rpmMin: 2,   rpmMax: 6  },
  { label: '🍜 Ẩm thực / Du lịch',   rpmMin: 1,   rpmMax: 4  },
  { label: '📺 Phim / Review',        rpmMin: 1,   rpmMax: 3  },
]

const fmt$ = n => {
  if (n <= 0) return '$0'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${Math.round(n)}`
}

const fmtRange = (a, b) => (a <= 0 && b <= 0) ? '—' : `${fmt$(a)} – ${fmt$(b)}`

export default function RevenueEstimator({ videos }) {
  const [nicheIdx, setNicheIdx] = useState(0)
  const niche = NICHES[nicheIdx]

  const stats = useMemo(() => {
    const withViews = videos.filter(v => parseInt(v.viewCount || 0) > 0)
    if (!withViews.length) return null

    // Monthly views grouped
    const monthMap = {}
    withViews.forEach(v => {
      const key = `${v.year}-${String(v.month).padStart(2, '0')}`
      monthMap[key] = (monthMap[key] || 0) + parseInt(v.viewCount)
    })
    const monthlyArr = Object.values(monthMap)
    const avgMonthlyViews = Math.round(monthlyArr.reduce((s, x) => s + x, 0) / monthlyArr.length)
    const avgViews = Math.round(withViews.reduce((s, v) => s + parseInt(v.viewCount), 0) / withViews.length)

    return { avgMonthlyViews, avgViews }
  }, [videos])

  if (!stats) return null

  const { avgMonthlyViews, avgViews } = stats
  const minMonth = Math.round(avgMonthlyViews * niche.rpmMin / 1000)
  const maxMonth = Math.round(avgMonthlyViews * niche.rpmMax / 1000)
  const minYear  = minMonth * 12
  const maxYear  = maxMonth * 12
  const minPer   = +(avgViews * niche.rpmMin / 1000).toFixed(2)
  const maxPer   = +(avgViews * niche.rpmMax / 1000).toFixed(2)

  // Gauge bar width for monthly income vs reference ($10K)
  const gaugeMax = 10_000
  const gaugePct = Math.min(100, Math.round(maxMonth / gaugeMax * 100))

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Ước tính doanh thu quảng cáo</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Tính theo RPM trung bình ngành (AdSense YouTube)</p>
          </div>
        </div>
        {/* Niche selector */}
        <select value={nicheIdx} onChange={e => setNicheIdx(Number(e.target.value))}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300
            focus:outline-none focus:border-violet-500 cursor-pointer transition-colors">
          {NICHES.map((n, i) => <option key={i} value={i}>{n.label}</option>)}
        </select>
      </div>

      {/* 3 main cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider mb-2">💵 Mỗi tháng</p>
          <p className="text-2xl font-bold text-emerald-400">{fmtRange(minMonth, maxMonth)}</p>
          <p className="text-[11px] text-zinc-500 mt-1">~{(avgMonthlyViews / 1000).toFixed(0)}K views/tháng</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">📅 Cả năm</p>
          <p className="text-2xl font-bold text-zinc-200">{fmtRange(minYear, maxYear)}</p>
          <p className="text-[11px] text-zinc-600 mt-1">Ước tính 12 tháng</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">🎬 Mỗi video</p>
          <p className="text-2xl font-bold text-zinc-200">{fmtRange(minPer, maxPer)}</p>
          <p className="text-[11px] text-zinc-600 mt-1">avg {(avgViews / 1000).toFixed(1)}K views</p>
        </div>
      </div>

      {/* Gauge bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-zinc-600 mb-1.5">
          <span>$0</span>
          <span className="text-emerald-500">{fmt$(maxMonth)}/tháng</span>
          <span>$10K+</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${gaugePct}%` }}/>
        </div>
      </div>

      {/* RPM table */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-800">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">RPM theo ngành ($/1000 views)</p>
        </div>
        <div className="grid grid-cols-4 divide-x divide-zinc-800">
          {NICHES.slice(0, 4).map((n, i) => (
            <button key={i} onClick={() => setNicheIdx(i)}
              className={`px-2 py-2 text-center transition-colors ${i === nicheIdx ? 'bg-violet-500/10' : 'hover:bg-zinc-800'}`}>
              <p className="text-[9px] text-zinc-500 truncate">{n.label.split(' ').slice(1).join(' ')}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${i === nicheIdx ? 'text-violet-400' : 'text-zinc-400'}`}>
                ${n.rpmMin}–${n.rpmMax}
              </p>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-zinc-700 mt-3">
        ⚠️ Ước tính dựa trên RPM trung bình. Doanh thu thực tế phụ thuộc vào quốc gia người xem, thời điểm trong năm và nhiều yếu tố khác.
      </p>
    </div>
  )
}
