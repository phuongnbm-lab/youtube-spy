import { useMemo, useState } from 'react'

const VN_STOP = new Set([
  'và','của','là','để','có','không','trong','với','được','cho','từ','về','khi','đã','một',
  'những','các','bài','lên','ra','vào','tôi','mình','bạn','họ','hay','cũng','như','vì',
  'thì','mà','rồi','đó','này','kia','đây','đấy','tao','mày','tui','anh','chị','em','ông',
  'bà','nó','hắn','ta','chúng','cái','con','người','năm','ngày','thời','cùng','theo','sau',
  'trước','vẫn','đang','sẽ','bị','do','tại','nên','nhưng','hoặc','đều','lại','còn','thêm',
  'giờ','lúc','hơn','nhất','rất','quá','thật','nữa','chỉ','cần','phải','muốn','thấy','biết',
  'làm','đi','đến','qua','trở','tất','mọi','nhiều','ít','nào','đâu','sao','vậy','thế',
  'bởi','nếu','dù','tuy','mặc','dầu','ở','trên','dưới','giữa','ngoài','trong','đến','tới',
  'được','phần','loại','dạng','cách','kiểu','kiến','việc','chuyện','điều','vấn','đề','liên',
  'quan','thông','tin','chia','sẻ','hướng','dẫn','top','số','list','review','tập','phần',
])
const EN_STOP = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as',
  'is','are','was','were','be','been','have','has','had','do','does','did','will','would',
  'could','should','this','that','these','those','my','your','his','her','its','we','they',
  'not','no','so','than','too','very','just','about','into','through','if','new','first',
  'last','own','like','back','how','what','when','where','why','who','all','more','most',
  'i','you','he','she','it','me','us','them','our','their','out','up','can','get','got',
])

function tokenize(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !VN_STOP.has(w) && !EN_STOP.has(w) && !/^\d+$/.test(w))
}

function fmtViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(Math.round(n))
}

