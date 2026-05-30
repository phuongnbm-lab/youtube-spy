import React, { useState, useMemo, useEffect, useRef } from 'react'
import VideoDetailModal from './VideoDetailModal'

const MARKER_COLORS = [
  { key: 'amber',   hex: '#f59e0b', border: 'border-l-amber-500/70',   bg: 'bg-amber-500/6',   hbg: 'hover:bg-amber-500/12',  icon: 'text-amber-400',   label: 'Vàng'       },
  { key: 'red',     hex: '#ef4444', border: 'border-l-red-500/70',     bg: 'bg-red-500/6',     hbg: 'hover:bg-red-500/12',    icon: 'text-red-400',     label: 'Đỏ'         },
  { key: 'emerald', hex: '#10b981', border: 'border-l-emerald-500/70', bg: 'bg-emerald-500/6', hbg: 'hover:bg-emerald-500/12',icon: 'text-emerald-400', label: 'Xanh lá'    },
  { key: 'sky',     hex: '#0ea5e9', border: 'border-l-sky-500/70',     bg: 'bg-sky-500/6',     hbg: 'hover:bg-sky-500/12',    icon: 'text-sky-400',     label: 'Xanh dương' },
  { key: 'violet',  hex: '#8b5cf6', border: 'border-l-violet-500/70',  bg: 'bg-violet-500/6',  hbg: 'hover:bg-violet-500/12', icon: 'text-violet-400',  label: 'Tím'         },
]
const colorOf = (key) => MARKER_COLORS.find(c => c.key === key) ?? MARKER_COLORS[0]

const DAY_COLORS = {
  'Thứ 2': 'text-blue-400 bg-blue-500/10',
  'Thứ 3': 'text-indigo-400 bg-indigo-500/10',
  'Thứ 4': 'text-violet-400 bg-violet-500/10',
  'Thứ 5': 'text-purple-400 bg-purple-500/10',
  'Thứ 6': 'text-pink-400 bg-pink-500/10',
  'Thứ 7': 'text-orange-400 bg-orange-500/10',
  'Chủ nhật': 'text-rose-400 bg-rose-500/10',
}
const DAYS_LABEL = ['T2','T3','T4','T5','T6','T7','CN']

function formatViews(n) {
  const num = parseInt(n || 0)
  if (!num) return '—'
  if (num >= 1_000_000) return `${(num/1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num/1_000).toFixed(0)}K`
  return num.toString()
}

// Tạo slug tên file: chỉ giữ ký tự an toàn, tối đa 30 ký tự
function fileSlug(name) {
  return (name || 'channel')
    .replace(/[^\wÀ-ɏ一-鿿]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30) || 'channel'
}
function today() { return new Date().toISOString().slice(0, 10) }

