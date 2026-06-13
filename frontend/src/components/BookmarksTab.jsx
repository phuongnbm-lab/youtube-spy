import { useMemo, useRef, useState } from 'react'
import { useDialog } from './Dialog'

const COLOR_HEX = { amber: '#f59e0b', red: '#ef4444', emerald: '#10b981', sky: '#0ea5e9', violet: '#8b5cf6' }

// Nhãn trạng thái: bấm để bật/tắt (bấm lại để bỏ)
const STATUS_TAGS = [
  { key: 'doing', label: 'Doing', on: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    off: 'border-zinc-700 text-zinc-600 hover:text-emerald-400 hover:border-emerald-500/40' },
  { key: 'done',  label: 'Done',  on: 'bg-red-500/20 text-red-300 border-red-500/50',
    off: 'border-zinc-700 text-zinc-600 hover:text-red-400 hover:border-red-500/40' },
]

function StatusTags({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {STATUS_TAGS.map(s => {
        const active = value === s.key
        return (
          <button key={s.key}
            onClick={() => onChange(active ? null : s.key)}
            title={active ? `Bỏ nhãn ${s.label}` : `Đánh nhãn ${s.label}`}
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${active ? s.on : s.off}`}>
            {s.label}
          </button>
        )
      })}
    </div>
  )
}

function exportBookmarks(bookmarks) {
  const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `youtube-spy-bookmarks-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function formatDate(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

function CopyLinkBtn({ url }) {
  const [copied, setCopied] = useState(false)
  const handle = (e) => {
    e.preventDefault(); e.stopPropagation()
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={handle} title={copied ? 'Đã copy link!' : 'Copy link video'}
      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
        copied ? 'text-emerald-400' : 'text-zinc-600 hover:text-sky-400 hover:bg-sky-500/10'
      }`}>
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
        </svg>
      )}
    </button>
  )
}

// Ô tick chọn tuỳ biến (tối, đồng tone — không dùng checkbox mặc định)
function SelectBox({ checked, onChange, title }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange() }}
      title={title || (checked ? 'Bỏ chọn' : 'Chọn để copy link')}
      className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-all ${
        checked
          ? 'bg-violet-600 border-violet-600 text-white'
          : 'bg-zinc-800/40 border-zinc-700 text-transparent hover:border-violet-500/60'
      }`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </button>
  )
}

function NoteEditor({ value, onChange }) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder="Thêm ghi chú cho video này..."
      rows={value ? 2 : 1}
      className="w-full resize-y bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2
        text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none
        focus:border-violet-500/60 transition-all leading-relaxed"
    />
  )
}

export default function BookmarksTab({ bm, hd, onAnalyzeChannel, onOpenChannelVideo }) {
  const { bookmarks, loaded, remove, setNote, setStatus, clear, importMany } = bm
  const { confirm, alert } = useDialog()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)  // null | 'doing' | 'done'
  const [selected, setSelected] = useState(() => new Set())  // videoId đã chọn
  const [copied, setCopied] = useState(false)

  const doneCount = bookmarks.filter(b => b.status === 'done').length

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const copySelected = () => {
    const urls = bookmarks.filter(b => selected.has(b.videoId)).map(b => b.url).join('\n')
    if (!urls) return
    navigator.clipboard.writeText(urls).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1600)
    })
  }

  const chOf = (item) => ({ name: item.channelName, channelId: item.channelId })
  // Ẩn video + huỷ luôn trạng thái Bookmark
  const hideAndRemove = (item) => {
    hd?.hide(item, chOf(item))
    remove(item.videoId)
  }
  // Ẩn toàn bộ Bookmark hiện có (và xoá khỏi danh sách Bookmark)
  const hideAll = () => {
    bm.bookmarks.forEach(item => hd?.hide(item, chOf(item)))
    clear()
  }
  // Ẩn riêng các video gắn nhãn Done
  const hideDone = () => {
    bm.bookmarks.filter(item => item.status === 'done')
      .forEach(item => { hd?.hide(item, chOf(item)); remove(item.videoId) })
  }
  // Ẩn các video đang được chọn (huỷ luôn Bookmark)
  const hideSelected = () => {
    bm.bookmarks.filter(item => selected.has(item.videoId))
      .forEach(item => { hd?.hide(item, chOf(item)); remove(item.videoId) })
    setSelected(new Set())
  }
  const fileRef = useRef(null)

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // reset để chọn lại đúng file vẫn chạy
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      let data
      try {
        data = JSON.parse(reader.result)
      } catch {
        alert({ title: 'Không đọc được file', message: 'File phải là JSON xuất từ YouTube Spy.', danger: true })
        return
      }
      const list = Array.isArray(data) ? data : (Array.isArray(data?.bookmarks) ? data.bookmarks : null)
      if (!list) {
        alert({ title: 'Sai định dạng', message: 'File không đúng định dạng bookmark.', danger: true })
        return
      }
      const res = importMany(list)
      alert({ title: 'Đã nhập xong', message: `Tổng ${res.total} mục: thêm mới ${res.added}, bỏ qua ${res.skipped} (trùng).` })
    }
    reader.readAsText(file)
  }

  // Nút Xuất + Nhập (dùng chung cho cả màn trống lẫn toolbar)
  const importExportButtons = ({ showExport = true } = {}) => (
    <>
      <input ref={fileRef} type="file" accept="application/json,.json"
        onChange={handleImportFile} className="hidden" />
      {showExport && (
        <button onClick={() => exportBookmarks(bookmarks)} disabled={bookmarks.length === 0}
          title="Tải toàn bộ bookmark ra file .json để backup / gửi cho người khác"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-zinc-800
            text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all
            disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:border-zinc-800">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Xuất
        </button>
      )}
      <button onClick={() => fileRef.current?.click()}
        title="Nhập bookmark từ file .json (gộp vào danh sách hiện có, tự bỏ trùng)"
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-zinc-800
          text-zinc-400 hover:text-sky-400 hover:border-sky-500/40 transition-all">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Nhập
      </button>
    </>
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookmarks.filter(b => {
      if (statusFilter && b.status !== statusFilter) return false
      if (!q) return true
      return (b.title || '').toLowerCase().includes(q) ||
        (b.note || '').toLowerCase().includes(q) ||
        (b.channelName || '').toLowerCase().includes(q)
    })
  }, [bookmarks, search, statusFilter])

  // Gom nhóm theo kênh
  const groups = useMemo(() => {
    const map = new Map()
    for (const b of filtered) {
      const key = b.channelId || b.channelName || 'unknown'
      if (!map.has(key)) {
        map.set(key, {
          channelId: b.channelId,
          channelName: b.channelName || 'Kênh khác',
          channelThumbnail: b.channelThumbnail || '',
          items: [],
        })
      }
      map.get(key).items.push(b)
    }
    // Kênh có bookmark mới nhất lên đầu
    return [...map.values()].sort((a, b) =>
      Math.max(...b.items.map(i => i.savedAt || 0)) - Math.max(...a.items.map(i => i.savedAt || 0))
    )
  }, [filtered])

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-zinc-500">Đang tải danh sách Bookmark...</p>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-300 mb-2">Chưa có Bookmark nào</h3>
        <p className="text-sm text-zinc-600 max-w-sm">
          Khi phân tích một kênh, nhấn icon bookmark 🔖 ở đầu mỗi video
          để lưu lại đây kèm ghi chú. Dữ liệu được giữ ngay cả khi thoát & mở lại app.
        </p>
        <div className="flex items-center gap-2 mt-6">
          {importExportButtons({ showExport: false })}
        </div>
        <p className="text-xs text-zinc-700 mt-3">Có file backup? Bấm "Nhập" để khôi phục.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-in fade-in" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Toolbar */}
      <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Bookmark</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {bookmarks.length} video · {groups.length} kênh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm trong Bookmark..."
              className="w-56 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2
                text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none
                focus:border-violet-500 transition-all" />
          </div>
          {/* Lọc theo trạng thái */}
          <div className="flex items-center gap-1">
            {STATUS_TAGS.map(s => {
              const active = statusFilter === s.key
              return (
                <button key={s.key}
                  onClick={() => setStatusFilter(active ? null : s.key)}
                  title={`Lọc: chỉ hiện ${s.label}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? s.on : s.off}`}>
                  {s.label}
                </button>
              )
            })}
          </div>
          {importExportButtons()}
          {hd && doneCount > 0 && (
            <button onClick={async () => { if (await confirm({ title: `Ẩn ${doneCount} video Done?`, message: 'Các video gắn nhãn Done sẽ chuyển sang mục Đã ẩn và bị huỷ Bookmark.', confirmText: 'Ẩn các Done', danger: true })) hideDone() }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-red-500/30
                text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              Ẩn các Done ({doneCount})
            </button>
          )}
          {hd && (
            <button onClick={async () => {
                if (selected.size > 0) {
                  if (await confirm({ title: `Ẩn ${selected.size} video đã chọn?`, message: 'Các video đã chọn sẽ chuyển sang mục Đã ẩn và bị huỷ Bookmark.', confirmText: 'Ẩn đã chọn', danger: true })) hideSelected()
                } else {
                  if (await confirm({ title: 'Ẩn tất cả Bookmark?', message: 'Toàn bộ Bookmark sẽ chuyển sang mục Đã ẩn và bị huỷ Bookmark.', confirmText: 'Ẩn tất cả', danger: true })) hideAll()
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-zinc-800
                text-zinc-500 hover:text-red-400 hover:border-red-500/40 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              {selected.size > 0 ? `Ẩn đã chọn (${selected.size})` : 'Ẩn tất cả'}
            </button>
          )}
          <button onClick={async () => { if (await confirm({ title: 'Xoá tất cả Bookmark?', message: 'Hành động này không thể hoàn tác.', confirmText: 'Xoá tất cả', danger: true })) clear() }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-zinc-800
              text-zinc-500 hover:text-red-400 hover:border-red-500/40 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Xoá tất cả
          </button>
        </div>
      </div>

      {/* Thanh hành động khi chọn nhiều */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 card p-3 flex items-center justify-between gap-3
          border-violet-500/40 bg-zinc-900/95 backdrop-blur-sm">
          <span className="text-xs text-zinc-300 font-medium">Đã chọn {selected.size} video</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 rounded-lg text-xs border border-zinc-700 text-zinc-400
                hover:text-zinc-200 hover:border-zinc-600 transition-all">
              Bỏ chọn
            </button>
            <button onClick={copySelected}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'
              }`}>
              {copied ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              )}
              {copied ? `Đã copy ${selected.size} link!` : `Copy All Link (${selected.size})`}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-zinc-600 text-sm">
          {search.trim()
            ? <>Không tìm thấy kết quả cho "{search}"</>
            : statusFilter
              ? <>Không có video nào gắn nhãn <span className="font-semibold">{statusFilter === 'doing' ? 'Doing' : 'Done'}</span></>
              : <>Chưa có Bookmark nào</>}
        </div>
      )}

      {/* Groups */}
      {groups.map(group => (
        <div key={group.channelId || group.channelName} className="card p-5 flex flex-col gap-4">
          {/* Channel header */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-3 min-w-0">
              {group.channelThumbnail ? (
                <img src={group.channelThumbnail} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-200 truncate">{group.channelName}</p>
                <p className="text-xs text-zinc-500">{group.items.length} Bookmark</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(() => {
                const ids = group.items.map(i => i.videoId)
                const allSel = ids.every(id => selected.has(id))
                return (
                  <button
                    onClick={() => setSelected(prev => {
                      const n = new Set(prev)
                      if (allSel) ids.forEach(id => n.delete(id))
                      else ids.forEach(id => n.add(id))
                      return n
                    })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      allSel
                        ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                        : 'border-zinc-700 text-zinc-400 hover:text-violet-300 hover:border-violet-500/40'
                    }`}>
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      allSel ? 'bg-violet-600 border-violet-600 text-white' : 'border-zinc-600 text-transparent'
                    }`}>
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {allSel ? 'Bỏ chọn kênh' : 'Chọn cả kênh'}
                  </button>
                )
              })()}
              {group.channelId && onAnalyzeChannel && (
                <button onClick={() => onAnalyzeChannel(group.channelId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border
                    border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Phân tích kênh này
                </button>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-3">
            {group.items.map(item => (
              <div key={item.videoId}
                style={{ borderLeftColor: COLOR_HEX[item.color] || COLOR_HEX.amber }}
                className={`flex gap-3 p-3 rounded-xl border border-l-4 transition-colors ${
                  selected.has(item.videoId)
                    ? 'bg-violet-500/10 border-violet-500/40'
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                }`}>
                {/* Số thứ tự gốc của clip */}
                <span className="shrink-0 w-6 pt-0.5 text-right font-mono text-xs text-zinc-600">
                  {item.originalIndex != null ? item.originalIndex : '—'}
                </span>
                {/* Thumbnail */}
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 rounded-lg overflow-hidden relative group">
                  <img src={item.thumbnail} alt="" className="w-32 h-[72px] object-cover
                    opacity-90 group-hover:opacity-100 transition-opacity" />
                  {item.durationStr && (
                    <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px]
                      font-medium px-1.5 py-0.5 rounded">{item.durationStr}</span>
                  )}
                  {item.isShort && (
                    <span className="absolute top-1 left-1 bg-rose-500 text-white text-[9px]
                      font-bold px-1.5 py-0.5 rounded-full">SHORT</span>
                  )}
                </a>

                {/* Content */}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-zinc-200 hover:text-violet-300
                        transition-colors line-clamp-2 leading-relaxed">
                      {item.title}
                    </a>
                    <div className="flex items-center gap-1 shrink-0">
                      <SelectBox checked={selected.has(item.videoId)} onChange={() => toggleSelect(item.videoId)} />
                      <CopyLinkBtn url={item.url} />
                      {onOpenChannelVideo && item.channelId && (
                        <button onClick={() => onOpenChannelVideo(item.channelId, item.videoId)}
                          title="Mở kênh (Phân tích kênh) & nhảy tới video này"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600
                            hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </button>
                      )}
                      {hd && (
                        <button onClick={() => hideAndRemove(item)}
                          title="Ẩn video (huỷ luôn Bookmark)"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600
                            hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => remove(item.videoId)}
                        title="Bỏ Bookmark"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600
                          hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 -mt-1">
                    {item.savedAt
                      ? <p className="text-[10px] text-zinc-600 font-mono">Lưu lúc {formatDate(item.savedAt)}</p>
                      : <span />}
                    <StatusTags value={item.status} onChange={(v) => setStatus(item.videoId, v)} />
                  </div>
                  <NoteEditor value={item.note} onChange={(v) => setNote(item.videoId, v)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
