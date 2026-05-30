import { useEffect, useRef } from 'react'

export default function SearchHistoryDropdown({ history, keyword, onPick, onRemove, onClear, visible, setVisible }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setVisible(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setVisible])

  const filtered = history.filter(h =>
    !keyword.trim() || h.toLowerCase().includes(keyword.toLowerCase())
  )

  if (!visible || filtered.length === 0) return null

  return (
    <div ref={ref} className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">Tìm kiếm gần đây</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); setVisible(false) }}
          className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
        >
          Xoá tất cả
        </button>
      </div>
      {filtered.slice(0, 8).map((term) => (
        <div key={term} className="flex items-center group hover:bg-zinc-800 transition-colors">
          <button
            type="button"
            onClick={() => { onPick(term); setVisible(false) }}
            className="flex-1 flex items-center gap-2.5 px-3 py-2 text-left"
          >
            <svg className="w-3.5 h-3.5 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-zinc-300 truncate">{term}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(term) }}
            className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-300"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
