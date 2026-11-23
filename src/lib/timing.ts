import type { Crop, Planting } from '../data/types'
import { addDays, frostDate, parseISODate } from './util'

/**
 * Rough target date to move indoor seedlings outside.
 * Spring: based on the last frost. Other seasons: weeks after seeding.
 */
export function targetTransplantDate(p: Planting, crop: Crop | undefined, lastFrost: string): Date | undefined {
  if (!crop || crop.transplantOffset === undefined) return undefined
  if (p.season === 'spring' || p.season === 'winter') {
    return addDays(frostDate(lastFrost, p.year), crop.transplantOffset)
  }
  if (p.seededOn && crop.startIndoorsOffset !== undefined) {
    return addDays(parseISODate(p.seededOn), crop.transplantOffset - crop.startIndoorsOffset)
  }
  return undefined
}

/** Rough expected first harvest, from the variety or crop days to maturity. */
export function expectedHarvestDate(p: Planting, crop: Crop | undefined, dtm?: number): Date | undefined {
  const days = dtm ?? crop?.daysToMaturity
  if (!days) return undefined
  // Days to maturity on seed packets count from transplant (for transplanted
  // crops) or from sowing (for direct-sown crops).
  const from = p.method === 'direct_sow' ? p.seededOn : p.transplantedOn
  return from ? addDays(parseISODate(from), days) : undefined
}
