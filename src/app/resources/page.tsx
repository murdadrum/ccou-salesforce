import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ScrollTopButton from '@/components/ScrollTopButton'
import AliWidget from '@/components/AliWidget'
import ResourcesClient from './ResourcesClient'
import { fetchMondayResources } from '@/lib/fetchMondayResources'

export const revalidate = 300

export const metadata = {
  title: 'Shared Resource Directory | CCO United',
  description: 'Centralized, searchable resource library across all Cherokee Nation CCO organizations — healthcare, food, housing, youth, elder services, and more.',
}

export default async function ResourcesPage() {
  const resources = await fetchMondayResources()

  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Shared Resource Directory</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '560px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            A centralized, searchable library of resources shared across all CCO organizations —
            healthcare, food, housing, youth, elder services, and more.
          </p>
        </div>
        <div className="container">
          <ResourcesClient resources={resources} />
        </div>
      </main>
      <Footer />
      <ScrollTopButton />
      <AliWidget />
    </>
  )
}
