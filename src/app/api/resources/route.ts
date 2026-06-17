import { NextResponse } from 'next/server'
import { fetchMondayResources } from '@/lib/fetchMondayResources'

export async function GET() {
  try {
    const resources = await fetchMondayResources()
    return NextResponse.json(
      { resources, fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 502 })
  }
}
