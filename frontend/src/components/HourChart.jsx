import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12AM'
  if (i < 12) return `${i}AM`
  if (i === 12) return '12PM'
  return `${i - 12}PM`
})

export default function HourChart({ hourData, peakHour }) {
  const maxVal = Math.max(...hourData)

  const backgroundColors = hourData.map((_, i) => {
    if (i === peakHour) return 'rgba(251, 146, 60, 0.9)'
    return 'rgba(139, 92, 246, 0.65)'
  })
  const hoverColors = hourData.map((_, i) => {
    if (i === peakHour) return 'rgba(251, 146, 60, 1)'
    return 'rgba(139, 92, 246, 0.9)'
  })

  const data = {
    labels: LABELS,
    datasets: [
      {
        data: hourData,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: hoverColors,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1e2e',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        titleColor: '#a78bfa',
        bodyColor: '#e4e4e7',
        padding: 10,
        callbacks: {
          title: ([item]) => `${LABELS[item.dataIndex]} (${item.dataIndex}:00)`,
          label: (item) => ` ${item.raw} video`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#71717a',
          font: { size: 10, family: 'Inter' },
          maxRotation: 0,
        },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#71717a',
          font: { size: 11, family: 'Inter' },
          stepSize: 1,
          precision: 0,
        },
        border: { color: 'rgba(255,255,255,0.06)' },
        max: maxVal + Math.ceil(maxVal * 0.2) || 5,
      },
    },
  }

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Phân bố theo giờ trong ngày</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Giờ Việt Nam (ICT UTC+7)</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" />
            Video thường
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />
            Giờ cao điểm
          </span>
        </div>
      </div>
      <div className="h-52">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
