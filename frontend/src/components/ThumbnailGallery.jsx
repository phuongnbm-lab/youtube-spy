import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
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

const TYPE_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Video', value: 'video' },
  { label: 'Short', value: 'short' },
]

const ORDER_OPTIONS = [
  { value: 'relevance', label: 'Liên quan nhất' },
  { value: 'viewCount', label: 'Nhiều view nhất' },
  { value: 'date', label: 'Mới nhất' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
]

const GRID_SIZES = [
  { label: '2', cols: 'grid-cols-2' },
  { label: '3', cols: 'grid-cols-3' },
  { label: '4', cols: 'grid-cols-4' },
  { label: '5', cols: 'grid-cols-5' },
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

function Lightbox({ video, all, onClose, onAnalyzeChannel, apiBase }) {
  const idx = all.findIndex(v => v.videoId === video.videoId)
  const [current, setCurrent] = useState(idx)
  const [imgSrc, setImgSrc] = useState(
    `https://i.ytimg.com/vi/${all[idx].videoId}/maxresdefault.jpg`
  )
  const v = all[current]

  const go = useCallback((dir) => {
    const next = (current + dir + all.length) % all.length
    setCurrent(next)
    setImgSrc(`https://i.ytimg.com/vi/${all[next].videoId}/maxresdefault.jpg`)
  }, [current, all])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, go])

  const handleDownload = async () => {
    try {
      const res = await fetch(`${apiBase}/api/thumbnail?video_id=${v.videoId}&quality=max`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${v.videoId}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(`https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`, '_blank')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full flex flex-col gap-3"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 shadow-2xl">
          <img
            src={imgSrc}
            alt={v.title}
            onError={() => setImgSrc(`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`)}
            className="w-full object-contain max-h-[70vh]"
          />

          {/* Close */}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 text-xs text-zinc-300 font-mono">
            {current + 1} / {all.length}
          </div>

          {/* Nav arrows */}
          {all.length > 1 && (
            <>
              <button onClick={() => go(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={() => go(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Info bar */}
        <div className="flex items-center justify-between gap-4 bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">{v.title}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
              <button
                onClick={() => { onAnalyzeChannel?.(v.channelId); onClose() }}
                className="hover:text-violet-400 transition-colors"
              >
                {v.channelTitle}
              </button>
              <span>{fmt(v.viewCount)} views</span>
              <span>{fmt(v.likeCount)} likes</span>
              <span>{v.publishedAt}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              title="Tải xuống thumbnail chất lượng cao"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Lưu thumbnail
            </button>
            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Xem video
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function ThumbnailCard({ video, onAnalyzeChannel, onOpenLightbox }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 cursor-zoom-in group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenLightbox(video)}
    >
      {/* Thumbnail */}
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Short badge */}
      {video.isShort && (
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold shadow">
          SHORT
        </div>
      )}

      {/* Duration */}
      {video.durationStr && !video.isShort && (
        <div className="absolute bottom-10 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
          {video.durationStr}
        </div>
      )}

      {/* Hover overlay — pointer-events only when visible */}
      <div className={`absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-200 flex flex-col justify-between p-3 ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Title */}
        <p className="text-xs font-medium text-white line-clamp-3 leading-relaxed">{video.title}</p>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-zinc-300">
              <svg className="w-3 h-3 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
              {fmt(video.viewCount)}
            </span>
            <span className="flex items-center gap-1 text-zinc-300">
              <svg className="w-3 h-3 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
              </svg>
              {fmt(video.likeCount)}
            </span>
            <span className="flex items-center gap-1 text-zinc-300">
              <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              {fmt(video.commentCount)}
            </span>
          </div>

          {/* Channel + actions */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onAnalyzeChannel?.(video.channelId) }}
              className="text-[11px] text-violet-300 hover:text-violet-200 truncate flex-1 text-left transition-colors"
              title={`Phân tích kênh: ${video.channelTitle}`}
            >
              {video.channelTitle}
            </button>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="shrink-0 p-1.5 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
              title="Xem video"
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </a>
          </div>

          <div className="text-[10px] text-zinc-500">{video.publishedAt}</div>
        </div>
      </div>

      {/* Title bar (always visible) */}
      <div className="px-2.5 py-2 bg-zinc-900">
        <p className="text-[11px] text-zinc-400 truncate">{video.title}</p>
      </div>
    </div>
  )
}

export default function ThumbnailGallery({ apiBase = '', apiKey = '', onAnalyzeChannel }) {
  const [keyword, setKeyword] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [order, setOrder] = useState('relevance')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [videos, setVideos] = useState([])
  const [lightboxVideo, setLightboxVideo] = useState(null)
  const [viewIdx, setViewIdx] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')
  const [gridIdx, setGridIdx] = useState(2) // default 4 cols
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const inputWrapRef = useRef(null)
  const { history, push: pushHistory, remove: removeHistory, clear: clearHistory } = useSearchHistory('yt_history_thumbnails')

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
    return videos.filter(vid =>
      vid.viewCount >= v.min && vid.viewCount < v.max &&
      (typeFilter === 'all' ||
       (typeFilter === 'short' && vid.isShort) ||
       (typeFilter === 'video' && !vid.isShort))
    )
  }, [videos, viewIdx, typeFilter])

  const activeFilterCount = [viewIdx !== 0, typeFilter !== 'all'].filter(Boolean).length
  const resetFilters = () => { setViewIdx(0); setTypeFilter('all') }

  return (
    <div className="w-full space-y-4">
      {/* Search form */}
      <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
        <div className="card p-5 glow-purple">
          <div className="flex gap-3">
            <div className="flex-1 relative" ref={inputWrapRef}>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="text"
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setShowHistory(true) }}
                onFocus={() => { if (history.length) setShowHistory(true) }}
                placeholder="Nhập từ khoá để xem thumbnail..."
                title="Nhập chủ đề hoặc từ khoá để tìm thumbnail video (VD: thumbnail cooking, gaming setup, travel vlog...)"
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

            <div className="relative w-24">
              <input
                type="number"
                value={maxResults}
                onChange={e => setMaxResults(Math.min(50, Math.max(1, Number(e.target.value))))}
                min={1} max={50}
                disabled={loading}
                title="Số thumbnail tối đa muốn hiển thị (tối đa 50)"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-zinc-100 text-center
                  focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
              <div className="absolute -top-2 left-2 px-1 text-[9px] text-zinc-600 bg-zinc-950">số ảnh</div>
            </div>

            <div className="relative w-44">
              <select
                value={order}
                onChange={e => setOrder(e.target.value)}
                disabled={loading}
                title="Sắp xếp kết quả theo tiêu chí nào"
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
                  Đang tải...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Tải thumbnail
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Xem thumbnail video theo từ khoá · Hover để xem stats · Click tên kênh để phân tích
          </p>
        </div>
      </form>

      {/* Filter + Grid control */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
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

          <div className="flex items-center gap-4">
            {/* Grid size control */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Cột</span>
              {GRID_SIZES.map((g, i) => (
                <button key={i} onClick={() => setGridIdx(i)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                    gridIdx === i ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}>
                  {g.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">
                <span className="text-violet-400 font-medium">{filtered.length}</span>
                {filtered.length !== videos.length && <span className="text-zinc-600">/{videos.length}</span>}
                {' '}thumbnail
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
        </div>

        {showFilters && (
          <div className="space-y-2.5 pt-2 border-t border-zinc-800">
            <FilterPills label="Lượt xem" options={VIEW_RANGES} value={viewIdx} onChange={setViewIdx} />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider w-20 shrink-0">Loại</span>
              <div className="flex gap-1">
                {TYPE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setTypeFilter(opt.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      typeFilter === opt.value ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
          <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className={`grid ${GRID_SIZES[gridIdx].cols} gap-3`}>
          {Array.from({ length: maxResults > 12 ? 12 : maxResults }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 animate-pulse">
              <div className="w-full aspect-video bg-zinc-800" />
              <div className="px-2.5 py-2">
                <div className="h-2.5 bg-zinc-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxVideo && (
        <Lightbox
          video={lightboxVideo}
          all={filtered}
          onClose={() => setLightboxVideo(null)}
          onAnalyzeChannel={onAnalyzeChannel}
          apiBase={apiBase}
        />
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className={`grid ${GRID_SIZES[gridIdx].cols} gap-3`}>
          {filtered.map(v => (
            <ThumbnailCard
              key={v.videoId}
              video={v}
              onAnalyzeChannel={onAnalyzeChannel}
              onOpenLightbox={setLightboxVideo}
            />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && !error && videos.length === 0 && keyword && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">Không tìm thấy thumbnail nào cho từ khoá này</p>
        </div>
      )}
      {!loading && videos.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center card">
          <p className="text-sm text-zinc-500 mb-2">Không có thumbnail nào khớp bộ lọc</p>
          <button onClick={resetFilters} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Xoá bộ lọc
          </button>
        </div>
      )}
    </div>
  )
}
