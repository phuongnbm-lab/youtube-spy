import { useState, useEffect, useRef } from 'react'

/* ── Lightbox xem thumbnail to ───────────────────────────────── */
function ThumbLightbox({ videoId, onClose }) {
  const [src, setSrc] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`)

  // Nếu maxres lỗi, fallback xuống sddefault
  const handleError = () => {
    if (src.includes('maxresdefault')) setSrc(`https://i.ytimg.com/vi/${videoId}/sddefault.jpg`)
    else if (src.includes('sddefault')) setSrc(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)
  }

  // Đóng khi bấm Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
         onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md"/>

      {/* Image */}
      <div className="relative z-10 max-w-4xl w-full"
           onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          onError={handleError}
          alt=""
          className="w-full rounded-xl shadow-2xl object-contain max-h-[80vh]"
        />
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-600
            flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all shadow-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function fileSlug(name) {
  return (name || 'channel').replace(/[^\wÀ-ɏ一-鿿]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'channel'
}

async function saveThumbnail(videoId, channelName) {
  // Thử từ chất lượng cao xuống thấp; bỏ qua ảnh placeholder (< 5 KB)
  const qualities = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault']
  for (const q of qualities) {
    try {
      const res = await fetch(`https://i.ytimg.com/vi/${videoId}/${q}.jpg`)
      if (!res.ok) continue
      const blob = await res.blob()
      if (blob.size < 5000) continue          // placeholder nhỏ → bỏ qua
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = `${fileSlug(channelName)}_${videoId}_thumb.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000)
      return true
    } catch { continue }
  }
  return false
}

function SaveThumbBtn({ videoId, channelName }) {
  const [state, setState] = useState('idle') // idle | saving | done | error
  const handle = async (e) => {
    e.preventDefault(); e.stopPropagation()
    setState('saving')
    const ok = await saveThumbnail(videoId, channelName)
    setState(ok ? 'done' : 'error')
    setTimeout(() => setState('idle'), 2000)
  }
  const cfg = {
    idle:   { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', cls: 'text-zinc-500 hover:text-sky-400 hover:border-sky-500/40', label: 'Save Thumb' },
    saving: { icon: null, cls: 'text-sky-400 border-sky-500/30 animate-pulse', label: '...' },
    done:   { icon: 'M5 13l4 4L19 7', cls: 'text-emerald-400 border-emerald-500/30', label: 'Saved!' },
    error:  { icon: 'M6 18L18 6M6 6l12 12', cls: 'text-red-400 border-red-500/30', label: 'Lỗi' },
  }[state]
  return (
    <button onClick={handle} title={cfg.label}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-zinc-700 bg-zinc-800/80 transition-all ${cfg.cls}`}>
      {cfg.icon ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon}/>
        </svg>
      ) : <span className="w-3 h-3 flex items-center justify-center text-[10px]">↓</span>}
      {cfg.label}
    </button>
  )
}

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
    <button onClick={handle} title={copied ? 'Đã copy!' : (label || 'Copy')}
      className={`flex items-center justify-center w-5 h-5 rounded transition-all ${
        copied
          ? 'text-emerald-400'
          : 'text-zinc-600 hover:text-zinc-300'
      }`}>
      {copied ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
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
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${colors[accent]}`}>
          {title}
        </span>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      {children}
    </div>
  )
}

function exportSingleTxt(video, channelName) {
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
  a.download = `${fileSlug(channelName)}_${video.videoId}_detail.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function VideoDetailModal({ video, onClose, channelName, channelMeta, bm }) {
  const [thumbOpen, setThumbOpen] = useState(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!video) return
    const handler = (e) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [video])

  if (!video) return null

  const allTags = video.tags?.join(', ') || ''
  const url = `https://youtube.com/watch?v=${video.videoId}`
  const saved = bm ? bm.isSaved(video.videoId) : false
  const note = bm ? (bm.bookmarks.find(b => b.videoId === video.videoId)?.note || '') : ''

  return (
    <>
    {thumbOpen && <ThumbLightbox videoId={video.videoId} onClose={() => setThumbOpen(false)} />}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose}/>

      {/* Modal */}
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col card border-zinc-700/60 shadow-2xl"
        tabIndex={-1} autoFocus
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
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
            {bm && (
              <button onClick={() => bm.toggle(video, channelMeta || { name: channelName })}
                title={saved ? 'Bỏ lưu' : 'Lưu vào mục Đã lưu'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  saved
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                    : 'border-zinc-700 text-zinc-400 hover:text-amber-300 hover:border-amber-500/40'
                }`}>
                <svg className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"/>
                </svg>
                {saved ? 'Đã lưu' : 'Lưu'}
              </button>
            )}
            <button onClick={() => exportSingleTxt(video, channelName)}
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
              <div className="shrink-0 flex flex-col gap-1.5">
                <button onClick={() => setThumbOpen(true)}
                  className="relative group rounded-lg overflow-hidden w-32 h-[72px] shrink-0 focus:outline-none">
                  <img src={video.thumbnail} alt="" className="w-full h-full object-cover
                    group-hover:opacity-70 transition-opacity"/>
                  {/* Zoom icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0zm-3-3v6m-3-3h6"/>
                    </svg>
                  </div>
                </button>
                <SaveThumbBtn videoId={video.videoId} channelName={channelName} />
              </div>
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

          {/* Ghi chú (chỉ khi đã lưu) */}
          {bm && saved && (
            <Section title="🔖 Ghi chú" accent="amber">
              <textarea
                value={note}
                onChange={e => bm.setNote(video.videoId, e.target.value)}
                placeholder="Thêm ghi chú cho video này — sẽ được lưu cùng bookmark..."
                rows={3}
                className="w-full resize-y bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5
                  text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none
                  focus:border-amber-500/60 transition-all leading-relaxed"
              />
            </Section>
          )}

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
    </>
  )
}
