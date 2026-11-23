import { Link } from 'react-router-dom'
import { Page, Card, Section, Empty, LinkButton, Pill } from '../components/ui'
import BackupBanner from '../components/BackupBanner'
import { Thumb } from '../components/photos'
import { byId, useBeds, useCrops, usePhotos, usePlantings, useSetting, useVarieties } from '../data/repo'
import { plantingName } from '../lib/labels'
import { targetTransplantDate } from '../lib/timing'
import { daysBetween, frostDate, formatShortDate } from '../lib/util'

function FrostCountdown({ lastFrost, firstFrost }: { lastFrost: string; firstFrost: string }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const y = today.getFullYear()
  const last = frostDate(lastFrost, y)
  const first = frostDate(firstFrost, y)
  let text: string
  if (today < last) text = `${daysBetween(today, last)} days until the average last frost (${formatShortDate(last)})`
  else if (today < first) text = `${daysBetween(today, first)} days until the average first fall frost (${formatShortDate(first)})`
  else {
    const next = frostDate(lastFrost, y + 1)
    text = `Past first frost. ${daysBetween(today, next)} days until spring's last frost (${formatShortDate(next)})`
  }
  return <p className="text-sm text-stone-600">❄️ {text}</p>
}

export default function Today() {
  const lastFrost = useSetting('lastFrost')
  const firstFrost = useSetting('firstFrost')
  const crops = byId(useCrops())
  const varieties = byId(useVarieties())
  const beds = byId(useBeds(true))
  const active = usePlantings({ statuses: ['active', 'planned'] })
  const photos = usePhotos({ limit: 6 })

  const seedlings = (active ?? []).filter((p) => !p.bedId && p.method === 'seed_indoors')
  const inBeds = (active ?? []).filter((p) => p.bedId)

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <Page title="Today">
      <div className="space-y-1">
        <p className="text-lg font-medium">{dateLabel}</p>
        {lastFrost && firstFrost && <FrostCountdown lastFrost={lastFrost} firstFrost={firstFrost} />}
      </div>

      <BackupBanner />

      {seedlings.length > 0 && (
        <Section title="Seedlings indoors" action={<Link to="/seedlings" className="text-sm text-leaf-700">All</Link>}>
          <Card className="divide-y divide-stone-100 p-0">
            {seedlings.slice(0, 5).map((p) => {
              const target = targetTransplantDate(p, crops.get(p.cropId), lastFrost ?? '04-01')
              return (
                <Link key={p.id} to={`/plantings/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 active:bg-stone-50">
                  <span className="font-medium">{plantingName(p, crops, varieties)}</span>
                  {target && <span className="text-sm text-stone-500">out ~{formatShortDate(target)}</span>}
                </Link>
              )
            })}
          </Card>
        </Section>
      )}

      <Section title="Growing now" action={<Link to="/plantings" className="text-sm text-leaf-700">All</Link>}>
        {active === undefined ? null : inBeds.length === 0 ? (
          <Empty>
            Nothing in the beds yet.
            <br />
            <Link to="/plantings/new" className="mt-2 inline-block font-medium text-leaf-700">
              + Add a planting
            </Link>
          </Empty>
        ) : (
          <Card className="divide-y divide-stone-100 p-0">
            {inBeds.slice(0, 8).map((p) => (
              <Link key={p.id} to={`/plantings/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 active:bg-stone-50">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{plantingName(p, crops, varieties)}</span>
                  <span className="block truncate text-sm text-stone-500">{beds.get(p.bedId!)?.name}</span>
                </span>
                <Pill>{p.currentStage}</Pill>
              </Link>
            ))}
          </Card>
        )}
      </Section>

      <Section title="Recent photos" action={<Link to="/photos" className="text-sm text-leaf-700">All</Link>}>
        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((p) => (
              <Link
                key={p.id}
                to={p.plantingId ? `/plantings/${p.plantingId}` : p.bedId ? `/beds/${p.bedId}` : '/photos'}
                className="aspect-square overflow-hidden rounded-lg bg-stone-200"
              >
                <Thumb photo={p} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty>No photos yet. Tap the camera button to add one.</Empty>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-2">
        <LinkButton to="/plantings/new">+ Planting</LinkButton>
        <LinkButton to="/photo" variant="secondary">
          + Photo
        </LinkButton>
      </div>
    </Page>
  )
}
