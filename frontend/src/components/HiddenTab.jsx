function formatDate(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

function NoteEditor({ value, onChange }) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder="Thêm ghi chú cho video này..."
      rows={value ? 2 : 1}
      className="w-full mt-1.5 resize-y bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5
        text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none
        focus:border-violet-500/60 transition-all leading-relaxed"
    />
  )
}

export default function HiddenTab({ hd, onOpenChannelVideo }) {
  const items = hd?.hidden || []

  if (items.length === 0) {
    return (
      <div className="card p-10 flex flex-col items-center justify-center gap-3 text-center">
        <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
        <p className="text-sm text-zinc-400 font-medium">Chưa ẩn video nào</p>
        <p className="text-xs text-zinc-600 max-w-sm leading-relaxed">
          Bấm icon mắt-gạch-chéo trên mỗi video trong danh sách để ẩn nó vĩnh viễn khỏi bảng. Video đã ẩn sẽ xuất hiện ở đây để khôi phục.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Video đã ẩn</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {items.length} video bị ẩn khỏi mọi danh sách — bấm “Hiện lại” để khôi phục
          </p>
        </div>
        <button onClick={() => hd.clear()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-zinc-700
            text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/40 transition-all">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Hiện lại tất cả
        </button>
      </div>

      <div className="flex flex-col divide-y divide-zinc-800/60">
        {items.map(item => (
          <div key={item.videoId} className="group flex items-start gap-3 py-2.5">
            <span className="shrink-0 w-7 pt-0.5 text-right font-mono text-xs text-zinc-600">
              {item.originalIndex != null ? item.originalIndex : '—'}
            </span>
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              className="shrink-0 rounded overflow-hidden">
              {item.thumbnail
                ? <img src={item.thumbnail} alt="" className="w-20 h-11 object-cover opacity-75 hover:opacity-100 transition-opacity" />
                : <div className="w-20 h-11 bg-zinc-800" />}
            </a>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{item.title || item.videoId}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-zinc-600 truncate">{item.channelName || ''}</span>
                {item.savedAt && (
                  <span className="text-[10px] text-zinc-600 font-mono">· Lưu lúc {formatDate(item.savedAt)}</span>
                )}
                {item.hiddenAt && (
                  <span className="text-[10px] text-zinc-700 font-mono">· Ẩn lúc {formatDate(item.hiddenAt)}</span>
                )}
              </div>
              <NoteEditor value={item.note} onChange={(v) => hd.setNote(item.videoId, v)} />
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              {onOpenChannelVideo && item.channelId && (
                <button onClick={() => onOpenChannelVideo(item.channelId, item.videoId)}
                  title="Mở kênh (Phân tích kênh) & nhảy tới video này"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-zinc-700
                    text-zinc-500 hover:text-violet-300 hover:border-violet-500/40 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Mở kênh
                </button>
              )}
              <button onClick={() => hd.unhide(item.videoId)}
                title="Hiện lại video này"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-zinc-700
                  text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/40 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Hiện lại
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
