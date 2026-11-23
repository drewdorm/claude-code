import { Link } from 'react-router-dom'
import { Page, Card, Section, Empty, LinkButton, Pill, Loading } from '../components/ui'
import { byId, useBeds, useCrops, usePlantings, useVarieties } from '../data/repo'
import type { Planting } from '../data/types'
import { plantingName } from '../lib/labels'

const SEASON_ORDER = { winter: 0, spring: 1, summer: 2, fall: 3 }

export default function Plantings() {
  const plantings = usePlantings()
  const beds = byId(useBeds(true))
  const crops = byId(useCrops())
  const varieties = byId(useVarieties())
  if (!plantings) return <Page title="All plantings" back><Loading /></Page>

  const groups = new Map<string, Planting[]>()
  const sorted = [...plantings].sort((a, b) => b.year - a.year || SEASON_ORDER[b.season] - SEASON_ORDER[a.season])
  for (const p of sorted) {
    const key = `${p.season[0].toUpperCase()}${p.season.slice(1)} ${p.year}`
    groups.set(key, [...(groups.get(key) ?? []), p])
  }

  return (
    <Page title="All plantings" back>
      {plantings.length === 0 && <Empty>No plantings yet.</Empty>}
      {[...groups].map(([season, list]) => (
        <Section key={season} title={season}>
          <Card className="divide-y divide-stone-100 p-0">
            {list.map((p) => (
              <Link key={p.id} to={`/plantings/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 active:bg-stone-50">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{plantingName(p, crops, varieties)}</span>
                  <span className="block truncate text-sm text-stone-500">{p.bedId ? beds.get(p.bedId)?.name : 'Indoors'}</span>
                </span>
                <Pill tone={p.status === 'active' ? 'leaf' : 'stone'}>{p.status === 'active' ? p.currentStage : p.status === 'planned' ? 'Planned' : p.status === 'done' ? 'Finished' : 'Failed'}</Pill>
              </Link>
            ))}
          </Card>
        </Section>
      ))}
      <LinkButton to="/plantings/new" className="w-full">
        + Add a planting
      </LinkButton>
    </Page>
  )
}
