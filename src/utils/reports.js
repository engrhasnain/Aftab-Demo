import { parseISO, roundMoney, toISO, TODAY } from './format'
import { activePurchases, activeSales, customerName, employeeName, getProduct, groupName } from './selectors'

/**
 * Everything the Reports screen needs, kept apart from the day-to-day selectors
 * because it answers a different question: not "what is true now" but "what
 * happened between these two dates".
 */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const lastDayOf = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate()
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/** The ready-made periods a business actually asks for. */
export function periodPresets(today = TODAY) {
  const [y, m] = today.split('-').map(Number)
  const q = Math.floor((m - 1) / 3)
  const prevQ = q === 0 ? 3 : q - 1
  const prevQYear = q === 0 ? y - 1 : y
  const prevMonth = m === 1 ? 12 : m - 1
  const prevMonthYear = m === 1 ? y - 1 : y

  return [
    { id: 'this-month', label: 'This month', from: iso(y, m, 1), to: today },
    {
      id: 'last-month',
      label: 'Last month',
      from: iso(prevMonthYear, prevMonth, 1),
      to: iso(prevMonthYear, prevMonth, lastDayOf(prevMonthYear, prevMonth)),
    },
    { id: 'this-quarter', label: 'This quarter', from: iso(y, q * 3 + 1, 1), to: today },
    {
      id: 'last-quarter',
      label: 'Last quarter',
      from: iso(prevQYear, prevQ * 3 + 1, 1),
      to: iso(prevQYear, prevQ * 3 + 3, lastDayOf(prevQYear, prevQ * 3 + 3)),
    },
    { id: 'this-year', label: 'This year', from: iso(y, 1, 1), to: today },
  ]
}

/** The period immediately before this one, of the same length — for comparison. */
export function previousPeriod(from, to) {
  const start = parseISO(from)
  const days = Math.round((parseISO(to) - start) / 86400000) + 1
  const prevEnd = new Date(start)
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setUTCDate(prevStart.getUTCDate() - (days - 1))
  return { from: toISO(prevStart), to: toISO(prevEnd) }
}

/** A plain-language name for a range, e.g. "June 2025" or "1 Apr – 15 Jun 2025". */
export function describePeriod(from, to) {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  if (fy === ty && fm === tm && fd === 1 && td === lastDayOf(ty, tm)) return `${MONTH_FULL[fm - 1]} ${fy}`
  if (fy === ty && fm === tm) return `${fd}–${td} ${MONTH_FULL[fm - 1]} ${fy}`
  if (fy === ty) return `${fd} ${MONTH_NAMES[fm - 1]} – ${td} ${MONTH_NAMES[tm - 1]} ${ty}`
  return `${fd} ${MONTH_NAMES[fm - 1]} ${fy} – ${td} ${MONTH_NAMES[tm - 1]} ${ty}`
}

/**
 * What each batch cost us per unit, averaged over the purchases that filled it.
 * This is what turns revenue into a real profit figure rather than a guess.
 */
export function batchCostMap(data) {
  const totals = new Map()
  for (const purchase of data.purchases) {
    if (purchase.status === 'reversed') continue
    for (const item of purchase.items) {
      const batch = data.stockBatches.find(
        (b) => b.productId === item.productId && b.batchNumber === item.batchNumber,
      )
      if (!batch) continue
      const entry = totals.get(batch.id) || { qty: 0, cost: 0 }
      entry.qty += item.qty
      entry.cost += item.qty * item.unitCost
      totals.set(batch.id, entry)
    }
  }
  const map = new Map()
  for (const [id, entry] of totals) map.set(id, entry.qty ? entry.cost / entry.qty : 0)
  return map
}

const inRange = (date, from, to) => date >= from && date <= to
const daysBetween = (from, to) => Math.round((parseISO(to) - parseISO(from)) / 86400000)

