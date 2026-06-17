import type { SharedResource } from './sfTypes'

const BOARD_ID = '18416228470'

const COLUMNS = [
  'dropdown_mm3zen72',
  'color_mm47meg8',
  'color_mm47mdvy',
  'color_mm47xk6d',
  'color_mm47gvj1',
  'color_mm47n3a',
  'color_mm47mdnk',
  'text_mm47mqy1',
  'text_mm47e33s',
]

const COLUMN_IDS = COLUMNS.map(id => `"${id}"`).join(', ')

const QUERY = `
  query {
    boards(ids: [${BOARD_ID}]) {
      groups {
        id
        title
        items_page(limit: 10) {
          items {
            id
            name
            column_values(ids: [${COLUMN_IDS}]) {
              id
              text
            }
          }
        }
      }
    }
  }
`.trim()

interface MondayColumnValue {
  id: string
  text: string
}

interface MondayItem {
  id: string
  name: string
  column_values: MondayColumnValue[]
}

interface MondayGroup {
  id: string
  title: string
  items_page: { items: MondayItem[] }
}

function col(item: MondayItem, colId: string): string {
  return item.column_values.find(c => c.id === colId)?.text ?? ''
}

async function mondayFetch(query: string): Promise<unknown> {
  const apiKey = process.env.MONDAY_API_KEY
  if (!apiKey) return null
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    next: { revalidate: 300 },
  })
  if (!res.ok) return null
  return res.json()
}

export async function fetchMondayResources(): Promise<SharedResource[]> {
  try {
    const json = await mondayFetch(QUERY) as {
      data?: { boards?: [{ groups?: MondayGroup[] }] }
    } | null
    const groups: MondayGroup[] = json?.data?.boards?.[0]?.groups ?? []
    const results: SharedResource[] = []
    for (const group of groups) {
      for (const item of group.items_page.items) {
        results.push(toResource(item, group.title))
      }
    }
    return results
  } catch {
    return []
  }
}

function toResource(item: MondayItem, groupTitle: string): SharedResource {
  return {
    id: item.id,
    name: item.name,
    resourceType: col(item, 'dropdown_mm3zen72') || null,
    category: col(item, 'color_mm47meg8') || null,
    cco: col(item, 'color_mm47mdvy') || null,
    availability: col(item, 'color_mm47xk6d') || null,
    cost: col(item, 'color_mm47gvj1') || null,
    capacity: col(item, 'color_mm47n3a') || null,
    indoorOutdoor: col(item, 'color_mm47mdnk') || null,
    description: col(item, 'text_mm47mqy1') || null,
    contact: col(item, 'text_mm47e33s') || null,
    group: groupTitle,
  }
}
