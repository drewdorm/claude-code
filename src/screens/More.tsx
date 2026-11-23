import { Page, Card } from '../components/ui'
import { Link } from 'react-router-dom'

const ITEMS = [
  { to: '/plantings', label: 'All plantings', sub: 'Current and past, by season' },
  { to: '/photos', label: 'All photos', sub: 'Every photo, newest first' },
  { to: '/crops', label: 'Crops & varieties', sub: 'Your crop library and the varieties you grow' },
  { to: '/settings', label: 'Settings & backup', sub: 'Frost dates, backup and restore, storage' },
]

export default function More() {
  return (
    <Page title="More">
      <Card className="divide-y divide-stone-100 p-0">
        {ITEMS.map((i) => (
          <Link key={i.to} to={i.to} className="flex items-center justify-between gap-3 px-4 py-3.5 active:bg-stone-50">
            <span>
              <span className="block font-medium">{i.label}</span>
              <span className="block text-sm text-stone-500">{i.sub}</span>
            </span>
            <span className="text-stone-300">›</span>
          </Link>
        ))}
      </Card>
      <p className="px-1 text-sm text-stone-500">
        Coming next: planting calendar, stage-by-stage tips, and photo-based stage suggestions.
      </p>
    </Page>
  )
}
