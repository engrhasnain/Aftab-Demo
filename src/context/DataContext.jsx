import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import seedData, { defaultSettings } from '../data/seedData'
import { TODAY } from '../utils/format'
import { calcLine, calcTotals } from '../utils/tax'

const round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100

/**
 * The single in-memory store for the whole demo.
 *
 * There is no backend and no persistence layer by design: everything lives in
 * this reducer for the lifetime of the page. Refreshing the browser reloads
 * the seed file and throws away anything the user added.
 *
 * Two rules run through it:
 *   - a purchase or sale is never deleted, only reversed, so history stays readable
 *   - a recorded invoice keeps the tax that was charged on the day, so changing
 *     the tax setting later never rewrites the past
 */

const DataContext = createContext(null)

/**
 * Persistence.
 *
 * The demo used to forget everything on refresh. It now keeps what you enter in
 * this browser, so a client can look at it again tomorrow and still see their
 * own data. The version stamp means an old save is discarded rather than
 * loaded into a newer shape it does not fit. "Reset demo data" in Settings puts
 * the seed figures back.
 *
 * This is still not a database — the data lives in this one browser and nobody
 * else can see it. That is what the real build replaces.
 */
const STORAGE_KEY = 'raso-demo-state'
const STORAGE_VERSION = 4

function loadSaved(fallback) {
  if (typeof window === 'undefined' || !window.localStorage) return fallback
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const saved = JSON.parse(raw)
    if (!saved || saved.version !== STORAGE_VERSION) return fallback
    return { ...fallback, ...saved.state }
  } catch {
    return fallback
  }
}

function save(state) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, state }))
  } catch {
    /* a full or blocked storage must never break the app */
  }
}

