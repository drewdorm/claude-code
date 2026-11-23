import { Link, useParams } from 'react-router-dom'
import { Page, Card, Section, Empty, LinkButton, Pill, Loading } from '../components/ui'
import { PhotoGrid } from '../components/photos'
import { byId, useBed, useCrops, usePhotos, usePlantings, useVarieties } from '../data/repo'
import { BED_TYPE_LABEL, STATUS_LABEL, SUN_LABEL, type Planting } from '../data/types'
import { plantingName } from '../lib/labels'
import { bedArea, bedSize } from '../lib/util'

export default function BedDetail() {
  const { id } = useParams()
  const bed = useBed(id)
  const plantings = usePlantings({ bedId: id })
  const photos = usePhotos({ bedId: id })
  const crops = byId(useCrops())
  const varieties = byId(useVarieties())

  if (bed === undefined) return <Page title="Bed" back><Loading /></Page>

  const current = (plantings ?? []).filter((p) => p.status === 'active' || p.status === 'planned')
  const past = (plantings ?? []).filter((p) => p.status === 'done' || p.status === 'failed')
  const pastBySeason = new Map<string, Planting[]>()
  for (const p of past) {
    const key = `${p.season[0].toUpperCase()}${p.season.slice(1)} ${p.year}`
    pastBySeason.set(key, [...(pastBySeason.get(key) ?? []), p])
  }
  const names = byId(plantings)

  return (
    <Page
      title={bed.name}
      back
      action={
        <Link to={`/beds/${bed.id}/edit`} className="min-h-11 px-2 py-2.5 font-medium text-leaf-700">
          Edit
        </Link>
      }
    >
      <Card>
        <div className="flex flex-wrap gap-2">
          <Pill>{BED_TYPE_LABEL[bed.type]}</Pill>
          <Pill tone="stone">{bedSize(bed)}</Pill>
          <Pill tone="stone">{Math.round(bedArea(bed) * 10) / 10} sq ft</Pill>
          <Pill tone="amber">{SUN_LABEL[bed.sun]}</Pill>
          {bed.archived && <Pill tone="soil">Archived</Pill>}
        </div>
        {bed.notes && <p className="mt-3 text-sm whitespace-pre-wrap text-stone-700">{bed.notes}</p>}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <LinkButton to={`/plantings/new?bed=${bed.id}`}>+ Planting</LinkButton>
        <LinkButton to={`/photo?bed=${bed.id}`} variant="secondary">
          + Photo
        </LinkButton>
      </div>

      <Section title="Growing now">
        {current.length === 0 ? (
          <Empty>Nothing planted here right now.</Empty>
        ) : (
          <Card className="divide-y divide-stone-100 p-0">
            {current.map((p) => (
              <Link key={p.id} to={`/plantings/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 active:bg-stone-50">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{plantingName(p, crops, varieties)}</span>
                  {p.quantity && <span className="block text-sm text-stone-500">{p.quantity}</span>}
                </span>
                <Pill>{p.status === 'planned' ? 'Planned' : p.currentStage}</Pill>
              </Link>
            ))}
          </Card>
        )}
      </Section>

      <Section title="Photos">
        {photos && photos.length > 0 ? (
          <PhotoGrid
            photos={photos}
            labels={(ph) => {
              const p = ph.plantingId ? names.get(ph.plantingId) : undefined
              return p ? plantingName(p, crops, varieties) : undefined
            }}
          />
        ) : (
          <Empty>No photos of this bed yet.</Empty>
        )}
      </Section>

      {pastBySeason.size > 0 && (
        <Section title="Past seasons">
          <Card className="space-y-3">
            {[...pastBySeason].map(([season, list]) => (
              <div key={season}>
                <p className="text-sm font-semibold text-stone-600">{season}</p>
                <ul className="mt-1 space-y-1">
                  {list.map((p) => (
                    <li key={p.id}>
                      <Link to={`/plantings/${p.id}`} className="text-leaf-700">
                        {plantingName(p, crops, varieties)}
                      </Link>
                      <span className="text-sm text-stone-500"> · {STATUS_LABEL[p.status]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        </Section>
      )}
    </Page>
  )
}
