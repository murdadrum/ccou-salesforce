import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import NutritionClient from './NutritionClient'
import { getSfToken } from '@/lib/sfAuth'
import type { FoodCampaign } from '@/lib/sfTypes'

export const revalidate = 300

export const metadata = {
  title: 'The Strawberry Dispatch — Nutrition & Food Distribution | CCO United',
  description: 'Cherokee Nation Keys CCO food distribution campaigns, member intake, and nutritional support programs through CCO United.',
}

async function getCampaigns(): Promise<FoodCampaign[]> {
  try {
    const { token, instanceUrl } = await getSfToken()
    const soql = `SELECT Id, Name, Status__c, Distribution_Date__c, Location__c, Food_Type__c, Quantity_Available__c, Description__c, Is_Public__c, Contact_Name__c, Contact_Email__c FROM FoodDistribution__c WHERE Is_Public__c = true ORDER BY Distribution_Date__c ASC NULLS LAST LIMIT 50`
    const res = await fetch(
      `${instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.records ?? []).map((r: Record<string, unknown>) => ({
      id: r.Id as string,
      name: r.Name as string,
      date: r.Distribution_Date__c as string | null,
      location: r.Location__c as string | null,
      foodType: r.Food_Type__c as string | null,
      quantity: r.Quantity_Available__c as number | null,
      status: r.Status__c as string | null,
      organization: null,
      description: r.Description__c as string | null,
      isPublic: r.Is_Public__c as boolean,
    }))
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
