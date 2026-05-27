import { useState } from 'react'

function CopyBtn({ text, label = '' }) {
  const [copied, setCopied] = useState(false)
  const handle = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={handle}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${
        copied
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
      }`}>
      {copied ? (
        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
        </svg>Đã copy</>
      ) : (
        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>{label || 'Copy'}</>
      )}
    </button>
  )
}

function Section({ title, children, copyText, accent = 'violet' }) {
  const colors = {
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    sky:    'text-sky-400 bg-sky-500/10 border-sky-500/20',
    amber:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
    zinc:   'text-zinc-400 bg-zinc-800 border-zinc-700',
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${colors[accent]}`}>
          {title}
        </span>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      {children}
    </div>
  )
}

function exportSingleTxt(video) {
  const lines = [
    `YOUTUBE SPY — Chi tiết video`,
    `${'═'.repeat(45)}`,
    ``,
    `📌 TIÊU ĐỀ`,
    video.title,
    ``,
    `🔗 URL`,
    `https://youtube.com/watch?v=${video.videoId}`,
    ``,
    `📅 THỜI ĐIỂM ĐĂNG`,
    `${video.publishedAt} (${video.dayName})`,
    ``,
    `⏱  DURATION`,
    video.durationStr ? `${video.durationStr} — ${video.isShort ? 'Short' : 'Long'}` : 'N/A',
    ``,
    `👁  LƯỢT XEM`,
    parseInt(video.viewCount || 0).toLocaleString(),
    ``,
    video.tags?.length ? `🏷  THẺ TAG\n${video.tags.join(', ')}` : null,
    ``,
    video.description ? `📝 MÔ TẢ\n${video.description}` : null,
  ].filter(l => l !== null).join('\n')

  const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `video-${video.videoId}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function VideoDetailModal({ video, onClose }) {
  if (!video) return null

  const allTags = video.tags?.join(', ') || ''
  const url = `https://youtube.com/watch?v=${video.videoId}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose}/>

      {/* Modal */}
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col card border-zinc-700/60 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-zinc-200">Chi tiết video</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => exportSingleTxt(video)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-zinc-700
                text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Export TXT
            </button>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600
                hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Thumbnail + meta */}
          <div className="flex gap-4">
            {video.thumbnail && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <img src={video.thumbnail} alt="" className="w-32 h-[72px] rounded-lg object-cover
                  hover:opacity-80 transition-opacity"/>
              </a>
            )}
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-mono text-zinc-500">{video.publishedAt}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded
                  ${{'Thứ 2':'text-blue-400 bg-blue-500/10','Thứ 3':'text-indigo-400 bg-indigo-500/10',
                    'Thứ 4':'text-violet-400 bg-violet-500/10','Thứ 5':'text-purple-400 bg-purple-500/10',
                    'Thứ 6':'text-pink-400 bg-pink-500/10','Thứ 7':'text-orange-400 bg-orange-500/10',
                    'Chủ nhật':'text-rose-400 bg-rose-500/10'}[video.dayName] || 'text-zinc-400 bg-zinc-800'}`}>
                  {video.dayName}
                </span>
                {video.durationStr && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    video.isShort ? 'bg-rose-500/15 text-rose-400' : 'bg-sky-500/15 text-sky-400'
                  }`}>{video.isShort ? '🩳 Short' : '📹 Long'} · {video.durationStr}</span>
                )}
                {video.viewCount && parseInt(video.viewCount) > 0 && (
                  <span className="text-[10px] text-zinc-500 font-mono">
                    👁 {parseInt(video.viewCount).toLocaleString()} views
                  </span>
                )}
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors truncate font-mono">
                {url}
              </a>
              <CopyBtn text={url} label="Copy URL" />
            </div>
          </div>

          {/* Title */}
          <Section title="📌 Tiêu đề" copyText={video.title} accent="violet">
            <p className="text-sm font-medium text-zinc-200 leading-relaxed bg-zinc-900 rounded-lg px-3 py-2.5 border border-zinc-800">
              {video.title}
            </p>
          </Section>

          {/* Tags */}
          {video.tags?.length > 0 && (
            <Section title="🏷 Thẻ Tag" copyText={allTags} accent="sky">
              <div className="flex flex-wrap gap-1.5 bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                {video.tags.map(tag => (
                  <span key={tag}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg
                      bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    #{tag}
                    <button onClick={() => navigator.clipboard.writeText(tag)}
                      className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-sky-500 hover:text-sky-300 transition-opacity ml-0.5">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Description */}
          <Section title="📝 Mô tả" copyText={video.description || ''} accent="amber">
            {video.description ? (
              <pre className="text-xs text-zinc-400 leading-relaxed bg-zinc-900 rounded-lg px-3 py-2.5
                border border-zinc-800 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                {video.description}
              </pre>
            ) : (
              <p className="text-xs text-zinc-600 italic bg-zinc-900 rounded-lg px-3 py-2.5 border border-zinc-800">
                Không có mô tả
              </p>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