export function clearSaved() {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/* ---------------------------------------------------------------- */
/* Helpers                                                           */
/* ---------------------------------------------------------------- */

/** Next internal id for a list whose ids look like "sup-07" / "pur-1012". */
function nextId(prefix, list, start, pad) {
  let max = start - 1
  for (const item of list) {
    const n = Number(String(item.id).split('-').pop())
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${prefix}-${String(max + 1).padStart(pad, '0')}`
}

/** Next human-facing code — products count from 1, suppliers 4000, customers 6000. */
function nextCode(list, start) {
  let max = Number(start) - 1
  for (const item of list) {
    const n = Number(item.code)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max + 1
}

function makeCashEntry(cashEntries, entry) {
  return { id: nextId('cash', cashEntries, 1, 3), ...entry }
}

function applyToBatches(stockBatches, changes) {
  return stockBatches.map((batch) => {
    const delta = changes.get(batch.id)
    return delta ? { ...batch, qtyOnHand: batch.qtyOnHand + delta } : batch
  })
}

/** Shapes the fields a product form sends into a stored product. */
function productFields(fields) {
  return {
    name: fields.name,
    supplierId: fields.supplierId,
    mrp: Number(fields.mrp),
    tp: Number(fields.tp),
    purchaseCost: Number(fields.purchaseCost),
    taxable: Boolean(fields.taxable),
    salesTaxPercent: Number(fields.salesTaxPercent) || 0,
    colour: fields.colour || '#2A3785',
    controlled: Boolean(fields.controlled),
    unit: fields.unit || 'unit',
    unitsPerCarton: Number(fields.unitsPerCarton) || 0,
  }
}

function customerFields(fields) {
  return {
    name: fields.name,
    businessTitle: fields.businessTitle || fields.name,
    longAddress: fields.longAddress,
    shortAddress: fields.shortAddress,
    contactNumber: fields.contactNumber,
    licenceNumber: fields.licenceNumber || '',
    licenceExpiry: fields.licenceExpiry || null,
    taxStatus: fields.taxStatus === 'filer' ? 'filer' : 'non-filer',
    ntn: fields.ntn || '',
  }
}

/* ---------------------------------------------------------------- */
/* Initial state                                                     */
/* ---------------------------------------------------------------- */

export const initialState = {
  settings: seedData.settings,
  suppliers: seedData.suppliers,
  customers: seedData.customers,
  productGroups: seedData.productGroups,
  products: seedData.products,
  stockBatches: seedData.stockBatches,
  purchases: seedData.purchases,
  sales: seedData.sales,
  employees: seedData.employees,
  cashEntries: seedData.cashEntries,
  adjustments: seedData.adjustments,
  expenses: seedData.expenses,
  offers: seedData.offers,
  investors: seedData.investors,
  investorEntries: seedData.investorEntries,
  targets: seedData.targets,
  salesReturns: seedData.salesReturns,
  purchaseReturns: seedData.purchaseReturns,
  sopDocuments: seedData.sopDocuments,
  openingBalance: seedData.openingBalance,
  lastCreated: null,
}

/* ---------------------------------------------------------------- */
/* Reducer                                                           */
/* ---------------------------------------------------------------- */

export function reducer(state, action) {
  const series = state.settings.codeSeries

  switch (action.type) {
    /* ---------------- settings ---------------- */

    case 'RESET_ALL':
      return initialState

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    /* ---------------- master records ---------------- */

    case 'ADD_SUPPLIER': {
      const supplier = {
        id: nextId('sup', state.suppliers, 1, 2),
        code: nextCode(state.suppliers, series.supplier),
        colour: action.payload.colour || '#2A3785',
        ...action.payload,
      }
      return {
        ...state,
        suppliers: [...state.suppliers, supplier],
        lastCreated: { type: 'supplier', id: supplier.id },
      }
    }

    case 'UPDATE_SUPPLIER': {
      const { id, ...fields } = action.payload
      return {
        ...state,
        suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...fields } : s)),
        lastCreated: { type: 'supplier', id },
      }
    }

    case 'ADD_CUSTOMER': {
      const customer = {
        id: nextId('cus', state.customers, 1, 2),
        code: nextCode(state.customers, series.customer),
        ...customerFields(action.payload),
      }
      return {
        ...state,
        customers: [...state.customers, customer],
        lastCreated: { type: 'customer', id: customer.id },
      }
    }

    case 'UPDATE_CUSTOMER': {
      const { id, ...fields } = action.payload
      return {
        ...state,
        customers: state.customers.map((c) => (c.id === id ? { ...c, ...customerFields(fields) } : c)),
        lastCreated: { type: 'customer', id },
      }
    }

    case 'ADD_PRODUCT': {
      const { newGroupName, ...fields } = action.payload
      let productGroups = state.productGroups
      let groupId = fields.groupId

      // The product form lets the user type a brand new group inline.
      if (newGroupName) {
        const group = {
          id: nextId('grp', productGroups, 1, 2),
          name: newGroupName,
          supplierId: fields.supplierId,
        }
        productGroups = [...productGroups, group]
        groupId = group.id
      }

      const product = {
        id: nextId('prd', state.products, 1, 2),
        code: nextCode(state.products, series.product),
        groupId,
        ...productFields(fields),
      }

      return {
        ...state,
        productGroups,
        products: [...state.products, product],
        lastCreated: { type: 'product', id: product.id },
      }
    }

    case 'UPDATE_PRODUCT': {
      const { id, newGroupName, ...fields } = action.payload
      let productGroups = state.productGroups
      let groupId = fields.groupId

      if (newGroupName) {
        const group = {
          id: nextId('grp', productGroups, 1, 2),
          name: newGroupName,
          supplierId: fields.supplierId,
        }
        productGroups = [...productGroups, group]
        groupId = group.id
      }

      return {
        ...state,
        productGroups,
        products: state.products.map((p) => (p.id === id ? { ...p, groupId, ...productFields(fields) } : p)),
        lastCreated: { type: 'product', id },
      }
    }

    case 'ADD_EMPLOYEE': {
      const employee = {
        id: nextId('emp', state.employees, 1, 2),
        code: nextCode(state.employees, series.employee),
        name: action.payload.name,
        designation: action.payload.designation,
        monthlySalary: Number(action.payload.monthlySalary),
      }
      return {
        ...state,
        employees: [...state.employees, employee],
        lastCreated: { type: 'employee', id: employee.id },
      }
    }

    case 'UPDATE_EMPLOYEE': {
      const { id, ...fields } = action.payload
      return {
        ...state,
        employees: state.employees.map((e) =>
          e.id === id
            ? {
                ...e,
                name: fields.name,
                designation: fields.designation,
                monthlySalary: Number(fields.monthlySalary),
              }
            : e,
        ),
        lastCreated: { type: 'employee', id },
      }
    }

    /* ---------------- openings ---------------- */

    case 'SET_OPENING_BALANCE': {
      const { date, amount, note } = action.payload
      const value = Number(amount)
      if (!Number.isFinite(value)) return state
      // There is only ever one opening balance, so replace it rather than add.
      const withoutOpening = state.cashEntries.filter((e) => e.referenceType !== 'opening')
      return {
        ...state,
        openingBalance: { date, amount: value, note: note || 'Opening cash brought forward' },
        cashEntries: [
          ...withoutOpening,
          {
            id: 'cash-opening',
            entryDate: date,
            direction: value >= 0 ? 'in' : 'out',
            amount: Math.abs(value),
            referenceType: 'opening',
            referenceId: 'opening-balance',
            note: note || 'Opening cash brought forward',
          },
        ],
      }
    }

    case 'ADD_OPENING_STOCK': {
      const { productId, batchNumber, expiryDate, qty, unitCost, date } = action.payload
      const amount = Number(qty)
      if (!productId || !batchNumber || !Number.isFinite(amount) || amount <= 0) return state

      const stockBatches = state.stockBatches.map((b) => ({ ...b }))
      const existing = stockBatches.find((b) => b.productId === productId && b.batchNumber === batchNumber)
      if (existing) {
        existing.qtyOnHand += amount
        existing.expiryDate = expiryDate
      } else {
        stockBatches.push({
          id: nextId('stb', stockBatches, 1, 3),
          productId,
          batchNumber,
          expiryDate,
          qtyOnHand: amount,
          opening: true,
        })
      }

      // Opening stock is what was already on the shelf — it is not a purchase,
      // so no money moves. It is recorded as an adjustment so the movement
      // history still explains where the stock came from.
      return {
        ...state,
        stockBatches,
        adjustments: [
          ...state.adjustments,
          {
            id: nextId('adj', state.adjustments, 1, 3),
            batchId: (stockBatches.find((b) => b.productId === productId && b.batchNumber === batchNumber) || {}).id,
            productId,
            batchNumber,
            qty: -amount, // negative qty = stock coming IN
            reason: 'Opening stock',
            note: `Unit cost ${unitCost || 0}`,
            date: date || TODAY,
          },
        ],
        lastCreated: { type: 'openingStock', id: productId },
      }
    }

    /* ---------------- offers ---------------- */

    case 'ADD_OFFER': {
      const offer = {
        id: nextId('ofr', state.offers, 1, 3),
        code: nextCode(state.offers, series.offer || 7000),
        name: action.payload.name,
        productId: action.payload.productId,
        type: action.payload.type,
        buyQty: Number(action.payload.buyQty) || 0,
        freeQty: Number(action.payload.freeQty) || 0,
        percent: Number(action.payload.percent) || 0,
        amount: Number(action.payload.amount) || 0,
        startDate: action.payload.startDate || null,
        endDate: action.payload.endDate || null,
        active: action.payload.active !== false,
        note: action.payload.note || '',
      }
      return { ...state, offers: [...state.offers, offer], lastCreated: { type: 'offer', id: offer.id } }
    }

    case 'UPDATE_OFFER': {
      const { id, ...fields } = action.payload
      return {
        ...state,
        offers: state.offers.map((offer) =>
          offer.id === id
            ? {
                ...offer,
                ...fields,
                buyQty: Number(fields.buyQty) || 0,
                freeQty: Number(fields.freeQty) || 0,
                percent: Number(fields.percent) || 0,
                amount: Number(fields.amount) || 0,
                startDate: fields.startDate || null,
                endDate: fields.endDate || null,
              }
            : offer,
        ),
        lastCreated: { type: 'offer', id },
      }
    }

    case 'TOGGLE_OFFER':
      return {
        ...state,
        offers: state.offers.map((offer) =>
          offer.id === action.payload.id ? { ...offer, active: !offer.active } : offer,
        ),
      }

    /* ---------------- investors ---------------- */

    case 'ADD_INVESTOR': {
      const investor = {
        id: nextId('inv', state.investors, 1, 3),
        code: nextCode(state.investors, series.investor || 5000),
        name: action.payload.name,
        role: action.payload.role,
        contactNumber: action.payload.contactNumber,
        joinedOn: action.payload.joinedOn || TODAY,
        note: action.payload.note || '',
      }
      return { ...state, investors: [...state.investors, investor], lastCreated: { type: 'investor', id: investor.id } }
    }

    case 'RECORD_INVESTOR_ENTRY': {
      const investor = state.investors.find((i) => i.id === action.payload.investorId)
      const amount = round2(action.payload.amount)
      if (!investor || !(amount > 0)) return state
      const direction = action.payload.direction === 'out' ? 'out' : 'in'
      const entry = {
        id: nextId('ive', state.investorEntries, 1, 3),
        investorId: investor.id,
        date: action.payload.date || TODAY,
        direction,
        amount,
        note: action.payload.note || '',
      }
      return {
        ...state,
        investorEntries: [...state.investorEntries, entry],
        cashEntries: [
          ...state.cashEntries,
          makeCashEntry(state.cashEntries, {
            entryDate: entry.date,
            direction,
            amount,
            referenceType: 'investor',
            referenceId: investor.id,
            note: (direction === 'in' ? 'Capital from ' : 'Drawings by ') + investor.name,
          }),
        ],
      }
    }

    /* ---------------- targets ---------------- */

    case 'SAVE_TARGET': {
      const { month, scope, employeeId, amount, note } = action.payload
      const value = round2(amount)
      const key = (t) => t.month === month && t.scope === scope && (t.employeeId || null) === (employeeId || null)
      const existing = state.targets.find(key)
      if (existing) {
        return {
          ...state,
          targets: state.targets.map((t) => (key(t) ? { ...t, amount: value, note: note || '' } : t)),
        }
      }
      return {
        ...state,
        targets: [
          ...state.targets,
          { id: nextId('tgt', state.targets, 1, 3), month, scope, employeeId: employeeId || null, amount: value, note: note || '' },
        ],
      }
    }

    case 'DELETE_TARGET':
      return { ...state, targets: state.targets.filter((t) => t.id !== action.payload.id) }

    /* ---------------- returns ---------------- */

    case 'RECORD_SALE_RETURN': {
      const sale = state.sales.find((x) => x.id === action.payload.saleId)
      if (!sale || sale.status === 'reversed') return state

      const lines = (action.payload.items || [])
        .map((item) => {
          const original = sale.items.find((i) => i.stockBatchId === item.stockBatchId && i.productId === item.productId)
          const qty = Math.floor(Number(item.qty) || 0)
          if (!original || qty <= 0) return null
          // Never take back more than actually went out on that line.
          const alreadyBack = state.salesReturns
            .filter((r) => r.saleId === sale.id)
            .flatMap((r) => r.items)
            .filter((i) => i.stockBatchId === item.stockBatchId)
            .reduce((t, i) => t + i.qty, 0)
          const maxQty = original.qty + (original.bonusQty || 0) - alreadyBack
          if (qty > maxQty) return null
          const value = round2(qty * original.unitPrice)
          const taxAmount = original.qty ? round2((original.taxAmount / original.qty) * qty) : 0
          return {
            productId: item.productId,
            stockBatchId: item.stockBatchId,
            qty,
            unitPrice: original.unitPrice,
            value,
            taxAmount,
            lineTotal: round2(value + taxAmount),
          }
        })
        .filter(Boolean)

      if (!lines.length) return state

      const subtotal = round2(lines.reduce((t, l) => t + l.value, 0))
      const taxTotal = round2(lines.reduce((t, l) => t + l.taxAmount, 0))
      const totalAmount = round2(subtotal + taxTotal)

      const doc = {
        id: nextId('sret', state.salesReturns, 1, 3),
        code: nextCode(state.salesReturns, series.saleReturn || 2500),
        saleId: sale.id,
        customerId: sale.customerId,
        date: action.payload.date || TODAY,
        reason: action.payload.reason,
        settle: action.payload.settle === 'credit' ? 'credit' : 'cash',
        items: lines,
        subtotal,
        taxTotal,
        totalAmount,
      }

      // The goods come back on the shelf.
      const changes = new Map()
      for (const line of lines) changes.set(line.stockBatchId, (changes.get(line.stockBatchId) || 0) + line.qty)

      const customer = state.customers.find((c) => c.id === sale.customerId)
      const cashEntries =
        doc.settle === 'cash'
          ? [
              ...state.cashEntries,
              makeCashEntry(state.cashEntries, {
                entryDate: doc.date,
                direction: 'out',
                amount: totalAmount,
                referenceType: 'saleReturn',
                referenceId: doc.id,
                note: 'Refund to ' + (customer ? customer.name : 'customer'),
              }),
            ]
          : state.cashEntries

      return {
        ...state,
        salesReturns: [...state.salesReturns, doc],
        stockBatches: applyToBatches(state.stockBatches, changes),
        cashEntries,
        lastCreated: { type: 'saleReturn', id: doc.id },
      }
    }

    case 'RECORD_PURCHASE_RETURN': {
      const purchase = state.purchases.find((x) => x.id === action.payload.purchaseId)
      if (!purchase || purchase.status === 'reversed') return state

      const lines = (action.payload.items || [])
        .map((item) => {
          const original = purchase.items.find(
            (i) => i.productId === item.productId && i.batchNumber === item.batchNumber,
          )
          const qty = Math.floor(Number(item.qty) || 0)
          if (!original || qty <= 0) return null
          const alreadyBack = state.purchaseReturns
            .filter((r) => r.purchaseId === purchase.id)
            .flatMap((r) => r.items)
            .filter((i) => i.batchNumber === item.batchNumber && i.productId === item.productId)
            .reduce((t, i) => t + i.qty, 0)
          if (qty > original.qty - alreadyBack) return null

          const batch = state.stockBatches.find(
            (b) => b.productId === item.productId && b.batchNumber === item.batchNumber,
          )
          // Cannot send back stock that is no longer on the shelf.
          if (!batch || batch.qtyOnHand < qty) return null

          const value = round2(qty * original.unitCost)
          const taxAmount = original.qty ? round2(((original.taxAmount || 0) / original.qty) * qty) : 0
          return {
            productId: item.productId,
            batchNumber: item.batchNumber,
            batchId: batch.id,
            qty,
            unitCost: original.unitCost,
            value,
            taxAmount,
            lineTotal: round2(value + taxAmount),
          }
        })
        .filter(Boolean)

      if (!lines.length) return state

      const subtotal = round2(lines.reduce((t, l) => t + l.value, 0))
      const taxTotal = round2(lines.reduce((t, l) => t + l.taxAmount, 0))
      const totalAmount = round2(subtotal + taxTotal)

      const doc = {
        id: nextId('pret', state.purchaseReturns, 1, 3),
        code: nextCode(state.purchaseReturns, series.purchaseReturn || 1500),
        purchaseId: purchase.id,
        supplierId: purchase.supplierId,
        date: action.payload.date || TODAY,
        reason: action.payload.reason,
        settle: action.payload.settle === 'credit' ? 'credit' : 'cash',
        items: lines,
        subtotal,
        taxTotal,
        totalAmount,
      }

      const changes = new Map()
      for (const line of lines) changes.set(line.batchId, (changes.get(line.batchId) || 0) - line.qty)

      const supplier = state.suppliers.find((x) => x.id === purchase.supplierId)
      const cashEntries =
        doc.settle === 'cash'
          ? [
              ...state.cashEntries,
              makeCashEntry(state.cashEntries, {
                entryDate: doc.date,
                direction: 'in',
                amount: totalAmount,
                referenceType: 'purchaseReturn',
                referenceId: doc.id,
                note: 'Refund from ' + (supplier ? supplier.name : 'supplier'),
              }),
            ]
          : state.cashEntries

      return {
        ...state,
        purchaseReturns: [...state.purchaseReturns, doc],
        stockBatches: applyToBatches(state.stockBatches, changes),
        cashEntries,
        lastCreated: { type: 'purchaseReturn', id: doc.id },
      }
    }

    /* ---------------- expenses ---------------- */

    case 'ADD_EXPENSE': {
      const expense = {
        id: nextId('exp', state.expenses, 1, 3),
        code: nextCode(state.expenses, series.expense),
        date: action.payload.date,
        category: action.payload.category,
        payee: action.payload.payee,
        amount: Number(action.payload.amount),
        note: action.payload.note || '',
      }
      return {
        ...state,
        expenses: [...state.expenses, expense],
        cashEntries: [
          ...state.cashEntries,
          makeCashEntry(state.cashEntries, {
            entryDate: expense.date,
            direction: 'out',
            amount: expense.amount,
            referenceType: 'expense',
            referenceId: expense.id,
            note: expense.category + ' — ' + expense.payee,
          }),
        ],
        lastCreated: { type: 'expense', id: expense.id },
      }
    }

    /* ---------------- purchases ---------------- */

    case 'RECORD_PURCHASE': {
      const { supplierId, purchaseDate, paymentStatus, items } = action.payload

      const purchase = {
        id: nextId('pur', state.purchases, 1001, 4),
        supplierId,
        purchaseDate,
        paymentStatus,
        status: 'active',
        items: items.map((item) => {
          const product = state.products.find((p) => p.id === item.productId)
          const value = round2(Number(item.qty) * Number(item.unitCost))
          // Tax paid to the supplier, claimed back against tax charged on sales.
          const rate =
            state.settings.inputTaxEnabled && product && product.taxable ? Number(product.salesTaxPercent) : 0
          const taxAmount = round2((value * rate) / 100)
          return {
            productId: item.productId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            qty: Number(item.qty),
            unitCost: Number(item.unitCost),
            value,
            taxPercent: rate,
            taxAmount,
            lineTotal: round2(value + taxAmount),
          }
        }),
      }

      purchase.subtotal = round2(purchase.items.reduce((t, i) => t + i.value, 0))
      purchase.taxTotal = round2(purchase.items.reduce((t, i) => t + i.taxAmount, 0))
      purchase.totalAmount = round2(purchase.subtotal + purchase.taxTotal)

      // A purchase either tops up an existing batch or opens a new one.
      const stockBatches = state.stockBatches.map((batch) => ({ ...batch }))
      for (const item of purchase.items) {
        const existing = stockBatches.find(
          (batch) => batch.productId === item.productId && batch.batchNumber === item.batchNumber,
        )
        if (existing) {
          existing.qtyOnHand += item.qty
          existing.expiryDate = item.expiryDate
        } else {
          stockBatches.push({
            id: nextId('stb', stockBatches, 1, 3),
            productId: item.productId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            qtyOnHand: item.qty,
          })
        }
      }

      const supplier = state.suppliers.find((s) => s.id === supplierId)
      const cashEntries =
        paymentStatus === 'paid'
          ? [
              ...state.cashEntries,
              makeCashEntry(state.cashEntries, {
                entryDate: purchaseDate,
                direction: 'out',
                amount: purchase.totalAmount,
                referenceType: 'purchase',
                referenceId: purchase.id,
                note: 'Purchase from ' + (supplier ? supplier.name : 'supplier'),
              }),
            ]
          : state.cashEntries

      return {
        ...state,
        purchases: [...state.purchases, purchase],
        stockBatches,
        cashEntries,
        lastCreated: { type: 'purchase', id: purchase.id },
      }
    }

    case 'SETTLE_PURCHASE': {
      const purchase = state.purchases.find((p) => p.id === action.payload.id)
      if (!purchase || purchase.paymentStatus === 'paid' || purchase.status === 'reversed') return state
      const supplier = state.suppliers.find((s) => s.id === purchase.supplierId)
      return {
        ...state,
        purchases: state.purchases.map((p) =>
          p.id === purchase.id ? { ...p, paymentStatus: 'paid', settledOn: action.payload.date } : p,
        ),
        cashEntries: [
          ...state.cashEntries,
          makeCashEntry(state.cashEntries, {
            entryDate: action.payload.date,
            direction: 'out',
            amount: purchase.totalAmount,
            referenceType: 'purchase',
            referenceId: purchase.id,
            note: 'Paid ' + (supplier ? supplier.name : 'supplier'),
          }),
        ],
      }
    }

    case 'REVERSE_PURCHASE': {
      const purchase = state.purchases.find((p) => p.id === action.payload.id)
      if (!purchase || purchase.status === 'reversed') return state

      // Taking the stock back out must not push any batch below zero — some of
      // it may already have been sold. The screen checks first; this is a
      // second guard so the store cannot be corrupted.
      const changes = new Map()
      for (const item of purchase.items) {
        const batch = state.stockBatches.find(
          (b) => b.productId === item.productId && b.batchNumber === item.batchNumber,
        )
        if (!batch) return state
        changes.set(batch.id, (changes.get(batch.id) || 0) - item.qty)
      }
      for (const [batchId, delta] of changes) {
        const batch = state.stockBatches.find((b) => b.id === batchId)
        if (!batch || batch.qtyOnHand + delta < 0) return state
      }

      const supplier = state.suppliers.find((s) => s.id === purchase.supplierId)
      const cashEntries =
        purchase.paymentStatus === 'paid'
          ? [
              ...state.cashEntries,
              makeCashEntry(state.cashEntries, {
                entryDate: action.payload.date,
                direction: 'in',
                amount: purchase.totalAmount,
                referenceType: 'purchase',
                referenceId: purchase.id,
                note: 'Cancelled purchase from ' + (supplier ? supplier.name : 'supplier') + ' — money back',
              }),
            ]
          : state.cashEntries

      return {
        ...state,
        purchases: state.purchases.map((p) =>
          p.id === purchase.id ? { ...p, status: 'reversed', reversedOn: action.payload.date } : p,
        ),
        stockBatches: applyToBatches(state.stockBatches, changes),
        cashEntries,
      }
    }

    /* ---------------- sales ---------------- */

    case 'RECORD_SALE': {
      const { customerId, saleDate, paymentStatus, items } = action.payload

      // Work the tax out now and store it on the invoice. If the business
      // changes its tax setting next month, this invoice must not change.
      const priced = items.map((item) => {
        const product = state.products.find((p) => p.id === item.productId)
        const calc = calcLine(
          {
            qty: item.qty,
            bonusQty: item.bonusQty,
            unitPrice: item.unitPrice,
            mrp: product ? product.mrp : 0,
            taxable: item.taxable !== undefined ? item.taxable : Boolean(product && product.taxable),
            taxPercent: item.taxPercent !== undefined ? item.taxPercent : product && product.salesTaxPercent,
          },
          state.settings,
        )
        return {
          productId: item.productId,
          stockBatchId: item.stockBatchId,
          qty: calc.qty,
          bonusQty: calc.bonusQty,
          unitPrice: calc.unitPrice,
          taxable: calc.taxRate > 0,
          taxPercent: calc.taxRate,
          taxAmount: calc.taxAmount,
          lineTotal: calc.lineTotal,
          value: calc.value,
        }
      })

      // Supplies to a buyer who is not on the tax roll carry further tax.
      const buyer = state.customers.find((c) => c.id === customerId)
      const totals = calcTotals(priced, {
        taxStatus: buyer ? buyer.taxStatus : 'filer',
        furtherTaxEnabled: state.settings.furtherTaxEnabled,
        furtherTaxPercent: state.settings.furtherTaxPercent,
      })

      const sale = {
        id: nextId('sal', state.sales, 2001, 4),
        customerId,
        saleDate,
        paymentStatus,
        status: 'active',
        items: priced,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        furtherTax: totals.furtherTax,
        furtherTaxPercent: totals.furtherTaxPercent,
        totalAmount: totals.grandTotal,
      }

      // Sold units and free bonus units both leave the shelf.
      const changes = new Map()
      for (const item of sale.items) {
        const out = item.qty + (item.bonusQty || 0)
        changes.set(item.stockBatchId, (changes.get(item.stockBatchId) || 0) - out)
      }

      const customer = state.customers.find((c) => c.id === customerId)
      const cashEntries =
        paymentStatus === 'paid'
          ? [
              ...state.cashEntries,
              makeCashEntry(state.cashEntries, {
                entryDate: saleDate,
                direction: 'in',
                amount: sale.totalAmount,
                referenceType: 'sale',
                referenceId: sale.id,
                note: 'Sale to ' + (customer ? customer.name : 'customer'),
              }),
            ]
          : state.cashEntries

      return {
        ...state,
        sales: [...state.sales, sale],
        stockBatches: applyToBatches(state.stockBatches, changes),
        cashEntries,
        lastCreated: { type: 'sale', id: sale.id },
      }
    }

    case 'SETTLE_SALE': {
      const sale = state.sales.find((s) => s.id === action.payload.id)
      if (!sale || sale.paymentStatus === 'paid' || sale.status === 'reversed') return state
      const customer = state.customers.find((c) => c.id === sale.customerId)
      return {
        ...state,
        sales: state.sales.map((s) =>
          s.id === sale.id ? { ...s, paymentStatus: 'paid', settledOn: action.payload.date } : s,
        ),
        cashEntries: [
          ...state.cashEntries,
          makeCashEntry(state.cashEntries, {
            entryDate: action.payload.date,
            direction: 'in',
            amount: sale.totalAmount,
            referenceType: 'sale',
            referenceId: sale.id,
            note: 'Received from ' + (customer ? customer.name : 'customer'),
          }),
        ],
      }
    }

    case 'REVERSE_SALE': {
      const sale = state.sales.find((s) => s.id === action.payload.id)
      if (!sale || sale.status === 'reversed') return state

      // Putting stock back is always safe, so a sale can always be cancelled.
      const changes = new Map()
      for (const item of sale.items) {
        const back = item.qty + (item.bonusQty || 0)
        changes.set(item.stockBatchId, (changes.get(item.stockBatchId) || 0) + back)
      }

      const customer = state.customers.find((c) => c.id === sale.customerId)
      const cashEntries =
        sale.paymentStatus === 'paid'
          ? [
              ...state.cashEntries,
              makeCashEntry(state.cashEntries, {
                entryDate: action.payload.date,
                direction: 'out',
                amount: sale.totalAmount,
                referenceType: 'sale',
                referenceId: sale.id,
                note: 'Cancelled sale to ' + (customer ? customer.name : 'customer') + ' — money returned',
              }),
            ]
          : state.cashEntries

      return {
        ...state,
        sales: state.sales.map((s) =>
          s.id === sale.id ? { ...s, status: 'reversed', reversedOn: action.payload.date } : s,
        ),
        stockBatches: applyToBatches(state.stockBatches, changes),
        cashEntries,
      }
    }

    /* ---------------- stock ---------------- */

    case 'WRITE_OFF_BATCH': {
      const { batchId, qty, reason, date, note } = action.payload
      const batch = state.stockBatches.find((b) => b.id === batchId)
      const amount = Number(qty)
      if (!batch || !Number.isFinite(amount) || amount <= 0 || amount > batch.qtyOnHand) return state

      return {
        ...state,
        stockBatches: state.stockBatches.map((b) =>
          b.id === batchId ? { ...b, qtyOnHand: b.qtyOnHand - amount } : b,
        ),
        adjustments: [
          ...state.adjustments,
          {
            id: nextId('adj', state.adjustments, 1, 3),
            batchId,
            productId: batch.productId,
            batchNumber: batch.batchNumber,
            qty: amount,
            reason,
            note: note || '',
            date,
          },
        ],
      }
    }

    /* ---------------- salaries ---------------- */

    case 'PAY_SALARY': {
      const employee = state.employees.find((e) => e.id === action.payload.employeeId)
      if (!employee) return state
      return {
        ...state,
        cashEntries: [
          ...state.cashEntries,
          makeCashEntry(state.cashEntries, {
            entryDate: action.payload.entryDate,
            direction: 'out',
            amount: employee.monthlySalary,
            referenceType: 'salary',
            referenceId: employee.id,
            note: 'Salary — ' + employee.name,
          }),
        ],
      }
    }

    default:
      return state
  }
}

/* ---------------------------------------------------------------- */
/* Provider                                                          */
/* ---------------------------------------------------------------- */

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, loadSaved)

  // Keep the browser's copy in step with what is on screen.
  useEffect(() => {
    save(state)
  }, [state])

  const value = useMemo(
    () => ({
      ...state,
      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', payload: patch }),
      resetAll: () => {
        clearSaved()
        dispatch({ type: 'RESET_ALL' })
      },

      addSupplier: (supplier) => dispatch({ type: 'ADD_SUPPLIER', payload: supplier }),
      updateSupplier: (supplier) => dispatch({ type: 'UPDATE_SUPPLIER', payload: supplier }),
      addCustomer: (customer) => dispatch({ type: 'ADD_CUSTOMER', payload: customer }),
      updateCustomer: (customer) => dispatch({ type: 'UPDATE_CUSTOMER', payload: customer }),
      addProduct: (product) => dispatch({ type: 'ADD_PRODUCT', payload: product }),
      updateProduct: (product) => dispatch({ type: 'UPDATE_PRODUCT', payload: product }),
      addEmployee: (employee) => dispatch({ type: 'ADD_EMPLOYEE', payload: employee }),
      updateEmployee: (employee) => dispatch({ type: 'UPDATE_EMPLOYEE', payload: employee }),

      setOpeningBalance: (payload) => dispatch({ type: 'SET_OPENING_BALANCE', payload }),
      addOpeningStock: (payload) => dispatch({ type: 'ADD_OPENING_STOCK', payload }),
      addExpense: (payload) => dispatch({ type: 'ADD_EXPENSE', payload }),
      addOffer: (payload) => dispatch({ type: 'ADD_OFFER', payload }),
      addInvestor: (payload) => dispatch({ type: 'ADD_INVESTOR', payload }),
      recordInvestorEntry: (payload) => dispatch({ type: 'RECORD_INVESTOR_ENTRY', payload }),
      saveTarget: (payload) => dispatch({ type: 'SAVE_TARGET', payload }),
      deleteTarget: (id) => dispatch({ type: 'DELETE_TARGET', payload: { id } }),
      recordSaleReturn: (payload) => dispatch({ type: 'RECORD_SALE_RETURN', payload }),
      recordPurchaseReturn: (payload) => dispatch({ type: 'RECORD_PURCHASE_RETURN', payload }),
      updateOffer: (payload) => dispatch({ type: 'UPDATE_OFFER', payload }),
      toggleOffer: (id) => dispatch({ type: 'TOGGLE_OFFER', payload: { id } }),

      recordPurchase: (purchase) => dispatch({ type: 'RECORD_PURCHASE', payload: purchase }),
      settlePurchase: (id, date = TODAY) => dispatch({ type: 'SETTLE_PURCHASE', payload: { id, date } }),
      reversePurchase: (id, date = TODAY) => dispatch({ type: 'REVERSE_PURCHASE', payload: { id, date } }),

      recordSale: (sale) => dispatch({ type: 'RECORD_SALE', payload: sale }),
      settleSale: (id, date = TODAY) => dispatch({ type: 'SETTLE_SALE', payload: { id, date } }),
      reverseSale: (id, date = TODAY) => dispatch({ type: 'REVERSE_SALE', payload: { id, date } }),

      writeOffBatch: (payload) => dispatch({ type: 'WRITE_OFF_BATCH', payload: { date: TODAY, ...payload } }),

      paySalary: (employeeId, entryDate = TODAY) =>
        dispatch({ type: 'PAY_SALARY', payload: { employeeId, entryDate } }),
    }),
    [state],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside a DataProvider')
  return context
}

export { defaultSettings }
