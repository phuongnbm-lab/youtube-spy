import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

function parseDate(s) {
  const [datePart] = (s || '').split(' ')
  const [d, m, y] = datePart.split('/').map(Number)
  return new Date(y, m - 1, d)
}

function movingAvg(arr, window = 3) {
  return arr.map((_, i) => {
    const slice = arr.slice(Math.max(0, i - window + 1), i + 1)
    return Math.round(slice.reduce((s, x) => s + x, 0) / slice.length)
  })
}

function fmtViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export default function ViewTrend({ videos }) {
  const sorted = useMemo(() =>
    [...videos]
      .filter(v => parseInt(v.viewCount || 0) > 0)
      .sort((a, b) => parseDate(a.publishedAt) - parseDate(b.publishedAt)),
    [videos]
  )

  if (sorted.length < 3) return null

  const labels   = sorted.map(v => v.publishedAt.split(' ')[0])
  const rawViews = sorted.map(v => parseInt(v.viewCount))
  const maViews  = movingAvg(rawViews, 3)

  const maxV = Math.max(...rawViews)
  const minV = Math.min(...rawViews)
  const avgV = Math.round(rawViews.reduce((s, x) => s + x, 0) / rawViews.length)

  // Find peak video
  const peakIdx   = rawViews.indexOf(maxV)
  const peakVideo = sorted[peakIdx]

  const data = {
    labels,
    datasets: [
      {
        label: 'Lượt xem',
        data: rawViews,
        borderColor: 'rgba(139,92,246,0.6)',
        backgroundColor: 'rgba(139,92,246,0.06)',
        pointBackgroundColor: rawViews.map(v => v === maxV ? 'rgba(251,146,60,1)' : 'rgba(139,92,246,0.8)'),
        pointBorderColor: 'transparent',
        pointRadius: rawViews.map(v => v === maxV ? 6 : 2.5),
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35,
        borderWidth: 1.5,
      },
      {
        label: 'Trung bình động (3 video)',
        data: maViews,
        borderColor: 'rgba(34,197,94,0.7)',
        backgroundColor: 'transparent',
        pointRadius: 0,
        borderWidth: 1.5,
        borderDash: [4, 3],
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: '#71717a',
          font: { size: 10 },
          boxWidth: 12,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#3f3f46',
        borderWidth: 1,
        titleColor: '#a1a1aa',
        bodyColor: '#e4e4e7',
        titleFont: { size: 10 },
        bodyFont: { size: 11 },
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${fmtViews(ctx.raw)}`,
          title: titles => {
            const idx = titles[0].dataIndex
            return sorted[idx]?.title?.slice(0, 50) + (sorted[idx]?.title?.length > 50 ? '…' : '')
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#52525b',
          font: { size: 9 },
          maxTicksLimit: 8,
          maxRotation: 0,
        },
        grid: { color: '#27272a', drawBorder: false },
      },
      y: {
        ticks: {
          color: '#52525b',
          font: { size: 9 },
          callback: v => fmtViews(v),
        },
        grid: { color: '#27272a', drawBorder: false },
      },
    },
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Xu hướng lượt xem</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Diễn biến views theo thời gian · {sorted.length} video</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="text-right">
            <p className="text-[10px] text-zinc-600">Cao nhất</p>
            <p className="text-xs font-semibold text-amber-400">{fmtViews(maxV)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-600">Trung bình</p>
            <p className="text-xs font-semibold text-violet-400">{fmtViews(avgV)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-600">Thấp nhất</p>
            <p className="text-xs font-semibold text-zinc-500">{fmtViews(minV)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '200px' }}>
        <Line data={data} options={options} />
      </div>

      {/* Peak video */}
      {peakVideo && (
        <div className="mt-3 flex items-center gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
          <span className="text-base">🏆</span>
          <div className="min-w-0">
            <p className="text-[10px] text-amber-500 font-semibold">Video nhiều view nhất</p>
            <a href={`https://youtube.com/watch?v=${peakVideo.videoId}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-zinc-300 hover:text-amber-400 transition-colors truncate block">
              {peakVideo.title}
            </a>
          </div>
          <span className="text-xs font-bold text-amber-400 shrink-0">{fmtViews(maxV)}</span>
        </div>
      )}
    </div>
  )
}
