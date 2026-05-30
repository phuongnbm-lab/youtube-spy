import { useState, useMemo, useRef } from 'react'
import { useSearchHistory } from '../hooks/useSearchHistory'
import SearchHistoryDropdown from './SearchHistoryDropdown'

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

const SUBS_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: '< 10K', min: 0, max: 10_000 },
  { label: '10K–100K', min: 10_000, max: 100_000 },
  { label: '100K–1M', min: 100_000, max: 1_000_000 },
  { label: '> 1M', min: 1_000_000, max: Infinity },
]

const VPD_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: '< 1K/ngày', min: 0, max: 1_000 },
  { label: '1K–10K/ngày', min: 1_000, max: 10_000 },
  { label: '10K–100K/ngày', min: 10_000, max: 100_000 },
  { label: '> 100K/ngày', min: 100_000, max: Infinity },
]

const AGE_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: '< 1 năm', min: 0, max: 365 },
  { label: '1–3 năm', min: 365, max: 365 * 3 },
  { label: '3–5 năm', min: 365 * 3, max: 365 * 5 },
  { label: '> 5 năm', min: 365 * 5, max: Infinity },
]

const VIDEO_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: '< 50', min: 0, max: 50 },
  { label: '50–200', min: 50, max: 200 },
  { label: '200–500', min: 200, max: 500 },
  { label: '> 500', min: 500, max: Infinity },
]

