// The data layer. Screens read and write garden data only through these
// functions and hooks. To move to Supabase (Phase 1.5), reimplement this file.
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Bed, Crop, Variety, Planting, StageEvent, Photo, PlantingStatus } from './types'
import { newId, todayISO } from '../lib/util'

// ---------- Reads (live: screens update automatically when data changes) ----------

export const useBeds = (includeArchived = false) =>
  useLiveQuery(async () => {
    const all = await db.beds.orderBy('sortOrder').toArray()
    return includeArchived ? all : all.filter((b) => !b.archived)
  }, [includeArchived])

export const useBed = (id?: string) => useLiveQuery(() => (id ? db.beds.get(id) : undefined), [id])

export const useCrops = () => useLiveQuery(() => db.crops.orderBy('name').toArray())

export const useCrop = (id?: string) => useLiveQuery(() => (id ? db.crops.get(id) : undefined), [id])

export const useVarieties = (cropId?: string) =>
  useLiveQuery(async () => {
    const list = cropId ? await db.varieties.where('cropId').equals(cropId).toArray() : await db.varieties.toArray()
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [cropId])

export const usePlantings = (filter?: { bedId?: string; statuses?: PlantingStatus[]; noBed?: boolean }) =>
  useLiveQuery(async () => {
    let list = filter?.bedId
      ? await db.plantings.where('bedId').equals(filter.bedId).toArray()
      : await db.plantings.toArray()
    if (filter?.statuses) list = list.filter((p) => filter.statuses!.includes(p.status))
    if (filter?.noBed) list = list.filter((p) => !p.bedId)
    return list.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [filter?.bedId, filter?.statuses?.join(','), filter?.noBed])

export const usePlanting = (id?: string) => useLiveQuery(() => (id ? db.plantings.get(id) : undefined), [id])

export const useStageEvents = (plantingId?: string) =>
  useLiveQuery(
    async () =>
      plantingId
        ? (await db.stageEvents.where('plantingId').equals(plantingId).toArray()).sort(
            (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
          )
        : [],
    [plantingId],
  )

export const usePhotos = (filter?: { plantingId?: string; bedId?: string; limit?: number }) =>
  useLiveQuery(async () => {
    let list: Photo[]
    if (filter?.plantingId) list = await db.photos.where('plantingId').equals(filter.plantingId).toArray()
    else if (filter?.bedId) {
      // A bed's timeline includes photos of the bed itself and of plants in it.
      const plantingIds = (await db.plantings.where('bedId').equals(filter.bedId).primaryKeys()) as string[]
      const [bedPhotos, plantPhotos] = await Promise.all([
        db.photos.where('bedId').equals(filter.bedId).toArray(),
        plantingIds.length ? db.photos.where('plantingId').anyOf(plantingIds).toArray() : Promise.resolve([]),
      ])
      const seen = new Set<string>()
      list = [...bedPhotos, ...plantPhotos].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
    } else list = await db.photos.toArray()
    list.sort((a, b) => b.takenAt - a.takenAt)
    return filter?.limit ? list.slice(0, filter.limit) : list
  }, [filter?.plantingId, filter?.bedId, filter?.limit])

export const useSetting = (key: string) => useLiveQuery(async () => (await db.settings.get(key))?.value ?? '', [key])

export const useCounts = () =>
  useLiveQuery(async () => ({
    photos: await db.photos.count(),
    plantings: await db.plantings.count(),
  }))

// ---------- Writes ----------

export async function saveBed(bed: Omit<Bed, 'id' | 'createdAt' | 'sortOrder'> & Partial<Pick<Bed, 'id'>>) {
  if (bed.id) {
    await db.beds.update(bed.id, bed)
    return bed.id
  }
  const last = await db.beds.orderBy('sortOrder').last()
  const id = newId()
  await db.beds.add({ ...bed, id, sortOrder: (last?.sortOrder ?? 0) + 1, createdAt: Date.now() })
  return id
}

export async function saveCrop(crop: Crop) {
  await db.crops.put(crop)
}

export async function saveVariety(v: Omit<Variety, 'id' | 'createdAt'> & Partial<Pick<Variety, 'id'>>) {
  if (v.id) {
    await db.varieties.update(v.id, v)
    return v.id
  }
  const id = newId()
  await db.varieties.add({ ...v, id, createdAt: Date.now() })
  return id
}

export async function deleteVariety(id: string) {
  await db.transaction('rw', db.varieties, db.plantings, async () => {
    await db.plantings.where('varietyId').equals(id).modify({ varietyId: undefined })
    await db.varieties.delete(id)
  })
}

export type PlantingInput = Omit<Planting, 'id' | 'createdAt' | 'updatedAt' | 'stageSource'> &
  Partial<Pick<Planting, 'id'>>

export async function savePlanting(p: PlantingInput) {
  const now = Date.now()
  return db.transaction('rw', db.plantings, db.stageEvents, async () => {
    if (p.id) {
      const before = await db.plantings.get(p.id)
      await db.plantings.update(p.id, { ...p, updatedAt: now })
      if (before && before.currentStage !== p.currentStage) await addStageEvent(p.id, p.currentStage)
      return p.id
    }
    const id = newId()
    await db.plantings.add({ ...p, id, stageSource: 'manual', createdAt: now, updatedAt: now })
    await addStageEvent(id, p.currentStage)
    return id
  })
}

async function addStageEvent(plantingId: string, stage: string, date = todayISO()) {
  const ev: StageEvent = { id: newId(), plantingId, stage, date, source: 'manual', createdAt: Date.now() }
  await db.stageEvents.add(ev)
}

/** Record a stage change (one tap on the planting screen). */
export async function setStage(plantingId: string, stage: string) {
  await db.transaction('rw', db.plantings, db.stageEvents, async () => {
    const p = await db.plantings.get(plantingId)
    if (!p || p.currentStage === stage) return
    const changes: Partial<Planting> = { currentStage: stage, stageSource: 'manual', updatedAt: Date.now() }
    if (stage === 'Harvesting' && !p.firstHarvestOn) changes.firstHarvestOn = todayISO()
    if (stage === 'Done') {
      changes.status = 'done'
      if (!p.endedOn) changes.endedOn = todayISO()
    } else if (p.status === 'planned' && stage !== 'Planned') changes.status = 'active'
    await db.plantings.update(plantingId, changes)
    await addStageEvent(plantingId, stage)
  })
}

export async function deleteStageEvent(id: string) {
  await db.stageEvents.delete(id)
}

/** Move indoor seedlings into a bed. */
export async function transplant(plantingId: string, bedId: string, date = todayISO()) {
  await db.transaction('rw', db.plantings, db.stageEvents, async () => {
    await db.plantings.update(plantingId, {
      bedId,
      transplantedOn: date,
      currentStage: 'Transplanted',
      status: 'active',
      updatedAt: Date.now(),
    })
    await addStageEvent(plantingId, 'Transplanted', date)
  })
}

export async function deletePlanting(id: string) {
  await db.transaction('rw', db.plantings, db.stageEvents, db.photos, async () => {
    await db.stageEvents.where('plantingId').equals(id).delete()
    await db.photos.where('plantingId').equals(id).delete()
    await db.plantings.delete(id)
  })
}

export async function addPhoto(p: Omit<Photo, 'id' | 'createdAt'>) {
  const id = newId()
  await db.photos.add({ ...p, id, createdAt: Date.now() })
  return id
}

export async function updatePhoto(id: string, changes: Partial<Pick<Photo, 'caption' | 'plantingId' | 'bedId'>>) {
  await db.photos.update(id, changes)
}

export async function deletePhoto(id: string) {
  await db.photos.delete(id)
}

export async function setSetting(key: string, value: string) {
  await db.settings.put({ key, value })
}

// Lookup helpers for screens that show names.
export function byId<T extends { id: string }>(list: T[] | undefined): Map<string, T> {
  return new Map((list ?? []).map((x) => [x.id, x]))
}
