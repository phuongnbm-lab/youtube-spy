import { useState } from 'react'
import SearchBar from './components/SearchBar'
import StatsCards from './components/StatsCards'
import HourChart from './components/HourChart'
import DayChart from './components/DayChart'
import VideoList from './components/VideoList'
import ApiKeyModal from './components/ApiKeyModal'
import TimezoneConverter from './components/TimezoneConverter'
import FeaturedVideos from './components/FeaturedVideos'

function ErrorBanner({ message }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
        <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-red-400">Lỗi</p>
          <p className="text-xs text-red-300/80 mt-0.5">{message}</p>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">Nhập kênh YouTube để bắt đầu</h3>
      <p className="text-sm text-zinc-600 max-w-sm">
        Hỗ trợ URL, @handle, hoặc Channel ID. Phân tích theo giờ VN (ICT UTC+7).
      </p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {['@mkbhd', '@PewDiePie', 'youtube.com/@veritasium'].map((ex) => (
          <span key={ex} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800
            text-xs text-zinc-500 font-mono">
            {ex}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [showApiModal, setShowApiModal] = useState(false)

  const hasApiKey = () => !!localStorage.getItem('yt_api_key')

  const API_BASE = import.meta.env.VITE_API_URL || ''

  const handleSearch = async (channel, limit) => {
    setLoading(true)
    setError(null)
    try {
      const headers = {}
      const storedKey = localStorage.getItem('yt_api_key')
      if (storedKey) headers['X-API-Key'] = storedKey

      const res = await fetch(`${API_BASE}/api/analyze?channel=${encodeURIComponent(channel)}&limit=${limit}`, { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Lỗi không xác định')
      setData(json)
    } catch (e) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} />}
      {/* Header */}
      <header className="border-b border-zinc-800/60 sticky top-0 z-10 backdrop-blur-sm bg-zinc-950/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold gradient-text">YouTube Spy</span>
              <span className="ml-2 text-xs text-zinc-600">v1.0</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              YouTube Data API v3
            </div>
            <button
              onClick={() => setShowApiModal(true)}
              title="Cài đặt API Key"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800
                hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group"
            >
              <svg className="w-3.5 h-3.5 text-zinc-600 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              <span className="text-xs text-zinc-600 group-hover:text-violet-400 transition-colors">API Key</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400 font-medium mb-5">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          Competitor Intelligence Tool
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
          Phân tích giờ đăng{' '}
          <span className="gradient-text">YouTube</span>
        </h1>
        <p className="text-zinc-500 text-sm max-w-xl mx-auto">
          Khám phá khung giờ vàng của đối thủ. Dữ liệu thực từ YouTube API, hiển thị theo múi giờ Việt Nam.
        </p>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 pb-16 space-y-5">
        <SearchBar onSearch={handleSearch} onReset={() => { setData(null); setError(null) }} loading={loading} />

        {error && <ErrorBanner message={error} />}

        {!data && !error && !loading && <EmptyState />}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border border-indigo-500/30 border-t-indigo-500 animate-spin animation-reverse" style={{ animationDirection: 'reverse', animationDuration: '0.75s' }} />
            </div>
            <div className="text-sm text-zinc-500">Đang lấy dữ liệu từ YouTube API...</div>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-5 animate-in fade-in" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {/* Reset button */}
            <div className="flex justify-end">
              <button
                onClick={() => setData(null)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-500
                  border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Phân tích kênh khác
              </button>
            </div>

            <StatsCards data={data} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <HourChart hourData={data.hourData} peakHour={data.peakHour} />
              <DayChart dayData={data.dayData} dayLabels={data.dayLabels} peakDayIndex={data.peakDayIndex} />
            </div>
            <TimezoneConverter peakHour={data.peakHour} />
            <FeaturedVideos videos={data.videos} peakHour={data.peakHour} />
            <VideoList videos={data.videos} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 pt-6 pb-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left: info */}
          <div className="flex flex-col gap-1.5 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-zinc-400">YouTube Spy</span>
              <span className="text-[10px] text-zinc-700 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">v27.05.2026</span>
            </div>
            <div className="text-xs text-zinc-600 space-y-0.5">
              <div>Tác giả: <span className="text-zinc-500 font-medium">Bá Phương</span></div>
              <div>Zalo: <a href="https://zalo.me/0904066020" target="_blank" rel="noopener noreferrer"
                className="text-violet-500 hover:text-violet-400 transition-colors">0904066020</a></div>
              <div className="text-zinc-700 pt-0.5">Dữ liệu từ YouTube Data API v3 · ICT UTC+7</div>
            </div>
          </div>

          {/* Right: Buy me a coffee */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] text-zinc-600 font-medium">☕ Ủng hộ tác giả</span>
            <div className="p-1.5 bg-white rounded-xl shadow-lg shadow-black/30">
              <img
                src="/buy-me-a-coffee.png"
                alt="Buy me a coffee QR"
                className="w-24 h-24 rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
