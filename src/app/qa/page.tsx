import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'QA Board — CCO United',
  description: 'Live Jira project board for CCO United — sprint status, epics, and backlog.',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface JiraStatus { name: string }
interface JiraIssueType { name: string }
interface JiraParent { key: string; fields?: { summary: string } }
interface JiraFields {
  summary: string
  status: JiraStatus
  issuetype: JiraIssueType
  parent?: JiraParent
}
interface JiraIssue { key: string; fields: JiraFields }

// ── Fetch ─────────────────────────────────────────────────────────────────────

const JIRA_BASE = 'https://cco-united.atlassian.net'
const JIRA_EMAIL = 'josh@joshbarteaux.com'

async function fetchBoard(): Promise<JiraIssue[]> {
  try {
    const token = process.env.JIRA_API_TOKEN
    if (!token) return []
    const auth = Buffer.from(`${JIRA_EMAIL}:${token}`).toString('base64')
    const url = `${JIRA_BASE}/rest/api/3/search/jql?` + new URLSearchParams({
      jql: 'project = SCRUM ORDER BY key ASC',
      maxResults: '200',
      fields: 'summary,status,issuetype,parent',
    }).toString()
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.issues ?? []
  } catch { return [] }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  'Done':        '#4A7C59',
  'In Progress': '#C8960C',
  'In Review':   '#2C5F7A',
  'To Do':       'rgba(255,255,255,0.18)',
}
const STATUS_TEXT: Record<string, string> = {
  'Done':        '#F5EDD8',
  'In Progress': '#1A0F0A',
  'In Review':   '#F5EDD8',
  'To Do':       'var(--cn-tan)',
}
const TYPE_ICON: Record<string, string> = {
  Epic:    '◈',
  Story:   '◉',
  Task:    '◻',
  Subtask: '·',
  Feature: '◆',
  Bug:     '✕',
  Request: '◎',
}

