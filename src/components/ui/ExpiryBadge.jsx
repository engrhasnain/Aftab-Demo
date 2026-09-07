import { AlertTriangle, CalendarClock, CircleSlash } from '../icons'
import Badge from './Badge'
import { expiryStatus, formatDate } from '../../utils/format'

/**
 * A single place that decides how an expiry date looks, so a batch that is
 * nearly out of date is flagged identically on Products, Stock and Sales.
 */
export default function ExpiryBadge({ date, showDate = true }) {
  const status = expiryStatus(date)

  if (status.level === 'ok') {
    return (
      <span className="whitespace-nowrap text-slate-800">{showDate ? formatDate(date) : status.label}</span>
    )
  }

  const icon = status.level === 'expired' ? CircleSlash : status.level === 'critical' ? AlertTriangle : CalendarClock

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {showDate ? <span className="whitespace-nowrap text-slate-800">{formatDate(date)}</span> : null}
      <Badge tone={status.tone} icon={icon}>
        {status.label}
      </Badge>
    </span>
  )
}
