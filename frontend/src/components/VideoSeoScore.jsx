import { useMemo, useState } from 'react'

function seoScore(v) {
  let score = 0
  const details = {}

  // ── Title (0–40 pts) ──────────────────────────────────────────────
  const title  = (v.title || '').trim()
  const tLen   = title.length
  const tScore = tLen >= 30 && tLen <= 60 ? 22
               : tLen >= 20 && tLen <= 80 ? 16
               : tLen > 0                 ? 8 : 0
  const tBonus = ((/\d/.test(title) ? 5 : 0) +    // has numbers
                  (/[?!]/.test(title) ? 4 : 0) +   // question/exclamation
                  (/20\d{2}/.test(title) ? 3 : 0) + // has year
                  (tLen >= 40 ? 3 : 0))             // optimal length
  details.title = { score: Math.min(40, tScore + tBonus), max: 40, hint: tLen === 0 ? 'Không có tiêu đề' : `${tLen} ký tự` }
  score += details.title.score

  // ── Description (0–30 pts) ────────────────────────────────────────
  const desc  = (v.description || '').trim()
  const dLen  = desc.length
  const dScore = dLen >= 300 ? 30 : dLen >= 150 ? 24 : dLen >= 80 ? 16 : dLen >= 20 ? 8 : dLen > 0 ? 3 : 0
  details.desc = { score: dScore, max: 30, hint: dLen === 0 ? 'Không có mô tả' : `${dLen} ký tự` }
  score += dScore

  // ── Tags (0–30 pts) ───────────────────────────────────────────────
  const tagCount = (v.tags || []).length
  const tgScore  = tagCount >= 15 ? 30 : tagCount >= 10 ? 25 : tagCount >= 7 ? 20 : tagCount >= 4 ? 13 : tagCount >= 1 ? 6 : 0
  details.tags = { score: tgScore, max: 30, hint: tagCount === 0 ? 'Không có tag' : `${tagCount} tag` }
  score += tgScore

  return { total: score, details }
}

function ScoreRing({ score }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#a78bfa' : score >= 30 ? '#f59e0b' : '#f87171'
  const r = 18, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#27272a" strokeWidth="3.5"/>
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
      <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{score}</text>
    </svg>
  )
}

function ScoreLabel({ score }) {
  if (score >= 80) return <span className="text-emerald-400 text-[10px] font-semibold">Tốt</span>
  if (score >= 60) return <span className="text-violet-400 text-[10px] font-semibold">Khá</span>
  if (score >= 40) return <span className="text-amber-400 text-[10px] font-semibold">TB</span>
  return <span className="text-red-400 text-[10px] font-semibold">Yếu</span>
}

export default function VideoSeoScore({ videos }) {
  const [tab, setTab] = useState('top') // 'top' | 'worst' | 'dist'

  const scored = useMemo(() =>
    videos.map(v => ({ ...v, seo: seoScore(v) })).sort((a, b) => b.seo.total - a.seo.total),
    [videos]
  )

  if (!scored.length) return null

  const avg    = Math.round(scored.reduce((s, v) => s + v.seo.total, 0) / scored.length)
  const top3   = scored.slice(0, 3)
  const worst3 = scored.slice(-3).reverse()

  // Distribution buckets
  const dist = [
    { label: '80–100', color: 'bg-emerald-500', count: scored.filter(v => v.seo.total >= 80).length },
    { label: '60–79',  color: 'bg-violet-500',  count: scored.filter(v => v.seo.total >= 60 && v.seo.total < 80).length },
    { label: '40–59',  color: 'bg-amber-500',   count: scored.filter(v => v.seo.total >= 40 && v.seo.total < 60).length },
    { label: '0–39',   color: 'bg-red-500',     count: scored.filter(v => v.seo.total < 40).length },
  ]
  const maxDist = Math.max(...dist.map(d => d.count), 1)

  const displayList = tab === 'top' ? top3 : worst3

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">SEO Score từng video</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Tiêu đề · Mô tả · Tag — thang 0–100</p>
          </div>
        </div>
        {/* Avg score */}
        <div className="flex items-center gap-2">
          <ScoreRing score={avg}/>
          <div>
            <p className="text-[10px] text-zinc-500">Trung bình</p>
            <ScoreLabel score={avg}/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: tab list */}
        <div className="flex flex-col gap-3">
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden self-start">
            {[['top','🏆 Top SEO'],['worst','⚠️ Yếu nhất']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-3 py-1.5 text-xs transition-colors ${tab === key ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {displayList.map((v, i) => {
              const { total, details } = v.seo
              return (
                <a key={v.videoId}
                  href={`https://youtube.com/watch?v=${v.videoId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3 border border-zinc-800 hover:border-zinc-700 group transition-all">
                  <ScoreRing score={total}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-300 truncate group-hover:text-violet-300 transition-colors">
                      {v.title}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-[9px] text-zinc-600">
                        T: <span className={details.title.score >= 30 ? 'text-emerald-500' : details.title.score >= 15 ? 'text-amber-500' : 'text-red-500'}>{details.title.score}</span>/40
                      </span>
                      <span className="text-[9px] text-zinc-600">
                        D: <span className={details.desc.score >= 22 ? 'text-emerald-500' : details.desc.score >= 10 ? 'text-amber-500' : 'text-red-500'}>{details.desc.score}</span>/30
                      </span>
                      <span className="text-[9px] text-zinc-600">
                        G: <span className={details.tags.score >= 22 ? 'text-emerald-500' : details.tags.score >= 10 ? 'text-amber-500' : 'text-red-500'}>{details.tags.score}</span>/30
                      </span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>

        {/* Right: distribution */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-zinc-400">Phân bổ điểm SEO ({scored.length} video)</p>
          <div className="flex flex-col gap-2.5">
            {dist.map(d => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-500 w-14 shrink-0">{d.label}</span>
                <div className="flex-1 h-5 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                  <div className={`h-full ${d.color} opacity-80 transition-all duration-700 flex items-center pl-2`}
                    style={{ width: `${Math.max(d.count > 0 ? 8 : 0, Math.round(d.count / scored.length * 100))}%` }}>
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-400 w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>

          {/* Score criteria legend */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 mt-1">
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">Cách tính điểm</p>
            {[
              ['📌 Tiêu đề', '40 pts', 'Độ dài lý tưởng 30–60 ký tự, có số, dấu ?/!'],
              ['📝 Mô tả',   '30 pts', '>300 ký tự = tối đa; không có = 0'],
              ['🏷 Tag',     '30 pts', '>15 tag = tối đa; không có tag = 0'],
            ].map(([name, pts, note]) => (
              <div key={name} className="flex items-start gap-2 py-1 border-b border-zinc-800 last:border-0">
                <span className="text-[11px] text-zinc-300 w-20 shrink-0">{name}</span>
                <span className="text-[10px] text-violet-400 w-10 shrink-0">{pts}</span>
                <span className="text-[10px] text-zinc-600">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
