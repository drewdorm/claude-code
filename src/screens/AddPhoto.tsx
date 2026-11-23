import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page, Card, Field, Select, TextArea, Button } from '../components/ui'
import { addPhoto, byId, useBeds, useCrops, usePlantings, useVarieties } from '../data/repo'
import { plantingName } from '../lib/labels'
import { preparePhoto } from '../lib/image'

type Picked = { file: File; url: string }

export default function AddPhoto() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const beds = useBeds()
  const plantings = usePlantings({ statuses: ['active', 'planned'] })
  const crops = byId(useCrops())
  const varieties = byId(useVarieties())
  const inputRef = useRef<HTMLInputElement>(null)

  const initial = params.get('planting') ? `p:${params.get('planting')}` : params.get('bed') ? `b:${params.get('bed')}` : ''
  const [target, setTarget] = useState(initial)
  const [picked, setPicked] = useState<Picked[]>([])
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Free preview images when leaving the screen.
  const pickedRef = useRef(picked)
  pickedRef.current = picked
  useEffect(() => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  function onFiles(files: FileList | null) {
    if (!files?.length) return
    // Copy now: the input is reset right after, which empties the live FileList.
    const added = Array.from(files).map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPicked((prev) => [...prev, ...added])
  }

  async function save() {
    if (!picked.length) return
    setSaving(true)
    setError('')
    const [kind, id] = target.split(':')
    // A plant photo shows in its bed's timeline too (found through the planting).
    const plantingId = kind === 'p' ? id : undefined
    const bedId = kind === 'b' ? id : undefined
    try {
      for (const { file } of picked) {
        const { image, thumb } = await preparePhoto(file)
        await addPhoto({ plantingId, bedId, caption: caption.trim(), image, thumb, takenAt: file.lastModified || Date.now() })
      }
      plantingId ? navigate(`/plantings/${plantingId}`, { replace: true }) : bedId ? navigate(`/beds/${bedId}`, { replace: true }) : navigate('/photos', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the photo.')
      setSaving(false)
    }
  }

  // Plantings grouped by bed (seedlings indoors in their own group).
  const groups = new Map<string, { label: string; value: string }[]>()
  for (const p of plantings ?? []) {
    const g = p.bedId ? (beds?.find((b) => b.id === p.bedId)?.name ?? 'Other') : 'Indoors'
    groups.set(g, [...(groups.get(g) ?? []), { label: plantingName(p, crops, varieties), value: `p:${p.id}` }])
  }

  return (
    <Page title="Add photo" back>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => (onFiles(e.target.files), (e.target.value = ''))} />

      {picked.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-leaf-200 bg-leaf-50 text-leaf-800 active:bg-leaf-100"
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
          <span className="font-medium">Take a photo or choose from library</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {picked.map((p, i) => (
            <div key={p.url} className="relative aspect-square overflow-hidden rounded-lg bg-stone-200">
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => {
                  URL.revokeObjectURL(p.url)
                  setPicked((prev) => prev.filter((_, j) => j !== i))
                }}
                className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
          <button onClick={() => inputRef.current?.click()} className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-3xl text-stone-400">
            +
          </button>
        </div>
      )}

      <Card className="space-y-4">
        <Field label="What's in the photo?">
          <Select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">— Not tagged —</option>
            {[...groups].map(([g, items]) => (
              <optgroup key={g} label={`Plants · ${g}`}>
                {items.map((it) => (
                  <option key={it.value} value={it.value}>
                    {it.label}
                  </option>
                ))}
              </optgroup>
            ))}
            <optgroup label="Whole bed">
              {(beds ?? []).map((b) => (
                <option key={b.id} value={`b:${b.id}`}>
                  {b.name}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>
        <Field label="Note (optional)">
          <TextArea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="First flowers! Some yellow leaves at the bottom." />
        </Field>
      </Card>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <Button className="w-full" disabled={!picked.length || saving} onClick={save}>
        {saving ? 'Saving…' : picked.length > 1 ? `Save ${picked.length} photos` : 'Save photo'}
      </Button>
    </Page>
  )
}
