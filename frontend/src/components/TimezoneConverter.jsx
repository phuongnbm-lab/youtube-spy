const ZONES = [
  { flag: '🇪🇸', name: 'Tây Ban Nha', tz: 'Europe/Madrid' },
  { flag: '🇬🇧', name: 'Anh', tz: 'Europe/London' },
  { flag: '🇫🇷', name: 'Pháp', tz: 'Europe/Paris' },
  { flag: '🇩🇪', name: 'Đức', tz: 'Europe/Berlin' },
  { flag: '🇺🇸', name: 'Mỹ (New York)', tz: 'America/New_York' },
  { flag: '🇺🇸', name: 'Mỹ (Los Angeles)', tz: 'America/Los_Angeles' },
  { flag: '🇧🇷', name: 'Brazil', tz: 'America/Sao_Paulo' },
  { flag: '🇯🇵', name: 'Nhật Bản', tz: 'Asia/Tokyo' },
  { flag: '🇰🇷', name: 'Hàn Quốc', tz: 'Asia/Seoul' },
  { flag: '🇨🇳', name: 'Trung Quốc', tz: 'Asia/Shanghai' },
  { flag: '🇮🇳', name: 'Ấn Độ', tz: 'Asia/Kolkata' },
  { flag: '🇦🇺', name: 'Úc (Sydney)', tz: 'Australia/Sydney' },
]

function convertVNHour(vnHour, targetTz) {
  // Vietnam = UTC+7 (no DST). Convert peak hour to a real UTC timestamp,
  // then format in the target timezone (Intl handles DST automatically).
  const now = new Date()
  const utcHour = ((vnHour - 7) % 24 + 24) % 24
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), utcHour, 0, 0))

  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: targetTz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)

  // Detect if it's the previous or next day
  const targetDay = new Intl.DateTimeFormat('en-US', {
    timeZone: targetTz,
    day: 'numeric',
  }).format(d)
  const vnDay = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: 'numeric',
  }).format(d)
  const diff = parseInt(targetDay) - parseInt(vnDay)
  let dayNote = ''
  if (diff < 0 || diff > 15) dayNote = '−1 ngày'
  else if (diff > 0) dayNote = '+1 ngày'

  return { timeStr, dayNote }
}

function vnHourLabel(h) {
  if (h === 0) return '12:00 AM'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

export default function TimezoneConverter({ peakHour }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Quy đổi múi giờ</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Giờ đăng cao điểm{' '}
            <span className="text-violet-400 font-mono font-medium">{vnHourLabel(peakHour)} (VN)</span>
            {' '}tương đương với:
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {ZONES.map(({ flag, name, tz }) => {
          const { timeStr, dayNote } = convertVNHour(peakHour, tz)
          return (
            <div key={tz}
              className="flex items-center gap-2.5 bg-zinc-900 rounded-lg px-3 py-2.5
                border border-zinc-800 hover:border-zinc-700 transition-colors">
              <span className="text-lg leading-none">{flag}</span>
              <div className="min-w-0">
                <div className="text-xs text-zinc-500 truncate">{name}</div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-sm font-mono font-semibold text-zinc-200">{timeStr}</span>
                  {dayNote && (
                    <span className="text-[10px] font-medium text-amber-500 shrink-0">{dayNote}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