/** Day buckets for a short range, month buckets for a long one. */
function bucketsFor(from, to) {
  if (daysBetween(from, to) <= 62) {
    const buckets = []
    const cursor = parseISO(from)
    const end = parseISO(to)
    while (cursor <= end) {
      buckets.push({
        key: toISO(cursor),
        label: `${cursor.getUTCDate()} ${MONTH_NAMES[cursor.getUTCMonth()]}`,
      })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return { grain: 'day', buckets, keyOf: (date) => date }
  }

  const buckets = []
  let [y, m] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  while (y < ty || (y === ty && m <= tm)) {
    buckets.push({ key: `${y}-${String(m).padStart(2, '0')}`, label: `${MONTH_NAMES[m - 1]} ${String(y).slice(2)}` })
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return { grain: 'month', buckets, keyOf: (date) => date.slice(0, 7) }
}

/**
 * Everything the reports screen shows, for one date range. Cancelled purchases
 * and sales are ignored throughout.
 */
export function buildReport(data, from, to) {
  const costMap = batchCostMap(data)

  const sales = activeSales(data).filter((sale) => inRange(sale.saleDate, from, to))
  const purchases = activePurchases(data).filter((p) => inRange(p.purchaseDate, from, to))
  const cash = data.cashEntries.filter((entry) => inRange(entry.entryDate, from, to))

  const salesTotal = roundMoney(sales.reduce((total, sale) => total + sale.totalAmount, 0))
  const purchasesTotal = roundMoney(purchases.reduce((total, p) => total + p.totalAmount, 0))

  let costOfSales = 0
  for (const sale of sales) {
    for (const item of sale.items) {
      costOfSales += item.qty * (costMap.get(item.stockBatchId) || 0)
    }
  }
  costOfSales = roundMoney(costOfSales)
  const grossProfit = roundMoney(salesTotal - costOfSales)
  const marginPercent = salesTotal ? (grossProfit / salesTotal) * 100 : 0

  /* The tax position for the period: tax charged on sales, less tax paid to
     suppliers on stock. The difference is what is owed to — or claimable from —
     the tax office. */
  const outputTax = roundMoney(sales.reduce((t, s) => t + (s.taxTotal || 0) + (s.furtherTax || 0), 0))
  const inputTax = roundMoney(purchases.reduce((t, p) => t + (p.taxTotal || 0), 0))
  const netTax = roundMoney(outputTax - inputTax)

  const moneyIn = roundMoney(cash.filter((e) => e.direction === 'in').reduce((t, e) => t + e.amount, 0))
  const moneyOut = roundMoney(cash.filter((e) => e.direction === 'out').reduce((t, e) => t + e.amount, 0))
  const salariesPaid = cash.filter((e) => e.referenceType === 'salary').reduce((t, e) => t + e.amount, 0)

  /* --- time buckets --- */
  const { grain, buckets, keyOf } = bucketsFor(from, to)
  const index = new Map(buckets.map((b) => [b.key, { ...b, sales: 0, purchases: 0, moneyIn: 0, moneyOut: 0 }]))
  for (const sale of sales) {
    const bucket = index.get(keyOf(sale.saleDate))
    if (bucket) bucket.sales += sale.totalAmount
  }
  for (const purchase of purchases) {
    const bucket = index.get(keyOf(purchase.purchaseDate))
    if (bucket) bucket.purchases += purchase.totalAmount
  }
  for (const entry of cash) {
    const bucket = index.get(keyOf(entry.entryDate))
    if (!bucket) continue
    if (entry.direction === 'in') bucket.moneyIn += entry.amount
    else bucket.moneyOut += entry.amount
  }
  const series = [...index.values()]

  /* --- rankings --- */
  const byProduct = new Map()
  const byGroup = new Map()
  for (const sale of sales) {
    for (const item of sale.items) {
      const product = getProduct(data, item.productId)
      if (!product) continue
      const value = item.qty * item.unitPrice

      const row = byProduct.get(product.id) || {
        id: product.id,
        name: product.name,
        unit: product.unit || 'unit',
        qty: 0,
        value: 0,
        to: `/products/${product.id}`,
      }
      row.qty += item.qty
      row.value += value
      byProduct.set(product.id, row)

      const g = groupName(data, product.groupId)
      byGroup.set(g, (byGroup.get(g) || 0) + value)
    }
  }

  const byCustomer = new Map()
  for (const sale of sales) {
    const row = byCustomer.get(sale.customerId) || {
      id: sale.customerId,
      name: customerName(data, sale.customerId),
      value: 0,
      orders: 0,
      to: `/customers/${sale.customerId}`,
    }
    row.value += sale.totalAmount
    row.orders += 1
    byCustomer.set(sale.customerId, row)
  }

  /* Who sold what. An invoice with nobody's name on it still counts towards the
     company total, so it is shown as its own row rather than being dropped —
     otherwise the parts would not add up to the whole. */
  const bySeller = new Map()
  for (const sale of sales) {
    const key = sale.bookedBy || 'unattributed'
    const row = bySeller.get(key) || {
      id: key,
      name: sale.bookedBy ? employeeName(data, sale.bookedBy) : 'Not booked to anyone',
      value: 0,
      orders: 0,
      to: sale.bookedBy ? `/employees/${sale.bookedBy}` : undefined,
    }
    row.value += sale.totalAmount
    row.orders += 1
    bySeller.set(key, row)
  }

  const rank = (rows) => [...rows].sort((a, b) => b.value - a.value)
  const busiest = series.reduce((best, b) => (b.sales > (best ? best.sales : 0) ? b : best), null)

  return {
    from,
    to,
    label: describePeriod(from, to),
    dayCount: daysBetween(from, to) + 1,
    grain,
    series,
    salesTotal,
    salesCount: sales.length,
    purchasesTotal,
    purchasesCount: purchases.length,
    costOfSales,
    grossProfit,
    marginPercent,
    moneyIn,
    moneyOut,
    netCash: roundMoney(moneyIn - moneyOut),
    salariesPaid,
    outputTax,
    inputTax,
    netTax,
    customerCount: byCustomer.size,
    unitsSold: sales.reduce((t, s) => t + s.items.reduce((n, i) => n + i.qty, 0), 0),
    topProducts: rank([...byProduct.values()]).slice(0, 6),
    topCustomers: rank([...byCustomer.values()]).slice(0, 6),
    bySeller: rank([...bySeller.values()]),
    byGroup: rank([...byGroup.entries()].map(([name, value]) => ({ name, value }))).slice(0, 8),
    busiestDay: busiest && busiest.sales > 0 ? busiest : null,
  }
}

/** Percentage change against the previous period, or null when there is nothing to compare. */
export function changeVs(current, previous) {
  if (!previous) return null
  return { percent: ((current - previous) / previous) * 100, previous }
}
