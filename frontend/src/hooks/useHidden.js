import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hidden videos — danh sách video bị ẩn vĩnh viễn khỏi bảng.
 * Lưu metadata tối thiểu (đủ để hiện lại trong khu khôi phục) vào file cạnh EXE
 * qua /api/hidden. Bền vững khi thoát & mở lại app.
 */
export function useHidden() {
  const [hidden, setHidden] = useState([])
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef(null)

  // Nạp từ backend khi khởi động
  useEffect(() => {
    fetch('/api/hidden')
      .then(r => r.json())
      .then(d => setHidden(Array.isArray(d.hidden) ? d.hidden : []))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // Ghi xuống backend (debounce 400ms)
  const persist = useCallback((items) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/hidden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: items }),
      }).catch(() => {})
    }, 400)
  }, [])

  const update = useCallback((updater) => {
    setHidden(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      persist(next)
      return next
    })
  }, [persist])

  const isHidden = useCallback(
    (videoId) => hidden.some(h => h.videoId === videoId),
    [hidden]
  )

  const hide = useCallback((video, channel = {}) => {
    update(prev => {
      if (prev.some(h => h.videoId === video.videoId)) return prev
      const entry = {
        videoId: video.videoId,
        title: video.title || '',
        thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
        url: `https://youtube.com/watch?v=${video.videoId}`,
        channelName: channel.name || channel.channelName || 'Kênh khác',
        channelId: channel.channelId || channel.id || video.channelId || '',
        originalIndex: video.originalIndex ?? null,
        savedAt: video.savedAt ?? null,   // giữ thời gian lưu gốc (nếu ẩn từ Bookmark)
        note: video.note || '',           // giữ luôn ghi chú nếu có
        hiddenAt: Date.now(),
      }
      return [entry, ...prev]
    })
  }, [update])

  const unhide = useCallback((videoId) => {
    update(prev => prev.filter(h => h.videoId !== videoId))
  }, [update])

  const setNote = useCallback((videoId, note) => {
    update(prev => prev.map(h => h.videoId === videoId ? { ...h, note } : h))
  }, [update])

  // Điền số thứ tự gốc + channelId còn thiếu cho entry cũ (đối chiếu kênh đang xem)
  const backfillIndex = useCallback((idxMap, channelId) => {
    setHidden(prev => {
      let changed = false
      const next = prev.map(h => {
        if (idxMap[h.videoId] == null) return h        // không thuộc kênh đang xem
        const patch = {}
        if (h.originalIndex == null) patch.originalIndex = idxMap[h.videoId]
        if (!h.channelId && channelId) patch.channelId = channelId
        if (Object.keys(patch).length === 0) return h
        changed = true
        return { ...h, ...patch }
      })
      if (changed) persist(next)
      return changed ? next : prev
    })
  }, [persist])

  const clear = useCallback(() => update([]), [update])

  return { hidden, loaded, isHidden, hide, unhide, setNote, clear, backfillIndex }
}
