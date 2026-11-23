// Shared data shapes. These match the tables in PLAN.md so the same shapes
// can move to Supabase later.

export type BedType = 'raised_bed' | 'in_ground' | 'container' | 'wall_bed'
export type BedShape = 'rect' | 'round'
export type Sun = 'full' | 'partial' | 'shade'

export interface Bed {
  id: string
  name: string
  type: BedType
  shape: BedShape
  lengthFt?: number
  widthFt?: number
  diameterFt?: number
  depthFt?: number
  sun: Sun
  notes: string
  archived: boolean
  sortOrder: number
  createdAt: number
}

export type CropCategory = 'vegetable' | 'herb' | 'flower' | 'fruit'

export interface Crop {
  id: string
  name: string
  category: CropCategory
  perennial: boolean
  /** Days relative to the last spring frost. Negative = before frost. */
  startIndoorsOffset?: number
  transplantOffset?: number
  directSowOffset?: number
  daysToMaturity?: number
  fallPlantingOk: boolean
  spacingIn?: number
  stages: string[]
  notes: string
}

export interface Variety {
  id: string
  cropId: string
  name: string
  daysToMaturity?: number
  growthHabit: string
  seedSource: string
  notes: string
  createdAt: number
}

export type PlantingMethod = 'seed_indoors' | 'direct_sow' | 'transplant_bought'
export type Season = 'spring' | 'summer' | 'fall' | 'winter'
export type PlantingStatus = 'planned' | 'active' | 'done' | 'failed'
export type StageSource = 'manual' | 'date_estimate' | 'photo_ai'

export interface Planting {
  id: string
  /** Empty while seedlings are still indoors. */
  bedId?: string
  cropId: string
  varietyId?: string
  season: Season
  year: number
  quantity: string
  method: PlantingMethod
  seededOn?: string // YYYY-MM-DD
  transplantedOn?: string
  firstHarvestOn?: string
  endedOn?: string
  currentStage: string
  stageSource: StageSource
  status: PlantingStatus
  notes: string
  createdAt: number
  updatedAt: number
}

export interface StageEvent {
  id: string
  plantingId: string
  stage: string
  date: string // YYYY-MM-DD
  source: StageSource
  createdAt: number
}

export interface Photo {
  id: string
  plantingId?: string
  bedId?: string
  takenAt: number
  caption: string
  image: Blob
  thumb: Blob
  createdAt: number
}

export interface Setting {
  key: string
  value: string
}

export const BED_TYPE_LABEL: Record<BedType, string> = {
  raised_bed: 'Raised bed',
  in_ground: 'In-ground',
  container: 'Round bed',
  wall_bed: 'Wall bed',
}

export const METHOD_LABEL: Record<PlantingMethod, string> = {
  seed_indoors: 'Started indoors',
  direct_sow: 'Direct sown',
  transplant_bought: 'Bought transplant',
}

export const STATUS_LABEL: Record<PlantingStatus, string> = {
  planned: 'Planned',
  active: 'Growing',
  done: 'Finished',
  failed: 'Failed',
}

export const SUN_LABEL: Record<Sun, string> = {
  full: 'Full sun',
  partial: 'Part sun',
  shade: 'Shade',
}
