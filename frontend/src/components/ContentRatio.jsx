function fmtViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n > 0 ? n.toLocaleString() : '—'
}

function avgViews(arr) {
  const w = arr.filter(v => parseInt(v.viewCount || 0) > 0)
  return w.length ? Math.round(w.reduce((s, v) => s + parseInt(v.viewCount), 0) / w.length) : 0
}

export default function ContentRatio({ videos }) {
  if (!videos?.length) return null

  const total  = videos.length
  const shorts = videos.filter(v => v.isShort)
  const longs  = videos.filter(v => !v.isShort)

  const shortPct = Math.round(shorts.length / total * 100)
  const longPct  = 100 - shortPct

  const shortAvg = avgViews(shorts)
  const longAvg  = avgViews(longs)

  // Engagement rate: likeCount / viewCount
  const withEng = videos.filter(v => parseInt(v.viewCount || 0) > 0 && parseInt(v.likeCount || 0) > 0)
  const engRate  = withEng.length
    ? (withEng.reduce((s, v) => s + parseInt(v.likeCount) / parseInt(v.viewCount), 0) / withEng.length * 100).toFixed(2)
    : null

  // Top 3 by engagement
  const topEng = [...videos]
    .filter(v => parseInt(v.viewCount || 0) > 500 && parseInt(v.likeCount || 0) > 0)
    .map(v => ({ ...v, eng: parseInt(v.likeCount) / parseInt(v.viewCount) * 100 }))
    .sort((a, b) => b.eng - a.eng)
    .slice(0, 3)

  const winner = shortAvg > longAvg ? 'short' : longAvg > shortAvg ? 'long' : null

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Tỉ lệ nội dung & Engagement</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Phân tích Short vs Long và mức độ tương tác</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Short vs Long */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tỉ lệ Short / Long</p>

          {/* Progress bar */}
          <div className="flex rounded-full overflow-hidden h-3 bg-zinc-800">
            {shorts.length > 0 && (
              <div className="bg-rose-500 transition-all" style={{ width: `${shortPct}%` }}/>
            )}
            {longs.length > 0 && (
              <div className="bg-sky-500 transition-all" style={{ width: `${longPct}%` }}/>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 border ${winner === 'short' ? 'border-rose-500/40 bg-rose-500/5' : 'border-zinc-800 bg-zinc-900'}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"/>
                <span className="text-[11px] font-semibold text-zinc-300">🩳 Short</span>
                {winner === 'short' && <span className="text-[9px] text-rose-400 bg-rose-500/10 px-1 rounded">views cao hơn</span>}
              </div>
              <p className="text-xl font-bold text-rose-400">{shortPct}%</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{shorts.length} video · avg {fmtViews(shortAvg)} views</p>
            </div>

            <div className={`rounded-xl p-3 border ${winner === 'long' ? 'border-sky-500/40 bg-sky-500/5' : 'border-zinc-800 bg-zinc-900'}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"/>
                <span className="text-[11px] font-semibold text-zinc-300">📹 Long</span>
                {winner === 'long' && <span className="text-[9px] text-sky-400 bg-sky-500/10 px-1 rounded">views cao hơn</span>}
              </div>
              <p className="text-xl font-bold text-sky-400">{longPct}%</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{longs.length} video · avg {fmtViews(longAvg)} views</p>
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Engagement rate (Likes/Views)</p>
            {engRate && (
              <span className="text-sm font-bold text-emerald-400">{engRate}% avg</span>
            )}
          </div>

          {topEng.length > 0 ? (
            <div className="flex flex-col gap-2">
              {topEng.map((v, i) => (
                <a key={v.videoId} href={`https://youtube.com/watch?v=${v.videoId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800
                    hover:border-zinc-700 transition-colors group">
                  <span className="text-xs text-zinc-600 w-4 shrink-0">#{i + 1}</span>
                  {v.thumbnail && (
                    <img src={v.thumbnail} alt="" className="w-12 h-[27px] rounded object-cover shrink-0"/>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-zinc-300 truncate group-hover:text-violet-300 transition-colors">
                      {v.title}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {fmtViews(parseInt(v.viewCount))} views
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 shrink-0">
                    {v.eng.toFixed(1)}%
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-600 italic">Không đủ dữ liệu để tính engagement</p>
          )}
        </div>
      </div>
    </div>
  )
}
