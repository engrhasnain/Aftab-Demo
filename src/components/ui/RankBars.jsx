import { Link } from 'react-router-dom'
import { formatMoney } from '../../utils/format'

/**
 * A ranked list drawn as horizontal bars.
 *
 * Every bar is directly labelled with its own value, so the reader never has to
 * measure a bar against an axis — which is the whole point for someone who does
 * not read charts for a living. One colour throughout: the bars are one series,
 * and colouring them by rank would say something that is not true.
 */
export default function RankBars({ rows, emptyText = 'Nothing in this period.', caption }) {
  if (!rows.length) {
    return <p className="px-6 py-8 text-center text-base text-slate-500">{emptyText}</p>
  }

  const max = Math.max(...rows.map((row) => row.value)) || 1
  const total = rows.reduce((sum, row) => sum + row.value, 0)

  return (
    <div className="px-6 py-5">
      <ol className="space-y-4">
        {rows.map((row, index) => {
          const share = total ? Math.round((row.value / total) * 100) : 0
          const label = (
            <>
              <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="min-w-0 text-base font-semibold text-slate-900">
                  <span className="mr-2 tabular-nums text-slate-400">{index + 1}.</span>
                  {row.name}
                </span>
                <span className="shrink-0 text-base font-bold tabular-nums text-slate-900">
                  {formatMoney(row.value)}
                </span>
              </span>
              <span className="mt-1.5 flex items-center gap-3">
                <span className="h-3 min-w-0 flex-1 overflow-hidden rounded-sm bg-slate-100">
                  <span
                    className="block h-full rounded-sm bg-[#3B4CA4]"
                    style={{ width: `${Math.max((row.value / max) * 100, 2)}%` }}
                  />
                </span>
                <span className="w-28 shrink-0 text-right text-sm tabular-nums text-slate-500">
                  {row.detail || `${share}% of the total`}
                </span>
              </span>
            </>
          )

          return (
            <li key={row.id || row.name}>
              {row.to ? (
                <Link to={row.to} className="block rounded-lg transition hover:bg-slate-50">
                  {label}
                </Link>
              ) : (
                <span className="block">{label}</span>
              )}
            </li>
          )
        })}
      </ol>
      {caption ? <p className="mt-5 text-sm text-slate-500">{caption}</p> : null}
    </div>
  )
}
