import { useState, useEffect, useRef } from 'react'
import SearchBar from './components/SearchBar'
import StatsCards from './components/StatsCards'
import HourChart from './components/HourChart'
import DayChart from './components/DayChart'
import VideoList from './components/VideoList'
import ApiKeyModal from './components/ApiKeyModal'
import TimezoneConverter from './components/TimezoneConverter'
import FeaturedVideos from './components/FeaturedVideos'
import OptimalTimeTip from './components/OptimalTimeTip'
import ContentRatio from './components/ContentRatio'
import UploadStats from './components/UploadStats'
import ViewTrend from './components/ViewTrend'
import TitleWordCloud from './components/TitleWordCloud'
import TagCloudViz from './components/TagCloudViz'
import CompareSection from './components/CompareSection'
import RevenueEstimator from './components/RevenueEstimator'
import ChannelGrade from './components/ChannelGrade'
import VideoSeoScore from './components/VideoSeoScore'
import UploadCalendar from './components/UploadCalendar'
import GrowthForecast from './components/GrowthForecast'
import TitleKeyAnalysis from './components/TitleKeyAnalysis'
import TranslateTooltip from './components/TranslateTooltip'
import ChannelSearch from './components/ChannelSearch'
import LicenseGate from './components/LicenseGate'
import KeywordSearch from './components/KeywordSearch'
import ThumbnailGallery from './components/ThumbnailGallery'

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
        Hỗ trợ URL, @handle, hoặc Channel ID. Phân tích theo múi giờ Việt Nam (ICT UTC+7).
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
  const [showDonate, setShowDonate] = useState(false)
  const [mode, setMode] = useState('analyze') // 'analyze' | 'search' | 'keyword' | 'thumbnail'
  const [license, setLicense] = useState(null) // null=checking, {valid,reason,machine_id,...}
  const [updateInfo, setUpdateInfo] = useState(null) // null | {latest, release_url, download_url}
  const [updating, setUpdating] = useState(false)
  const [devPanel, setDevPanel] = useState(false)
  const [devReleasing, setDevReleasing] = useState(false)
  const [devResult, setDevResult] = useState(null)
  const [appVersion, setAppVersion] = useState('')
  const logoClickCount = useRef(0)
  const logoClickTimer = useRef(null)

  useEffect(() => {
    checkLicense()
    checkUpdate()
    fetch('/api/version').then(r => r.json()).then(d => setAppVersion(d.version)).catch(() => {})
  }, [])

  const checkUpdate = async () => {
    try {
      const res = await fetch('/api/update-check')
      const json = await res.json()
      if (json.has_update) setUpdateInfo(json)
    } catch {}
  }

  const handleLogoClick = () => {
    logoClickCount.current += 1
    clearTimeout(logoClickTimer.current)
    logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0 }, 2000)
    if (logoClickCount.current >= 5) {
      logoClickCount.current = 0
      setDevPanel(true)
      setDevResult(null)
    }
  }

  const doDevRelease = async () => {
    setDevReleasing(true)
    setDevResult(null)
    try {
      const res = await fetch('/api/dev/release', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) setDevResult({ ok: false, msg: json.detail })
      else setDevResult({ ok: true, msg: `Release ${json.tag} thành công! GitHub Actions đang build...` })
    } catch (e) {
      setDevResult({ ok: false, msg: e.message })
    } finally {
      setDevReleasing(false)
    }
  }

  const doUpdate = async () => {
    if (!updateInfo?.download_url) return
    setUpdating(true)
    try {
      await fetch('/api/do-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ download_url: updateInfo.download_url }),
      })
      // App sẽ tự tắt và khởi động lại — không cần xử lý thêm
    } catch {
      setUpdating(false)
    }
  }

  const checkLicense = async (force = false) => {
    setLicense(null)
    try {
      const res = await fetch(`/api/license${force ? '?force=true' : ''}`)
      const json = await res.json()
      if (json.valid && json.api_key) {
        localStorage.setItem('yt_api_key', json.api_key)
      }
      setLicense(json)
    } catch {
      setLicense({ valid: true, reason: 'offline' })
    }
  }

  // Channel history: [{channel, name, thumbnail}]
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('yt_channel_history') || '[]') } catch { return [] }
  })

  const API_BASE = import.meta.env.VITE_API_URL || ''

  // Sync API key từ backend (config.json) vào localStorage khi khởi động
  useEffect(() => {
    fetch('/api/key')
      .then(r => r.json())
      .then(d => { if (d.key) localStorage.setItem('yt_api_key', d.key) })
      .catch(() => {})
  }, [])

  const saveHistory = (channelInput, json) => {
    const entry = {
      channel:   channelInput,
      name:      json.channel?.name || channelInput,
      thumbnail: json.channel?.thumbnail || '',
    }
    const updated = [entry, ...history.filter(h => h.channel !== channelInput)].slice(0, 10)
    setHistory(updated)
    localStorage.setItem('yt_channel_history', JSON.stringify(updated))
  }

  const handleSearch = async (channel, limit) => {
    setLoading(true)
    setError(null)
    try {
      const headers = {}
      const storedKey = localStorage.getItem('yt_api_key')
      if (storedKey) headers['X-API-Key'] = storedKey

      const res  = await fetch(`${API_BASE}/api/analyze?channel=${encodeURIComponent(channel)}&limit=${limit}`, { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Lỗi không xác định')
      setData(json)
      saveHistory(channel, json)
    } catch (e) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  // License checking screen
  if (license === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-zinc-500">Đang xác thực license...</p>
        </div>
      </div>
    )
  }

  // License invalid screen
  if (!license.valid) {
    // Hiện form nhập sheet URL khi chưa cấu hình hoặc không kết nối được
    return (
      <LicenseGate
        reason={license.reason}
        machineId={license.machine_id}
        onRetry={(force) => checkLicense(force)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <TranslateTooltip />
      {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} />}

      {/* Update banner */}
      {updateInfo && (
        <div className={`w-full border-b px-6 py-2.5 flex items-center justify-between gap-4 transition-all ${
          updating
            ? 'bg-violet-700 border-violet-500/50 animate-banner-breathe'
            : 'bg-violet-600/90 border-violet-500/50'
        }`}>
          <div className="flex items-center gap-2 text-sm text-white">
            {updating ? (
              <div className="relative w-4 h-4 shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {updating
              ? <span className="animate-pulse-text">Đang tải bản mới... App sẽ tự khởi động lại</span>
              : <>Có bản cập nhật mới <strong className="mx-1">v{updateInfo.latest}</strong> — Nhấn để cập nhật tự động!</>
            }
          </div>
          {!updating && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={doUpdate}
                className="px-3 py-1 rounded-lg bg-white text-violet-700 text-xs font-semibold hover:bg-violet-50 transition-colors animate-update-glow"
              >
                Cập nhật ngay
              </button>
              <button
                onClick={() => setUpdateInfo(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dev release panel */}
      {devPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setDevPanel(false)}>
          <div className="bg-zinc-900 border border-violet-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 font-mono">DEV</span>
              <span className="text-sm font-semibold text-zinc-200">Release Tool</span>
            </div>
            <p className="text-xs text-zinc-500 mb-5">
              Tạo release mới với version hôm nay → push lên GitHub → GitHub Actions tự build EXE.
            </p>
            {devResult && (
              <div className={`text-xs rounded-lg px-4 py-3 mb-4 ${devResult.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {devResult.msg}
                {devResult.ok && (
                  <a href="https://github.com/phuongnbm-lab/youtube-spy/actions"
                    target="_blank" rel="noopener noreferrer"
                    className="block mt-1 underline opacity-70">Xem tiến trình build →</a>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={doDevRelease}
                disabled={devReleasing}
                className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {devReleasing ? 'Đang release...' : '🚀 Release ngay'}
              </button>
              <button
                onClick={() => setDevPanel(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donate modal */}
      {showDonate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowDonate(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="logo" className="w-8 h-8 rounded-lg object-cover" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Ủng hộ tác giả</div>
                <div className="text-xs text-zinc-500">Bá Phương · YouTube Spy v1.0</div>
              </div>
            </div>

            {/* QR code */}
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <img
                src="/buy-me-a-coffee.png"
                alt="QR ủng hộ"
                className="w-64 h-64 object-contain rounded-lg"
              />
            </div>

            {/* Caption */}
            <div className="text-center space-y-1">
              <p className="text-sm text-zinc-300 font-medium">Momo · VietQR · Napas 247</p>
              <p className="text-xs text-zinc-500">Quét QR bằng app ngân hàng hoặc Momo</p>
              <p className="text-xs text-zinc-600">Mọi đóng góp đều được trân trọng ☕</p>
            </div>

            <button
              onClick={() => setShowDonate(false)}
              className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-800/60 sticky top-0 z-10 backdrop-blur-sm bg-zinc-950/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="YouTube Spy" className="w-8 h-8 rounded-lg object-cover cursor-pointer select-none" onClick={handleLogoClick} />
            <div>
              <span className="text-sm font-bold gradient-text">YouTube Spy</span>
              {appVersion && <span className="ml-2 text-xs text-zinc-600">v{appVersion}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Expiry badge */}
            {license?.valid && license?.expired && (() => {
              const parts = license.expired.split(/[\/\-]/)
              let expDate = null
              if (parts.length === 3) {
                // dd/mm/yyyy hoặc yyyy-mm-dd
                if (parts[0].length === 4) expDate = new Date(+parts[0], +parts[1]-1, +parts[2])
                else expDate = new Date(+parts[2], +parts[1]-1, +parts[0])
              }
              if (!expDate || isNaN(expDate)) return null
              const days = Math.ceil((expDate - Date.now()) / 86400000)
              const urgent = days < 6
              return (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                  urgent
                    ? 'border-red-500/40 bg-red-500/10 text-red-400'
                    : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                }`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Exp: {license.expired}
                  {' '}
                  <span className={urgent ? 'text-red-400 font-bold' : 'text-emerald-500'}>
                    ({days} days)
                  </span>
                </div>
              )
            })()}
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              YouTube Data API v3
            </div>
            {(() => {
              const hasKey = !!localStorage.getItem('yt_api_key')
              return (
                <button
                  onClick={() => setShowApiModal(true)}
                  title={hasKey ? 'Đổi API Key' : 'Chưa có API Key — nhấn để nhập'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all group ${
                    hasKey
                      ? 'border-zinc-800 hover:border-violet-500/40 hover:bg-violet-500/5'
                      : 'border-violet-500/60 bg-violet-500/10 animate-pulse-glow'
                  }`}
                >
                  <svg className={`w-3.5 h-3.5 transition-colors ${hasKey ? 'text-zinc-600 group-hover:text-violet-400' : 'text-violet-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                  <span className={`text-xs transition-colors ${hasKey ? 'text-zinc-600 group-hover:text-violet-400' : 'text-violet-300 font-medium'}`}>
                    {hasKey ? 'API Key' : 'Nhập API Key'}
                  </span>
                </button>
              )
            })()}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400 font-medium mb-5">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          YouTube Channel Intelligence
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
          Bộ công cụ{' '}
          <span className="gradient-text">YouTube</span>
          {' '}đa năng
        </h1>
        <p className="text-zinc-500 text-sm max-w-xl mx-auto leading-relaxed">
          Phân tích kênh · Tìm kiếm kênh · Nghiên cứu từ khoá · Xem Thumbnail — tất cả trong một. Dữ liệu thực từ YouTube Data API v3.
        </p>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 pb-16 space-y-5">
        {/* Mode toggle */}
        <div className="flex justify-center">
          <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              onClick={() => { setMode('analyze'); setData(null); setError(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'analyze'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Phân tích kênh
            </button>
            <button
              onClick={() => { setMode('search'); setData(null); setError(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'search'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
              Tìm kênh
            </button>
            <button
              onClick={() => { setMode('keyword'); setData(null); setError(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'keyword'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
              </svg>
              Keyword
            </button>
            <button
              onClick={() => { setMode('thumbnail'); setData(null); setError(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'thumbnail'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Thumbnail
            </button>
          </div>
        </div>

        {mode === 'thumbnail' ? (
          <ThumbnailGallery
            apiBase={API_BASE}
            apiKey={localStorage.getItem('yt_api_key')}
            onAnalyzeChannel={(channelId) => {
              setMode('analyze')
              handleSearch(channelId, 50)
            }}
          />
        ) : mode === 'keyword' ? (
          <KeywordSearch
            apiBase={API_BASE}
            apiKey={localStorage.getItem('yt_api_key')}
            onAnalyzeChannel={(channelId) => {
              setMode('analyze')
              handleSearch(channelId, 50)
            }}
          />
        ) : mode === 'search' ? (
          <ChannelSearch
            apiBase={API_BASE}
            apiKey={localStorage.getItem('yt_api_key')}
            onAnalyze={(channelId) => {
              setMode('analyze')
              handleSearch(channelId, 50)
            }}
          />
        ) : (
          <>
        <SearchBar
          onSearch={handleSearch}
          onReset={() => { setData(null); setError(null) }}
          loading={loading}
          history={history}
        />

        {error && <ErrorBanner message={error} />}

        {!data && !error && !loading && <EmptyState />}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border border-indigo-500/30 border-t-indigo-500 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '0.75s' }} />
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

            {/* ── Row 1: Stats ── */}
            <StatsCards data={data} />

            {/* ── Row 2: Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <HourChart hourData={data.hourData} peakHour={data.peakHour} />
              <DayChart  dayData={data.dayData}   dayLabels={data.dayLabels} peakDayIndex={data.peakDayIndex} />
            </div>

            {/* ── Row 3: Timezone + Optimal tip ── */}
            <TimezoneConverter peakHour={data.peakHour} />
            <OptimalTimeTip
              peakHour={data.peakHour}
              peakDayName={data.peakDayName}
              videos={data.videos}
            />

            {/* ── Row 4: Channel grade + Revenue ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChannelGrade videos={data.videos} channelMeta={data.channel} />
              <RevenueEstimator videos={data.videos} />
            </div>

            {/* ── Row 5: Content ratio + Upload stats ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ContentRatio videos={data.videos} />
              <UploadStats  videos={data.videos} />
            </div>

            {/* ── Row 6: View trend + Growth forecast ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ViewTrend     videos={data.videos} />
              <GrowthForecast videos={data.videos} />
            </div>

            {/* ── Row 7: Upload calendar ── */}
            <UploadCalendar videos={data.videos} />

            {/* ── Row 8: Featured videos ── */}
            <FeaturedVideos videos={data.videos} peakHour={data.peakHour} />

            {/* ── Row 9: SEO Score ── */}
            <VideoSeoScore videos={data.videos} />

            {/* ── Row 10: Title key analysis ── */}
            <TitleKeyAnalysis videos={data.videos} />

            {/* ── Row 11: Word clouds ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <TitleWordCloud videos={data.videos} />
              <TagCloudViz    videos={data.videos} channelName={data.channel?.name} />
            </div>

            {/* ── Row 11: Video list ── */}
            <VideoList videos={data.videos} channelName={data.channel?.name} />

            {/* ── Row 12: Compare ── */}
            <CompareSection
              apiBase={API_BASE}
              apiKey={localStorage.getItem('yt_api_key')}
            />
          </div>
        )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 pt-6 pb-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <img src="/logo.png" alt="YouTube Spy" className="w-6 h-6 rounded-md object-cover" />
              <span className="text-xs font-semibold text-zinc-400">YouTube Spy</span>
              {appVersion && <span className="text-[10px] text-zinc-700 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">v{appVersion}</span>}
            </div>
            <div className="text-xs text-zinc-600 space-y-0.5">
              <div>Tác giả: <span className="text-zinc-500 font-medium">Bá Phương</span></div>
              <div>Zalo: <a href="https://zalo.me/0904066020" target="_blank" rel="noopener noreferrer"
                className="text-violet-500 hover:text-violet-400 transition-colors">0904066020</a></div>
              <div className="text-zinc-700 pt-0.5">Dữ liệu từ YouTube Data API v3 · ICT UTC+7</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] text-zinc-600 font-medium">☕ Ủng hộ tác giả</span>
            <button
              onClick={() => setShowDonate(true)}
              className="group p-1.5 bg-white rounded-xl shadow-lg shadow-black/30 hover:scale-105 transition-transform cursor-pointer"
              title="Click để xem QR to"
            >
              <img
                src="/buy-me-a-coffee.png"
                alt="Buy me a coffee QR"
                className="w-24 h-24 rounded-lg object-cover"
              />
            </button>
            <span className="text-[10px] text-zinc-700">Tap để quét QR</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 6px 1px rgba(139,92,246,0.4); border-color: rgba(139,92,246,0.5); }
          50%       { box-shadow: 0 0 16px 4px rgba(139,92,246,0.8); border-color: rgba(139,92,246,0.9); }
        }
        .animate-pulse-glow {
          animation: pulseGlow 1.6s ease-in-out infinite;
        }
        @keyframes updateGlow {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(255,255,255,0.6), 0 0 20px 4px rgba(167,139,250,0.5); }
          50%       { box-shadow: 0 0 18px 6px rgba(255,255,255,0.9), 0 0 40px 10px rgba(167,139,250,0.8); }
        }
        .animate-update-glow {
          animation: updateGlow 1.2s ease-in-out infinite;
        }
        @keyframes bannerBreathe {
          0%, 100% { opacity: 1; background-color: rgba(109,40,217,0.95); }
          50%       { opacity: 0.75; background-color: rgba(124,58,237,0.8); }
        }
        .animate-banner-breathe {
          animation: bannerBreathe 1.8s ease-in-out infinite;
        }
        @keyframes pulseText {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        .animate-pulse-text {
          animation: pulseText 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
