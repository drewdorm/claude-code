import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, Section, Loading } from '../components/ui'
import { Thumb } from '../components/photos'
import { byId, useBeds, useCrops, usePhotos, usePlantings, useVarieties } from '../data/repo'
import { BED_TYPE_LABEL, type Bed, type BedType, type Photo } from '../data/types'
import { plantingName } from '../lib/labels'
import { bedArea, bedSize } from '../lib/util'

const ORDER: BedType[] = ['raised_bed', 'container', 'in_ground', 'wall_bed']
const GROUP_TITLE: Record<BedType, string> = {
  raised_bed: 'Raised beds',
  container: 'Round beds',
  in_ground: 'In-ground',
  wall_bed: 'Retaining-wall beds',
}

export default function Beds() {
  const [showArchived, setShowArchived] = useState(false)
  const allBeds = useBeds(true)
  const beds = allBeds?.filter((b) => showArchived || !b.archived)
  const archivedCount = allBeds?.filter((b) => b.archived).length ?? 0
  const plantings = usePlantings({ statuses: ['active', 'planned'] })
  const photos = usePhotos()
  const crops = byId(useCrops())
  const varieties = byId(useVarieties())

  if (!beds) return <Page title="Beds"><Loading /></Page>

  const plantingBed = new Map((plantings ?? []).map((p) => [p.id, p.bedId]))
  const latestPhoto = new Map<string, Photo>()
  for (const ph of photos ?? []) {
    const bedId = ph.bedId ?? (ph.plantingId ? plantingBed.get(ph.plantingId) : undefined)
    if (bedId && !latestPhoto.has(bedId)) latestPhoto.set(bedId, ph) // photos are newest-first
  }
  const growing = new Map<string, string[]>()
  for (const p of plantings ?? []) {
    if (!p.bedId) continue
    growing.set(p.bedId, [...(growing.get(p.bedId) ?? []), plantingName(p, crops, varieties)])
  }
  const total = Math.round(beds.filter((b) => !b.archived).reduce((s, b) => s + bedArea(b), 0))

  return (
    <Page
      title="Beds"
      action={
        <Link to="/beds/new" className="min-h-11 px-2 py-2.5 font-medium text-leaf-700">
          + Add
        </Link>
      }
    >
      <p className="px-1 text-sm text-stone-500">
        {beds.filter((b) => !b.archived).length} growing spaces · about {total.toLocaleString()} sq ft
      </p>
      {ORDER.map((type) => {
        const list = beds.filter((b) => b.type === type)
        if (!list.length) return null
        return (
          <Section key={type} title={GROUP_TITLE[type]}>
            <div className="space-y-2">
              {list.map((b) => (
                <BedRow key={b.id} bed={b} photo={latestPhoto.get(b.id)} plants={growing.get(b.id) ?? []} />
              ))}
            </div>
          </Section>
        )
      })}
      {archivedCount > 0 && (
        <button onClick={() => setShowArchived((v) => !v)} className="w-full py-2 text-sm font-medium text-leaf-700">
          {showArchived ? 'Hide archived beds' : `Show archived beds (${archivedCount})`}
        </button>
      )}
    </Page>
  )
}

function BedRow({ bed, photo, plants }: { bed: Bed; photo?: Photo; plants: string[] }) {
  return (
    <Link to={`/beds/${bed.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200/70 active:bg-stone-50">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-leaf-50">
        {photo ? (
          <Thumb photo={photo} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-leaf-200" aria-hidden>
            {bed.shape === 'round' ? '◯' : '▭'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{bed.name}</p>
        <p className="text-xs text-stone-500">
          {BED_TYPE_LABEL[bed.type]} · {bedSize(bed)}
        </p>
        <p className="truncate text-sm text-stone-700">{plants.length ? plants.join(', ') : <span className="text-stone-400">Empty</span>}</p>
      </div>
      <span className="text-stone-300">›</span>
    </Link>
  )
}
