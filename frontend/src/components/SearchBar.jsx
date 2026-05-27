import { useState } from 'react'

export default function SearchBar({ onSearch, onReset, loading }) {
  const [channel, setChannel] = useState('')
  const [limit, setLimit] = useState(50)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!channel.trim()) return
    onSearch(channel.trim(), limit)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="card p-5 glow-purple">
        {/* Channel input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
            </div>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="@channelname hoặc youtube.com/... hoặc Channel ID"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-11 pr-9 py-3 text-sm text-zinc-100
                placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30
                transition-all duration-200"
              disabled={loading}
            />
            {channel && !loading && (
              <button
                type="button"
                onClick={() => { setChannel(''); onReset?.(); }}
                className="absolute inset-y-0 right-3 flex items-center text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
