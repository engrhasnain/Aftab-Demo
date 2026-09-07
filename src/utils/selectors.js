import { TODAY, byDateDesc, daysUntil, lastNDays, roundMoney } from './format'
import { advanceOutstanding, monthOf, payrollFor } from './payroll'

/**
 * Read-only views over the in-memory store. Everything a screen needs is
 * derived here from the same arrays, which is why a purchase recorded on one
 * screen shows up on Stock, Cash ledger and the Dashboard straight away.
 *
 * Two rules run through all of it:
 *   - a reversed purchase or sale still exists, but never counts towards a total
 *   - expired stock is worth nothing, and is reported separately
 */

const byId = (list, id) => list.find((item) => item.id === id)

export const getSupplier = (data, id) => byId(data.suppliers, id)
export const getCustomer = (data, id) => byId(data.customers, id)
export const getProduct = (data, id) => byId(data.products, id)
export const getGroup = (data, id) => byId(data.productGroups, id)
export const getBatch = (data, id) => byId(data.stockBatches, id)
export const getEmployee = (data, id) => byId(data.employees, id)
export const employeeName = (data, id) => (getEmployee(data, id) || {}).name || 'Unknown person'
export const getPurchase = (data, id) => byId(data.purchases, id)
export const getSale = (data, id) => byId(data.sales, id)

export const supplierName = (data, id) => (getSupplier(data, id) || {}).name || 'Unknown supplier'
export const customerName = (data, id) => (getCustomer(data, id) || {}).name || 'Unknown customer'
export const productName = (data, id) => (getProduct(data, id) || {}).name || 'Unknown product'
export const groupName = (data, id) => (getGroup(data, id) || {}).name || '—'
export const productUnit = (data, id) => (getProduct(data, id) || {}).unit || 'unit'

export const isActive = (doc) => doc.status !== 'reversed'
export const activePurchases = (data) => data.purchases.filter(isActive)
export const activeSales = (data) => data.sales.filter(isActive)

/* ---------------------------------------------------------------- */
/* Products & stock                                                  */
/* ---------------------------------------------------------------- */

export const isExpired = (batch) => daysUntil(batch.expiryDate) < 0

export function batchesForProduct(data, productId) {
  return data.stockBatches
    .filter((batch) => batch.productId === productId)
    .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : a.expiryDate > b.expiryDate ? 1 : 0))
}

/**
 * Batches that can actually be sold, nearest expiry first. Expired stock is
 * excluded — offering it for sale is how expired goods end up on a delivery.
 */
export function availableBatchesForProduct(data, productId) {
  return batchesForProduct(data, productId).filter((batch) => batch.qtyOnHand > 0 && !isExpired(batch))
}

export function productStockQty(data, productId) {
  return data.stockBatches
    .filter((batch) => batch.productId === productId)
    .reduce((total, batch) => total + batch.qtyOnHand, 0)
}

/** Only the part of the stock that is still sellable. */
export function productSellableQty(data, productId) {
  return availableBatchesForProduct(data, productId).reduce((total, batch) => total + batch.qtyOnHand, 0)
}

export function productsForSupplier(data, supplierId) {
  return data.products.filter((product) => product.supplierId === supplierId)
}

export function groupsForSupplier(data, supplierId) {
  return data.productGroups.filter((group) => group.supplierId === supplierId)
}

/** Stock is valued at what we paid for it — cost, not a selling price. */
const batchValue = (data, batch) => {
  const product = getProduct(data, batch.productId)
  return batch.qtyOnHand * (product ? product.purchaseCost : 0)
}

/** What the sellable stock is worth. Expired batches are counted at nothing. */
export function totalStockValue(data) {
  return roundMoney(
    data.stockBatches
      .filter((batch) => !isExpired(batch))
      .reduce((total, batch) => total + batchValue(data, batch), 0),
  )
}

/** What has already gone bad, reported separately rather than hidden. */
export function expiredStockValue(data) {
  return roundMoney(
    data.stockBatches
      .filter((batch) => isExpired(batch) && batch.qtyOnHand > 0)
      .reduce((total, batch) => total + batchValue(data, batch), 0),
  )
}

