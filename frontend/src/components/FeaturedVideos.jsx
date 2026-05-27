function formatViews(n) {
  const num = parseInt(n || 0)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K views`
  return num > 0 ? `${num} views` : null
}

export default function FeaturedVideos({ videos, peakHour }) {
  // Top 3 bởi viewCount tại giờ cao điểm, fallback sang top 3 overall
  const atPeak = videos.filter(v => v.hour === peakHour && parseInt(v.viewCount || 0) > 0)
  const sorted = [...(atPeak.length >= 2 ? atPeak : videos)]
    .sort((a, b) => parseInt(b.viewCount || 0) - parseInt(a.viewCount || 0))
    .slice(0, 3)

  if (!sorted.length) return null

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Video nổi bật</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Top 3 lượt xem nhiều nhất</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sorted.map((video, i) => {
          const views = formatViews(video.viewCount)
          return (
            <a
              key={video.videoId}
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2.5 bg-zinc-900 rounded-xl p-3 border border-zinc-800
                hover:border-violet-500/40 hover:bg-zinc-900/80 transition-all"
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
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-zinc-300 line-clamp-2 group-hover:text-violet-300
                  transition-colors leading-relaxed">{video.title}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-600 font-mono">{video.publishedAt}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded
                    ${video.hour === peakHour ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {video.hour}:00
                  </span>
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
            </a>
          )
        })}
      </div>
    </div>
  )
}
