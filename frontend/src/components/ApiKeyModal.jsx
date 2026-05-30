import { useState, useEffect } from 'react'

export default function ApiKeyModal({ onClose }) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Ưu tiên key từ backend (lưu file, bền vững qua mọi lần restart)
    fetch('/api/key')
      .then(r => r.json())
      .then(d => {
        const k = d.key || localStorage.getItem('yt_api_key') || ''
        setKey(k)
        if (k) localStorage.setItem('yt_api_key', k)
      })
      .catch(() => setKey(localStorage.getItem('yt_api_key') || ''))
  }, [])

  const handleSave = async () => {
    const trimmed = key.trim()
    if (trimmed) localStorage.setItem('yt_api_key', trimmed)
    else localStorage.removeItem('yt_api_key')
    // Lưu vào file qua backend
    try {
      await fetch('/api/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: trimmed }),
      })
    } catch {}
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  const handleClear = () => {
    setKey('')
    localStorage.removeItem('yt_api_key')
    fetch('/api/key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: '' }),
    }).catch(() => {})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md card p-6 shadow-2xl border-zinc-700/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-zinc-200">YouTube API Key</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-400
              hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info box */}
        <div className="bg-zinc-900 rounded-lg p-3.5 mb-4 border border-zinc-800">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Key được lưu vào file cục bộ trên máy — không mất khi khởi động lại app. Không gửi cho ai khác.<br />
            Lấy key miễn phí tại{' '}
            <a
              href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
            >
              Google Cloud Console
            </a>
            {' '}→ Enable YouTube Data API v3 → Create Credentials.
          </p>
        </div>

        {/* Input */}
        <div className="relative mb-4">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 pr-11
              text-sm text-zinc-100 placeholder:text-zinc-600 font-mono
              focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30
              transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {show ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {key && (
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-300
                hover:bg-zinc-800 border border-zinc-800 transition-all"
            >
              Xoá key
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
              bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Đã lưu!
              </>
            ) : 'Lưu API Key'}
          </button>
        </div>
      </div>
    </div>
  )
}