export function expiredBatches(data) {
  return data.stockBatches
    .filter((batch) => isExpired(batch) && batch.qtyOnHand > 0)
    .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : 1))
}

export function expiringSoonBatches(data, withinDays = 30) {
  return data.stockBatches
    .filter((batch) => batch.qtyOnHand > 0)
    .filter((batch) => daysUntil(batch.expiryDate) <= withinDays)
    .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : a.expiryDate > b.expiryDate ? 1 : 0))
}

/** Stock rows flattened for the Stock screen: one row per batch. */
export function stockRows(data) {
  return data.stockBatches.map((batch) => {
    const product = getProduct(data, batch.productId)
    const expired = isExpired(batch)
    return {
      ...batch,
      productName: product ? product.name : 'Unknown product',
      groupName: product ? groupName(data, product.groupId) : '—',
      unit: product ? product.unit || 'unit' : 'unit',
      colour: product ? product.colour : null,
      controlled: Boolean(product && product.controlled),
      expired,
      value: expired ? 0 : batchValue(data, batch),
    }
  })
}

/**
 * Works out which batches to take a quantity from, nearest expiry first.
 * Returns { lines: [{ batchId, qty }], shortfall } so the caller can either
 * apply the plan or explain what is missing.
 *
 * `claimed` lets the caller subtract quantities already spoken for by other
 * lines on the same unsaved sale.
 */
export function planAllocation(data, productId, wanted, claimed = new Map()) {
  let remaining = Math.max(0, Math.floor(Number(wanted) || 0))
  const lines = []

  for (const batch of availableBatchesForProduct(data, productId)) {
    if (remaining <= 0) break
    const free = batch.qtyOnHand - (claimed.get(batch.id) || 0)
    if (free <= 0) continue
    const take = Math.min(free, remaining)
    lines.push({ batchId: batch.id, batchNumber: batch.batchNumber, expiryDate: batch.expiryDate, qty: take })
    remaining -= take
  }

  return { lines, shortfall: remaining }
}

/** Everything that has ever moved a batch, newest first. */
export function batchMovements(data, batchId) {
  const rows = []

  for (const purchase of data.purchases) {
    const batch = getBatch(data, batchId)
    if (!batch) continue
    for (const item of purchase.items) {
      if (item.productId !== batch.productId || item.batchNumber !== batch.batchNumber) continue
      rows.push({
        key: `p-${purchase.id}-${item.productId}`,
        date: purchase.purchaseDate,
        label: 'Purchase from ' + supplierName(data, purchase.supplierId),
        qty: purchase.status === 'reversed' ? 0 : item.qty,
        cancelled: purchase.status === 'reversed',
        to: `/purchases/${purchase.id}`,
      })
    }
  }

  for (const sale of data.sales) {
    for (const item of sale.items) {
      if (item.stockBatchId !== batchId) continue
      rows.push({
        key: `s-${sale.id}-${item.productId}`,
        date: sale.saleDate,
        label: 'Sale to ' + customerName(data, sale.customerId),
        qty: sale.status === 'reversed' ? 0 : -item.qty,
        cancelled: sale.status === 'reversed',
        to: `/sales/${sale.id}`,
      })
    }
  }

  for (const adjustment of data.adjustments) {
    if (adjustment.batchId !== batchId) continue
    rows.push({
      key: `a-${adjustment.id}`,
      date: adjustment.date,
      label: 'Written off — ' + adjustment.reason,
      qty: -adjustment.qty,
      cancelled: false,
      to: '/stock',
    })
  }

  return rows.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1))
}

/* ---------------------------------------------------------------- */
/* Purchases & sales                                                 */
/* ---------------------------------------------------------------- */

export function purchasesForSupplier(data, supplierId) {
  return data.purchases
    .filter((purchase) => purchase.supplierId === supplierId)
    .sort(byDateDesc((p) => p.purchaseDate))
}

export function salesForCustomer(data, customerId) {
  return data.sales.filter((sale) => sale.customerId === customerId).sort(byDateDesc((s) => s.saleDate))
}

