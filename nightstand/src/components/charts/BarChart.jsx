import './charts.css'

// Horizontal bar chart from [{ label, value }]. Pure CSS, no dependencies.
export default function BarChart({ data, color = 'var(--amber)', formatValue = v => v, emptyText = 'No data yet' }) {
  if (!data?.length || data.every(d => !d.value)) {
    return <p className="chart-empty">{emptyText}</p>
  }
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="bar-chart">
      {data.map(d => (
        <div className="bar-row" key={d.label}>
          <span className="bar-label" title={d.label}>{d.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
          <span className="bar-value">{formatValue(d.value)}</span>
        </div>
      ))}
    </div>
  )
}
