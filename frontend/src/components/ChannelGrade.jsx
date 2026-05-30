import { useMemo } from 'react'

function parseDate(s) {
  const [datePart] = (s || '').split(' ')
  const [d, m, y] = datePart.split('/').map(Number)
  return new Date(y, m - 1, d)
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return `${d.getUTCFullYear()}-W${Math.ceil((((d - y0) / 86400000) + 1) / 7)}`
}

const GRADES = [
  { min: 92, grade: 'S',  color: 'text-yellow-300', bg: 'bg-yellow-400/10 border-yellow-400/30', desc: 'Xuất sắc' },
  { min: 85, grade: 'A+', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30', desc: 'Rất tốt' },
  { min: 75, grade: 'A',  color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/20', desc: 'Tốt' },
  { min: 65, grade: 'B+', color: 'text-sky-300',     bg: 'bg-sky-500/10 border-sky-500/30', desc: 'Khá tốt' },
  { min: 55, grade: 'B',  color: 'text-sky-400',     bg: 'bg-sky-500/8 border-sky-500/20', desc: 'Trung bình khá' },
  { min: 45, grade: 'C+', color: 'text-violet-400',  bg: 'bg-violet-500/8 border-violet-500/20', desc: 'Trung bình' },
  { min: 35, grade: 'C',  color: 'text-amber-400',   bg: 'bg-amber-500/8 border-amber-500/20', desc: 'Cần cải thiện' },
  { min: 20, grade: 'D',  color: 'text-orange-400',  bg: 'bg-orange-500/8 border-orange-500/20', desc: 'Yếu' },
  { min: 0,  grade: 'F',  color: 'text-red-400',     bg: 'bg-red-500/8 border-red-500/20', desc: 'Rất yếu' },
]

function getGrade(score) {
  return GRADES.find(g => score >= g.min) || GRADES[GRADES.length - 1]
}

function ScoreBar({ label, score, max = 25, color = 'bg-violet-500' }) {
  const pct = Math.round(score / max * 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-zinc-400">{label}</span>
        <span className="font-semibold text-zinc-300">{score}<span className="text-zinc-600">/{max}</span></span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }}/>
      </div>
    </div>
  )
}