export function purchasesNewestFirst(data) {
  return [...data.purchases].sort(byDateDesc((p) => p.purchaseDate))
}

export function salesNewestFirst(data) {
  return [...data.sales].sort(byDateDesc((s) => s.saleDate))
}

/**
 * A purchase can only be cancelled if the stock it brought in is still on the
 * shelf. Returns a plain-language reason when it cannot.
 */
export function canReversePurchase(data, purchase) {
  if (!purchase) return { ok: false, reason: 'This purchase no longer exists.' }
  if (purchase.status === 'reversed') return { ok: false, reason: 'This purchase has already been cancelled.' }

  const needed = new Map()
  for (const item of purchase.items) {
    const batch = data.stockBatches.find(
      (b) => b.productId === item.productId && b.batchNumber === item.batchNumber,
    )
    if (!batch) return { ok: false, reason: 'The batch this purchase created can no longer be found.' }
    needed.set(batch.id, (needed.get(batch.id) || 0) + item.qty)
  }

  for (const [batchId, qty] of needed) {
    const batch = getBatch(data, batchId)
    if (batch.qtyOnHand < qty) {
      const product = getProduct(data, batch.productId)
      return {
        ok: false,
        reason:
          `Some of batch ${batch.batchNumber} (${product ? product.name : 'this product'}) has already been sold. ` +
          `Cancelling would need ${qty} back but only ${batch.qtyOnHand} are on the shelf. ` +
          'Cancel the sales that used it first.',
      }
    }
  }

  return { ok: true, reason: null }
}

/* ---------------------------------------------------------------- */
/* Cash and credit                                                   */
/* ---------------------------------------------------------------- */

export function cashBalance(data) {
  return roundMoney(
    data.cashEntries.reduce(
      (total, entry) => total + (entry.direction === 'in' ? entry.amount : -entry.amount),
      0,
    ),
  )
}

export function cashTotals(data) {
  let moneyIn = 0
  let moneyOut = 0
  for (const entry of data.cashEntries) {
    if (entry.direction === 'in') moneyIn += entry.amount
    else moneyOut += entry.amount
  }
  return { moneyIn: roundMoney(moneyIn), moneyOut: roundMoney(moneyOut), balance: roundMoney(moneyIn - moneyOut) }
}

/**
 * Ledger rows newest first, each carrying the running balance as it stood
 * after that entry (so the newest row's balance equals the cash in hand).
 */
export function cashLedgerRows(data) {
  const oldestFirst = [...data.cashEntries].sort((a, b) => {
    if (a.entryDate !== b.entryDate) return a.entryDate < b.entryDate ? -1 : 1
    return a.id < b.id ? -1 : 1
  })

  let running = 0
  const withBalance = oldestFirst.map((entry) => {
    running = roundMoney(running + (entry.direction === 'in' ? entry.amount : -entry.amount))
    return { ...entry, runningBalance: running }
  })

  return withBalance.reverse()
}

/** Sales that have been delivered but not yet paid for — money owed to us. */
export function receivables(data) {
  return activeSales(data)
    .filter((sale) => sale.paymentStatus !== 'paid')
    .map((sale) => ({
      id: sale.id,
      kind: 'sale',
      date: sale.saleDate,
      partyId: sale.customerId,
      partyName: customerName(data, sale.customerId),
      amount: sale.totalAmount,
      daysOld: Math.max(0, -daysUntil(sale.saleDate)),
      to: `/sales/${sale.id}`,
    }))
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1))
}

/** Purchases taken on credit and not yet settled — money we owe. */
export function payables(data) {
  return activePurchases(data)
    .filter((purchase) => purchase.paymentStatus !== 'paid')
    .map((purchase) => ({
      id: purchase.id,
      kind: 'purchase',
      date: purchase.purchaseDate,
      partyId: purchase.supplierId,
      partyName: supplierName(data, purchase.supplierId),
      amount: purchase.totalAmount,
      daysOld: Math.max(0, -daysUntil(purchase.purchaseDate)),
      to: `/purchases/${purchase.id}`,
    }))
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1))
}

