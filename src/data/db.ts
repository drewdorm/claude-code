// The on-phone database (IndexedDB, through the Dexie library).
// Only files in src/data/ should import this directly, so it can later be
// swapped for Supabase without touching the screens.
import Dexie, { type EntityTable } from 'dexie'
import type { Bed, Crop, Variety, Planting, StageEvent, Photo, Setting } from './types'
import { seedBeds, seedCrops, defaultSettings } from './seed'

export class GardenDB extends Dexie {
  beds!: EntityTable<Bed, 'id'>
  crops!: EntityTable<Crop, 'id'>
  varieties!: EntityTable<Variety, 'id'>
  plantings!: EntityTable<Planting, 'id'>
  stageEvents!: EntityTable<StageEvent, 'id'>
  photos!: EntityTable<Photo, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor() {
    super('garden')
    this.version(1).stores({
      beds: 'id, sortOrder, archived',
      crops: 'id, name',
      varieties: 'id, cropId, name',
      plantings: 'id, bedId, cropId, varietyId, status, year',
      stageEvents: 'id, plantingId, date',
      photos: 'id, plantingId, bedId, takenAt',
      settings: 'key',
    })
    this.on('populate', async (tx) => {
      await tx.table('beds').bulkAdd(seedBeds())
      await tx.table('crops').bulkAdd(seedCrops())
      await tx.table('settings').bulkAdd(defaultSettings())
    })
  }
}

export const db = new GardenDB()