export default function ChannelGrade({ videos, channelMeta }) {
  const result = useMemo(() => {
    if (!videos || videos.length < 3) return null

    // ── 1. POSTING FREQUENCY (0–25) ───────────────────────────────────
    const sorted = [...videos].sort((a, b) => parseDate(a.publishedAt) - parseDate(b.publishedAt))
    const first = parseDate(sorted[0].publishedAt)
    const last  = parseDate(sorted[sorted.length - 1].publishedAt)
    const weekRange = Math.max(1, (last - first) / (7 * 86400000))
    const avgPerWeek = videos.length / weekRange

    // streak
    const weekSet  = new Set(sorted.map(v => isoWeek(parseDate(v.publishedAt))))
    const weekArr  = [...weekSet].sort()
    let maxStreak  = 1, cur = 1
    for (let i = 1; i < weekArr.length; i++) {
      const [y1, w1] = weekArr[i - 1].split('-W').map(Number)
      const [y2, w2] = weekArr[i].split('-W').map(Number)
      const ok = (y2 === y1 && w2 === w1 + 1) || (y2 === y1 + 1 && w1 >= 52 && w2 === 1)
      cur = ok ? cur + 1 : 1
      maxStreak = Math.max(maxStreak, cur)
    }
    const freqScore = Math.min(25, Math.round(
      (avgPerWeek >= 3 ? 15 : avgPerWeek >= 2 ? 13 : avgPerWeek >= 1 ? 10 : avgPerWeek >= 0.5 ? 6 : 3) +
      (maxStreak >= 12 ? 10 : maxStreak >= 8 ? 8 : maxStreak >= 4 ? 5 : maxStreak >= 2 ? 3 : 1)
    ))

    // ── 2. ENGAGEMENT RATE (0–25) ─────────────────────────────────────
    const withEng = videos.filter(v => parseInt(v.viewCount || 0) > 0 && parseInt(v.likeCount || 0) > 0)
    const engRate  = withEng.length
      ? withEng.reduce((s, v) => s + parseInt(v.likeCount) / parseInt(v.viewCount), 0) / withEng.length * 100
      : 0
    const engScore = Math.min(25, Math.round(
      engRate >= 5 ? 25 : engRate >= 3 ? 20 : engRate >= 2 ? 15 : engRate >= 1 ? 10 : engRate >= 0.5 ? 5 : withEng.length ? 2 : 0
    ))

    // ── 3. VIEW CONSISTENCY (0–25) ────────────────────────────────────
    const viewArr = videos.map(v => parseInt(v.viewCount || 0)).filter(Boolean)
    let consScore = 0
    if (viewArr.length >= 3) {
      const avg = viewArr.reduce((s, x) => s + x, 0) / viewArr.length
      const std = Math.sqrt(viewArr.reduce((s, x) => s + (x - avg) ** 2, 0) / viewArr.length)
      const cv  = avg > 0 ? std / avg : 1   // coefficient of variation
      consScore = Math.min(25, Math.round(
        cv < 0.3 ? 25 : cv < 0.6 ? 20 : cv < 1 ? 15 : cv < 1.5 ? 10 : 5
      ))
    }

    // ── 4. CONTENT QUALITY (0–25) ─────────────────────────────────────
    const taggedPct  = videos.filter(v => (v.tags || []).length >= 5).length / videos.length
    const descPct    = videos.filter(v => (v.description || '').length >= 100).length / videos.length
    const avgTagCount = videos.reduce((s, v) => s + (v.tags || []).length, 0) / videos.length
    const qualScore  = Math.min(25, Math.round(
      taggedPct * 10 + descPct * 8 + Math.min(7, avgTagCount / 2)
    ))

    const total = freqScore + engScore + consScore + qualScore
    const grade = getGrade(total)

    return {
      total, grade, freqScore, engScore, consScore, qualScore,
      avgPerWeek: avgPerWeek.toFixed(1), maxStreak, engRate: engRate.toFixed(2),
      taggedPct: Math.round(taggedPct * 100), descPct: Math.round(descPct * 100),
    }
  }, [videos])

  if (!result) return null
  const { total, grade, freqScore, engScore, consScore, qualScore,
          avgPerWeek, maxStreak, engRate, taggedPct, descPct } = result

  const tips = []
  if (freqScore < 15) tips.push('Đăng đều đặn hơn (ít nhất 1 video/tuần) để tăng điểm tần suất.')
  if (engScore < 10)  tips.push('Tỉ lệ like/view còn thấp — cải thiện call-to-action trong video.')
  if (consScore < 12) tips.push('Views không đều — tập trung vào một niche cụ thể để tăng độ nhất quán.')
  if (qualScore < 12) tips.push('Thêm tag và mô tả đầy đủ hơn để cải thiện SEO từng video.')

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Channel Grade</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Đánh giá tổng thể chất lượng kênh (4 tiêu chí)</p>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* Grade badge */}
        <div className={`shrink-0 w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center ${grade.bg}`}>
          <span className={`text-4xl font-black leading-none ${grade.color}`}>{grade.grade}</span>
          <span className={`text-[9px] font-semibold mt-1 ${grade.color} opacity-80`}>{grade.desc}</span>
        </div>

        {/* Score breakdown */}
        <div className="flex-1 flex flex-col gap-2.5">
          <ScoreBar label="📅 Tần suất & Streak đăng bài" score={freqScore} color="bg-indigo-500"/>
          <ScoreBar label="❤️ Engagement rate (likes/views)" score={engScore} color="bg-rose-500"/>
          <ScoreBar label="📊 Độ nhất quán về views" score={consScore} color="bg-sky-500"/>
          <ScoreBar label="🏷 Chất lượng tag & mô tả" score={qualScore} color="bg-violet-500"/>
          {/* Total */}
          <div className="flex justify-between text-xs border-t border-zinc-800 pt-2 mt-1">
            <span className="font-semibold text-zinc-400">Tổng điểm</span>
            <span className={`text-base font-black ${grade.color}`}>{total} / 100</span>
          </div>
        </div>
      </div>

      {/* Detail stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {[
          { label: 'Video/tuần', value: avgPerWeek },
          { label: 'Streak dài nhất', value: `${maxStreak} tuần` },
          { label: 'Engagement', value: `${engRate}%` },
          { label: 'Video có tag', value: `${taggedPct}%` },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 rounded-lg p-2.5 border border-zinc-800 text-center">
            <p className="text-[10px] text-zinc-600">{s.label}</p>
            <p className="text-sm font-bold text-zinc-300 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">💡 Gợi ý cải thiện</p>
          {tips.map((t, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">
              <span className="text-amber-500 shrink-0">→</span>{t}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
