import { useState } from 'react'

const DAY_COLORS = {
  'Thứ 2': 'text-blue-400 bg-blue-500/10',
  'Thứ 3': 'text-indigo-400 bg-indigo-500/10',
  'Thứ 4': 'text-violet-400 bg-violet-500/10',
  'Thứ 5': 'text-purple-400 bg-purple-500/10',
  'Thứ 6': 'text-pink-400 bg-pink-500/10',
  'Thứ 7': 'text-orange-400 bg-orange-500/10',
  'Chủ nhật': 'text-rose-400 bg-rose-500/10',
}

export default function VideoList({ videos }) {
  const [search, setSearch] = useState('')

  const filtered = videos.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Danh sách video</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{filtered.length} / {videos.length} video</p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm video..."
            className="bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300
              placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 w-56 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-10">#</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tiêu đề</th>
              <th className="text-center py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-28">Ngày</th>
              <th className="text-center py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-36">Thời điểm đăng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.map((video, idx) => (
              <tr key={video.videoId} className="group hover:bg-zinc-900/60 transition-colors">
                <td className="py-3 px-3 text-zinc-600 font-mono text-xs">{idx + 1}</td>
                <td className="py-3 px-3">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group/link"
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt=""
                        className="w-16 h-9 rounded object-cover shrink-0 opacity-80 group-hover/link:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-16 h-9 rounded bg-zinc-800 shrink-0" />
                    )}
                    <span className="text-zinc-300 group-hover/link:text-violet-300 transition-colors line-clamp-2 text-xs leading-relaxed">
                      {video.title}
                    </span>
                  </a>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${DAY_COLORS[video.dayName] || 'text-zinc-400 bg-zinc-800'}`}>
                    {video.dayName}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="font-mono text-xs text-zinc-400">{video.publishedAt}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-zinc-600 text-sm">
                  Không tìm thấy video nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
