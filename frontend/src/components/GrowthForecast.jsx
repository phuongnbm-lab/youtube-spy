import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip,
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const MONTHS_VN = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']

function fmtV(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return Math.round(n).toString()
}

// Simple linear regression: returns {slope, intercept}
function linReg(xs, ys) {
  const n = xs.length
  if (n < 2) return { slope: 0, intercept: ys[0] || 0 }
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0)
  const sumX2 = xs.reduce((s, x) => s + x * x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

export default function GrowthForecast({ videos }) {
  const { chartData, chartOptions, forecast, trend } = useMemo(() => {
    if (!videos || videos.length < 4) return {}

    // Group by month: total views + video count
    const monthMap = {}
    videos.forEach(v => {
      const key = `${v.year}-${String(v.month).padStart(2, '0')}`
      if (!monthMap[key]) monthMap[key] = { views: 0, count: 0 }
      monthMap[key].views += parseInt(v.viewCount || 0)
      monthMap[key].count++
    })

    const sortedKeys  = Object.keys(monthMap).sort()
    if (sortedKeys.length < 2) return {}

    const labels    = sortedKeys.map(k => {
      const [y, m] = k.split('-')
      return `${MONTHS_VN[parseInt(m) - 1]}/${y.slice(2)}`
    })
    const viewsArr  = sortedKeys.map(k => monthMap[k].views)
    const countArr  = sortedKeys.map(k => monthMap[k].count)

    // Linear regression on monthly views
    const xs = sortedKeys.map((_, i) => i)
    const { slope: sV, intercept: iV } = linReg(xs, viewsArr)
    const { slope: sC, intercept: iC } = linReg(xs, countArr)

    // Project 3 months forward
    const n = sortedKeys.length
    const lastKey = sortedKeys[n - 1]
    const [ly, lm] = lastKey.split('-').map(Number)

    const projLabels = [], projViews = [], projCount = []
    for (let i = 1; i <= 3; i++) {
      const nm = ((lm - 1 + i) % 12) + 1
      const ny = lm + i > 12 ? ly + 1 : ly
      projLabels.push(`${MONTHS_VN[nm - 1]}/${String(ny).slice(2)}`)
      projViews.push(Math.max(0, Math.round(sV * (n + i - 1) + iV)))
      projCount.push(Math.max(0, Math.round(sC * (n + i - 1) + iC)))
    }

    const allLabels = [...labels, ...projLabels]
    const pad       = new Array(n).fill(null)

    // Trend direction
    const trend = sV > viewsArr[0] * 0.03 ? 'up' : sV < -viewsArr[0] * 0.03 ? 'down' : 'flat'

    const chartData = {
      labels: allLabels,
      datasets: [
        {
          label: 'Views thực tế (theo tháng)',
          data: [...viewsArr, ...new Array(3).fill(null)],
          borderColor: 'rgba(139,92,246,0.8)',
          backgroundColor: 'rgba(139,92,246,0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: 'rgba(139,92,246,0.9)',
        },
        {
          label: 'Dự báo (tuyến tính)',
          data: [...pad, viewsArr[n - 1], ...projViews],
          borderColor: 'rgba(34,197,94,0.7)',
          backgroundColor: 'rgba(34,197,94,0.06)',
          fill: true,
          tension: 0.35,
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: [0, 0, 0, 4, 4, 4, 4],
          pointBackgroundColor: 'rgba(34,197,94,0.9)',
        },
      ],
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#71717a', font: { size: 10 }, boxWidth: 12, padding: 12 } },
        tooltip: {
          backgroundColor: '#18181b', borderColor: '#3f3f46', borderWidth: 1,
          titleColor: '#a1a1aa', bodyColor: '#e4e4e7',
          callbacks: { label: ctx => ctx.raw != null ? ` ${ctx.dataset.label}: ${fmtV(ctx.raw)}` : null },
        },
      },
      scales: {
        x: { ticks: { color: '#52525b', font: { size: 9 }, maxTicksLimit: 10 }, grid: { color: '#27272a' } },
        y: { ticks: { color: '#52525b', font: { size: 9 }, callback: v => fmtV(v) }, grid: { color: '#27272a' } },
      },
    }

    return {
      chartData, chartOptions, trend,
      forecast: {
        views: projViews, count: projCount, labels: projLabels,
        totalProjViews: projViews.reduce((s, x) => s + x, 0),
        avgCurrent: Math.round(viewsArr.reduce((s, x) => s + x, 0) / viewsArr.length),
      },
    }
  }, [videos])

  if (!chartData || !forecast) return null

  const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'
  const trendText = trend === 'up' ? 'Đang tăng trưởng' : trend === 'down' ? 'Đang giảm' : 'Ổn định'
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-400'

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Dự báo tăng trưởng</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Projection tuyến tính 3 tháng tới</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base">{trendIcon}</span>
          <span className={`text-xs font-semibold ${trendColor}`}>{trendText}</span>
        </div>
      </div>

      {/* Forecast cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {forecast.labels.map((label, i) => (
          <div key={label} className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
            <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider mb-1.5">{label}</p>
            <p className="text-lg font-bold text-emerald-400">{fmtV(forecast.views[i])}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">~{forecast.count[i]} video</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: '180px' }}>
        <Line data={chartData} options={chartOptions}/>
      </div>

      <p className="text-[10px] text-zinc-700 mt-3">
        ⚠️ Dự báo dựa trên hồi quy tuyến tính từ dữ liệu lịch sử. View count thực tế phụ thuộc vào nội dung, quảng bá và nhiều yếu tố ngoài dự báo.
      </p>
    </div>
  )
}
