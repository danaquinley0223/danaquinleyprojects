import './FilterControls.css'

const PACES = ['slow', 'medium', 'fast']
const FORMAT_LABELS = { physical: 'Physical', ebook: 'Ebook', audio: 'Audio' }

function toggle(list, value) {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

function ChipRow({ label, options, selected, onToggle, tone = '' }) {
  if (!options.length) return null
  return (
    <div className="filter-group">
      <span className="filter-label">{label}</span>
      <div className="filter-chips">
        {options.map(opt => (
          <button
            key={opt}
            className={`filter-chip ${tone}${selected.includes(opt) ? ' active' : ''}`}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function FilterControls({ facets, filters, setFilters }) {
  const set = (patch) => setFilters(f => ({ ...f, ...patch }))

  return (
    <div className="filters panel">
      <ChipRow
        label="Mood" tone="violet" options={facets.moods}
        selected={filters.moods}
        onToggle={(m) => set({ moods: toggle(filters.moods, m) })}
      />

      <div className="filter-group">
        <span className="filter-label">Pace</span>
        <div className="filter-chips">
          {PACES.map(p => (
            <button
              key={p}
              className={`filter-chip teal${filters.pace === p ? ' active' : ''}`}
              onClick={() => set({ pace: filters.pace === p ? '' : p })}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <ChipRow
        label="Genre" options={facets.genres.slice(0, 24)}
        selected={filters.genres}
        onToggle={(g) => set({ genres: toggle(filters.genres, g) })}
      />

      {facets.formats.length > 0 && (
        <div className="filter-group">
          <span className="filter-label">Format</span>
          <div className="filter-chips">
            {facets.formats.map(fmt => (
              <button
                key={fmt}
                className={`filter-chip${filters.format === fmt ? ' active' : ''}`}
                onClick={() => set({ format: filters.format === fmt ? '' : fmt })}
              >
                {FORMAT_LABELS[fmt] || fmt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="filter-row">
        <div className="filter-group">
          <span className="filter-label">Time I have</span>
          <div className="filter-time">
            <input
              type="range" min="0" max="20" step="1"
              value={filters.maxHours || 0}
              onChange={e => set({ maxHours: Number(e.target.value) || null })}
            />
            <span className="filter-time-value">
              {filters.maxHours ? `${filters.maxHours}h or less` : 'any length'}
            </span>
          </div>
        </div>

        <label className="filter-owned">
          <input
            type="checkbox"
            checked={filters.ownedOnly}
            onChange={e => set({ ownedOnly: e.target.checked })}
          />
          Owned only
        </label>
      </div>
    </div>
  )
}