export const sumAmount = (rows) => roundMoney(rows.reduce((total, row) => total + row.amount, 0))

/* ---------------------------------------------------------------- */
/* People                                                            */
/* ---------------------------------------------------------------- */

/** Where this month's pay stands for one person. */
export function salaryStatus(data, employeeId, month = monthOf(TODAY)) {
  const employee = getEmployee(data, employeeId)
  if (!employee) return null
  return payrollFor(employee, data.salaryPayments, month)
}

/** Advances handed to this person and not yet taken back. */
export function advanceHeld(data, employeeId) {
  return advanceOutstanding(employeeId, data.salaryPayments)
}

/** Every payroll record for one person, newest first. */
export function payrollHistory(data, employeeId) {
  return data.salaryPayments
    .filter((row) => row.employeeId === employeeId)
    .slice()
    .sort((a, b) => (a.entryDate === b.entryDate ? (a.id < b.id ? 1 : -1) : a.entryDate < b.entryDate ? 1 : -1))
}

/** The people a sale screen may offer for a given duty. */
export const peopleWhoBookSales = (data) =>
  data.employees.filter((e) => e.booksSales && e.status !== 'left')

export const peopleWhoDeliver = (data) =>
  data.employees.filter((e) => e.delivers && e.status !== 'left')

/** Live invoices this person booked, newest first. */
export function salesBookedBy(data, employeeId) {
  return activeSales(data)
    .filter((sale) => sale.bookedBy === employeeId)
    .sort((a, b) => (a.saleDate === b.saleDate ? 0 : a.saleDate < b.saleDate ? 1 : -1))
}

/** Live invoices this person delivered, newest first. */
export function salesDeliveredBy(data, employeeId) {
  return activeSales(data)
    .filter((sale) => sale.deliveredBy === employeeId)
    .sort((a, b) => (a.saleDate === b.saleDate ? 0 : a.saleDate < b.saleDate ? 1 : -1))
}

/**
 * What one person sold in one month.
 *
 * This is what makes a target for a person mean anything. A sale that was never
 * attributed to anybody counts towards the company figure but towards nobody's
 * own — which is the honest answer, not a guess.
 */
export function soldByInMonth(data, employeeId, month) {
  return roundMoney(
    activeSales(data)
      .filter((sale) => sale.bookedBy === employeeId && sale.saleDate.slice(0, 7) === month)
      .reduce((total, sale) => total + sale.totalAmount, 0),
  )
}

