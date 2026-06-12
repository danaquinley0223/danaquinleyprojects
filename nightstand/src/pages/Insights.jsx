import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLibrary } from '../context/LibraryContext'
import { useSettings } from '../context/SettingsContext'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import { computeStats, pagesPerDay, predictFinish } from '../utils/stats'
import './Insights.css'

function StatCard({ value, label, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function Insights() {
  const { books } = useLibrary()
  const { settings, update } = useSettings()

  const stats = useMemo(() => computeStats(books), [books])
  const perDay = useMemo(() => pagesPerDay(books), [books])

  if (!books.length) {
    return (
      <div className="empty">
        <p className="empty-title">No reading data yet</p>
        <p>Import your StoryGraph history to see your reading patterns.</p>
        <Link to="/import" className="btn" style={{ marginTop: 18 }}>Import your shelf</Link>
      </div>
    )
  }

  const { counts } = stats

  return (
    <div className="insights">
      <div className="page-head">
        <h1 className="page-title">Reading insights</h1>
        <p className="page-sub">Patterns from your {counts.read} finished book{counts.read === 1 ? '' : 's'}.</p>
      </div>

      <div className="stat-grid">
        <StatCard value={counts.read} label="Books read" accent="var(--amber-light)" />
        <StatCard value={counts.totalPages.toLocaleString()} label="Pages read" />
        <StatCard value={counts.avgRating ? counts.avgRating.toFixed(2) : '—'} label="Avg rating" accent="var(--amber)" />
        <StatCard value={counts.reading} label="Reading now" accent="var(--teal)" />
      </div>

      {stats.reading.length > 0 && (
        <section className="insight-block">
          <h2 className="insight-title">Currently reading</h2>
          <div className="reading-now">
            {stats.reading.map(b => {
              const p = predictFinish(b, perDay)
              return (
                <Link to={`/book/${encodeURIComponent(b.id)}`} key={b.id} className="reading-row">
                  <span className="reading-row-title">{b.title}</span>
                  <span className="reading-row-finish">
                    {p ? `~${p.days}d · done ${p.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'add page count'}
                  </span>
                </Link>
              )
            })}
          </div>
          <p className="insight-note">Estimated from your pace of ~{Math.round(perDay)} pages/day this year.</p>
        </section>
      )}

      <div className="insight-cols">
        <section className="insight-block">
          <h2 className="insight-title">Books per year</h2>
          <LineChart data={stats.booksPerYear} />
        </section>
        <section className="insight-block">
          <h2 className="insight-title">Pages per year</h2>
          <BarChart data={stats.pagesPerYear} color="var(--teal)" formatValue={v => v.toLocaleString()} />
        </section>
      </div>

      <div className="insight-cols">
        <section className="insight-block">
          <h2 className="insight-title">When you read</h2>
          <BarChart data={stats.byMonth} color="var(--violet)" />
        </section>
        <section className="insight-block">
          <h2 className="insight-title">Ratings you give</h2>
          <BarChart data={stats.ratingBuckets} color="var(--amber)" emptyText="No rated books yet" />
        </section>
      </div>

      <div className="insight-cols">
        <section className="insight-block">
          <h2 className="insight-title">Top genres</h2>
          <BarChart data={stats.topGenres} color="var(--teal)" emptyText="Enrich your shelf to see genres" />
        </section>
        <section className="insight-block">
          <h2 className="insight-title">Your moods</h2>
          <BarChart data={stats.topMoods} color="var(--violet)" />
        </section>
      </div>

      <section className="insight-block">
        <h2 className="insight-title">Most-read authors</h2>
        <BarChart data={stats.topAuthors} color="var(--amber)" />
      </section>

      <section className="insight-block">
        <h2 className="insight-title">Reading speed</h2>
        <div className="speed-control">
          <label>
            Words per minute
            <input
              type="number" min="100" max="800" step="10"
              value={settings.wordsPerMinute}
              onChange={e => update({ wordsPerMinute: Number(e.target.value) || 250 })}
            />
          </label>
          <p className="insight-note">Used to estimate reading time in the matcher and on book pages.</p>
        </div>
      </section>
    </div>
  )
}
