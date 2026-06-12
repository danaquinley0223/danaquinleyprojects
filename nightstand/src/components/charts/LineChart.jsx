import './charts.css'

// Minimal SVG line chart from [{ label, value }].
export default function LineChart({ data, height = 140, color = 'var(--teal)', emptyText = 'No data yet' }) {
  if (!data?.length || data.every(d => !d.value)) {
    return <p className="chart-empty">{emptyText}</p>
  }
  const w = 100, h = 100
  const max = Math.max(...data.map(d => d.value), 1)
  const stepX = data.length > 1 ? w / (data.length - 1) : 0
  const pts = data.map((d, i) => [i * stepX, h - (d.value / max) * h])
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `0,${h} ${line} ${w},${h}`

  return (
    <div className="line-chart" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="line-svg">
        <polygon points={area} fill={color} opacity="0.12" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="1.5"
          vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.6" fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="line-labels">
        {data.map(d => <span key={d.label}>{d.label}</span>)}
      </div>
    </div>
  )
}
