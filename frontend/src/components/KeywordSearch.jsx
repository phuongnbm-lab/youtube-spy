import { useState, useMemo, useRef } from 'react'
import { useSearchHistory } from '../hooks/useSearchHistory'
import SearchHistoryDropdown from './SearchHistoryDropdown'

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

const VIEW_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: '< 10K', min: 0, max: 10_000 },
  { label: '10K–100K', min: 10_000, max: 100_000 },
  { label: '100K–1M', min: 100_000, max: 1_000_000 },
  { label: '> 1M', min: 1_000_000, max: Infinity },
]

const DUR_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: 'Short (≤60s)', min: 0, max: 61 },
  { label: '1–5 phút', min: 60, max: 300 },
  { label: '5–20 phút', min: 300, max: 1200 },
  { label: '> 20 phút', min: 1200, max: Infinity },
]

const LIKE_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: '< 1K', min: 0, max: 1_000 },
  { label: '1K–10K', min: 1_000, max: 10_000 },
  { label: '> 10K', min: 10_000, max: Infinity },
]

const ORDER_OPTIONS = [
  { value: 'relevance', label: 'Liên quan nhất' },
  { value: 'viewCount', label: 'Nhiều view nhất' },
  { value: 'date', label: 'Mới nhất' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
]

function FilterPills({ label, options, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider w-20 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt, i) => (
          <button key={i} onClick={() => onChange(i)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              value === i ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function KeywordSearch({ apiBase = '', apiKey = '', onAnalyzeChannel }) {
  const [keyword, setKeyword] = useState('')
  const [maxResults, setMaxResults] = useState(10)
  const [order, setOrder] = useState('relevance')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [videos, setVideos] = useState([])
  const [viewIdx, setViewIdx] = useState(0)
  const [durIdx, setDurIdx] = useState(0)
  const [likeIdx, setLikeIdx] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const inputWrapRef = useRef(null)
  const { history, push: pushHistory, remove: removeHistory, clear: clearHistory } = useSearchHistory('yt_history_keywords')

  const handleSearch = async (e, overrideTerm) => {
    e?.preventDefault()
    const term = overrideTerm || keyword.trim()
    if (!term) return
    setShowHistory(false)
    setLoading(true)
    setError(null)
    setVideos([])
    try {
      const headers = {}
      if (apiKey) headers['X-API-Key'] = apiKey
      const res = await fetch(
        `${apiBase}/api/search-videos?q=${encodeURIComponent(term)}&max_results=${maxResults}&order=${order}`,
        { headers }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Lỗi không xác định')
      setVideos(json.videos || [])
      pushHistory(term)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const v = VIEW_RANGES[viewIdx]
    const d = DUR_RANGES[durIdx]
    const l = LIKE_RANGES[likeIdx]
    return videos.filter(vid =>
      vid.viewCount  >= v.min && vid.viewCount  < v.max &&
      vid.durationSec >= d.min && vid.durationSec < d.max &&
      vid.likeCount  >= l.min && vid.likeCount  < l.max
    )
  }, [videos, viewIdx, durIdx, likeIdx])

  const activeFilterCount = [viewIdx, durIdx, likeIdx].filter(i => i !== 0).length
  const resetFilters = () => { setViewIdx(0); setDurIdx(0); setLikeIdx(0) }

  return (
    <div className="w-full space-y-4">
      {/* Search form */}
      <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
        <div className="card p-5 glow-purple">
          <div className="flex gap-3">
            {/* Keyword input */}
            <div className="flex-1 relative" ref={inputWrapRef}>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
                </svg>
              </div>
              <input
                type="text"
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setShowHistory(true) }}
                onFocus={() => { if (history.length) setShowHistory(true) }}
                placeholder="Nhập từ khoá để tìm video YouTube..."
                title="Nhập từ khoá bạn muốn tìm kiếm video (VD: review điện thoại, học tiếng Anh, nấu ăn...)"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-sm text-zinc-100
                  placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
                disabled={loading}
                autoComplete="off"
              />
              <SearchHistoryDropdown
                history={history}
                keyword={keyword}
                visible={showHistory}
                setVisible={setShowHistory}
                onPick={(term) => { setKeyword(term); handleSearch(null, term) }}
                onRemove={removeHistory}
                onClear={clearHistory}
              />
            </div>

            {/* Max results */}
            <div className="relative w-24">
              <input
                type="number"
                value={maxResults}
                onChange={e => setMaxResults(Math.min(50, Math.max(1, Number(e.target.value))))}
                min={1} max={50}
                disabled={loading}
                title="Số video tối đa muốn lấy (tối đa 50)"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-zinc-100 text-center
                  focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
              <div className="absolute -top-2 left-2 px-1 text-[9px] text-zinc-600 bg-zinc-950">số video</div>
            </div>

            {/* Sort order */}
            <div className="relative w-44">
              <select
                value={order}
                onChange={e => setOrder(e.target.value)}
                disabled={loading}
                title="Sắp xếp kết quả tìm kiếm theo tiêu chí nào"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-zinc-300
                  focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all appearance-none cursor-pointer"
              >
                {ORDER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="absolute -top-2 left-2 px-1 text-[9px] text-zinc-600 bg-zinc-950">sắp xếp</div>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !keyword.trim()}
              className="px-6 py-3 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500
                disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 whitespace-nowrap glow-purple-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang tìm...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
                  </svg>
                  Tìm video
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Tìm kiếm video YouTube theo từ khoá · Tối đa 50 video/lần · Click tên kênh để phân tích chi tiết
          </p>
        </div>
      </form>

      {/* Filter bar — luôn hiện */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Bộ lọc thông minh
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
            <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              Hiển thị <span className="text-violet-400 font-medium">{filtered.length}</span>
              {filtered.length !== videos.length && <span className="text-zinc-600">/{videos.length}</span>}
              {' '}video
            </span>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Xoá lọc
              </button>
            )}
          </div>
        </div>
        {showFilters && (
          <div className="space-y-2.5 pt-2 border-t border-zinc-800">
            <FilterPills label="Lượt xem"  options={VIEW_RANGES} value={viewIdx} onChange={setViewIdx} />
            <FilterPills label="Độ dài"    options={DUR_RANGES}  value={durIdx}  onChange={setDurIdx} />
            <FilterPills label="Lượt thích" options={LIKE_RANGES} value={likeIdx} onChange={setLikeIdx} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
            <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Results table */}
      {videos.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-zinc-300">
                <span className="text-violet-400">{filtered.length}</span>
                {filtered.length !== videos.length && <span className="text-zinc-600">/{videos.length}</span>}
                {' '}video cho &ldquo;{keyword}&rdquo;
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  {['STT','THUMB','TIÊU ĐỀ','KÊNH','VIEWS','LIKES','BÌNH LUẬN','NGÀY ĐĂNG','ĐỘ DÀI','LOẠI','URL'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium text-zinc-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <tr key={v.videoId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-3 py-2.5 text-zinc-500">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <img src={v.thumbnail} alt="" className="w-16 h-9 rounded object-cover border border-zinc-700" />
                    </td>
                    <td className="px-3 py-2.5 max-w-[220px]">
                      <a href={v.url} target="_blank" rel="noopener noreferrer"
                        className="text-zinc-200 hover:text-violet-400 font-medium line-clamp-2 transition-colors block leading-tight"
                        title={v.title}>
                        {v.title}
                      </a>
                    </td>
                    <td className="px-3 py-2.5 max-w-[140px]">
                      <button
                        onClick={() => onAnalyzeChannel?.(v.channelId)}
                        className="text-zinc-400 hover:text-violet-400 transition-colors truncate block w-full text-left"
                        title={`Phân tích kênh: ${v.channelTitle}`}>
                        {v.channelTitle}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-300 font-mono">{fmt(v.viewCount)}</td>
                    <td className="px-3 py-2.5 text-zinc-300 font-mono">{fmt(v.likeCount)}</td>
                    <td className="px-3 py-2.5 text-zinc-300 font-mono">{fmt(v.commentCount)}</td>
                    <td className="px-3 py-2.5 text-zinc-400 whitespace-nowrap">{v.publishedAt}</td>
                    <td className="px-3 py-2.5 text-zinc-400 font-mono">{v.durationStr || '—'}</td>
                    <td className="px-3 py-2.5">
                      {v.isShort
                        ? <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-medium">Short</span>
                        : <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[10px]">Video</span>
                      }
                    </td>
                    <td className="px-3 py-2.5">
                      <a href={v.url} target="_blank" rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 transition-colors">
                        https://...
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty states */}
      {!loading && !error && videos.length === 0 && keyword && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">Không tìm thấy video nào cho từ khoá này</p>
        </div>
      )}
      {!loading && videos.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center card">
          <svg className="w-8 h-8 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <p className="text-sm text-zinc-500 mb-2">Không có video nào khớp bộ lọc</p>
          <button onClick={resetFilters} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Xoá bộ lọc
          </button>
        </div>
      )}
    </div>
  )
}
