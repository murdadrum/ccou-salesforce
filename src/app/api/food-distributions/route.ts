import { NextResponse } from 'next/server'
import { getSfToken } from '@/lib/sfAuth'
import type { FoodCampaign } from '@/lib/sfTypes'

export const revalidate = 300

export async function GET() {
  try {
    const { token, instanceUrl } = await getSfToken()
    const soql = `SELECT Id, Name, Status__c, Distribution_Date__c, Location__c, Food_Type__c, Quantity_Available__c, Description__c, Is_Public__c, Contact_Name__c, Contact_Email__c FROM FoodDistribution__c WHERE Is_Public__c = true ORDER BY Distribution_Date__c ASC NULLS LAST LIMIT 50`
    const res = await fetch(
      `${instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
    )
    if (!res.ok) throw new Error(`SF query failed: ${res.status}`)
    const data = await res.json()

    const campaigns: FoodCampaign[] = (data.records ?? []).map((r: Record<string, unknown>) => ({
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

    return NextResponse.json(campaigns, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    })
  } catch (err) {
    console.error('food-distributions error', err)
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }
}
