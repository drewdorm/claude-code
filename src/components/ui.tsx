import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cx } from '../lib/util'

export function Page({
  title,
  back,
  action,
  children,
}: {
  title: string
  back?: boolean
  action?: ReactNode
  children: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-xl">
      <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-paper/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex h-14 items-center gap-2">
          {back && (
            <button
              onClick={() => navigate(-1)}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-leaf-700 active:bg-leaf-100"
              aria-label="Back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">{title}</h1>
          {action}
        </div>
      </header>
      <main className="space-y-4 px-4 pt-4 pb-28">{children}</main>
    </div>
  )
}

export function Card({ children, className, to }: { children: ReactNode; className?: string; to?: string }) {
  const cls = cx('block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70', to && 'active:bg-stone-50', className)
  return to ? (
    <Link to={to} className={cls}>
      {children}
    </Link>
  ) : (
    <div className={cls}>{children}</div>
  )
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold tracking-wide text-stone-500 uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }

export function Button({ variant = 'primary', className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-medium transition disabled:opacity-50',
        variant === 'primary' && 'bg-leaf-700 text-white active:bg-leaf-800',
        variant === 'secondary' && 'bg-leaf-100 text-leaf-800 active:bg-leaf-200',
        variant === 'danger' && 'bg-red-50 text-red-700 active:bg-red-100',
        variant === 'ghost' && 'text-leaf-700 active:bg-leaf-50',
        className,
      )}
    />
  )
}

export function LinkButton({ to, children, variant = 'primary', className }: { to: string; children: ReactNode; variant?: 'primary' | 'secondary'; className?: string }) {
  return (
    <Link
      to={to}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-medium',
        variant === 'primary' ? 'bg-leaf-700 text-white active:bg-leaf-800' : 'bg-leaf-100 text-leaf-800 active:bg-leaf-200',
        className,
      )}
    >
      {children}
    </Link>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

const inputCls =
  'block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-100'

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, p.className)} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(inputCls, 'appearance-auto', p.className)} />
export const TextArea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={cx(inputCls, p.className)} />

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-stone-500">{children}</p>
}

export function Pill({ children, tone = 'leaf' }: { children: ReactNode; tone?: 'leaf' | 'stone' | 'soil' | 'amber' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'leaf' && 'bg-leaf-100 text-leaf-800',
        tone === 'stone' && 'bg-stone-100 text-stone-600',
        tone === 'soil' && 'bg-soil-100 text-soil-600',
        tone === 'amber' && 'bg-amber-100 text-amber-800',
      )}
    >
      {children}
    </span>
  )
}

export function Loading() {
  return <p className="py-10 text-center text-stone-400">Loading…</p>
}
