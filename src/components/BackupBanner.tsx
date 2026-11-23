import { Link } from 'react-router-dom'
import { useCounts, useSetting } from '../data/repo'

const DAY = 86_400_000

/** Shown on Today when there's data and no backup in the last 7 days. */
export default function BackupBanner() {
  const last = useSetting('lastBackupAt')
  const counts = useCounts()
  if (last === undefined || !counts) return null
  if (counts.photos + counts.plantings === 0) return null
  const lastAt = last ? Number(last) : 0
  if (lastAt && Date.now() - lastAt < 7 * DAY) return null
  const days = lastAt ? Math.floor((Date.now() - lastAt) / DAY) : null
  return (
    <Link to="/settings#backup" className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 active:bg-amber-100">
      <span className="text-2xl" aria-hidden>
        💾
      </span>
      <span className="flex-1 text-sm text-amber-900">
        <strong className="block">Time to back up</strong>
        {days === null ? "You haven't saved a backup yet." : `Last backup was ${days} days ago.`} Your garden lives only on this phone.
      </span>
      <span className="text-amber-700">›</span>
    </Link>
  )
}