/** Every seller's total for a month, biggest first, for the league table. */
export function salesByPerson(data, month) {
  const totals = new Map()
  for (const sale of activeSales(data)) {
    if (sale.saleDate.slice(0, 7) !== month) continue
    const key = sale.bookedBy || 'unattributed'
    totals.set(key, roundMoney((totals.get(key) || 0) + sale.totalAmount))
  }
  return [...totals.entries()]
    .map(([employeeId, amount]) => ({
      employeeId: employeeId === 'unattributed' ? null : employeeId,
      name:
        employeeId === 'unattributed'
          ? 'Not attributed to anyone'
          : (getEmployee(data, employeeId) || {}).name || 'Unknown',
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
}

/* ---------------------------------------------------------------- */
/* Dashboard                                                         */
/* ---------------------------------------------------------------- */

export function salesLastSevenDays(data) {
  const days = lastNDays(7)
  const totals = Object.fromEntries(days.map((day) => [day, 0]))
  for (const sale of activeSales(data)) {
    if (sale.saleDate in totals) totals[sale.saleDate] += sale.totalAmount
  }
  return days.map((day) => ({ date: day, total: totals[day] }))
}

/**
 * Recent activity feed. Purchases and sales are listed directly; cash entries
 * are only included when they are not already represented by a purchase or a
 * sale row (i.e. salary payments), so nothing appears twice.
 */
export function recentActivity(data, limit = 8) {
  const rows = []

  for (const purchase of data.purchases) {
    rows.push({
      key: 'purchase-' + purchase.id,
      date: purchase.purchaseDate,
      kind: 'purchase',
      title: 'Purchase from ' + supplierName(data, purchase.supplierId),
      detail: `${purchase.items.length} item${purchase.items.length === 1 ? '' : 's'} · ${
        purchase.status === 'reversed' ? 'Cancelled' : purchase.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'
      }`,
      amount: purchase.totalAmount,
      direction: 'out',
      cancelled: purchase.status === 'reversed',
      to: '/purchases/' + purchase.id,
    })
  }

  for (const sale of data.sales) {
    rows.push({
      key: 'sale-' + sale.id,
      date: sale.saleDate,
      kind: 'sale',
      title: 'Sale to ' + customerName(data, sale.customerId),
      detail: `${sale.items.length} item${sale.items.length === 1 ? '' : 's'} · ${
        sale.status === 'reversed' ? 'Cancelled' : sale.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'
      }`,
      amount: sale.totalAmount,
      direction: 'in',
      cancelled: sale.status === 'reversed',
      to: '/sales/' + sale.id,
    })
  }

  for (const entry of data.cashEntries) {
    if (entry.referenceType !== 'salary') continue
    rows.push({
      key: 'cash-' + entry.id,
      date: entry.entryDate,
      kind: 'salary',
      title: entry.note,
      detail: 'Salary payment',
      amount: entry.amount,
      direction: entry.direction,
      cancelled: false,
      to: '/cash',
    })
  }

  return rows
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return a.key < b.key ? 1 : -1
    })
    .slice(0, limit)
}

/* ---------------------------------------------------------------- */
/* Global search                                                     */
/* ---------------------------------------------------------------- */

/** One box that looks everywhere, so nothing depends on knowing which screen. */
export function globalSearch(data, query, limit = 8) {
  const term = query.trim().toLowerCase()
  if (term.length < 2) return []
  const hits = []
  const match = (text) => String(text || '').toLowerCase().includes(term)

  for (const supplier of data.suppliers) {
    if (match(supplier.name) || match(supplier.shortAddress) || match(supplier.contactNumber)) {
      hits.push({ id: supplier.id, kind: 'Supplier', label: supplier.name, hint: supplier.shortAddress, to: `/suppliers/${supplier.id}` })
    }
  }
  for (const customer of data.customers) {
    if (match(customer.name) || match(customer.shortAddress) || match(customer.contactNumber)) {
      hits.push({ id: customer.id, kind: 'Customer', label: customer.name, hint: customer.shortAddress, to: `/customers/${customer.id}` })
    }
  }
  for (const product of data.products) {
    if (match(product.name) || match(groupName(data, product.groupId))) {
      hits.push({ id: product.id, kind: 'Product', label: product.name, hint: groupName(data, product.groupId), to: `/products/${product.id}` })
    }
  }
  for (const batch of data.stockBatches) {
    if (match(batch.batchNumber)) {
      hits.push({
        id: batch.id,
        kind: 'Batch',
        label: batch.batchNumber,
        hint: productName(data, batch.productId),
        to: `/products/${batch.productId}`,
      })
    }
  }
  for (const employee of data.employees) {
    if (match(employee.name) || match(employee.designation)) {
      hits.push({ id: employee.id, kind: 'Employee', label: employee.name, hint: employee.designation, to: '/employees' })
    }
  }

  return hits.slice(0, limit)
}


/* ---------------------------------------------------------------- */
/* Compliance — licences, recall, controlled medicines               */
/* ---------------------------------------------------------------- */

/**
 * Where a customer's drug sale licence stands today.
 * A shop with no licence on file is "none" — that is not the same as expired,
 * because plenty of general stores never had one.
 */
export function licenceStatus(customer, withinDays = 60) {
  if (!customer || !customer.licenceExpiry) {
    return { state: 'none', days: null, label: 'No licence on file', tone: 'slate' }
  }
  const days = daysUntil(customer.licenceExpiry)
  if (days < 0) {
    return { state: 'expired', days, label: `Licence expired ${Math.abs(days)} days ago`, tone: 'red' }
  }
  if (days <= withinDays) {
    return { state: 'expiring', days, label: `Licence expires in ${days} days`, tone: 'amber' }
  }
  return { state: 'valid', days, label: 'Licence valid', tone: 'green' }
}

/** Everyone whose licence has run out or is about to. */
export function licenceWatchlist(data, withinDays = 60) {
  return data.customers
    .map((customer) => ({ customer, status: licenceStatus(customer, withinDays) }))
    .filter((row) => row.status.state === 'expired' || row.status.state === 'expiring')
    .sort((a, b) => (a.status.days ?? 0) - (b.status.days ?? 0))
}

/**
 * Recall trace: given a batch number, everywhere it went.
 * This is the question a regulator asks — "who has this batch?" — and it has to
 * be answerable in minutes, not days.
 */
export function traceBatch(data, batchNumber) {
  const term = String(batchNumber || '').trim().toLowerCase()
  if (!term) return null

  const batches = data.stockBatches.filter((b) => b.batchNumber.toLowerCase() === term)
  if (!batches.length) return null

  const ids = new Set(batches.map((b) => b.id))
  const product = getProduct(data, batches[0].productId)

  const receivedFrom = []
  for (const purchase of data.purchases) {
    for (const item of purchase.items) {
      if (item.batchNumber.toLowerCase() !== term) continue
      receivedFrom.push({
        id: purchase.id,
        date: purchase.purchaseDate,
        party: supplierName(data, purchase.supplierId),
        qty: item.qty,
        cancelled: purchase.status === 'reversed',
        to: `/purchases/${purchase.id}`,
      })
    }
  }

  const suppliedTo = []
  for (const sale of data.sales) {
    for (const item of sale.items) {
      if (!ids.has(item.stockBatchId)) continue
      const customer = getCustomer(data, sale.customerId)
      suppliedTo.push({
        id: sale.id,
        date: sale.saleDate,
        party: customerName(data, sale.customerId),
        contactNumber: customer ? customer.contactNumber : '',
        qty: item.qty + (item.bonusQty || 0),
        cancelled: sale.status === 'reversed',
        to: `/sales/${sale.id}`,
      })
    }
  }

  const stillOnShelf = batches.reduce((total, b) => total + b.qtyOnHand, 0)
  const shipped = suppliedTo.filter((r) => !r.cancelled).reduce((t, r) => t + r.qty, 0)

  return {
    batchNumber: batches[0].batchNumber,
    expiryDate: batches[0].expiryDate,
    product,
    receivedFrom: receivedFrom.sort((a, b) => (a.date < b.date ? -1 : 1)),
    suppliedTo: suppliedTo.sort((a, b) => (a.date < b.date ? -1 : 1)),
    stillOnShelf,
    shipped,
    customerCount: new Set(suppliedTo.filter((r) => !r.cancelled).map((r) => r.party)).size,
  }
}

export const controlledProducts = (data) => data.products.filter((p) => p.controlled)

/**
 * The controlled-medicines register: every movement of every restricted item,
 * with a running balance, which is what has to be produced on inspection.
 */
export function controlledRegister(data) {
  const ids = new Set(controlledProducts(data).map((p) => p.id))
  if (!ids.size) return []

  const rows = []
  for (const purchase of data.purchases) {
    if (purchase.status === 'reversed') continue
    for (const item of purchase.items) {
      if (!ids.has(item.productId)) continue
      rows.push({
        key: `p-${purchase.id}-${item.productId}`,
        date: purchase.purchaseDate,
        productId: item.productId,
        productName: productName(data, item.productId),
        batchNumber: item.batchNumber,
        movement: 'Received',
        party: supplierName(data, purchase.supplierId),
        inQty: item.qty,
        outQty: 0,
        to: `/purchases/${purchase.id}`,
      })
    }
  }
  for (const sale of data.sales) {
    if (sale.status === 'reversed') continue
    for (const item of sale.items) {
      if (!ids.has(item.productId)) continue
      const batch = getBatch(data, item.stockBatchId)
      const customer = getCustomer(data, sale.customerId)
      rows.push({
        key: `s-${sale.id}-${item.productId}`,
        date: sale.saleDate,
        productId: item.productId,
        productName: productName(data, item.productId),
        batchNumber: batch ? batch.batchNumber : '—',
        movement: 'Supplied',
        party: customerName(data, sale.customerId),
        licenceNumber: customer ? customer.licenceNumber : '',
        inQty: 0,
        outQty: item.qty + (item.bonusQty || 0),
        to: `/sales/${sale.id}`,
      })
    }
  }

  rows.sort((a, b) => (a.date === b.date ? (a.key < b.key ? -1 : 1) : a.date < b.date ? -1 : 1))
  let balance = 0
  return rows.map((row) => {
    balance += row.inQty - row.outQty
    return { ...row, balance }
  })
}

/* ---------------------------------------------------------------- */
/* Expenses                                                          */
/* ---------------------------------------------------------------- */

export function expensesNewestFirst(data) {
  return [...data.expenses].sort(byDateDesc((e) => e.date))
}

export function expenseTotalsByCategory(data, from, to) {
  const totals = new Map()
  for (const expense of data.expenses) {
    if (from && expense.date < from) continue
    if (to && expense.date > to) continue
    totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount)
  }
  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}


