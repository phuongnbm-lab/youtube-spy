import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const DialogCtx = createContext(null)

const normalize = (opts) => (typeof opts === 'string' ? { message: opts } : (opts || {}))

export function DialogProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback((opts) => new Promise((resolve) => {
    setState({ type: 'confirm', confirmText: 'Đồng ý', cancelText: 'Huỷ', danger: false, ...normalize(opts), resolve })
  }), [])

  const alert = useCallback((opts) => new Promise((resolve) => {
    setState({ type: 'alert', confirmText: 'OK', ...normalize(opts), resolve })
  }), [])

  const close = useCallback((val) => {
    setState((s) => { s?.resolve?.(val); return null })
  }, [])

  return (
    <DialogCtx.Provider value={{ confirm, alert }}>
      {children}
      {state && <DialogModal state={state} onClose={close} />}
    </DialogCtx.Provider>
  )
}

function DialogModal({ state, onClose }) {
  const { type, title, message, confirmText, cancelText, danger } = state
  const isConfirm = type === 'confirm'

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(isConfirm ? false : undefined)
      if (e.key === 'Enter') onClose(isConfirm ? true : undefined)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isConfirm, onClose])

  const accent = danger
    ? { ring: 'bg-red-500/10 border-red-500/20 text-red-400',
        btn: 'bg-red-600 hover:bg-red-500 shadow-red-500/20' }
    : { ring: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
        btn: 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/20' }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm
        animate-in fade-in"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
      onMouseDown={() => onClose(isConfirm ? false : undefined)}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl
          p-5 flex flex-col gap-4"
        style={{ animation: 'popIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-start gap-3">
          <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${accent.ring}`}>
            {danger ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            {title && <h3 className="text-sm font-semibold text-zinc-100 mb-1">{title}</h3>}
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          {isConfirm && (
            <button
              onClick={() => onClose(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400
                border border-zinc-700 hover:text-zinc-200 hover:border-zinc-600 transition-all"
            >
              {cancelText}
            </button>
          )}
          <button
            autoFocus
            onClick={() => onClose(isConfirm ? true : undefined)}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg transition-all ${accent.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useDialog() {
  const ctx = useContext(DialogCtx)
  if (!ctx) throw new Error('useDialog must be used within <DialogProvider>')
  return ctx
}
