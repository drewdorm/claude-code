import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, Card, Empty, LinkButton, Pill, Button } from '../components/ui'
import TransplantSheet from '../components/TransplantSheet'
import { byId, useCrops, usePlantings, useSetting, useVarieties } from '../data/repo'
import type { Planting } from '../data/types'
import { plantingName } from '../lib/labels'
import { targetTransplantDate } from '../lib/timing'
import { daysBetween, formatDate, formatShortDate, parseISODate } from '../lib/util'

export default function Seedlings() {
  const list = usePlantings({ statuses: ['active', 'planned'], noBed: true })
  const crops = byId(useCrops())
  const varieties = byId(useVarieties())
  const lastFrost = useSetting('lastFrost') || '04-01'
  const [moving, setMoving] = useState<Planting>()

  const rows = (list ?? [])
    .map((p) => ({ p, target: targetTransplantDate(p, crops.get(p.cropId), lastFrost) }))
    .sort((a, b) => (a.target?.getTime() ?? Infinity) - (b.target?.getTime() ?? Infinity))

  return (
    <Page title="Seedlings">
      <p className="px-1 text-sm text-stone-600">Seeds started indoors that haven't gone into a bed yet.</p>
      {list && rows.length === 0 && <Empty>No seedlings indoors right now.</Empty>}
      {rows.map(({ p, target }) => {
        const name = plantingName(p, crops, varieties)
        const age = p.seededOn ? daysBetween(parseISODate(p.seededOn), new Date()) : undefined
        const due = target && target.getTime() <= Date.now()
        return (
          <Card key={p.id} className="space-y-3">
            <Link to={`/plantings/${p.id}`} className="block">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{name}</p>
                <Pill>{p.currentStage}</Pill>
              </div>
              <p className="text-sm text-stone-600">
                {p.seededOn ? `Seeded ${formatDate(p.seededOn)}${age !== undefined ? ` · ${age} days old` : ''}` : 'No seed date'}
                {p.quantity && ` · ${p.quantity}`}
              </p>
              {target && (
                <p className={due ? 'text-sm font-medium text-amber-700' : 'text-sm text-stone-600'}>
                  {due ? 'Ready to plant out' : 'Plant out around'} {formatShortDate(target)}
                </p>
              )}
            </Link>
            <Button variant="secondary" className="w-full" onClick={() => setMoving(p)}>
              Transplant into a bed
            </Button>
          </Card>
        )
      })}
      <LinkButton to="/plantings/new" className="w-full">
        + Start seeds
      </LinkButton>
      {moving && <TransplantSheet plantingId={moving.id} title={plantingName(moving, crops, varieties)} onClose={() => setMoving(undefined)} />}
    </Page>
  )
}
