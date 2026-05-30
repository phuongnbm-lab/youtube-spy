import { useEffect, useState, useCallback, useRef } from 'react'

const VN_RE   = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
const WORD_RE = /[\wàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

function isVietnamese(text) { return VN_RE.test(text) }

async function translate(text) {
  const to = isVietnamese(text) ? 'en' : 'vi'
  // Google Translate free endpoint — tự nhận diện ngôn ngữ nguồn (ES, EN, JP, KO, ...)
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('API error')
  const json = await res.json()
  // Response: [[["translated","original",...], ...], null, "detected_lang", ...]
  const translated = json[0].map(item => item[0]).filter(Boolean).join('')
  if (!translated) throw new Error('No translation')
  return { text: translated, to }
}

// Lấy từ dưới con trỏ chuột bằng caret API
function getWordAtPoint(x, y) {
  try {
    let node, offset
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y)
      if (!r) return null
      node = r.startContainer; offset = r.startOffset
    } else if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y)
      if (!p) return null
      node = p.offsetNode; offset = p.offset
    }
    if (!node || node.nodeType !== Node.TEXT_NODE) return null
    const text = node.textContent
    if (!text) return null
    let s = offset, e = offset
    while (s > 0 && WORD_RE.test(text[s - 1])) s--
    while (e < text.length && WORD_RE.test(text[e])) e++
    const word = text.slice(s, e).trim()
    return word.length >= 2 ? word : null
  } catch { return null }
}

