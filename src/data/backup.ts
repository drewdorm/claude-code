// Export everything (including photos) to one file, and restore from it.
import { db } from './db'
import type { Photo } from './types'

const FORMAT = 'garden-backup'
const VERSION = 1

function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(b)
  })
}

async function dataURLToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob()
}

export async function createBackupFile(): Promise<File> {
  const [beds, crops, varieties, plantings, stageEvents, photos, settings] = await Promise.all([
    db.beds.toArray(),
    db.crops.toArray(),
    db.varieties.toArray(),
    db.plantings.toArray(),
    db.stageEvents.toArray(),
    db.photos.toArray(),
    db.settings.toArray(),
  ])
  const photoRows = []
  for (const p of photos) {
    photoRows.push({ ...p, image: await blobToDataURL(p.image), thumb: await blobToDataURL(p.thumb) })
  }
  const data = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    tables: { beds, crops, varieties, plantings, stageEvents, photos: photoRows, settings },
  }
  const stamp = new Date().toISOString().slice(0, 10)
  return new File([JSON.stringify(data)], `garden-backup-${stamp}.json`, { type: 'application/json' })
}

export interface BackupSummary {
  exportedAt: string
  beds: number
  plantings: number
  photos: number
}

type BackupData = {
  format: string
  version: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

export async function readBackupFile(file: File): Promise<{ data: BackupData; summary: BackupSummary }> {
  let data: BackupData
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error("That file isn't a garden backup (it couldn't be read).")
  }
  if (data?.format !== FORMAT || !data.tables) throw new Error("That file isn't a garden backup.")
  if (data.version > VERSION) throw new Error('This backup is from a newer version of the app.')
  const t = data.tables
  return {
    data,
    summary: {
      exportedAt: data.exportedAt,
      beds: t.beds?.length ?? 0,
      plantings: t.plantings?.length ?? 0,
      photos: t.photos?.length ?? 0,
    },
  }
}

/** Replaces ALL data on this phone with the backup's contents. */
export async function restoreBackup(data: BackupData) {
  const t = data.tables
  // Convert photos before opening the transaction (IndexedDB transactions
  // close if they wait on unrelated async work).
  const photos: Photo[] = []
  for (const raw of (t.photos ?? []) as (Omit<Photo, 'image' | 'thumb'> & { image: string; thumb: string })[]) {
    photos.push({ ...raw, image: await dataURLToBlob(raw.image), thumb: await dataURLToBlob(raw.thumb) })
  }
  const tables = [db.beds, db.crops, db.varieties, db.plantings, db.stageEvents, db.photos, db.settings]
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((tb) => tb.clear()))
    await db.beds.bulkAdd((t.beds ?? []) as never[])
    await db.crops.bulkAdd((t.crops ?? []) as never[])
    await db.varieties.bulkAdd((t.varieties ?? []) as never[])
    await db.plantings.bulkAdd((t.plantings ?? []) as never[])
    await db.stageEvents.bulkAdd((t.stageEvents ?? []) as never[])
    await db.photos.bulkAdd(photos)
    await db.settings.bulkAdd((t.settings ?? []) as never[])
  })
}

/** Ask the browser not to clear our storage, and report usage. */
export async function storageStatus(): Promise<{ persisted: boolean | null; usedMB: number | null; quotaMB: number | null }> {
  const s = navigator.storage
  if (!s) return { persisted: null, usedMB: null, quotaMB: null }
  let persisted: boolean | null = null
  try {
    persisted = (await s.persisted?.()) ?? null
    if (persisted === false && s.persist) persisted = await s.persist()
  } catch {
    /* not supported */
  }
  let usedMB: number | null = null
  let quotaMB: number | null = null
  try {
    const est = await s.estimate?.()
    if (est?.usage !== undefined) usedMB = est.usage / 1_048_576
    if (est?.quota !== undefined) quotaMB = est.quota / 1_048_576
  } catch {
    /* not supported */
  }
  return { persisted, usedMB, quotaMB }
}
