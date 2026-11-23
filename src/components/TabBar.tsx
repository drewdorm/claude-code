import { NavLink, useLocation } from 'react-router-dom'
import { cx } from '../lib/util'

const icon = (d: string) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const TABS = [
  { to: '/', label: 'Today', icon: icon('M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z') },
  { to: '/beds', label: 'Beds', icon: icon('M3 7h18v10H3zM3 12h18M9 7v10M15 7v10') },
  { to: '/photo', label: 'Photo', icon: null },
  { to: '/seedlings', label: 'Seedlings', icon: icon('M12 21v-8M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 11c0-4 3-7 7-7 0 4-3 7-7 7zM7 21h10') },
  { to: '/more', label: 'More', icon: icon('M5 12h.01M12 12h.01M19 12h.01') },
]

export default function TabBar() {
  const { pathname } = useLocation()
  if (pathname === '/photo') return null
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-xl">
        {TABS.map((t) =>
          t.icon ? (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                cx('flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium', isActive ? 'text-leaf-700' : 'text-stone-500')
              }
            >
              {t.icon}
              {t.label}
            </NavLink>
          ) : (
            <NavLink key={t.to} to={t.to} className="flex flex-1 items-center justify-center" aria-label="Add photo">
              <span className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-leaf-700 text-white shadow-lg ring-4 ring-white active:bg-leaf-800">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </span>
            </NavLink>
          ),
        )}
      </div>
    </nav>
  )
}
