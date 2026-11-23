import type { Bed, Season } from '../data/types'

export function newId(): string {
  // randomUUID only exists on https pages; fall back for local testing over http.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return crypto.randomUUID()
    } catch {
      /* fall through */
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayISO(): string {
  return toISODate(new Date())
}

export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(s?: string | number): string {
  if (s === undefined || s === '') return ''
  const d = typeof s === 'number' ? new Date(s) : parseISODate(s)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

/** Frost date (MM-DD) for a given year. */
export function frostDate(mmdd: string, year: number): Date {
  const [m, d] = mmdd.split('-').map(Number)
  return new Date(year, m - 1, d)
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function guessSeason(d = new Date()): Season {
  const m = d.getMonth() + 1
  if (m <= 1 || m === 12) return 'winter'
  if (m <= 5) return 'spring'
  if (m <= 7) return 'summer'
  return 'fall'
}

export function bedSize(b: Bed): string {
  const depth = b.depthFt ? ` × ${b.depthFt} ft deep` : ''
  if (b.shape === 'round') return `${b.diameterFt ?? '?'} ft round${depth}`
  return `${b.lengthFt ?? '?'} × ${b.widthFt ?? '?'} ft${depth}`
}

export function bedArea(b: Bed): number {
  if (b.shape === 'round') return Math.PI * ((b.diameterFt ?? 0) / 2) ** 2
  return (b.lengthFt ?? 0) * (b.widthFt ?? 0)
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
