const TONES = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-100 text-amber-900 border-amber-300',
  red: 'bg-red-100 text-red-800 border-red-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-sky-100 text-sky-800 border-sky-200',
}

export default function Badge({ children, tone = 'slate', icon: Icon, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-sm font-semibold ${
        TONES[tone] || TONES.slate
      } ${className}`}
    >
      {Icon ? <Icon size={15} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
