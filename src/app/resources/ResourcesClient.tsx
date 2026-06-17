'use client'
import { useState, useMemo } from 'react'
import type { SharedResource } from '@/lib/sfTypes'

type View = 'grid' | 'list'

export default function ResourcesClient({ resources }: { resources: SharedResource[] }) {
  const [view, setView] = useState<View>('grid')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCCO, setFilterCCO] = useState('')
  const [filterCost, setFilterCost] = useState('')
  const [filterAvailability, setFilterAvailability] = useState('')

  const uniqueCategories = useMemo(
    () => Array.from(new Set(resources.map(r => r.category).filter(Boolean))).sort() as string[],
    [resources]
  )
  const uniqueCCOs = useMemo(
    () => Array.from(new Set(resources.map(r => r.cco).filter(Boolean))).sort() as string[],
    [resources]
  )
  const uniqueCosts = useMemo(
    () => Array.from(new Set(resources.map(r => r.cost).filter(Boolean))).sort() as string[],
    [resources]
  )
  const uniqueAvailabilities = useMemo(
    () => Array.from(new Set(resources.map(r => r.availability).filter(Boolean))).sort() as string[],
    [resources]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return resources.filter(r => {
      if (q && !r.name.toLowerCase().includes(q)) return false
      if (filterCategory && r.category !== filterCategory) return false
      if (filterCCO && r.cco !== filterCCO) return false
      if (filterCost && r.cost !== filterCost) return false
      if (filterAvailability && r.availability !== filterAvailability) return false
      return true
    })
  }, [resources, search, filterCategory, filterCCO, filterCost, filterAvailability])

  const hasFilters = search || filterCategory || filterCCO || filterCost || filterAvailability

  function clearFilters() {
    setSearch('')
    setFilterCategory('')
    setFilterCCO('')
    setFilterCost('')
    setFilterAvailability('')
  }

  return (
    <>
      <div className="events-controls" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="events-filters" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <input
            type="search"
            className="events-filter-date"
            placeholder="Search resources…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search resources"
            style={{ minWidth: '180px' }}
          />
          <select
            className="events-filter-select"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="events-filter-select"
            value={filterCCO}
            onChange={e => setFilterCCO(e.target.value)}
            aria-label="Filter by county"
          >
            <option value="">All Counties</option>
            {uniqueCCOs.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="events-filter-select"
            value={filterCost}
            onChange={e => setFilterCost(e.target.value)}
            aria-label="Filter by cost"
          >
            <option value="">Any Cost</option>
            {uniqueCosts.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="events-filter-select"
            value={filterAvailability}
            onChange={e => setFilterAvailability(e.target.value)}
            aria-label="Filter by availability"
          >
            <option value="">Any Availability</option>
            {uniqueAvailabilities.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                background: 'none',
                border: '1px solid var(--cn-gold)',
                color: 'var(--cn-gold)',
                borderRadius: '4px',
                padding: '0.35rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--cn-tan)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            {filtered.length.toLocaleString()} result{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="view-toggle" role="group" aria-label="View style">
            {(['grid', 'list'] as View[]).map(v => (
              <button
                key={v}
                className={`view-toggle-btn${view === v ? ' view-toggle-btn--active' : ''}`}
                onClick={() => setView(v)}
              >
                {v === 'grid' ? 'Grid' : 'List'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="events-empty">No resources match your filters.</div>
      )}

      {view === 'grid' && filtered.length > 0 && (
        <div className="events-grid">
          {filtered.map(r => (
            <div key={r.id} className="event-card" style={{ cursor: 'default' }}>
              {r.category && <div className="event-card-type">{r.category}</div>}
              <div className="event-card-title">{r.name}</div>
              {r.cco && <div className="event-card-org">{r.cco} County</div>}
              {r.cost && (
                <div style={{ fontSize: '0.8rem', color: 'var(--cn-gold)', marginTop: '0.35rem' }}>
                  {r.cost}
                </div>
              )}
              {r.description && (
                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--cn-cream)',
                  opacity: 0.7,
                  marginTop: '0.5rem',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {r.description}
                </div>
              )}
              {r.contact && (
                <div style={{ fontSize: '0.8rem', color: 'var(--cn-tan)', marginTop: '0.5rem' }}>
                  {r.contact}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'list' && filtered.length > 0 && (
        <div className="events-list">
          {filtered.map(r => (
            <div key={r.id} className="event-list-item" style={{ cursor: 'default' }}>
              <span className="event-list-title">{r.name}</span>
              {r.category && <span className="event-list-type">{r.category}</span>}
              <span className="event-list-org">{r.cco ? `${r.cco} County` : ''}</span>
              {r.cost && (
                <span style={{ fontSize: '0.8rem', color: 'var(--cn-gold)', marginLeft: 'auto' }}>
                  {r.cost}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
