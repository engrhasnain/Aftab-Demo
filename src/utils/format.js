import { REFERENCE_DATE } from '../data/seedData'

/* Everything in the demo is measured against this fixed "today" so the
   screens look identical whenever the demo is shown. */
export const TODAY = REFERENCE_DATE

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * All date maths goes through these two.
 *
 * `new Date('2025-06-01T00:00:00')` parses as LOCAL midnight, so calling
 * .toISOString() on it shifts the day backwards for anyone east of UTC — which
 * is everyone using this app. Parsing and formatting both in UTC keeps a date
 * meaning the same day in Karachi as it does anywhere else.
 */
export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export const toISO = (date) => date.toISOString().slice(0, 10)

/**
 * Money is held as ordinary numbers, and prices now carry paisa, so every
 * total is rounded back to two decimals as it is worked out. Without this,
 * adding a few hundred decimal prices drifts by fractions of a paisa and two
 * screens that should agree end up showing different figures.
 *
 * (The production answer is to store whole paisa as integers. This keeps the
 * demo's arithmetic honest in the meantime.)
 */
export const roundMoney = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100

/** '2025-06-15' -> '15 Jun 2025' */
export function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`
}

/** '2025-06-15' -> 'Jun 2025' */
export function formatMonth(iso) {
  if (!iso) return '—'
  const [y, m] = iso.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}

/** '2025-06-15' -> 'Sun 15' (used for the dashboard chart axis) */
export function formatDayShort(iso) {
  const date = parseISO(iso)
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()]
  return `${day} ${date.getUTCDate()}`
}

/**
 * 1234567 -> 'Rs 12,34,567'
 *
 * South Asian digit grouping throughout, so the tables agree with the
 * lakh / crore wording used on the dashboard and with how the numbers are
 * read locally.
 */
export function formatMoney(amount) {
  const rounded = Math.round(Number(amount) || 0)
  return 'Rs ' + rounded.toLocaleString('en-IN')
}

/** 1234567 -> 'Rs 12.3 lakh' style short form for the big dashboard numbers. */
export function formatMoneyShort(amount) {
  const value = Math.round(Number(amount) || 0)
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 10000000) return `${sign}Rs ${(abs / 10000000).toFixed(2)} crore`
  if (abs >= 100000) return `${sign}Rs ${(abs / 100000).toFixed(2)} lakh`
  return formatMoney(value)
}

export function formatNumber(value) {
  return (Number(value) || 0).toLocaleString('en-IN')
}

/** Adds whole months to an ISO date, clamping the day to the shorter month. */
export function addMonths(iso, months) {
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(Date.UTC(y, m - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(d, lastDay))
  return target.toISOString().slice(0, 10)
}

/** Whole days from TODAY until the given date. Negative means already expired. */
export function daysUntil(iso, from = TODAY) {
  return Math.round((parseISO(iso) - parseISO(from)) / 86400000)
}

/**
 * Expiry urgency used everywhere a batch is shown.
 * expired -> red, 0-7 days -> red, 8-30 days -> amber, otherwise normal.
 */
export function expiryStatus(iso, from = TODAY) {
  const days = daysUntil(iso, from)
  if (days < 0) return { level: 'expired', days, label: `Expired ${Math.abs(days)} days ago`, tone: 'red' }
  if (days === 0) return { level: 'critical', days, label: 'Expires today', tone: 'red' }
  if (days <= 7) return { level: 'critical', days, label: `${days} day${days === 1 ? '' : 's'} left`, tone: 'red' }
  if (days <= 30) return { level: 'warning', days, label: `${days} days left`, tone: 'amber' }
  return { level: 'ok', days, label: `${days} days left`, tone: 'slate' }
}

export function isExpiringSoon(iso, from = TODAY) {
  const { level } = expiryStatus(iso, from)
  return level === 'warning' || level === 'critical' || level === 'expired'
}

/** Newest-first comparator for ISO date strings. */
export function byDateDesc(getter) {
  return (a, b) => {
    const av = getter(a)
    const bv = getter(b)
    if (av === bv) return 0
    return av < bv ? 1 : -1
  }
}

/** The last `count` calendar days ending on TODAY, oldest first. */
export function lastNDays(count, from = TODAY) {
  const end = parseISO(from)
  const days = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setUTCDate(d.getUTCDate() - i)
    days.push(toISO(d))
  }
  return days
}
