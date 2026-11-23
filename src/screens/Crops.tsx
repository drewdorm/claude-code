import { useNavigate } from 'react-router-dom'
import { Page, Card, Button, Loading } from '../components/ui'
import { saveCrop, useCrops, useVarieties } from '../data/repo'
import { newId } from '../lib/util'

const CATEGORY_EMOJI = { vegetable: '🥕', herb: '🌿', flower: '🌼', fruit: '🫐' } as const

export default function Crops() {
  const crops = useCrops()
  const varieties = useVarieties()
  const navigate = useNavigate()
  if (!crops) return <Page title="Crops & varieties" back><Loading /></Page>

  const count = new Map<string, number>()
  for (const v of varieties ?? []) count.set(v.cropId, (count.get(v.cropId) ?? 0) + 1)

  return (
    <Page title="Crops & varieties" back>
      <Card className="divide-y divide-stone-100 p-0">
        {crops.map((c) => (
          <button key={c.id} onClick={() => navigate(`/crops/${c.id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-stone-50">
            <span className="text-xl" aria-hidden>
              {CATEGORY_EMOJI[c.category]}
            </span>
            <span className="flex-1">
              <span className="block font-medium">{c.name}</span>
              <span className="block text-sm text-stone-500">
                {count.get(c.id) ? `${count.get(c.id)} ${count.get(c.id) === 1 ? 'variety' : 'varieties'}` : 'No varieties yet'}
              </span>
            </span>
            <span className="text-stone-300">›</span>
          </button>
        ))}
      </Card>
      <Button
        variant="secondary"
        className="w-full"
        onClick={async () => {
          const name = prompt('Name of the new crop (e.g. Okra, Lettuce):')?.trim()
          if (!name) return
          const id = newId()
          await saveCrop({
            id,
            name,
            category: 'vegetable',
            perennial: false,
            fallPlantingOk: false,
            stages: crops.find((c) => c.id === 'tomato')?.stages ?? ['Planned', 'Seeded', 'Growing', 'Harvesting', 'Done'],
            notes: '',
          })
          navigate(`/crops/${id}`)
        }}
      >
        + Add a crop
      </Button>
    </Page>
  )
}
