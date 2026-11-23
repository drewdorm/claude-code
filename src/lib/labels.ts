import type { Crop, Planting, Variety } from '../data/types'

/** "Sungold Tomato", or just "Tomato" when no variety is set. */
export function plantingName(p: Planting, crops: Map<string, Crop>, varieties: Map<string, Variety>): string {
  const crop = crops.get(p.cropId)?.name ?? 'Unknown crop'
  const v = p.varietyId ? varieties.get(p.varietyId)?.name : undefined
  if (!v) return crop
  // Avoid "Basil Herb": for catch-all crops, the variety name stands alone.
  if (p.cropId === 'herb' || p.cropId === 'flower') return v
  return v.toLowerCase().includes(crop.toLowerCase()) ? v : `${v} ${crop}`
}