function exportCsv(videos, channelName) {
  const escape = s => `"${String(s || '').replace(/"/g, '""')}"`
  const header = ['#','Tiêu đề','URL','Ngày đăng','Ngày trong tuần','Giờ','Views','Likes','Duration','Loại','Tags']
  const rows = videos.map((v, i) => [
    i + 1,
    escape(v.title),
    escape(`https://youtube.com/watch?v=${v.videoId}`),
    escape(v.publishedAt),
    escape(v.dayName),
    v.hour,
    parseInt(v.viewCount || 0),
    parseInt(v.likeCount || 0),
    escape(v.durationStr || ''),
    v.isShort ? 'Short' : 'Long',
    escape((v.tags || []).join(', ')),
  ])
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileSlug(channelName)}_${today()}_videos.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportTxt(videos, channelName) {
  const lines = videos.map((v, i) =>
    [
      `${i+1}. ${v.title}`,
      `   URL  : https://youtube.com/watch?v=${v.videoId}`,
      `   Ngày : ${v.publishedAt} (${v.dayName})`,
      `   Views: ${parseInt(v.viewCount||0).toLocaleString()}`,
      v.tags?.length ? `   Tags : ${v.tags.join(', ')}` : null,
      v.description ? `   Mô tả: ${v.description.slice(0,150)}...` : null,
    ].filter(Boolean).join('\n')
  ).join('\n\n')

  const blob = new Blob([`YouTube Spy Export — ${channelName || 'channel'}\n${'='.repeat(40)}\nTổng: ${videos.length} video\n\n${lines}`],
    { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileSlug(channelName)}_${today()}_videos.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function VideoList({ videos, channelName }) {
  const [search, setSearch] = useState('')
  const [searchIn, setSearchIn] = useState({ title: true, description: true, tags: true })
  const [hourFrom, setHourFrom] = useState(0)
  const [hourTo, setHourTo] = useState(23)
  const [activeDays, setActiveDays] = useState([])       // [] = all
  const [activeMonths, setActiveMonths] = useState([])   // [] = all
  const [activeYears, setActiveYears] = useState([])     // [] = all
  const [videoType, setVideoType] = useState('all')      // 'all' | 'short' | 'long'
  const [onlyBookmarked, setOnlyBookmarked] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('table')      // 'table' | 'grid'
  const [sortBy, setSortBy] = useState('default')        // 'default' | 'views_desc' | 'views_asc'
  const [expandedDesc, setExpandedDesc] = useState(null)
  const [detailVideo, setDetailVideo] = useState(null)
  const [bookmarks, setBookmarks] = useState({})  // videoId → colorKey
  const [openPickerId, setOpenPickerId] = useState(null)

  const toggleBookmark = (e, videoId) => {
    e.stopPropagation()
if (bookmarks[videoId]) {
      setOpenPickerId(prev => prev === videoId ? null : videoId)
    } else {
      setBookmarks(prev => ({ ...prev, [videoId]: 'amber' }))
      setOpenPickerId(videoId)
    }
  }
  const setBookmarkColor = (videoId, colorKey) => {
    setBookmarks(prev => ({ ...prev, [videoId]: colorKey }))
    setOpenPickerId(null)
  }
  const removeBookmark = (videoId) => {
    setBookmarks(prev => { const n = { ...prev }; delete n[videoId]; return n })
    setOpenPickerId(null)
  }

  // Derived unique months/years from data
  const allMonths = useMemo(() => [...new Set(videos.map(v => v.month))].sort((a,b)=>a-b), [videos])
  const allYears  = useMemo(() => [...new Set(videos.map(v => v.year))].sort((a,b)=>b-a), [videos])

  // Đóng color picker khi click ra ngoài
  useEffect(() => {
    if (!openPickerId) return
    const handler = () => setOpenPickerId(null)
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openPickerId])

  const toggleArr = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val])

  // Count active filters
  const activeFilterCount = [
    search.trim(),
    hourFrom > 0 || hourTo < 23,
    activeDays.length,
    activeMonths.length,
    activeYears.length,
    videoType !== 'all',
  ].filter(Boolean).length

  const resetFilters = () => {
    setSearch(''); setHourFrom(0); setHourTo(23)
    setActiveDays([]); setActiveMonths([]); setActiveYears([])
    setSearchIn({ title: true, description: true, tags: true })
    setVideoType('all')
  }

  const bookmarkIds = Object.keys(bookmarks)
const filtered = useMemo(() => videos.filter(v => {
    if (onlyBookmarked && !bookmarks[v.videoId]) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const inTitle = searchIn.title && v.title.toLowerCase().includes(q)
      const inDesc  = searchIn.description && (v.description||'').toLowerCase().includes(q)
      const inTags  = searchIn.tags && (v.tags||[]).some(t=>t.toLowerCase().includes(q))
      if (!inTitle && !inDesc && !inTags) return false
    }
    if (v.hour < hourFrom || v.hour > hourTo) return false
    if (activeDays.length   && !activeDays.includes(v.dayIndex))   return false
    if (activeMonths.length && !activeMonths.includes(v.month))    return false
    if (activeYears.length  && !activeYears.includes(v.year))      return false
    if (videoType === 'short' && !v.isShort) return false
    if (videoType === 'long'  && v.isShort)  return false
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [videos, onlyBookmarked, bookmarkIds.join(','), search, searchIn, hourFrom, hourTo, activeDays, activeMonths, activeYears, videoType])

  const sorted = (() => {
    if (sortBy === 'views_desc') return [...filtered].sort((a, b) => parseInt(b.viewCount || 0) - parseInt(a.viewCount || 0))
    if (sortBy === 'views_asc')  return [...filtered].sort((a, b) => parseInt(a.viewCount || 0) - parseInt(b.viewCount || 0))
    return filtered
  })()

  const cycleSortBy = () => setSortBy(s => s === 'default' ? 'views_desc' : s === 'views_desc' ? 'views_asc' : 'default')

  return (
    <div className="card p-5 flex flex-col gap-4">
      <VideoDetailModal video={detailVideo} onClose={() => setDetailVideo(null)} channelName={channelName} />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Danh sách video</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{sorted.length} / {videos.length} video</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode */}
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            <button onClick={()=>setViewMode('table')}
              className={`px-2.5 py-1.5 text-xs transition-colors ${viewMode==='table' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
            </button>
            <button onClick={()=>setViewMode('grid')}
              className={`px-2.5 py-1.5 text-xs transition-colors ${viewMode==='grid' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
              </svg>
            </button>
          </div>

          {/* Bookmark filter */}
          {Object.keys(bookmarks).length > 0 && (
            <button onClick={()=>setOnlyBookmarked(v=>!v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                onlyBookmarked
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 ring-1 ring-amber-400/30'
                  : 'border-zinc-700 text-zinc-500 hover:text-amber-400 hover:border-amber-500/30'
              }`}>
              <svg className="w-3.5 h-3.5" fill={onlyBookmarked ? 'currentColor' : 'none'}
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"/>
              </svg>
              {Object.keys(bookmarks).length} đánh dấu
            </button>
          )}

          {/* Sort by views */}
          <button onClick={cycleSortBy}
            title={sortBy === 'default' ? 'Sắp xếp theo views' : sortBy === 'views_desc' ? 'Đang: Nhiều view nhất' : 'Đang: Ít view nhất'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
              sortBy !== 'default'
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            {sortBy === 'default'     && 'Views'}
            {sortBy === 'views_desc'  && 'Views ↓'}
            {sortBy === 'views_asc'   && 'Views ↑'}
          </button>

          {/* Filter toggle */}
          <button onClick={()=>setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all
              ${showFilters ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="bg-violet-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Export */}
          <button onClick={()=>exportTxt(sorted, channelName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-zinc-700
              text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Xuất TXT
          </button>
          <button onClick={()=>exportCsv(sorted, channelName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-zinc-700
              text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/40 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex flex-col gap-4">
          {/* Search */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400">Tìm kiếm</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"/>
                </svg>
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Nhập từ khoá..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2
                    text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none
                    focus:border-violet-500 transition-all"/>
              </div>
              {search && (
                <button onClick={()=>setSearch('')}
                  className="px-2 text-zinc-600 hover:text-zinc-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            {/* Search scope */}
            <div className="flex gap-2 flex-wrap">
              {[['title','Tiêu đề'],['description','Mô tả'],['tags','Thẻ tag']].map(([key,label])=>(
                <button key={key}
                  onClick={()=>setSearchIn(s=>({...s,[key]:!s[key]}))}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-all
                    ${searchIn[key] ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'border-zinc-700 text-zinc-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hour */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Giờ đăng</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={23} value={hourFrom}
                  onChange={e=>setHourFrom(Math.min(Number(e.target.value), hourTo))}
                  className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5
                    text-xs text-center text-zinc-200 focus:outline-none focus:border-violet-500"/>
                <span className="text-zinc-600 text-xs">→</span>
                <input type="number" min={0} max={23} value={hourTo}
                  onChange={e=>setHourTo(Math.max(Number(e.target.value), hourFrom))}
                  className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5
                    text-xs text-center text-zinc-200 focus:outline-none focus:border-violet-500"/>
                <span className="text-zinc-600 text-xs">h</span>
              </div>
            </div>

            {/* Day */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Ngày trong tuần</label>
              <div className="flex flex-wrap gap-1">
                {DAYS_LABEL.map((d,i)=>(
                  <button key={i} onClick={()=>toggleArr(activeDays,setActiveDays,i)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-medium border transition-all
                      ${activeDays.includes(i) ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'border-zinc-700 text-zinc-600 hover:text-zinc-400'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Video type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Loại video</label>
              <div className="flex gap-1">
                {[['all','Tất cả'],['long','📹 Long'],['short','🩳 Short']].map(([val,label])=>(
                  <button key={val} onClick={()=>setVideoType(val)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                      videoType===val
                        ? val==='short' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : val==='long' ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                          : 'bg-zinc-700 border-zinc-600 text-zinc-200'
                        : 'border-zinc-700 text-zinc-600 hover:text-zinc-400'
                    }`}>{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Month */}
            {allMonths.length > 1 && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400">Tháng</label>
                <div className="flex flex-wrap gap-1">
                  {allMonths.map(m=>(
                    <button key={m} onClick={()=>toggleArr(activeMonths,setActiveMonths,m)}
                      className={`px-2 h-7 rounded-lg text-[10px] font-medium border transition-all
                        ${activeMonths.includes(m) ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'border-zinc-700 text-zinc-600 hover:text-zinc-400'}`}>
                      T{m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Year */}
            {allYears.length > 1 && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400">Năm</label>
                <div className="flex flex-wrap gap-1">
                  {allYears.map(y=>(
                    <button key={y} onClick={()=>toggleArr(activeYears,setActiveYears,y)}
                      className={`px-2 h-7 rounded-lg text-[10px] font-medium border transition-all
                        ${activeYears.includes(y) ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'border-zinc-700 text-zinc-600 hover:text-zinc-400'}`}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button onClick={resetFilters}
              className="self-start text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Xoá bộ lọc
            </button>
          )}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="w-6 px-1"></th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-8">#</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tiêu đề</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-24">Ngày</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-32">Thời điểm</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-20">Duration</th>
              <th className="text-center py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-16">Views</th>
              <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {sorted.map((video, idx) => (
                <React.Fragment key={video.videoId}>
                  <tr
                    className={`group transition-colors cursor-pointer border-l-2 ${
                      bookmarks[video.videoId]
                        ? `${colorOf(bookmarks[video.videoId]).bg} ${colorOf(bookmarks[video.videoId]).hbg} ${colorOf(bookmarks[video.videoId]).border}`
                        : 'hover:bg-zinc-900/60 border-l-transparent'
                    }`}
                    onClick={()=>setExpandedDesc(expandedDesc===video.videoId ? null : video.videoId)}>
                    {/* Bookmark button + color picker */}
                    <td className="py-3 pl-2 pr-0 relative" onClick={e=>e.stopPropagation()}>
                      <button
                        onClick={e=>toggleBookmark(e, video.videoId)}
                        title={bookmarks[video.videoId] ? 'Đổi màu / Bỏ đánh dấu' : 'Đánh dấu'}
                        className={`w-5 h-5 flex items-center justify-center rounded transition-all ${
                          bookmarks[video.videoId]
                            ? colorOf(bookmarks[video.videoId]).icon
                            : 'text-zinc-700 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                        }`}>
                        <svg className="w-3.5 h-3.5" fill={bookmarks[video.videoId] ? 'currentColor' : 'none'}
                          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"/>
                        </svg>
                      </button>
                      {/* Color picker popover */}
                      {openPickerId === video.videoId && (
                        <div
                          onMouseDown={e => e.stopPropagation()}
                          className="absolute left-6 top-1/2 -translate-y-1/2 z-50
                          bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl
                          flex items-center gap-1 p-1.5">
                          {MARKER_COLORS.map(c => (
                            <button key={c.key}
                              onClick={() => setBookmarkColor(video.videoId, c.key)}
                              title={c.label}
                              className="w-5 h-5 rounded-full transition-transform hover:scale-125 focus:outline-none"
                              style={{
                                backgroundColor: c.hex,
                                boxShadow: bookmarks[video.videoId] === c.key
                                  ? `0 0 0 2px #18181b, 0 0 0 3.5px ${c.hex}` : 'none',
                              }}
                            />
                          ))}
                          <div className="w-px h-4 bg-zinc-700 mx-0.5"/>
                          <button onClick={() => removeBookmark(video.videoId)}
                            title="Bỏ đánh dấu"
                            className="w-5 h-5 flex items-center justify-center text-zinc-500
                              hover:text-red-400 transition-colors rounded">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-zinc-600 font-mono text-xs">{idx+1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail → mở YouTube */}
                        <a href={`https://www.youtube.com/watch?v=${video.videoId}`}
                          target="_blank" rel="noopener noreferrer"
                          onClick={e=>e.stopPropagation()}
                          className="shrink-0 rounded overflow-hidden">
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt="" className="w-16 h-9 object-cover
                              opacity-80 hover:opacity-100 transition-opacity"/>
                          ) : (
                            <div className="w-16 h-9 bg-zinc-800"/>
                          )}
                        </a>
                        {/* Title — có thể chọn & Ctrl+hover để dịch */}
                        <div className="min-w-0">
                          <span
                            className="text-zinc-300 hover:text-violet-300 transition-colors
                              line-clamp-2 text-xs leading-relaxed block select-text cursor-text"
                            onClick={e=>e.stopPropagation()}
                          >{video.title}</span>
                          {video.tags?.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {video.tags.slice(0,3).map(tag=>(
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded
                                  bg-violet-500/10 text-violet-400 border border-violet-500/20 truncate max-w-[80px]">
                                  #{tag}
                                </span>
                              ))}
                              {video.tags.length > 3 && (
                                <span className="text-[10px] text-zinc-600">+{video.tags.length-3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium
                        ${DAY_COLORS[video.dayName] || 'text-zinc-400 bg-zinc-800'}`}>
                        {video.dayName}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-zinc-400">{video.publishedAt}</td>
                    <td className="py-3 px-3 text-center">
                      {video.durationStr ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-mono text-xs text-zinc-400">{video.durationStr}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            video.isShort
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-sky-500/15 text-sky-400'
                          }`}>
                            {video.isShort ? '🩳 Short' : '📹 Long'}
                          </span>
                        </div>
                      ) : <span className="text-zinc-700">—</span>}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-zinc-500">{formatViews(video.viewCount)}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={e => { e.stopPropagation(); setDetailVideo(video) }}
                        title="Xem chi tiết"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600
                          hover:text-violet-400 hover:bg-violet-500/10 border border-transparent
                          hover:border-violet-500/30 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {expandedDesc === video.videoId && (
                    <tr key={`${video.videoId}-desc`} className="bg-zinc-900/40">
                      <td colSpan={7} className="px-6 py-3">
                        {video.description ? (
                          <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{video.description}</p>
                        ) : (
                          <p className="text-xs text-zinc-600 italic">Không có mô tả</p>
                        )}
                        {video.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {video.tags.map(tag=>(
                              <span key={tag} className="text-[10px] px-2 py-1 rounded-full
                                bg-zinc-800 text-zinc-400 border border-zinc-700">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-zinc-600 text-sm">
                  Không tìm thấy video nào
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* THUMBNAIL GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {sorted.map((video) => (
            <a key={video.videoId}
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank" rel="noopener noreferrer"
              className="group flex flex-col gap-2 bg-zinc-900 rounded-xl overflow-hidden
                border border-zinc-800 hover:border-violet-500/40 transition-all">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-zinc-800">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt="" className="w-full h-full object-cover
                    group-hover:scale-105 transition-transform duration-300"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-zinc-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                )}
                {video.durationStr && (
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px]
                    font-medium px-1.5 py-0.5 rounded">{video.durationStr}</div>
                )}
                {video.isShort !== undefined && (
                  <div className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    video.isShort ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'
                  }`}>
                    {video.isShort ? 'SHORT' : 'LONG'}
                  </div>
                )}
                {formatViews(video.viewCount) !== '—' && (
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px]
                    font-medium px-1.5 py-0.5 rounded">{formatViews(video.viewCount)}</div>
                )}
              </div>
              {/* Info */}
              <div className="p-2 flex flex-col gap-1.5">
                <p className="text-xs font-medium text-zinc-300 line-clamp-2 leading-relaxed
                  group-hover:text-violet-300 transition-colors">{video.title}</p>
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded
                    ${DAY_COLORS[video.dayName] || 'text-zinc-400 bg-zinc-800'}`}>{video.dayName}</span>
                  <span className="text-[10px] font-mono text-zinc-600">{video.publishedAt.split(' ')[0]}</span>
                </div>
                {video.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {video.tags.slice(0,2).map(tag=>(
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded
                        bg-violet-500/10 text-violet-400 truncate max-w-[70px]">#{tag}</span>
                    ))}
                  </div>
                )}
                <button
                  onClick={e=>{ e.preventDefault(); e.stopPropagation(); setDetailVideo(video) }}
                  className="self-start flex items-center gap-1 text-[10px] text-zinc-600
                    hover:text-violet-400 transition-colors mt-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Chi tiết
                </button>
              </div>
            </a>
          ))}
          {sorted.length === 0 && (
            <div className="col-span-full py-10 text-center text-zinc-600 text-sm">
              Không tìm thấy video nào
            </div>
          )}
        </div>
      )}
    </div>
  )
}
