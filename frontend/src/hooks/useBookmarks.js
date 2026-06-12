import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Bookmark persistent — lưu link đã đánh dấu + ghi chú vào file cạnh EXE
 * (qua /api/bookmarks). Bền vững khi thoát & mở lại app, không phụ thuộc port.
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([])
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef(null)

  // Nạp từ backend khi khởi động
  useEffect(() => {
    fetch('/api/bookmarks')
      .then(r => r.json())
      .then(d => setBookmarks(Array.isArray(d.bookmarks) ? d.bookmarks : []))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // Ghi xuống backend (debounce 400ms — gộp nhiều lần gõ ghi chú)
  const persist = useCallback((items) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarks: items }),
      }).catch(() => {})
    }, 400)
  }, [])

  const update = useCallback((updater) => {
    setBookmarks(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      persist(next)
      return next
    })
  }, [persist])

  const isSaved = useCallback(
    (videoId) => bookmarks.some(b => b.videoId === videoId),
    [bookmarks]
  )

  const toggle = useCallback((video, channel = {}) => {
    update(prev => {
      if (prev.some(b => b.videoId === video.videoId)) {
        return prev.filter(b => b.videoId !== video.videoId)
      }
      const entry = {
        videoId: video.videoId,
        title: video.title || '',
        thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
        url: `https://youtube.com/watch?v=${video.videoId}`,
        durationStr: video.durationStr || '',
        isShort: !!video.isShort,
        publishedAt: video.publishedAt || '',
        channelId: channel.channelId || channel.id || '',
        channelName: channel.name || channel.channelName || 'Kênh khác',
        channelThumbnail: channel.thumbnail || '',
        note: '',
        savedAt: Date.now(),
      }
      return [entry, ...prev]
    })
  }, [update])

  const remove = useCallback((videoId) => {
    update(prev => prev.filter(b => b.videoId !== videoId))
  }, [update])

  const setNote = useCallback((videoId, note) => {
    update(prev => prev.map(b => b.videoId === videoId ? { ...b, note } : b))
  }, [update])

  const clear = useCallback(() => update([]), [update])

  return { bookmarks, loaded, isSaved, toggle, remove, setNote, clear }
}
