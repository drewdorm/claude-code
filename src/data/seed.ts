// Starter data loaded the first time the app opens.
import type { Bed, Crop, Setting } from './types'

const ANNUAL = [
  'Planned',
  'Seeded',
  'Germinated',
  'Seedling',
  'Transplanted',
  'Growing',
  'Flowering',
  'Fruiting',
  'Harvesting',
  'Done',
]
const ANNUAL_NO_FRUIT = ANNUAL.filter((s) => s !== 'Fruiting')
const PERENNIAL = ['Dormant', 'Bud break', 'Flowering', 'Fruiting', 'Harvesting', 'Post-harvest']

export function seedBeds(): Bed[] {
  const now = Date.now()
  const beds: Bed[] = []
  let order = 0
  const add = (b: Omit<Bed, 'id' | 'sortOrder' | 'createdAt' | 'notes' | 'archived' | 'sun'>) => {
    order++
    beds.push({
      ...b,
      id: `bed-${order}`,
      sortOrder: order,
      sun: 'full',
      notes: '',
      archived: false,
      createdAt: now,
    })
  }
  for (let i = 1; i <= 4; i++)
    add({ name: `Raised Bed ${i}`, type: 'raised_bed', shape: 'rect', lengthFt: 6, widthFt: 3, depthFt: 1 })
  for (let i = 5; i <= 8; i++)
    add({ name: `Raised Bed ${i}`, type: 'raised_bed', shape: 'rect', lengthFt: 6, widthFt: 3, depthFt: 2 })
  for (let i = 1; i <= 6; i++)
    add({ name: `Round Bed ${i}`, type: 'container', shape: 'round', diameterFt: 2, depthFt: 2 })
  add({ name: 'In-Ground Plot', type: 'in_ground', shape: 'rect', lengthFt: 30, widthFt: 10 })
  for (let i = 1; i <= 4; i++)
    add({ name: `Wall Bed ${i}`, type: 'wall_bed', shape: 'rect', lengthFt: 20, widthFt: 5 })
  return beds
}

export function seedCrops(): Crop[] {
  const c = (crop: Omit<Crop, 'notes'> & { notes?: string }): Crop => ({ notes: '', ...crop })
  return [
    c({ id: 'tomato', name: 'Tomato', category: 'vegetable', perennial: false, startIndoorsOffset: -49, transplantOffset: 14, daysToMaturity: 75, fallPlantingOk: true, spacingIn: 24, stages: ANNUAL }),
    c({ id: 'pepper', name: 'Pepper', category: 'vegetable', perennial: false, startIndoorsOffset: -63, transplantOffset: 21, daysToMaturity: 70, fallPlantingOk: false, spacingIn: 18, stages: ANNUAL }),
    c({ id: 'cucumber', name: 'Cucumber', category: 'vegetable', perennial: false, startIndoorsOffset: -21, transplantOffset: 14, directSowOffset: 14, daysToMaturity: 55, fallPlantingOk: true, spacingIn: 12, stages: ANNUAL }),
    c({ id: 'squash', name: 'Squash', category: 'vegetable', perennial: false, startIndoorsOffset: -21, transplantOffset: 14, directSowOffset: 14, daysToMaturity: 50, fallPlantingOk: true, spacingIn: 36, stages: ANNUAL }),
    c({ id: 'corn', name: 'Sweet Corn', category: 'vegetable', perennial: false, directSowOffset: 7, daysToMaturity: 80, fallPlantingOk: false, spacingIn: 10, stages: ANNUAL_NO_FRUIT.map((s) => (s === 'Flowering' ? 'Tasseling' : s)) }),
    c({ id: 'bean', name: 'Bean', category: 'vegetable', perennial: false, directSowOffset: 14, daysToMaturity: 55, fallPlantingOk: true, spacingIn: 4, stages: ANNUAL }),
    c({ id: 'herb', name: 'Herb', category: 'herb', perennial: false, startIndoorsOffset: -42, transplantOffset: 14, daysToMaturity: 60, fallPlantingOk: false, spacingIn: 12, stages: ANNUAL_NO_FRUIT, notes: 'Add each herb (basil, dill, cilantro…) as a variety.' }),
    c({ id: 'flower', name: 'Flower', category: 'flower', perennial: false, startIndoorsOffset: -28, transplantOffset: 7, directSowOffset: 7, daysToMaturity: 70, fallPlantingOk: false, spacingIn: 12, stages: ANNUAL_NO_FRUIT, notes: 'Add each flower (zinnia, marigold, sunflower…) as a variety.' }),
    c({ id: 'blueberry', name: 'Blueberry', category: 'fruit', perennial: true, fallPlantingOk: true, spacingIn: 60, stages: PERENNIAL, notes: 'Rabbiteye types do best around Atlanta. Plant two or more varieties for pollination.' }),
  ]
}

export function defaultSettings(): Setting[] {
  return [
    { key: 'lastFrost', value: '04-01' }, // MM-DD, average last spring frost
    { key: 'firstFrost', value: '11-01' }, // MM-DD, average first fall frost
    { key: 'zone', value: '7b/8a' },
    { key: 'lastBackupAt', value: '' },
  ]
}
