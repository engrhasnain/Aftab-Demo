export function DetailList({ children, columns = 2 }) {
  return (
    <dl className={`grid gap-x-8 gap-y-5 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>{children}</dl>
  )
}

export function DetailItem({ label, children, wide = false }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-medium text-slate-900">{children}</dd>
    </div>
  )
}
