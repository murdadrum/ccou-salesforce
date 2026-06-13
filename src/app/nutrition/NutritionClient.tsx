'use client'

import { useState } from 'react'
import type { FoodCampaign } from '@/lib/sfTypes'

/* eslint-disable @next/next/no-img-element */

const FOOD_IMAGES: Record<string, string> = {
  'Strawberry Harvest': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80',
  'Mixed Box': 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=80',
  'Canned Goods': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80',
  'Fresh Produce': 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&q=80',
}
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80'

const STEPS = [
  { n: '1', label: 'Find a Campaign', detail: 'Browse upcoming distributions below and find one near you.' },
  { n: '2', label: 'Submit Inquiry', detail: 'Complete the form with your contact info and the campaign you\'re interested in.' },
  { n: '3', label: 'Coordinator Contact', detail: 'A Keys CCO coordinator will follow up with pickup details and any requirements.' },
]

function formatDate(iso: string | null) {
  if (!iso) return 'TBD'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function statusColor(s: string | null) {
  if (s === 'Scheduled') return '#4A5E3A'
  if (s === 'Active') return '#C8960C'
  if (s === 'Completed') return '#6B4226'
  return '#4A5E3A'
}

export default function NutritionClient({ campaigns }: { campaigns: FoodCampaign[] }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', campaign: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/nutrition-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred')
      setStatus('error')
    }
  }

  const upcomingCount = campaigns.filter(c => c.status === 'Scheduled' || c.status === 'Active').length
  const totalUnits = campaigns.reduce((sum, c) => sum + (c.quantity ?? 0), 0)

  return (
    <div className="container" style={{ maxWidth: '960px', padding: '3rem 1.5rem 5rem' }}>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: '3.5rem' }}>
        {[
          { num: `${upcomingCount}`, label: 'Upcoming Distributions' },
          { num: `${totalUnits}+`, label: 'Units Available' },
          { num: '14', label: 'Counties Served' },
          { num: '1839', label: 'Cherokee Nation Est.' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Campaign cards heading */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="section-label">Food Distributions</span>
        <h2 className="section-title" style={{ fontSize: '1.5rem', marginTop: '0.4rem' }}>Upcoming Campaigns</h2>
        <div className="gold-rule" style={{ margin: '0.75rem auto' }} />
        <p style={{ color: 'var(--cn-cream)', opacity: 0.7, maxWidth: '520px', margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Food distribution campaigns coordinated by Keys CCO and partner organizations across Cherokee Nation&rsquo;s service territory.
        </p>
      </div>

      {/* Campaign cards */}
      {campaigns.length === 0 ? (
        <div className="form-card" style={{ textAlign: 'center', padding: '3rem', marginBottom: '4rem' }}>
          <p style={{ color: 'var(--cn-cream)', opacity: 0.6 }}>No upcoming distributions at this time. Check back soon.</p>
        </div>
      ) : (
        <div className="feature-grid" style={{ marginBottom: '4rem' }}>
          {campaigns.map((c, i) => (
            <a
              key={c.id}
              href="#inquire"
              className="feature-card-link"
              onClick={e => {
                e.preventDefault()
                setForm(f => ({ ...f, campaign: c.name }))
                document.getElementById('inquire')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              <div className="feature-card" style={{ transitionDelay: `${i * 0.08}s` }}>
                <img
                  className="feature-card-img loaded"
                  src={FOOD_IMAGES[c.foodType ?? ''] ?? DEFAULT_IMG}
                  alt={`${c.foodType ?? 'Food'} distribution`}
                  loading="lazy"
                />
                <div className="feature-card-scrim" />
                <div className="feature-card-body">
                  <span className="feature-card-tag" style={{ background: statusColor(c.status), color: '#F5EDD8' }}>
                    {c.foodType ?? 'Distribution'}
                  </span>
                  <div className="feature-name" style={{ fontSize: '0.95rem' }}>{c.name}</div>
                  <p className="feature-desc" style={{ fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                    📅 {formatDate(c.date)}{formatTime(c.date) ? ` · ${formatTime(c.date)}` : ''}<br />
                    📍 {c.location ?? 'Location TBD'}<br />
                    {c.quantity ? `🧺 ${c.quantity} units available` : ''}
                  </p>
                  <span className="feature-card-cta">Register Interest →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* How it works */}
      <div style={{
        background: 'rgba(200,150,12,0.05)',
        border: '1px solid rgba(200,150,12,0.15)',
        borderRadius: '10px',
        padding: '2.5rem 2rem',
        marginBottom: '4rem',
        textAlign: 'center',
      }}>
        <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--cn-gold)', fontSize: '1.1rem', marginBottom: '2rem', letterSpacing: '0.05em' }}>
          How It Works
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
          {STEPS.map(step => (
            <div key={step.n} style={{ flex: '1 1 200px', maxWidth: '260px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                border: '2px solid var(--cn-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.75rem',
                fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--cn-gold)',
              }}>{step.n}</div>
              <div style={{ fontFamily: 'Cinzel, serif', color: 'var(--cn-cream)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                {step.label}
              </div>
              <div style={{ color: 'var(--cn-cream)', opacity: 0.65, fontSize: '0.85rem', lineHeight: 1.6 }}>
                {step.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inquiry form */}
      <div id="inquire" style={{ maxWidth: '680px', margin: '0 auto', scrollMarginTop: '100px' }}>
        {status === 'success' ? (
          <div className="form-success" style={{ display: 'block' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              Wado — We&rsquo;ll Be in Touch
            </p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              A Keys CCO coordinator will follow up at the email address you provided with pickup details and next steps.
            </p>
            <button
              onClick={() => { setStatus('idle'); setForm({ name: '', email: '', phone: '', campaign: '', message: '' }) }}
              className="btn-submit"
              style={{ marginTop: '1.5rem' }}
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form className="form-card" onSubmit={handleSubmit} noValidate>
            <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--cn-gold)', fontSize: '1.1rem', marginBottom: '0.5rem', textAlign: 'center' }}>
              Register Your Interest
            </h2>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem', textAlign: 'center', marginBottom: '2rem', lineHeight: 1.5 }}>
              Tell us which distribution you&rsquo;re interested in — a coordinator will follow up with details.
            </p>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ni-name">Full Name *</label>
                <input id="ni-name" type="text" value={form.name} onChange={set('name')} required placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label htmlFor="ni-email">Email Address *</label>
                <input id="ni-email" type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ni-phone">Phone Number</label>
                <input id="ni-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="(optional)" />
              </div>
              <div className="form-group">
                <label htmlFor="ni-campaign">Campaign of Interest</label>
                <select id="ni-campaign" value={form.campaign} onChange={set('campaign')}>
                  <option value="">— Select a campaign —</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="General Inquiry">General / Not Sure</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ni-message">Message (optional)</label>
              <textarea
                id="ni-message"
                value={form.message}
                onChange={set('message')}
                rows={4}
                placeholder="Any questions or details for the coordinator."
              />
            </div>

            {status === 'error' && (
              <p style={{ color: '#D45C5C', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {errorMsg || 'Something went wrong. Please try again.'}
              </p>
            )}

            <button type="submit" className="btn-submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
            </button>

            <p style={{ color: 'var(--cn-cream)', opacity: 0.4, fontSize: '0.78rem', textAlign: 'center', marginTop: '1.25rem', lineHeight: 1.5 }}>
              Your information is shared only with Keys CCO coordinators. Wado for trusting CCO United.
            </p>
          </form>
        )}
      </div>

    </div>
  )
}
