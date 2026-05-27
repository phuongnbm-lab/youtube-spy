function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`card card-hover p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-zinc-100">{value}</div>
        {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
      </div>
    </div>
  )
}

function formatSubscribers(count) {
  const n = parseInt(count || '0')
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export default function StatsCards({ data }) {
  const { channel, analyzedCount, peakHour, peakDayName, hourData, dayData, fetchMethod } = data

  const peakHourCount = hourData[peakHour]
  const peakHourPct = Math.round((peakHourCount / analyzedCount) * 100)
  const peakDayCount = Math.max(...dayData)
  const peakDayPct = Math.round((peakDayCount / analyzedCount) * 100)

  const hourStr = peakHour < 12
    ? `${peakHour === 0 ? 12 : peakHour}:00 AM`
    : `${peakHour === 12 ? 12 : peakHour - 12}:00 PM`

  return (
    <div className="space-y-4">
      {/* RSS warning */}
      {fetchMethod === 'rss' && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3">
          <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-amber-300/90">
            Kênh này bị giới hạn truy cập qua YouTube API — đang dùng RSS feed. Chỉ hiển thị <strong>15 video gần nhất</strong>, không phân trang được.
          </p>
        </div>
      )}
      {/* Channel info */}
      <div className="card p-5 flex items-center gap-4">
        {channel.thumbnail ? (
          <img
            src={channel.thumbnail}
            alt={channel.name}
            className="w-14 h-14 rounded-full ring-2 ring-violet-500/30"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
            <svg className="w-7 h-7 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-zinc-100 truncate">{channel.name}</h2>
          {channel.description && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{channel.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold text-zinc-300">
            {formatSubscribers(channel.subscriberCount)} subs
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {parseInt(channel.videoCount || 0).toLocaleString()} videos
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Video đã phân tích"
          value={analyzedCount}
          sub="video gần nhất (giờ VN)"
          accent="bg-blue-500/10 text-blue-400"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          }
        />
        <StatCard
          label="Giờ đăng nhiều nhất"
          value={hourStr}
          sub={`${peakHourCount} video · ${peakHourPct}% tổng số`}
          accent="bg-violet-500/10 text-violet-400"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Ngày đăng nhiều nhất"
          value={peakDayName}
          sub={`${peakDayCount} video · ${peakDayPct}% tổng số`}
          accent="bg-pink-500/10 text-pink-400"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Múi giờ hiển thị"
          value="ICT UTC+7"
          sub="Giờ Việt Nam (Hà Nội)"
          accent="bg-emerald-500/10 text-emerald-400"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
    </div>
  )
}
