import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page, Card, Field, Input, Select, TextArea, Button } from '../components/ui'
import { saveBed, useBed } from '../data/repo'
import type { BedShape, BedType, Sun } from '../data/types'

const num = (s: string) => (s.trim() === '' ? undefined : Number(s))
const str = (n?: number) => (n === undefined ? '' : String(n))

export default function BedForm() {
  const { id } = useParams()
  const existing = useBed(id)
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(!id)

  const [name, setName] = useState('')
  const [type, setType] = useState<BedType>('raised_bed')
  const [shape, setShape] = useState<BedShape>('rect')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [diameter, setDiameter] = useState('')
  const [depth, setDepth] = useState('')
  const [sun, setSun] = useState<Sun>('full')
  const [notes, setNotes] = useState('')
  const [archived, setArchived] = useState(false)

  useEffect(() => {
    if (!existing || loaded) return
    setName(existing.name)
    setType(existing.type)
    setShape(existing.shape)
    setLength(str(existing.lengthFt))
    setWidth(str(existing.widthFt))
    setDiameter(str(existing.diameterFt))
    setDepth(str(existing.depthFt))
    setSun(existing.sun)
    setNotes(existing.notes)
    setArchived(existing.archived)
    setLoaded(true)
  }, [existing, loaded])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const savedId = await saveBed({
      id,
      name: name.trim() || 'Untitled bed',
      type,
      shape,
      lengthFt: shape === 'rect' ? num(length) : undefined,
      widthFt: shape === 'rect' ? num(width) : undefined,
      diameterFt: shape === 'round' ? num(diameter) : undefined,
      depthFt: num(depth),
      sun,
      notes,
      archived,
    })
    navigate(`/beds/${savedId}`, { replace: true })
  }

  if (!loaded) return <Page title="Edit bed" back>{null}</Page>

  return (
    <Page title={id ? 'Edit bed' : 'New bed'} back>
      <form onSubmit={submit} className="space-y-4">
        <Card className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Raised Bed 3 – by the fence" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as BedType
                  setType(t)
                  if (t === 'container') setShape('round')
                }}
              >
                <option value="raised_bed">Raised bed</option>
                <option value="container">Round bed</option>
                <option value="in_ground">In-ground</option>
                <option value="wall_bed">Wall bed</option>
              </Select>
            </Field>
            <Field label="Shape">
              <Select value={shape} onChange={(e) => setShape(e.target.value as BedShape)}>
                <option value="rect">Rectangle</option>
                <option value="round">Round</option>
              </Select>
            </Field>
          </div>
          {shape === 'rect' ? (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Length (ft)">
                <Input inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)} />
              </Field>
              <Field label="Width (ft)">
                <Input inputMode="decimal" value={width} onChange={(e) => setWidth(e.target.value)} />
              </Field>
              <Field label="Depth (ft)">
                <Input inputMode="decimal" value={depth} onChange={(e) => setDepth(e.target.value)} />
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Diameter (ft)">
                <Input inputMode="decimal" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
              </Field>
              <Field label="Height (ft)">
                <Input inputMode="decimal" value={depth} onChange={(e) => setDepth(e.target.value)} />
              </Field>
            </div>
          )}
          <Field label="Sun">
            <Select value={sun} onChange={(e) => setSun(e.target.value as Sun)}>
              <option value="full">Full sun (6+ hours)</option>
              <option value="partial">Part sun (3–6 hours)</option>
              <option value="shade">Shade</option>
            </Select>
          </Field>
          <Field label="Notes" hint="Soil mix, irrigation, anything worth remembering.">
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          {id && (
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="h-5 w-5 accent-leaf-700" />
              <span>
                <span className="block font-medium">Archived</span>
                <span className="block text-xs text-stone-500">Hides the bed from the list but keeps its history.</span>
              </span>
            </label>
          )}
        </Card>
        <Button type="submit" className="w-full">
          Save
        </Button>
      </form>
    </Page>
  )
}
