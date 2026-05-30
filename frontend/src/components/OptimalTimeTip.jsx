const fmt = h => h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`

export default function OptimalTimeTip({ peakHour, peakDayName, videos }) {
  if (!videos?.length) return null

  const withViews = v => parseInt(v.viewCount || 0) > 0
  const avg = arr => {
    const w = arr.filter(withViews)
    return w.length ? Math.round(w.reduce((s, v) => s + parseInt(v.viewCount), 0) / w.length) : 0
  }

  const peakAvg    = avg(videos.filter(v => v.hour === peakHour))
  const overallAvg = avg(videos)
  const boost      = overallAvg > 0 ? Math.round((peakAvg - overallAvg) / overallAvg * 100) : 0
  const earlyHour  = ((peakHour - 1) + 24) % 24

  return (
    <div className="card p-5">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Gợi ý khung giờ đăng</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Chiến lược cạnh tranh dựa trên dữ liệu đối thủ</p>
        </div>
      </div>

      {/* 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div className="bg-zinc-900 rounded-xl p-3.5 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1.5">Đối thủ đăng lúc</p>
          <p className="text-2xl font-bold text-rose-400">{fmt(peakHour)}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{peakDayName} · giờ cao điểm</p>
        </div>

        <div className="bg-emerald-500/5 rounded-xl p-3.5 border border-emerald-500/20">
          <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider mb-1.5">Bạn nên đăng lúc</p>
          <p className="text-2xl font-bold text-emerald-400">{fmt(earlyHour)}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Trước đối thủ 1 tiếng</p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-3.5 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1.5">Views giờ cao điểm</p>
          <p className={`text-2xl font-bold ${boost > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
            {boost > 0 ? `+${boost}%` : boost < 0 ? `${boost}%` : '—'}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">so với trung bình kênh</p>
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2 bg-violet-500/5 border border-violet-500/15 rounded-lg px-3 py-2.5">
        <svg className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
        </svg>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Đối thủ thường đăng vào{' '}
          <span className="text-violet-300 font-medium">{peakDayName} lúc {fmt(peakHour)}</span>.
          {' '}Đăng lúc{' '}
          <span className="text-emerald-400 font-medium">{fmt(earlyHour)}</span>
          {' '}để video được index trước — khán giả tìm kiếm nội dung tương tự sẽ thấy bạn xuất hiện trước đối thủ.
        </p>
      </div>
    </div>
  )
}