/* ---------------------------------------------------------------- */
/* Offers                                                            */
/* ---------------------------------------------------------------- */

/**
 * The offer that applies to a product on a given day.
 *
 * Offers carry dates, so one can be set up weeks in advance and simply start
 * on its own. If two ever overlap the newest wins — the later campaign is the
 * one that was agreed most recently.
 */
export function activeOfferForProduct(data, productId, on = TODAY) {
  const running = (data.offers || []).filter(
    (offer) =>
      offer.productId === productId &&
      offer.active &&
      (!offer.startDate || on >= offer.startDate) &&
      (!offer.endDate || on <= offer.endDate),
  )
  if (!running.length) return null
  return running.sort((a, b) => (a.startDate || '') < (b.startDate || '') ? 1 : -1)[0]
}

export function offersForProduct(data, productId) {
  return (data.offers || [])
    .filter((offer) => offer.productId === productId)
    .sort((a, b) => ((a.startDate || '') < (b.startDate || '') ? 1 : -1))
}

export function offersNewestFirst(data) {
  return [...(data.offers || [])].sort((a, b) => ((a.startDate || '') < (b.startDate || '') ? 1 : -1))
}

/* ---------------------------------------------------------------- */
/* Tax status                                                        */
/* ---------------------------------------------------------------- */