function FilterPills({ label, options, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider w-20 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              value === i
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ChannelSearch({ apiBase = '', apiKey = '', onAnalyze }) {
  const [keyword, setKeyword] = useState('')
  const [maxResults, setMaxResults] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [channels, setChannels] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [subsIdx, setSubsIdx] = useState(0)
  const [vpdIdx, setVpdIdx] = useState(0)
  const [ageIdx, setAgeIdx] = useState(0)
  const [videoIdx, setVideoIdx] = useState(0)
  const [countryFilter, setCountryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const inputWrapRef = useRef(null)
  const { history, push: pushHistory, remove: removeHistory, clear: clearHistory } = useSearchHistory('yt_history_channels')

  const handleSearch = async (e, overrideTerm) => {
    e?.preventDefault()
    const term = overrideTerm || keyword.trim()
    if (!term) return
    setShowHistory(false)
    setLoading(true)
    setError(null)
    setChannels([])
    setSelected(new Set())
    try {
      const headers = {}
      if (apiKey) headers['X-API-Key'] = apiKey
      const res = await fetch(
        `${apiBase}/api/search-channels?q=${encodeURIComponent(term)}&max_results=${maxResults}`,
        { headers }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Lỗi không xác định')
      setChannels(json.channels || [])
      pushHistory(term)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const countries = useMemo(() => {
    const set = new Set(channels.map(c => c.country).filter(Boolean))
    return [...set].sort()
  }, [channels])

  const filtered = useMemo(() => {
    const subs = SUBS_RANGES[subsIdx]
    const vpd  = VPD_RANGES[vpdIdx]
    const age  = AGE_RANGES[ageIdx]
    const vid  = VIDEO_RANGES[videoIdx]
    return channels.filter(c =>
      c.subscriberCount >= subs.min && c.subscriberCount < subs.max &&
      c.viewsPerDay     >= vpd.min  && c.viewsPerDay     < vpd.max  &&
      c.ageDays         >= age.min  && c.ageDays         < age.max  &&
      c.videoCount      >= vid.min  && c.videoCount      < vid.max  &&
      (!countryFilter || c.country === countryFilter)
    )
  }, [channels, subsIdx, vpdIdx, ageIdx, videoIdx, countryFilter])

  const activeFilterCount = [subsIdx, vpdIdx, ageIdx, videoIdx].filter(i => i !== 0).length + (countryFilter ? 1 : 0)

  const resetFilters = () => { setSubsIdx(0); setVpdIdx(0); setAgeIdx(0); setVideoIdx(0); setCountryFilter('') }

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
                placeholder="Nhập từ khoá tìm kiếm kênh..."
                title="Nhập tên hoặc chủ đề kênh bạn muốn tìm (VD: review công nghệ, nấu ăn Việt Nam, dạy tiếng Anh...)"
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

            {/* Max results input */}
            <div className="relative w-24">
              <input
                type="number"
                value={maxResults}
                onChange={e => setMaxResults(Math.min(50, Math.max(1, Number(e.target.value))))}
                min={1}
                max={50}
                disabled={loading}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-zinc-100 text-center
                  focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
                title="Số kênh tối đa"
              />
              <div className="absolute -top-2 left-2 px-1 text-[9px] text-zinc-600 bg-zinc-950">số kênh</div>
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
                  Tìm kênh
                </>
              )}
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-600">
            Tìm kiếm kênh YouTube theo từ khoá · Tối đa 50 kênh/lần · Click vào tên kênh để phân tích chi tiết
          </p>
        </div>
      </form>

      {/* Filter bar */}
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
                Hiển thị <span className="text-violet-400 font-medium">{filtered.length}</span>/{channels.length} kênh
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
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
              <FilterPills label="Subscribers" options={SUBS_RANGES} value={subsIdx} onChange={setSubsIdx} />
              <FilterPills label="Views/ngày"  options={VPD_RANGES}  value={vpdIdx}  onChange={setVpdIdx} />
              <FilterPills label="Tuổi kênh"   options={AGE_RANGES}  value={ageIdx}  onChange={setAgeIdx} />
              <FilterPills label="Số video"    options={VIDEO_RANGES} value={videoIdx} onChange={setVideoIdx} />
              {countries.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider w-20 shrink-0">Quốc gia</span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setCountryFilter('')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        !countryFilter ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      Tất cả
                    </button>
                    {countries.map(c => (
                      <button
                        key={c}
                        onClick={() => setCountryFilter(countryFilter === c ? '' : c)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          countryFilter === c ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
      {channels.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-zinc-300">
                <span className="text-violet-400">{filtered.length}</span>
                {filtered.length !== channels.length && <span className="text-zinc-600">/{channels.length}</span>}
                {' '}kênh cho &ldquo;{keyword}&rdquo;
              </span>
            </div>
            {selected.size > 0 && (
              <button
                onClick={() => {
                  const ch = channels.find(c => selected.has(c.channelId))
                  if (ch) onAnalyze?.(ch.channelId)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Phân tích ({selected.size})
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  {['STT','ICON','TÊN KÊNH','TỔNG SUBS','TỔNG VIEW','TỔNG VIDEO','QUỐC GIA','NGÀY TẠO','TUỔI KÊNH','VIEWS/NGÀY','URL','CHỌN'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium text-zinc-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ch, i) => (
                  <tr key={ch.channelId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-3 py-2.5 text-zinc-500">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      {ch.thumbnail
                        ? <img src={ch.thumbnail} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-700" />
                        : <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                            </svg>
                          </div>
                      }
                    </td>
                    <td className="px-3 py-2.5 max-w-[180px]">
                      <button
                        onClick={() => onAnalyze?.(ch.channelId)}
                        className="text-zinc-200 hover:text-violet-400 font-medium text-left truncate block w-full transition-colors"
                        title={ch.name}
                      >
                        {ch.name}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-300 font-mono">{fmt(ch.subscriberCount)}</td>
                    <td className="px-3 py-2.5 text-zinc-300 font-mono">{fmt(ch.viewCount)}</td>
                    <td className="px-3 py-2.5 text-zinc-300 font-mono">{fmt(ch.videoCount)}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{ch.country || '—'}</td>
                    <td className="px-3 py-2.5 text-zinc-400 whitespace-nowrap">{ch.createdAt || '—'}</td>
                    <td className="px-3 py-2.5 text-zinc-400 font-mono">{ch.ageDays.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-zinc-300 font-mono">{ch.viewsPerDay.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <a
                        href={ch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        https://...
                      </a>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(ch.channelId)}
                        onChange={() => toggleSelect(ch.channelId)}
                        className="w-4 h-4 accent-violet-500 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state — no API results */}
      {!loading && !error && channels.length === 0 && keyword && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">Không tìm thấy kênh nào cho từ khoá này</p>
        </div>
      )}

      {/* Empty state — filtered out all results */}
      {!loading && channels.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center card">
          <svg className="w-8 h-8 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <p className="text-sm text-zinc-500 mb-2">Không có kênh nào khớp bộ lọc</p>
          <button onClick={resetFilters} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Xoá bộ lọc
          </button>
        </div>
      )}
    </div>
  )
}
