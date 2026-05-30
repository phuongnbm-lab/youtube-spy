import { useState, useRef, useEffect } from 'react'

export default function SearchBar({ onSearch, onReset, loading, history = [] }) {
  const [channel, setChannel] = useState('')
  const [limit, setLimit] = useState(50)
  const [showHistory, setShowHistory] = useState(false)
  const wrapRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowHistory(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!channel.trim()) return
    setShowHistory(false)
    onSearch(channel.trim(), limit)
  }

  const pickHistory = (entry) => {
    setChannel(entry.channel)
    setShowHistory(false)
    onSearch(entry.channel, limit)
  }

  const filtered = history.filter(h =>
    !channel.trim() || h.channel.toLowerCase().includes(channel.toLowerCase()) || h.name.toLowerCase().includes(channel.toLowerCase())
  )

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="card p-5 glow-purple">
        {/* Channel input */}
        <div className="flex gap-3">
          <div className="flex-1 relative" ref={wrapRef}>
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
            </div>
            <input
              type="text"
              value={channel}
              onChange={(e) => { setChannel(e.target.value); if (history.length) setShowHistory(true) }}
              onFocus={() => { if (history.length) setShowHistory(true) }}
              placeholder="@channelname hoặc youtube.com/... hoặc Channel ID"
              title="Nhập tên kênh bạn muốn phân tích. Hỗ trợ: @handle (VD: @mkbhd), URL kênh, hoặc Channel ID bắt đầu bằng UC..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-11 pr-9 py-3 text-sm text-zinc-100
                placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30
                transition-all duration-200"
              disabled={loading}
              autoComplete="off"
            />
            {channel && !loading && (
              <button
                type="button"
                onClick={() => { setChannel(''); setShowHistory(false); onReset?.() }}
                className="absolute inset-y-0 right-3 flex items-center text-zinc-600 hover:text-zinc-300 transition-colors z-10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* History dropdown */}
            {showHistory && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl
                shadow-2xl z-50 overflow-hidden">
                <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">Kênh đã tra cứu</span>
                </div>
                {filtered.slice(0, 8).map((entry) => (
                  <button
                    key={entry.channel}
                    type="button"
                    onClick={() => pickHistory(entry)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800 transition-colors text-left"
                  >
                    {entry.thumbnail ? (
                      <img src={entry.thumbnail} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 border border-zinc-700"/>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-300 truncate">{entry.name}</p>
                      <p className="text-[10px] text-zinc-600 font-mono truncate">{entry.channel}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !channel.trim()}
            className="px-6 py-3 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500
              disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200
              flex items-center gap-2 whitespace-nowrap glow-purple-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang phân tích...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Phân tích
              </>
            )}
          </button>
        </div>

        {/* Slider */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-xs text-zinc-500 whitespace-nowrap w-28">Số video:</span>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            disabled={loading}
            className="flex-1 h-1.5 appearance-none rounded-full bg-zinc-700 accent-violet-500 cursor-pointer
              disabled:opacity-40"
          />
          <span className="text-sm font-mono font-medium text-violet-400 w-12 text-right">
            {limit} video
          </span>
        </div>
      </div>
    </form>
  )
}