function Badge({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.55rem',
      fontSize: '0.65rem',
      fontFamily: "'Source Sans 3', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      background: STATUS_COLOR[status] ?? 'rgba(255,255,255,0.1)',
      color: STATUS_TEXT[status] ?? 'var(--cn-cream)',
      borderRadius: 2,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

// ── Donut chart helpers ───────────────────────────────────────────────────────

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutSlice(cx: number, cy: number, r: number, startDeg: number, endDeg: number, stroke: number) {
  const start = polarToXY(cx, cy, r, startDeg)
  const end   = polarToXY(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M${start.x.toFixed(2)},${start.y.toFixed(2)} A${r},${r},0,${large},1,${end.x.toFixed(2)},${end.y.toFixed(2)}`
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function QAPage() {
  const issues = await fetchBoard()

  const epics   = issues.filter(i => i.fields.issuetype.name === 'Epic')
  const nonEpic = issues.filter(i => i.fields.issuetype.name !== 'Epic')

  // Stats
  const total    = issues.length
  const done     = issues.filter(i => i.fields.status.name === 'Done').length
  const inProg   = issues.filter(i => i.fields.status.name === 'In Progress').length
  const inReview = issues.filter(i => i.fields.status.name === 'In Review').length
  const todo     = issues.filter(i => i.fields.status.name === 'To Do').length
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0

  // Donut segments (degrees out of 360)
  const seg = (n: number) => total > 0 ? (n / total) * 360 : 0
  const doneCx = 80, doneCy = 80, doneR = 56, doneStroke = 18
  const segments = [
    { n: done,     color: '#4A7C59', label: 'Done' },
    { n: inProg,   color: '#C8960C', label: 'In Progress' },
    { n: inReview, color: '#2C5F7A', label: 'In Review' },
    { n: todo,     color: 'rgba(255,255,255,0.15)', label: 'To Do' },
  ]
  let cursor = 0
  const slices = segments.map(s => {
    const start = cursor
    const end   = cursor + seg(s.n)
    cursor = end
    return { ...s, start, end }
  })

  // Group children by epic key
  const byEpic: Record<string, JiraIssue[]> = {}
  const orphans: JiraIssue[] = []
  for (const issue of nonEpic) {
    const parentKey = issue.fields.parent?.key
    if (parentKey) {
      byEpic[parentKey] = byEpic[parentKey] ?? []
      byEpic[parentKey].push(issue)
    } else {
      orphans.push(issue)
    }
  }

  // Half-gauge for sprint progress
  const cx = 110, cy = 100, R = 80, stroke = 18
  const circ = Math.PI * R
  const filled = (pct / 100) * circ
  const startX = cx - R, startY = cy, endX = cx + R, endY = cy
  const gaugeColor = pct === 100 ? '#4A7C59' : pct > 70 ? '#C8960C' : '#8B1A1A'

  return (
    <>
      <Nav />
      <main className="tests-page" style={{ paddingTop: 80 }}>

        {/* Hero */}
        <div className="events-hero">
          <span className="section-label">Project Management</span>
          <h1 className="section-title">QA Board</h1>
          <div className="gold-rule" />
          <p className="tests-summary">
            Live view of the CCO United Jira board — sprints, epics, and backlog status.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--cn-tan)', marginTop: '0.5rem', opacity: 0.7 }}>
            Synced from{' '}
            <a href="https://cco-united.atlassian.net/jira/software/projects/SCRUM/boards/1"
              target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--cn-gold)', textDecoration: 'none' }}>
              cco-united.atlassian.net · SCRUM
            </a>
            {' '}· refreshes every 5 min
          </p>
          <a
            href="https://cco-united.atlassian.net/jira/software/projects/SCRUM/boards/1"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              padding: '0.65rem 1.6rem',
              background: 'var(--cn-gold)',
              color: '#1A0F0A',
              fontFamily: "'Cinzel', serif",
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: 2,
              transition: 'opacity 0.2s',
            }}
          >
            Launch Jira Board
          </a>
        </div>

        <div className="container">

          {/* ── At a Glance — visual metrics ── */}
          <section className="tests-section">
            <h2 className="tests-section-title">At a Glance</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2.5rem', alignItems: 'center' }}>

              {/* Donut chart */}
              <div style={{ textAlign: 'center' }}>
                <svg viewBox="0 0 160 160" width="160" height="160" style={{ display: 'block', margin: '0 auto' }}>
                  {/* Track */}
                  <circle cx={doneCx} cy={doneCy} r={doneR} fill="none"
                    stroke="rgba(255,255,255,0.06)" strokeWidth={doneStroke} />
                  {/* Segments */}
                  {slices.map((s, i) => s.n > 0 && (
                    <path key={i}
                      d={donutSlice(doneCx, doneCy, doneR, s.start, s.end, doneStroke)}
                      fill="none" stroke={s.color} strokeWidth={doneStroke} strokeLinecap="butt" />
                  ))}
                  {/* Center label */}
                  <text x={doneCx} y={doneCy - 8} textAnchor="middle" fill="#F5EDD8"
                    fontSize="22" fontFamily="Cinzel,serif" fontWeight="700">{pct}%</text>
                  <text x={doneCx} y={doneCy + 10} textAnchor="middle" fill={gaugeColor}
                    fontSize="8" fontFamily="Source Sans 3,sans-serif" letterSpacing="1.5">COMPLETE</text>
                  <text x={doneCx} y={doneCy + 24} textAnchor="middle" fill="rgba(245,237,216,0.4)"
                    fontSize="7.5" fontFamily="Source Sans 3,sans-serif">{done} of {total} issues</text>
                </svg>
                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.75rem', alignItems: 'flex-start', paddingLeft: '1rem' }}>
                  {segments.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--cn-tan)' }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      {s.label} <span style={{ color: 'var(--cn-cream)', fontWeight: 600, marginLeft: 2 }}>{segments[i].n}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stacked bar + stat tiles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Stacked progress bar */}
                <div>
                  <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cn-tan)', marginBottom: '0.5rem', fontFamily: "'Source Sans 3', sans-serif" }}>
                    Issue Breakdown — {total} total
                  </div>
                  <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', gap: 1 }}>
                    {segments.map((s, i) => s.n > 0 && (
                      <div key={i} style={{ flex: s.n, background: s.color, transition: 'flex 0.4s' }} title={`${s.label}: ${s.n}`} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                    {segments.map((s, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', color: 'var(--cn-tan)', fontFamily: "'Source Sans 3', sans-serif" }}>
                        <span style={{ color: s.color, fontWeight: 700 }}>{Math.round(total > 0 ? (s.n / total) * 100 : 0)}%</span> {s.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stat tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Total', value: total, color: 'rgba(200,150,12,0.25)', border: 'rgba(200,150,12,0.35)' },
                    { label: 'Done', value: done, color: 'rgba(74,124,89,0.2)', border: 'rgba(74,124,89,0.4)' },
                    { label: 'In Progress', value: inProg, color: 'rgba(200,150,12,0.15)', border: 'rgba(200,150,12,0.3)' },
                    { label: 'To Do', value: todo, color: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
                  ].map((t, i) => (
                    <div key={i} style={{
                      background: t.color,
                      border: `1px solid ${t.border}`,
                      borderRadius: 6,
                      padding: '0.85rem 0.75rem',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.8rem', fontFamily: "'Cinzel', serif", fontWeight: 700, color: 'var(--cn-cream)', lineHeight: 1 }}>{t.value}</div>
                      <div style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cn-tan)', marginTop: '0.35rem', fontFamily: "'Source Sans 3', sans-serif" }}>{t.label}</div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </section>

          {/* ── Sprint Progress gauge + Epic table ── */}
          <section className="tests-section">
            <h2 className="tests-section-title">Sprint Progress</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>

              {/* Half-gauge */}
              <div className="tests-chart-card tests-chart-card--center">
                <div className="tests-chart-title">Overall Completion</div>
                <svg viewBox="0 0 220 110" width="220" height="110" style={{ display: 'block', margin: '1rem auto 0' }}>
                  <path d={`M${startX},${startY} A${R},${R},0,0,1,${endX},${endY}`}
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} strokeLinecap="round" />
                  <path d={`M${startX},${startY} A${R},${R},0,0,1,${endX},${endY}`}
                    fill="none" stroke={gaugeColor} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={`${filled} ${circ}`} />
                  <text x={cx} y={cy - 10} textAnchor="middle" fill="#F5EDD8" fontSize="28"
                    fontFamily="Cinzel,serif" fontWeight="700">{pct}%</text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fill={gaugeColor} fontSize="9"
                    fontFamily="Source Sans 3,sans-serif" letterSpacing="1.5">COMPLETE</text>
                </svg>
                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--cn-tan)' }}>
                  {done} of {total} issues closed
                </div>
              </div>

              {/* Epic status table */}
              <div>
                {epics.map(epic => {
                  const children = byEpic[epic.key] ?? []
                  const epicDone = children.filter(c => c.fields.status.name === 'Done').length
                  const epicTotal = children.length
                  const epicPct = epicTotal > 0 ? Math.round((epicDone / epicTotal) * 100) : (epic.fields.status.name === 'Done' ? 100 : 0)
                  return (
                    <div key={epic.key} style={{
                      display: 'grid',
                      gridTemplateColumns: '72px 1fr 100px 52px',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.7rem 0',
                      borderBottom: '1px solid rgba(200,150,12,0.1)',
                    }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--cn-gold)', fontFamily: 'monospace' }}>{epic.key}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--cn-cream)', fontWeight: 600 }}>{epic.fields.summary}</span>
                      <Badge status={epic.fields.status.name} />
                      <span style={{ fontSize: '0.75rem', color: epicPct === 100 ? '#4A7C59' : 'var(--cn-tan)', textAlign: 'right' }}>
                        {epicTotal > 0 ? `${epicDone}/${epicTotal}` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── Issues by Epic ── */}
          <section className="tests-section">
            <h2 className="tests-section-title">Issues by Epic</h2>
            {epics.map(epic => {
              const children = byEpic[epic.key] ?? []
              if (children.length === 0) return null
              return (
                <div key={epic.key} style={{ marginBottom: '2rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem 0.75rem',
                    background: 'rgba(200,150,12,0.07)',
                    borderLeft: '3px solid var(--cn-gold)',
                    marginBottom: '0.25rem',
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--cn-gold)', fontFamily: 'monospace', minWidth: 72 }}>{epic.key}</span>
                    <span style={{ fontSize: '0.9rem', fontFamily: "'Cinzel', serif", color: 'var(--cn-cream)', fontWeight: 600, flex: 1 }}>
                      {epic.fields.summary}
                    </span>
                    <Badge status={epic.fields.status.name} />
                  </div>
                  <div className="test-inventory">
                    {children.map(issue => (
                      <div key={issue.key} className="test-inventory-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--cn-gold)', fontSize: '0.75rem', minWidth: 16, textAlign: 'center' }}>
                            {TYPE_ICON[issue.fields.issuetype.name] ?? '·'}
                          </span>
                          <span className="test-inventory-suite" style={{ fontWeight: issue.fields.issuetype.name === 'Story' ? 600 : 400 }}>
                            {issue.fields.summary}
                          </span>
                        </div>
                        <div />
                        <div className="test-inventory-desc" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                          {issue.key}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Badge status={issue.fields.status.name} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Orphans (no parent epic) */}
            {orphans.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderLeft: '3px solid rgba(255,255,255,0.2)',
                  marginBottom: '0.25rem',
                }}>
                  <span style={{ fontSize: '0.9rem', fontFamily: "'Cinzel', serif", color: 'var(--cn-cream)', fontWeight: 600 }}>
                    Standalone Issues
                  </span>
                </div>
                <div className="test-inventory">
                  {orphans.map(issue => (
                    <div key={issue.key} className="test-inventory-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--cn-gold)', fontSize: '0.75rem', minWidth: 16, textAlign: 'center' }}>
                          {TYPE_ICON[issue.fields.issuetype.name] ?? '·'}
                        </span>
                        <span className="test-inventory-suite">{issue.fields.summary}</span>
                      </div>
                      <div />
                      <div className="test-inventory-desc" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                        {issue.key}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Badge status={issue.fields.status.name} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
