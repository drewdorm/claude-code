import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Page, Card, Section, Empty, LinkButton, Button, Pill, Loading } from '../components/ui'
import { PhotoGrid } from '../components/photos'
import TransplantSheet from '../components/TransplantSheet'
import { byId, deleteStageEvent, setStage, useBed, useCrop, usePhotos, usePlanting, useSetting, useStageEvents, useVarieties } from '../data/repo'
import { METHOD_LABEL, STATUS_LABEL } from '../data/types'
import { plantingName } from '../lib/labels'
import { expectedHarvestDate, targetTransplantDate } from '../lib/timing'
import { cx, formatDate, formatShortDate } from '../lib/util'

export default function PlantingDetail() {
  const { id } = useParams()
  const p = usePlanting(id)
  const crop = useCrop(p?.cropId)
  const bed = useBed(p?.bedId)
  const varieties = byId(useVarieties())
  const events = useStageEvents(id)
  const photos = usePhotos({ plantingId: id })
  const lastFrost = useSetting('lastFrost')
  const [transplanting, setTransplanting] = useState(false)

  if (!p || !crop) return <Page title="Planting" back><Loading /></Page>

  const variety = p.varietyId ? varieties.get(p.varietyId) : undefined
  const name = plantingName(p, new Map([[crop.id, crop]]), varieties)
  const stageIdx = crop.stages.indexOf(p.currentStage)
  const progress = stageIdx >= 0 ? (stageIdx + 1) / crop.stages.length : 0
  const target = !p.bedId ? targetTransplantDate(p, crop, lastFrost || '04-01') : undefined
  const harvest = !p.firstHarvestOn ? expectedHarvestDate(p, crop, variety?.daysToMaturity) : undefined

  const dates: [string, string | undefined][] = [
    ['Seeded', formatDate(p.seededOn)],
    ['Planted out', formatDate(p.transplantedOn)],
    ['First harvest', formatDate(p.firstHarvestOn)],
    ['Ended', formatDate(p.endedOn)],
  ]

  return (
    <Page
      title={name}
      back
      action={
        <Link to={`/plantings/${p.id}/edit`} className="min-h-11 px-2 py-2.5 font-medium text-leaf-700">
          Edit
        </Link>
      }
    >
      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Pill tone={p.status === 'active' ? 'leaf' : p.status === 'failed' ? 'soil' : 'stone'}>{STATUS_LABEL[p.status]}</Pill>
          <Pill tone="stone">{METHOD_LABEL[p.method]}</Pill>
          <Pill tone="stone">
            {p.season[0].toUpperCase() + p.season.slice(1)} {p.year}
          </Pill>
          {variety?.daysToMaturity && <Pill tone="amber">{variety.daysToMaturity} days</Pill>}
        </div>
        <p className="text-sm">
          {bed ? (
            <>
              In{' '}
              <Link to={`/beds/${bed.id}`} className="font-medium text-leaf-700">
                {bed.name}
              </Link>
            </>
          ) : (
            <span className="text-stone-600">Indoors, no bed yet</span>
          )}
          {p.quantity && <span className="text-stone-600"> · {p.quantity}</span>}
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {dates
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt className="text-stone-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          {target && (
            <div>
              <dt className="text-stone-500">Plant out around</dt>
              <dd className="font-medium">{formatShortDate(target)}</dd>
            </div>
          )}
          {harvest && (
            <div>
              <dt className="text-stone-500">Harvest expected</dt>
              <dd className="font-medium">~{formatShortDate(harvest)}</dd>
            </div>
          )}
        </dl>
        {!p.bedId && (
          <Button className="w-full" onClick={() => setTransplanting(true)}>
            Transplant into a bed
          </Button>
        )}
      </Card>

      <Section title="Stage">
        <Card className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-leaf-600 transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="text-sm text-stone-600">Tap the stage it's in now:</p>
          <div className="flex flex-wrap gap-1.5">
            {crop.stages.map((s, i) => (
              <button
                key={s}
                onClick={() => setStage(p.id, s)}
                className={cx(
                  'min-h-10 rounded-full px-3 text-sm font-medium ring-1',
                  s === p.currentStage
                    ? 'bg-leaf-700 text-white ring-leaf-700'
                    : i < stageIdx
                      ? 'bg-leaf-50 text-leaf-800 ring-leaf-100'
                      : 'bg-white text-stone-600 ring-stone-200',
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {events && events.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-stone-500">History ({events.length})</summary>
              <ul className="mt-2 space-y-1">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between">
                    <span>
                      <span className="font-medium">{e.stage}</span> <span className="text-stone-500">· {formatDate(e.date)}</span>
                    </span>
                    <button
                      onClick={() => confirm('Remove this history entry?') && deleteStageEvent(e.id)}
                      className="px-2 text-stone-400"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      </Section>

      {p.notes && (
        <Section title="Notes">
          <Card>
            <p className="text-sm whitespace-pre-wrap">{p.notes}</p>
          </Card>
        </Section>
      )}

      <Section title="Photos" action={<Link to={`/photo?planting=${p.id}`} className="text-sm font-medium text-leaf-700">+ Add</Link>}>
        {photos && photos.length > 0 ? <PhotoGrid photos={photos} /> : <Empty>No photos of this plant yet.</Empty>}
      </Section>

      <LinkButton to={`/photo?planting=${p.id}`} variant="secondary" className="w-full">
        + Photo of this plant
      </LinkButton>

      {transplanting && <TransplantSheet plantingId={p.id} title={name} onClose={() => setTransplanting(false)} />}
    </Page>
  )
}
