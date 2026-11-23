import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Page, Card, Section, Field, Input, Select, TextArea, Button, Empty, Loading } from '../components/ui'
import { deleteVariety, saveCrop, saveVariety, useCrop, useVarieties } from '../data/repo'
import type { Crop, CropCategory, Variety } from '../data/types'

const num = (s: string) => (s.trim() === '' || isNaN(Number(s)) ? undefined : Number(s))
const str = (n?: number) => (n === undefined ? '' : String(n))

export default function CropDetail() {
  const { id } = useParams()
  const crop = useCrop(id)
  const varieties = useVarieties(id)
  const [editingVariety, setEditingVariety] = useState<Partial<Variety> | null>(null)
  const [editingCrop, setEditingCrop] = useState(false)

  if (!crop) return <Page title="Crop" back><Loading /></Page>

  return (
    <Page title={crop.name} back>
      <Section title="Varieties" action={<button onClick={() => setEditingVariety({})} className="text-sm font-medium text-leaf-700">+ Add</button>}>
        {editingVariety && editingVariety.id === undefined && (
          <VarietyForm crop={crop} initial={editingVariety} onDone={() => setEditingVariety(null)} />
        )}
        {varieties && varieties.length === 0 && !editingVariety && <Empty>No varieties yet. Add the ones you grow.</Empty>}
        {(varieties ?? []).map((v) =>
          editingVariety?.id === v.id ? (
            <VarietyForm key={v.id} crop={crop} initial={v} onDone={() => setEditingVariety(null)} />
          ) : (
            <Card key={v.id}>
              <button onClick={() => setEditingVariety(v)} className="block w-full text-left">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">{v.name}</p>
                  {v.daysToMaturity && <span className="text-sm text-stone-500">{v.daysToMaturity} days</span>}
                </div>
                <p className="text-sm text-stone-600">{[v.growthHabit, v.seedSource].filter(Boolean).join(' · ')}</p>
                {v.notes && <p className="mt-1 text-sm whitespace-pre-wrap text-stone-700">{v.notes}</p>}
              </button>
            </Card>
          ),
        )}
      </Section>

      <Section title="Crop defaults" action={!editingCrop && <button onClick={() => setEditingCrop(true)} className="text-sm font-medium text-leaf-700">Edit</button>}>
        {editingCrop ? <CropForm crop={crop} onDone={() => setEditingCrop(false)} /> : <CropSummary crop={crop} />}
      </Section>
    </Page>
  )
}

function weeks(days?: number) {
  if (days === undefined) return undefined
  const w = Math.round(Math.abs(days) / 7)
  if (days === 0) return 'on the last frost date'
  return `${w} week${w === 1 ? '' : 's'} ${days < 0 ? 'before' : 'after'} last frost`
}

function CropSummary({ crop }: { crop: Crop }) {
  const rows: [string, string | undefined][] = [
    ['Start indoors', weeks(crop.startIndoorsOffset)],
    ['Plant out', weeks(crop.transplantOffset)],
    ['Direct sow', weeks(crop.directSowOffset)],
    ['Days to harvest', crop.daysToMaturity ? `${crop.daysToMaturity} days` : undefined],
    ['Spacing', crop.spacingIn ? `${crop.spacingIn} in` : undefined],
    ['Fall planting', crop.fallPlantingOk ? 'Yes' : 'No'],
    ['Type', crop.perennial ? 'Perennial' : 'Annual'],
  ]
  return (
    <Card className="space-y-3">
      <dl className="space-y-1.5 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-stone-500">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
      </dl>
      <p className="text-sm text-stone-600">
        <span className="text-stone-500">Stages:</span> {crop.stages.join(' → ')}
      </p>
      {crop.notes && <p className="text-sm text-stone-700">{crop.notes}</p>}
    </Card>
  )
}