/**
 * What being off the tax roll actually costs, per customer.
 * This is the number that makes the filer / non-filer flag mean something.
 */
export function taxStatusSummary(data) {
  const rate = data.settings.furtherTaxEnabled ? Number(data.settings.furtherTaxPercent) || 0 : 0

  const rows = data.customers.map((customer) => {
    const sales = activeSales(data).filter((sale) => sale.customerId === customer.id)
    const supplied = sales.reduce((total, sale) => total + (sale.subtotal ?? sale.totalAmount), 0)
    const charged = sales.reduce((total, sale) => total + (sale.furtherTax || 0), 0)
    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      businessTitle: customer.businessTitle,
      taxStatus: customer.taxStatus,
      ntn: customer.ntn,
      saleCount: sales.length,
      supplied: roundMoney(supplied),
      furtherTaxCharged: roundMoney(charged),
      // What they would save the invoice if they registered.
      wouldSave: customer.taxStatus === 'non-filer' ? roundMoney((supplied * rate) / 100) : 0,
      to: `/customers/${customer.id}`,
    }
  })

  const filers = rows.filter((r) => r.taxStatus === 'filer')
  const nonFilers = rows.filter((r) => r.taxStatus === 'non-filer')

  return {
    rate,
    rows: rows.sort((a, b) => b.supplied - a.supplied),
    filers,
    nonFilers,
    filerSupplied: roundMoney(filers.reduce((t, r) => t + r.supplied, 0)),
    nonFilerSupplied: roundMoney(nonFilers.reduce((t, r) => t + r.supplied, 0)),
    furtherTaxCollected: roundMoney(rows.reduce((t, r) => t + r.furtherTaxCharged, 0)),
    missingNtn: rows.filter((r) => r.taxStatus === 'filer' && !r.ntn).length,
  }
}
