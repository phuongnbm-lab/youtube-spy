import { useState } from 'react'
import VideoDetailModal from './VideoDetailModal'

function formatViews(n) {
  const num = parseInt(n || 0)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K views`
  return num > 0 ? `${num} views` : null
}

export default function FeaturedVideos({ videos, peakHour }) {
  const [selectedVideo, setSelectedVideo] = useState(null)

  // Top 3 bởi viewCount tại giờ cao điểm, fallback sang top 3 overall
  const atPeak = videos.filter(v => v.hour === peakHour && parseInt(v.viewCount || 0) > 0)
  const sorted = [...(atPeak.length >= 2 ? atPeak : videos)]
    .sort((a, b) => parseInt(b.viewCount || 0) - parseInt(a.viewCount || 0))
    .slice(0, 3)

  if (!sorted.length) return null

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="card p-5">
      <VideoDetailModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Video nổi bật</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Top 3 lượt xem nhiều nhất · Click để xem chi tiết</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sorted.map((video, i) => {
          const views = formatViews(video.viewCount)
          return (
            <div
              key={video.videoId}
              onClick={() => setSelectedVideo(video)}
              className="group flex flex-col gap-2.5 bg-zinc-900 rounded-xl p-3 border border-zinc-800
                hover:border-violet-500/40 hover:bg-zinc-900/80 transition-all cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative rounded-lg overflow-hidden aspect-video bg-zinc-800">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt="" className="w-full h-full object-cover
                    group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-zinc-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 left-2 text-lg leading-none">{medals[i]}</div>
                {views && (
                  <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px]
                    font-medium px-1.5 py-0.5 rounded">
                    {views}
                  </div>
                )}

                {/* Hover overlay: xem chi tiết */}
                <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/20
                  transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity
                    bg-black/60 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-white text-[11px] font-medium">Chi tiết</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-zinc-300 line-clamp-2 group-hover:text-violet-300
                  transition-colors leading-relaxed">{video.title}</p>
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-zinc-600 font-mono">{video.publishedAt}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded
                      ${video.hour === peakHour ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {video.hour}:00
                    </span>
                  </div>
                  {/* Nút mở YouTube trực tiếp */}
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    title="Mở trên YouTube"
                    className="shrink-0 p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.47 4.83 4.83 0 00-3.77-2.47H6.41A4.83 4.83 0 002 6.41v11.18a4.83 4.83 0 004.41 4.66h11.18a4.83 4.83 0 004.41-4.66V6.41a4.83 4.83 0 00-2.41-1.72zM10 15V9l5 3-5 3z"/>
                    </svg>
                  </a>
                </div>
                {video.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {video.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10
                        text-violet-400 border border-violet-500/20 truncate max-w-[80px]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