function VarietyForm({ crop, initial, onDone }: { crop: Crop; initial: Partial<Variety>; onDone: () => void }) {
  const [name, setName] = useState(initial.name ?? '')
  const [dtm, setDtm] = useState(str(initial.daysToMaturity))
  const [habit, setHabit] = useState(initial.growthHabit ?? '')
  const [source, setSource] = useState(initial.seedSource ?? '')
  const [notes, setNotes] = useState(initial.notes ?? '')

  const habitHint: Record<string, string> = {
    tomato: 'Determinate or indeterminate',
    bean: 'Bush or pole',
    cucumber: 'Slicing or pickling; bush or vining',
    squash: 'Summer or winter',
    blueberry: 'Rabbiteye or southern highbush',
  }

  return (
    <Card className="space-y-3 ring-2 ring-leaf-200">
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sungold" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Days to harvest" hint={crop.daysToMaturity ? `Crop default: ${crop.daysToMaturity}` : undefined}>
          <Input inputMode="numeric" value={dtm} onChange={(e) => setDtm(e.target.value)} />
        </Field>
        <Field label="Type / habit" hint={habitHint[crop.id]}>
          <Input value={habit} onChange={(e) => setHabit(e.target.value)} />
        </Field>
      </div>
      <Field label="Seed source">
        <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Johnny's, saved seed, Lowe's" />
      </Field>
      <Field label="Notes">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!name.trim()}
          onClick={async () => {
            await saveVariety({ id: initial.id, cropId: crop.id, name: name.trim(), daysToMaturity: num(dtm), growthHabit: habit.trim(), seedSource: source.trim(), notes })
            onDone()
          }}
        >
          Save
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {initial.id && (
        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            if (confirm(`Delete ${initial.name}? Plantings of it will keep the crop but lose the variety name.`)) {
              await deleteVariety(initial.id!)
              onDone()
            }
          }}
        >
          Delete variety
        </Button>
      )}
    </Card>
  )
}

function CropForm({ crop, onDone }: { crop: Crop; onDone: () => void }) {
  const [c, setC] = useState(crop)
  const [stages, setStages] = useState(crop.stages.join(', '))
  useEffect(() => setC(crop), [crop])
  const set = <K extends keyof Crop>(k: K, v: Crop[K]) => setC((prev) => ({ ...prev, [k]: v }))

  return (
    <Card className="space-y-3 ring-2 ring-leaf-200">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <Input value={c.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Category">
          <Select value={c.category} onChange={(e) => set('category', e.target.value as CropCategory)}>
            <option value="vegetable">Vegetable</option>
            <option value="herb">Herb</option>
            <option value="flower">Flower</option>
            <option value="fruit">Fruit</option>
          </Select>
        </Field>
      </div>
      <p className="text-xs text-stone-500">Timing is in days from the last spring frost. Use a minus sign for "before" (e.g. -42 = 6 weeks before).</p>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Start indoors">
          <Input inputMode="numeric" value={str(c.startIndoorsOffset)} onChange={(e) => set('startIndoorsOffset', num(e.target.value))} />
        </Field>
        <Field label="Plant out">
          <Input inputMode="numeric" value={str(c.transplantOffset)} onChange={(e) => set('transplantOffset', num(e.target.value))} />
        </Field>
        <Field label="Direct sow">
          <Input inputMode="numeric" value={str(c.directSowOffset)} onChange={(e) => set('directSowOffset', num(e.target.value))} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Days to harvest">
          <Input inputMode="numeric" value={str(c.daysToMaturity)} onChange={(e) => set('daysToMaturity', num(e.target.value))} />
        </Field>
        <Field label="Spacing (in)">
          <Input inputMode="numeric" value={str(c.spacingIn)} onChange={(e) => set('spacingIn', num(e.target.value))} />
        </Field>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-5 w-5 accent-leaf-700" checked={c.fallPlantingOk} onChange={(e) => set('fallPlantingOk', e.target.checked)} />
          Fall planting
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-5 w-5 accent-leaf-700" checked={c.perennial} onChange={(e) => set('perennial', e.target.checked)} />
          Perennial
        </label>
      </div>
      <Field label="Stages" hint="In order, separated by commas.">
        <TextArea value={stages} onChange={(e) => setStages(e.target.value)} />
      </Field>
      <Field label="Notes">
        <TextArea value={c.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={async () => {
            const list = stages.split(',').map((s) => s.trim()).filter(Boolean)
            await saveCrop({ ...c, name: c.name.trim() || crop.name, stages: list.length ? list : crop.stages })
            onDone()
          }}
        >
          Save
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Card>
  )
}
