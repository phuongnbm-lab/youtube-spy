import { useMemo, useState } from 'react'

const VN_STOP = new Set([
  'và','của','là','để','có','không','trong','với','được','cho','từ','về','khi','đã','một',
  'những','các','bài','lên','ra','vào','tôi','mình','bạn','họ','hay','cũng','như','vì',
  'thì','mà','rồi','đó','này','kia','đây','đấy','tao','mày','tui','anh','chị','em','ông',
  'bà','nó','hắn','ta','chúng','cái','con','người','năm','ngày','thời','cùng','theo','sau',
  'trước','vẫn','đang','sẽ','bị','do','tại','nên','nhưng','hoặc','đều','lại','còn','thêm',
  'giờ','lúc','hơn','nhất','rất','quá','thật','nữa','chỉ','cần','phải','muốn','thấy','biết',
  'làm','đi','đến','qua','trở','tất','mọi','nhiều','ít','nào','đâu','sao','vậy','thế',
  'bởi','nếu','dù','tuy','mặc','dầu','ở','trên','dưới','giữa','ngoài','trong','đến','tới',
  'được','phần','loại','dạng','cách','kiểu','kiến','việc','chuyện','điều','vấn','đề','liên',
  'quan','thông','tin','chia','sẻ','hướng','dẫn','top','số','list','review','tập','phần',
])

const EN_STOP = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as',
  'is','are','was','were','be','been','have','has','had','do','does','did','will','would',
  'could','should','this','that','these','those','my','your','his','her','its','we','they',
  'not','no','so','than','too','very','just','about','into','through','if','new','first',
  'last','own','like','back','how','what','when','where','why','who','all','more','most',
  'i','you','he','she','it','me','us','them','our','their','out','up','can','get','got',
])

function tokenize(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !VN_STOP.has(w) && !EN_STOP.has(w) && !/^\d+$/.test(w))
}

export default function TitleWordCloud({ videos }) {
  const [showAll, setShowAll] = useState(false)

  const wordFreq = useMemo(() => {
    const freq = {}
    videos.forEach(v => {
      tokenize(v.title).forEach(w => { freq[w] = (freq[w] || 0) + 1 })
    })
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .filter(([, c]) => c >= 2) // chỉ hiện từ xuất hiện ≥ 2 lần
  }, [videos])

  if (wordFreq.length < 3) return null

  const maxCount = wordFreq[0][1]
  const displayWords = showAll ? wordFreq : wordFreq.slice(0, 30)

  const sizeClass = (count) => {
    const ratio = count / maxCount
    if (ratio > 0.7) return 'text-xl font-bold text-violet-300'
    if (ratio > 0.45) return 'text-base font-semibold text-violet-400'
    if (ratio > 0.25) return 'text-sm font-medium text-zinc-300'
    return 'text-xs text-zinc-500'
  }

  const bgClass = (count) => {
    const ratio = count / maxCount
    if (ratio > 0.7) return 'bg-violet-500/15 border-violet-500/30 hover:bg-violet-500/25'
    if (ratio > 0.45) return 'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20'
    if (ratio > 0.25) return 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
    return 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Word Cloud tiêu đề</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Từ khoá xuất hiện nhiều nhất trong tiêu đề video</p>
          </div>
        </div>
        <span className="text-[10px] text-zinc-600 font-mono">{wordFreq.length} từ độc nhất</span>
      </div>

      {/* Top 5 summary */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {wordFreq.slice(0, 5).map(([word, count]) => (
          <div key={word} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <span className="text-sm font-bold text-violet-300">{word}</span>
            <span className="text-[10px] text-violet-500 bg-violet-500/20 px-1 rounded">{count}×</span>
          </div>
        ))}
      </div>

      {/* Word cloud */}
      <div className="flex flex-wrap gap-2 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        {displayWords.map(([word, count]) => (
          <span key={word}
            className={`px-2 py-1 rounded-lg border cursor-default transition-colors ${sizeClass(count)} ${bgClass(count)}`}
            title={`"${word}" xuất hiện ${count} lần`}>
            {word}
            <span className="text-[9px] opacity-50 ml-1">{count}</span>
          </span>
        ))}
      </div>

      {wordFreq.length > 30 && (
        <button onClick={() => setShowAll(v => !v)}
          className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full text-center">
          {showAll ? '▲ Thu gọn' : `▼ Xem thêm ${wordFreq.length - 30} từ`}
        </button>
      )}
    </div>
  )
}