function EffBar({ ratio }) {
  const pct = Math.min(ratio * 50, 100)
  const color = ratio >= 1.5 ? 'bg-emerald-500' : ratio >= 1.0 ? 'bg-violet-500' : 'bg-zinc-600'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono w-10 text-right shrink-0 ${
        ratio >= 1.5 ? 'text-emerald-400' : ratio >= 1.0 ? 'text-violet-400' : 'text-zinc-600'
      }`}>{ratio.toFixed(2)}x</span>
    </div>
  )
}

const TABS = ['Hiệu quả', 'Phổ biến', 'Cụm từ']

export default function TitleKeyAnalysis({ videos }) {
  const [tab, setTab] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [expanded, setExpanded] = useState(null) // label of expanded row

  const hasViews = videos.some(v => parseInt(v.viewCount || 0) > 0)

  const { keywords, bigrams, overallAvg } = useMemo(() => {
    const views = videos.map(v => parseInt(v.viewCount || 0))
    const totalViews = views.reduce((a, b) => a + b, 0)
    const overallAvg = views.length ? totalViews / views.length : 0

    const kmap = {}
    const bmap = {}

    videos.forEach(v => {
      const vViews = parseInt(v.viewCount || 0)
      const tokens = tokenize(v.title)
      const seen = new Set()

      tokens.forEach((w, i) => {
        if (!seen.has(w)) {
          if (!kmap[w]) kmap[w] = { count: 0, totalViews: 0, titles: [] }
          kmap[w].count++
          kmap[w].totalViews += vViews
          kmap[w].titles.push({ title: v.title, views: vViews })
          seen.add(w)
        }
        if (i < tokens.length - 1) {
          const bg = `${w} ${tokens[i + 1]}`
          if (!bmap[bg]) bmap[bg] = { count: 0, totalViews: 0, titles: [] }
          bmap[bg].count++
          bmap[bg].totalViews += vViews
          if (!bmap[bg].titles.find(t => t.title === v.title))
            bmap[bg].titles.push({ title: v.title, views: vViews })
        }
      })
    })

    const MIN_COUNT = Math.max(2, Math.floor(videos.length * 0.04))

    const keywords = Object.entries(kmap)
      .filter(([, v]) => v.count >= MIN_COUNT)
      .map(([word, v]) => ({
        word,
        count: v.count,
        avgViews: v.count > 0 ? v.totalViews / v.count : 0,
        ratio: overallAvg > 0 ? (v.totalViews / v.count) / overallAvg : 1,
        pct: Math.round((v.count / videos.length) * 100),
        titles: v.titles.sort((a, b) => b.views - a.views),
      }))

    const bigrams = Object.entries(bmap)
      .filter(([, v]) => v.count >= Math.max(2, Math.floor(videos.length * 0.04)))
      .map(([phrase, v]) => ({
        phrase,
        count: v.count,
        avgViews: v.count > 0 ? v.totalViews / v.count : 0,
        ratio: overallAvg > 0 ? (v.totalViews / v.count) / overallAvg : 1,
        pct: Math.round((v.count / videos.length) * 100),
        titles: v.titles.sort((a, b) => b.views - a.views),
      }))

    return { keywords, bigrams, overallAvg }
  }, [videos])

  const byEfficiency = [...keywords].sort((a, b) => b.ratio - a.ratio)
  const byFrequency  = [...keywords].sort((a, b) => b.count - a.count)
  const byBigram     = [...bigrams].sort((a, b) => b.ratio - a.ratio)

  const rows = tab === 0 ? byEfficiency : tab === 1 ? byFrequency : byBigram
  const visible = showAll ? rows : rows.slice(0, 15)

  const powerWords = byEfficiency.filter(k => k.ratio >= 1.2 && k.count >= 3).slice(0, 3)

  const toggleExpand = (label) => setExpanded(prev => prev === label ? null : label)

  if (!keywords.length) {
    return (
      <div className="card p-5">
        <div className="text-sm text-zinc-500 text-center py-6">
          Chưa đủ dữ liệu tiêu đề để phân tích
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Từ khoá tiêu đề</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tần suất · Hiệu quả theo lượt xem · {keywords.length} từ khoá
          </p>
        </div>
      </div>

      {/* Power words insight */}
      {powerWords.length > 0 && hasViews && (
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 flex flex-col gap-2">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
            ⚡ Từ khoá tăng view mạnh nhất
          </div>
          <div className="flex flex-wrap gap-2">
            {powerWords.map(k => (
              <div key={k.word} className="flex items-center gap-1.5 bg-zinc-900/80 rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-semibold text-white">{k.word}</span>
                <span className="text-[10px] text-emerald-400 font-mono">+{Math.round((k.ratio - 1) * 100)}%</span>
                <span className="text-[10px] text-zinc-500">({k.count} video)</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500">
            So với trung bình {fmtViews(overallAvg)} views/video — tiêu đề có những từ này đạt cao hơn đáng kể
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); setShowAll(false); setExpanded(null) }}
            className={`flex-1 text-xs py-1.5 rounded-md transition-colors font-medium ${
              tab === i ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex flex-col gap-0.5">
        {/* Column headers */}
        <div className="grid gap-2 px-2 pb-1" style={{ gridTemplateColumns: '1fr 40px 56px 1fr 18px' }}>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
            {tab === 2 ? 'Cụm từ' : 'Từ khoá'}
          </span>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wide text-center">Lặp</span>
          {hasViews
            ? <span className="text-[10px] text-zinc-600 uppercase tracking-wide text-right">Avg views</span>
            : <span className="text-[10px] text-zinc-600 uppercase tracking-wide text-right">%</span>
          }
          {hasViews
            ? <span className="text-[10px] text-zinc-600 uppercase tracking-wide text-right">Hiệu quả</span>
            : <span className="text-[10px] text-zinc-600 uppercase tracking-wide" />
          }
          <span />
        </div>

        {visible.map((k, i) => {
          const item = k
          const label = tab === 2 ? item.phrase : item.word
          const isTop = i < 3
          const isOpen = expanded === label
          return (
            <div key={label} data-ytspy-no-translate="true">
              {/* Main row */}
              <div
                className={`grid gap-2 items-center px-2 py-1.5 rounded-lg transition-colors hover:bg-zinc-800/50 ${
                  isTop ? 'bg-zinc-800/30' : ''
                } ${isOpen ? 'bg-zinc-800/40' : ''}`}
                style={{ gridTemplateColumns: '1fr 40px 56px 1fr 18px' }}
              >
                {/* Keyword */}
                <div className="flex items-center gap-1.5 min-w-0">
                  {isTop && <span className="text-[10px] shrink-0">{['🥇','🥈','🥉'][i]}</span>}
                  <span className={`text-xs font-medium truncate ${
                    isTop ? 'text-white' : 'text-zinc-300'
                  }`}>{label}</span>
                </div>

                {/* Count */}
                <span className="text-xs text-zinc-500 text-center font-mono">{item.count}</span>

                {/* Avg views or % */}
                {hasViews
                  ? <span className="text-[11px] text-zinc-400 text-right font-mono">
                      {fmtViews(item.avgViews)}
                    </span>
                  : <span className="text-[11px] text-zinc-500 text-right">{item.pct}%</span>
                }

                {/* Effectiveness bar */}
                {hasViews
                  ? <EffBar ratio={item.ratio} />
                  : <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${Math.min(item.pct * 2, 100)}%` }} />
                    </div>
                }

                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(label)}
                  className={`flex items-center justify-center w-4 h-4 rounded transition-colors shrink-0 ${
                    isOpen
                      ? 'text-violet-400 bg-violet-500/15'
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50'
                  }`}
                  title="Xem tiêu đề sử dụng từ khoá này"
                >
                  <svg className={`w-2.5 h-2.5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                    viewBox="0 0 6 10" fill="currentColor">
                    <path d="M1 1l4 4-4 4"/>
                  </svg>
                </button>
              </div>

              {/* Expanded titles panel */}
              {isOpen && (
                <div className="mx-2 mb-1 mt-0.5 bg-zinc-900/70 border border-zinc-800 rounded-lg px-3 py-2.5 flex flex-col gap-1.5">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-wide mb-0.5">
                    Tiêu đề sử dụng "{label}" — sắp xếp theo view
                  </div>
                  {item.titles.slice(0, 8).map((t, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      {hasViews && t.views > 0 && (
                        <span className="text-[10px] font-mono text-zinc-600 shrink-0 mt-0.5 w-10 text-right">
                          {fmtViews(t.views)}
                        </span>
                      )}
                      <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-2 flex-1 select-text">
                        {t.title}
                      </p>
                    </div>
                  ))}
                  {item.titles.length > 8 && (
                    <p className="text-[10px] text-zinc-600 pt-0.5">
                      +{item.titles.length - 8} tiêu đề khác...
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {rows.length > 15 && (
        <button onClick={() => setShowAll(v => !v)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-center py-1">
          {showAll ? '▲ Thu gọn' : `▼ Xem thêm ${rows.length - 15} từ khoá`}
        </button>
      )}

      <div className="text-[11px] text-zinc-700 border-t border-zinc-800 pt-3">
        Hiệu quả = avg views của video chứa từ khoá ÷ avg views toàn kênh · Ngưỡng lọc: xuất hiện ≥{Math.max(2, Math.floor(videos.length * 0.04))} video
      </div>
    </div>
  )
}
