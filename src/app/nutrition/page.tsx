import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import NutritionClient from './NutritionClient'
import type { FoodCampaign } from '@/lib/sfTypes'

export const revalidate = 300

export const metadata = {
  title: 'The Strawberry Dispatch — Nutrition & Food Distribution | CCO United',
  description: 'Cherokee Nation Keys CCO food distribution campaigns, member intake, and nutritional support programs through CCO United.',
}

async function getCampaigns(): Promise<FoodCampaign[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/food-distributions`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function NutritionPage() {
  const campaigns = await getCampaigns()

  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">The Strawberry Dispatch</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '580px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.7,
          }}>
            Connecting Cherokee Nation community members with food distribution campaigns
            and nutritional support — coordinated by the Keys CCO across all 14 counties.
          </p>
        </div>
        <NutritionClient campaigns={campaigns} />
      </main>
      <Footer />
    </>
  )
}