export default function TranslateTooltip() {
  const [tooltip,   setTooltip]   = useState(null)
  const [ctrlHeld,  setCtrlHeld]  = useState(false)
  const [dragPos,   setDragPos]   = useState(null)   // {x,y} khi user đã kéo
  const ctrlRef       = useRef(false)
  const abortRef      = useRef(null)
  const tooltipRef    = useRef(null)
  const hoverTimerRef = useRef(null)
  const lastWordRef   = useRef('')
  const isDragging    = useRef(false)
  const dragOffset    = useRef({ x: 0, y: 0 })

  const dismiss = useCallback(() => {
    setTooltip(null)
    setDragPos(null)
    lastWordRef.current = ''
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null }
  }, [])

  // Drag handlers
  const onDragStart = useCallback((e) => {
    if (e.button !== 0) return
    isDragging.current = true
    const rect = tooltipRef.current?.getBoundingClientRect()
    if (rect) dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    e.preventDefault()
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return
      setDragPos({
        x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth  - 296)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 180)),
      })
    }
    const onUp = () => { isDragging.current = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
  }, [])

  // Dịch văn bản tại toạ độ viewport (x, y)
  const doTranslateAt = useCallback(async (text, x, y) => {
    if (!text || text.length < 2 || text.length > 500) return
    setDragPos(null)   // reset vị trí kéo khi có từ/đoạn mới
    setTooltip({ x, y, state: 'loading', original: text, translated: '', to: 'vi' })
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    try {
      const result = await translate(text)
      setTooltip(prev => prev ? { ...prev, state: 'done', translated: result.text, to: result.to } : null)
    } catch {
      setTooltip(prev => prev ? { ...prev, state: 'error', translated: 'Không dịch được' } : null)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Control') {
        ctrlRef.current = true
        setCtrlHeld(true)
        // Đang có selection → dịch ngay
        const sel = window.getSelection()
        const txt = sel?.toString().trim()
        if (txt && txt.length > 1) {
          const rect = sel.getRangeAt(0).getBoundingClientRect()
          doTranslateAt(txt, rect.left + rect.width / 2, rect.bottom + 10)
        }
      }
      if (e.key === 'Escape') dismiss()
    }

    const onKeyUp = (e) => {
      if (e.key === 'Control') {
        ctrlRef.current = false
        setCtrlHeld(false)
        lastWordRef.current = ''
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      }
    }

    // Ctrl + thả chuột sau khi chọn văn bản
    const onMouseUp = (e) => {
      if (!e.ctrlKey && !ctrlRef.current) return
      setTimeout(() => {
        const sel = window.getSelection()
        const txt = sel?.toString().trim()
        if (!txt || txt.length < 2) return
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        doTranslateAt(txt, rect.left + rect.width / 2, rect.bottom + 10)
      }, 50)
    }

    // Ctrl + hover → dịch từ dưới con trỏ (debounce 350ms)
    const onMouseMove = (e) => {
      if (!e.ctrlKey && !ctrlRef.current) return
      if (e.target.closest?.('[data-ytspy-no-translate]')) return
      // Nếu đang chọn nhiều chữ thì bỏ qua hover
      const sel = window.getSelection()
      if (sel && sel.toString().trim().length > 1) return
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      const { clientX, clientY } = e
      hoverTimerRef.current = setTimeout(() => {
        const word = getWordAtPoint(clientX, clientY)
        if (!word || word === lastWordRef.current) return
        lastWordRef.current = word
        doTranslateAt(word, clientX, clientY + 22)
      }, 350)
    }

    const onMouseDown = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) dismiss()
    }

    document.addEventListener('keydown',   onKeyDown)
    document.addEventListener('keyup',     onKeyUp)
    document.addEventListener('mouseup',   onMouseUp)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown',   onKeyDown)
      document.removeEventListener('keyup',     onKeyUp)
      document.removeEventListener('mouseup',   onMouseUp)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mousedown', onMouseDown)
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [doTranslateAt, dismiss])

  // Đổi cursor khi giữ Ctrl để báo hiệu chế độ dịch
  useEffect(() => {
    document.body.style.cursor = ctrlHeld ? 'crosshair' : ''
    return () => { document.body.style.cursor = '' }
  }, [ctrlHeld])

  if (!tooltip) return null

  const { x, y, state, original, translated, to } = tooltip
  const tooltipW = 280
  const autoX = Math.min(Math.max(x - tooltipW / 2, 8), window.innerWidth - tooltipW - 8)
  const autoY = Math.min(y, window.innerHeight - 170)
  const posX = dragPos ? dragPos.x : autoX
  const posY = dragPos ? dragPos.y : autoY

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] pointer-events-auto"
      style={{ left: posX, top: posY }}
    >
      {/* Arrow — ẩn khi đã kéo */}
      {!dragPos && (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45
          bg-zinc-800 border-l border-t border-zinc-700/60" />
      )}

      {/* Card */}
      <div className="bg-zinc-800 border border-zinc-700/60 rounded-xl shadow-2xl shadow-black/50
        p-3 w-[280px] flex flex-col gap-2">

        {/* Header — drag handle */}
        <div
          className="flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onDragStart}
        >
          <div className="flex items-center gap-1.5">
            {/* dots icon */}
            <svg className="w-3 h-3 text-zinc-600 shrink-0" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="2.5" cy="4"  r="1.5"/><circle cx="7.5" cy="4"  r="1.5"/>
              <circle cx="2.5" cy="8"  r="1.5"/><circle cx="7.5" cy="8"  r="1.5"/>
              <circle cx="2.5" cy="12" r="1.5"/><circle cx="7.5" cy="12" r="1.5"/>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {to === 'vi' ? 'EN → VI' : 'VI → EN'}
            </span>
          </div>
          <button onClick={dismiss}
            onMouseDown={e => e.stopPropagation()}
            className="text-zinc-600 hover:text-zinc-400 transition-colors w-4 h-4 flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Original */}
        <div className="text-[11px] text-zinc-500 italic leading-relaxed line-clamp-2 border-b border-zinc-700/50 pb-2">
          "{original}"
        </div>

        {/* Translation */}
        <div className="min-h-[24px] flex items-center">
          {state === 'loading' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <span className="text-xs text-zinc-500">Đang dịch…</span>
            </div>
          )}
          {state === 'done' && (
            <p className="text-sm font-medium text-white leading-relaxed">{translated}</p>
          )}
          {state === 'error' && (
            <p className="text-xs text-red-400">{translated}</p>
          )}
        </div>

        {/* Footer */}
        {state === 'done' && (
          <div className="flex items-center justify-between pt-0.5 border-t border-zinc-700/50">
            <span className="text-[10px] text-zinc-600">MyMemory · Ctrl+hover hoặc Ctrl+chọn</span>
            <button
              onClick={() => navigator.clipboard?.writeText(translated)}
              className="text-[10px] text-zinc-600 hover:text-violet-400 transition-colors font-medium"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
