import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Photo } from '../data/types'
import { deletePhoto, updatePhoto } from '../data/repo'
import { Button, TextArea } from './ui'

export function useObjectURL(blob?: Blob) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return setUrl(undefined)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

export function Thumb({ photo, className }: { photo: Photo; className?: string }) {
  const url = useObjectURL(photo.thumb)
  return url ? (
    <img src={url} alt={photo.caption || 'Garden photo'} className={className ?? 'h-full w-full object-cover'} />
  ) : (
    <div className="h-full w-full bg-stone-200" />
  )
}

/** Photo timeline grid, newest first, grouped by month. Tap to open. */
export function PhotoGrid({ photos, labels }: { photos: Photo[]; labels?: (p: Photo) => string | undefined }) {
  const [open, setOpen] = useState<Photo>()
  const groups = new Map<string, Photo[]>()
  for (const p of photos) {
    const key = new Date(p.takenAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    groups.set(key, [...(groups.get(key) ?? []), p])
  }
  return (
    <>
      <div className="space-y-3">
        {[...groups].map(([month, list]) => (
          <div key={month}>
            <p className="mb-1.5 px-1 text-xs font-medium text-stone-500">{month}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {list.map((p) => (
                <button key={p.id} onClick={() => setOpen(p)} className="relative aspect-square overflow-hidden rounded-lg bg-stone-200">
                  <Thumb photo={p} />
                  {labels?.(p) && (
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/45 px-1.5 py-0.5 text-left text-[11px] text-white">
                      {labels(p)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {open && <PhotoViewer photo={open} onClose={() => setOpen(undefined)} />}
    </>
  )
}

function PhotoViewer({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const url = useObjectURL(photo.image)
  const [caption, setCaption] = useState(photo.caption)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between px-3 py-2 text-white">
        <button onClick={onClose} className="min-h-11 px-2 font-medium">
          Close
        </button>
        <span className="text-sm text-white/70">
          {new Date(photo.takenAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </span>
        <button
          onClick={async () => {
            if (confirm('Delete this photo?')) {
              await deletePhoto(photo.id)
              onClose()
            }
          }}
          className="min-h-11 px-2 font-medium text-red-300"
        >
          Delete
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {url && <img src={url} alt={photo.caption} className="max-h-full max-w-full object-contain" />}
      </div>
      <div className="space-y-2 bg-black p-3 text-white">
        {editing ? (
          <>
            <TextArea value={caption} onChange={(e) => setCaption(e.target.value)} className="text-stone-900" autoFocus />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={async () => {
                  await updatePhoto(photo.id, { caption })
                  setEditing(false)
                }}
              >
                Save note
              </Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="block w-full text-left text-sm">
            {caption || <span className="text-white/60">Add a note…</span>}
          </button>
        )}
        <div className="flex gap-4 text-sm">
          {photo.plantingId && (
            <Link to={`/plantings/${photo.plantingId}`} onClick={onClose} className="text-leaf-200 underline">
              Open plant
            </Link>
          )}
          {photo.bedId && (
            <Link to={`/beds/${photo.bedId}`} onClick={onClose} className="text-leaf-200 underline">
              Open bed
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
