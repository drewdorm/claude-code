import { useState } from 'react'
import { transplant, useBeds } from '../data/repo'
import { BED_TYPE_LABEL } from '../data/types'
import { todayISO } from '../lib/util'
import { Button, Field, Input, Select } from './ui'

/** Bottom sheet: pick a bed and date to move indoor seedlings outside. */
export default function TransplantSheet({ plantingId, title, onClose }: { plantingId: string; title: string; onClose: () => void }) {
  const beds = useBeds()
  const [bedId, setBedId] = useState('')
  const [date, setDate] = useState(todayISO())
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-xl space-y-4 rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Transplant {title}</h2>
        <Field label="Into which bed?">
          <Select value={bedId} onChange={(e) => setBedId(e.target.value)}>
            <option value="">— Pick a bed —</option>
            {(beds ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({BED_TYPE_LABEL[b.type]})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={!bedId}
            onClick={async () => {
              await transplant(plantingId, bedId, date || todayISO())
              onClose()
            }}
          >
            Transplant
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
