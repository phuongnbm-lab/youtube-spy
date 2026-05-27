import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function DayChart({ dayData, dayLabels, peakDayIndex }) {
  const maxVal = Math.max(...dayData)

  const backgroundColors = dayData.map((_, i) => {
    if (i === peakDayIndex) return 'rgba(236, 72, 153, 0.85)'
    return 'rgba(99, 102, 241, 0.65)'
  })
  const hoverColors = dayData.map((_, i) => {
    if (i === peakDayIndex) return 'rgba(236, 72, 153, 1)'
    return 'rgba(99, 102, 241, 0.9)'
  })

  const data = {
    labels: dayLabels,
    datasets: [
      {
        data: dayData,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: hoverColors,
        borderRadius: 6,
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
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        titleColor: '#a5b4fc',
        bodyColor: '#e4e4e7',
        padding: 10,
        callbacks: {
          label: (item) => ` ${item.raw} video`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#71717a',
          font: { size: 11, family: 'Inter' },
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
          <h3 className="text-sm font-semibold text-zinc-200">Phân bố theo ngày trong tuần</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Thứ 2 → Chủ nhật</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
            Ngày thường
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-pink-500 inline-block" />
            Ngày cao điểm
          </span>
        </div>
      </div>
      <div className="h-52">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
