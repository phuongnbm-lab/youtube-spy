import { useState } from 'react'

export default function LicenseGate({ reason, machineId, onRetry }) {
  const [copied, setCopied] = useState(false)

  const copyId = () => {
    navigator.clipboard.writeText(machineId || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5">

        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Tài khoản chưa kích hoạt</h2>
            <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">{reason}</p>
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <p className="text-xs text-zinc-500">Mã định danh phần cứng của máy bạn:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-violet-300 bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2.5 font-mono truncate select-all">
              {machineId || 'Không xác định được'}
            </code>
            <button
              onClick={copyId}
              className={`shrink-0 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                copied ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            Gửi mã này cho tác giả · <span className="text-zinc-500 font-medium">Bá Phương — Zalo: 0904066020</span>
          </p>
          <p className="text-[11px] text-sky-500">
            Vui lòng đợi xác nhận từ tác giả rồi nhấn "Thử lại" hoặc khởi động lại app.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onRetry(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-800
              hover:border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Thử lại
          </button>
          <a
            href="https://zalo.me/0904066020"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600
              hover:bg-blue-500 text-sm text-white font-medium transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm1.5 14H9a.5.5 0 010-1h4.5a.5.5 0 010 1zm0-3H9a.5.5 0 010-1h4.5a.5.5 0 010 1zm0-3H9a.5.5 0 010-1h4.5a.5.5 0 010 1z"/>
            </svg>
            Liên hệ Zalo
          </a>
        </div>

        <p className="text-center text-[11px] text-zinc-700">YouTube Spy · by Bá Phương</p>
      </div>
    </div>
  )
}
