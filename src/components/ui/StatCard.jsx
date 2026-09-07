import { Link } from 'react-router-dom'

/**
 * A summary tile: label, the number, and one supporting line.
 *
 * Deliberately no coloured icon badge. A pastel rounded square with a glyph in
 * it reads as a sticker rather than as software, and the colour carried no
 * meaning. The icon here is a plain monochrome line mark set quietly beside the
 * label, and colour is used only where it says something — an accent rule down
 * the left edge when the tile needs attention.
 */

const ACCENTS = {
  none: '',
  warning: 'border-l-4 border-l-amber-500',
  critical: 'border-l-4 border-l-red-600',
  good: 'border-l-4 border-l-emerald-600',
}

export default function StatCard({ label, sublabel, value, hint, icon: Icon, accent = 'none', to }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</p>
          {sublabel ? <p className="mt-0.5 text-sm text-slate-500">{sublabel}</p> : null}
        </div>
        {Icon ? (
          <Icon size={20} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
        ) : null}
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight tabular-nums text-slate-900">{value}</p>
      {hint ? <p className="mt-1.5 text-sm font-medium text-slate-500">{hint}</p> : null}
    </>
  )

  const className = [
    'block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition',
    ACCENTS[accent] || ACCENTS.none,
    to ? 'hover:border-slate-300 hover:shadow-md' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return to ? (
    <Link to={to} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  )
}
