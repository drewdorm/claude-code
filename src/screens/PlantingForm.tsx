import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Page, Card, Field, Input, Select, TextArea, Button } from '../components/ui'
import { deletePlanting, saveVariety, savePlanting, useBeds, useCrops, usePlanting, useVarieties } from '../data/repo'
import { BED_TYPE_LABEL, METHOD_LABEL, type Crop, type PlantingMethod, type PlantingStatus, type Season } from '../data/types'
import { cx, guessSeason, todayISO } from '../lib/util'

const NEW_VARIETY = '__new__'

function defaultStage(crop: Crop | undefined, method: PlantingMethod): string {
  const stages = crop?.stages ?? []
  const want = method === 'transplant_bought' ? 'Transplanted' : 'Seeded'
  return stages.includes(want) ? want : stages.includes('Growing') ? 'Growing' : (stages[0] ?? want)
}

export default function PlantingForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const existing = usePlanting(id)
  const crops = useCrops()
  const beds = useBeds()
  const [loaded, setLoaded] = useState(!id)

  const [cropId, setCropId] = useState('tomato')
  const [varietyId, setVarietyId] = useState('')
  const [newVariety, setNewVariety] = useState('')
  const [method, setMethod] = useState<PlantingMethod>('transplant_bought')
  const [bedId, setBedId] = useState(params.get('bed') ?? '')
  const [season, setSeason] = useState<Season>(guessSeason())
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [quantity, setQuantity] = useState('')
  const [seededOn, setSeededOn] = useState('')
  const [transplantedOn, setTransplantedOn] = useState(todayISO())
  const [status, setStatus] = useState<PlantingStatus>('active')
  const [stage, setStage] = useState('Transplanted')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const varieties = useVarieties(cropId)
  const crop = useMemo(() => crops?.find((c) => c.id === cropId), [crops, cropId])

  useEffect(() => {
    if (!existing || loaded) return
    setCropId(existing.cropId)
    setVarietyId(existing.varietyId ?? '')
    setMethod(existing.method)
    setBedId(existing.bedId ?? '')
    setSeason(existing.season)
    setYear(String(existing.year))
    setQuantity(existing.quantity)
    setSeededOn(existing.seededOn ?? '')
    setTransplantedOn(existing.transplantedOn ?? '')
    setStatus(existing.status)
    setStage(existing.currentStage)
    setNotes(existing.notes)
    setLoaded(true)
  }, [existing, loaded])

  function changeMethod(m: PlantingMethod) {
    setMethod(m)
    if (id) return
    setStage(defaultStage(crop, m))
    if (m === 'transplant_bought') {
      setTransplantedOn(todayISO())
      setSeededOn('')
    } else {
      setSeededOn(todayISO())
      setTransplantedOn('')
    }
  }

  function changeCrop(c: string) {
    setCropId(c)
    setVarietyId('')
    const next = crops?.find((x) => x.id === c)
    if (next && !next.stages.includes(stage)) setStage(defaultStage(next, method))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!bedId && method !== 'seed_indoors') {
      setError('Pick a bed. Only seeds started indoors can be saved without one.')
      return
    }
    let vId = varietyId || undefined
    if (varietyId === NEW_VARIETY) {
      if (!newVariety.trim()) {
        setError('Type a name for the new variety.')
        return
      }
      vId = await saveVariety({ cropId, name: newVariety.trim(), growthHabit: '', seedSource: '', notes: '' })
    }
    const savedId = await savePlanting({
      id,
      bedId: bedId || undefined,
      cropId,
      varietyId: vId,
      season,
      year: Number(year) || new Date().getFullYear(),
      quantity: quantity.trim(),
      method,
      seededOn: seededOn || undefined,
      transplantedOn: transplantedOn || undefined,
      firstHarvestOn: existing?.firstHarvestOn,
      endedOn: status === 'done' || status === 'failed' ? (existing?.endedOn ?? todayISO()) : undefined,
      currentStage: stage,
      status,
      notes,
    })
    navigate(`/plantings/${savedId}`, { replace: true })
  }

  if (!loaded || !crops || !beds) return <Page title="Planting" back>{null}</Page>

  return (
    <Page title={id ? 'Edit planting' : 'New planting'} back>
      <form onSubmit={submit} className="space-y-4">
        <Card className="space-y-4">
          <Field label="Crop">
            <Select value={cropId} onChange={(e) => changeCrop(e.target.value)}>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Variety" hint={crop?.notes || undefined}>
            <Select value={varietyId} onChange={(e) => setVarietyId(e.target.value)}>
              <option value="">— Not set —</option>
              {(varieties ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
              <option value={NEW_VARIETY}>+ Add a new variety…</option>
            </Select>
          </Field>
          {varietyId === NEW_VARIETY && (
            <Field label="New variety name">
              <Input value={newVariety} onChange={(e) => setNewVariety(e.target.value)} placeholder="e.g. Sungold" autoFocus />
            </Field>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-stone-700">How it started</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(METHOD_LABEL) as PlantingMethod[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => changeMethod(m)}
                  className={cx(
                    'min-h-11 rounded-xl px-2 text-sm font-medium ring-1',
                    method === m ? 'bg-leaf-700 text-white ring-leaf-700' : 'bg-white text-stone-700 ring-stone-300',
                  )}
                >
                  {METHOD_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
          <Field label="Where" hint={method === 'seed_indoors' ? 'Leave as "Indoors" until you transplant.' : undefined}>
            <Select value={bedId} onChange={(e) => setBedId(e.target.value)}>
              <option value="">{method === 'seed_indoors' ? 'Indoors (no bed yet)' : '— Pick a bed —'}</option>
              {beds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({BED_TYPE_LABEL[b.type]})
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Season">
              <Select value={season} onChange={(e) => setSeason(e.target.value as Season)}>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </Select>
            </Field>
            <Field label="Year">
              <Input inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
            </Field>
          </div>
          <Field label="How many" hint='e.g. "4 plants", "two 6-ft rows", "1 cell tray"'>
            <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            {method !== 'transplant_bought' && (
              <Field label="Seeded on">
                <Input type="date" value={seededOn} onChange={(e) => setSeededOn(e.target.value)} />
              </Field>
            )}
            {method !== 'direct_sow' && (
              <Field label="Planted out on">
                <Input type="date" value={transplantedOn} onChange={(e) => setTransplantedOn(e.target.value)} />
              </Field>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <Select value={stage} onChange={(e) => setStage(e.target.value)}>
                {(crop?.stages ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                {crop && !crop.stages.includes(stage) && <option value={stage}>{stage}</option>}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as PlantingStatus)}>
                <option value="planned">Planned</option>
                <option value="active">Growing</option>
                <option value="done">Finished</option>
                <option value="failed">Failed</option>
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </Card>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full">
          Save
        </Button>
        {id && (
          <Button
            type="button"
            variant="danger"
            className="w-full"
            onClick={async () => {
              if (confirm('Delete this planting, its stage history and its photos? This cannot be undone.')) {
                await deletePlanting(id)
                navigate('/', { replace: true })
              }
            }}
          >
            Delete planting
          </Button>
        )}
      </form>
    </Page>
  )
}
