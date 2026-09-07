/**
 * Sales tax.
 *
 * Nothing about tax is hardcoded. How tax is worked out is a setting the
 * business chooses, the rate is a setting, and each product can carry its own
 * rate or be marked not taxable at all — because in the same catalogue some
 * items are taxed and some are not, and that can change with the budget.
 *
 * A sale line can also override the product's default, since the same product
 * can go out taxed on one invoice and untaxed on another.
 */

export const TAX_MODES = [
  {
    id: 'exclusive-mrp',
    labelKey: 'tax.exclusive-mrp',
    helpKey: 'tax.exclusive-mrp.help',
    label: 'Added on top of MRP',
    help: 'Tax is worked out on the MRP and added to the bill. The customer pays MRP plus tax.',
  },
  {
    id: 'inclusive-mrp',
    labelKey: 'tax.inclusive-mrp',
    helpKey: 'tax.inclusive-mrp.help',
    label: 'Already included in MRP',
    help: 'The printed MRP is the final price. Tax is taken out of it and shown separately on the bill.',
  },
  {
    id: 'on-rate',
    labelKey: 'tax.on-rate',
    helpKey: 'tax.on-rate.help',
    label: 'On the rate actually charged',
    help: 'Tax is worked out on the price you actually sold at, not on the MRP.',
  },
  {
    id: 'none',
    labelKey: 'tax.none',
    helpKey: 'tax.none.help',
    label: 'No sales tax',
    help: 'Sales tax is switched off everywhere.',
  },
]

export const isTaxMode = (id) => TAX_MODES.some((mode) => mode.id === id)
export const taxModeLabel = (id) => (TAX_MODES.find((mode) => mode.id === id) || {}).label || 'No sales tax'

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

/**
 * Works out one sale line.
 *
 * line: { qty, bonusQty, unitPrice, mrp, taxable, taxPercent }
 * settings: { taxMode, defaultTaxPercent }
 *
 * Bonus (free) units carry no value and no tax — they are goods given away,
 * so they leave stock but never appear in the money.
 */
export function calcLine(line, settings) {
  const qty = Number(line.qty) || 0
  const bonusQty = Number(line.bonusQty) || 0
  const unitPrice = Number(line.unitPrice) || 0
  const mrp = Number(line.mrp) || 0

  const value = round2(qty * unitPrice)
  const mode = settings.taxMode || 'none'
  const rate = line.taxable === false ? 0 : Number(line.taxPercent ?? settings.defaultTaxPercent ?? 0)

  let taxBase = 0
  let taxAmount = 0
  let lineTotal = value

  if (mode !== 'none' && rate > 0 && qty > 0) {
    if (mode === 'exclusive-mrp') {
      taxBase = round2(qty * mrp)
      taxAmount = round2((taxBase * rate) / 100)
      lineTotal = round2(value + taxAmount)
    } else if (mode === 'inclusive-mrp') {
      // The printed price already contains the tax, so pull it back out.
      taxBase = round2(qty * mrp)
      taxAmount = round2((taxBase * rate) / (100 + rate))
      lineTotal = value
    } else if (mode === 'on-rate') {
      taxBase = value
      taxAmount = round2((taxBase * rate) / 100)
      lineTotal = round2(value + taxAmount)
    }
  }

  return {
    qty,
    bonusQty,
    deliveredQty: qty + bonusQty,
    unitPrice,
    value,
    taxRate: rate,
    taxBase,
    taxAmount,
    lineTotal,
  }
}

/**
 * Adds up already-calculated lines into invoice totals.
 *
 * `buyer` carries the customer's tax status. Supplies to a buyer who is not on
 * the tax roll attract an extra percentage — "further tax" — which is why the
 * filer / non-filer flag has to be more than a label on the invoice. Whether it
 * applies at all, and at what rate, is a setting.
 */
export function calcTotals(lines, options = {}) {
  const subtotal = round2(lines.reduce((t, l) => t + l.value, 0))
  const taxTotal = round2(lines.reduce((t, l) => t + l.taxAmount, 0))
  const linesTotal = round2(lines.reduce((t, l) => t + l.lineTotal, 0))

  const { taxStatus, furtherTaxEnabled, furtherTaxPercent } = options
  const rate = Number(furtherTaxPercent) || 0
  const applies = Boolean(furtherTaxEnabled) && rate > 0 && taxStatus === 'non-filer'
  const furtherTax = applies ? round2((subtotal * rate) / 100) : 0

  return {
    subtotal,
    taxTotal,
    furtherTax,
    furtherTaxPercent: applies ? rate : 0,
    grandTotal: round2(linesTotal + furtherTax),
    // On an inclusive bill the tax sits inside the subtotal rather than on top.
    taxIsInsideTotal: round2(subtotal + taxTotal) !== linesTotal,
  }
}

/**
 * Free units earned on a quantity, e.g. "buy 10 get 1 free".
 * Whole schemes only — 25 units on a buy-10-get-1 earns 2, not 2.5.
 */
export function bonusFor(scheme, qty) {
  if (!scheme || !scheme.buyQty || !scheme.freeQty) return 0
  const buy = Number(scheme.buyQty)
  const free = Number(scheme.freeQty)
  const n = Number(qty) || 0
  if (buy <= 0 || free <= 0 || n < buy) return 0
  return Math.floor(n / buy) * free
}

export const describeScheme = (scheme) =>
  scheme && scheme.buyQty && scheme.freeQty ? `Buy ${scheme.buyQty} get ${scheme.freeQty} free` : null

/* ---------------------------------------------------------------- */
/* Offers                                                            */
/* ---------------------------------------------------------------- */

export const OFFER_TYPES = [
  { id: 'bonus', label: 'Free goods', help: 'Buy a quantity, get some free — e.g. buy 10 get 2 free.' },
  { id: 'discount-percent', label: 'Percentage off', help: 'A percentage off the price, e.g. 5% off.' },
  { id: 'discount-amount', label: 'Amount off each unit', help: 'A fixed sum off every unit sold.' },
]

/** Where an offer stands against a date: running, not started, or finished. */
export function offerStatus(offer, today) {
  if (!offer.active) return { state: 'off', label: 'Switched off', tone: 'slate' }
  if (offer.startDate && today < offer.startDate) return { state: 'upcoming', label: 'Starts later', tone: 'blue' }
  if (offer.endDate && today > offer.endDate) return { state: 'finished', label: 'Finished', tone: 'slate' }
  return { state: 'running', label: 'Running now', tone: 'green' }
}

export const isOfferLive = (offer, today) => offerStatus(offer, today).state === 'running'

/** A one-line summary a non-technical reader understands immediately. */
export function describeOffer(offer) {
  if (!offer) return null
  if (offer.type === 'bonus') return `Buy ${offer.buyQty} get ${offer.freeQty} free`
  if (offer.type === 'discount-percent') return `${offer.percent}% off`
  if (offer.type === 'discount-amount') return `Rs ${offer.amount} off each unit`
  return null
}

/** Free units earned under an offer. */
export function offerBonus(offer, qty) {
  if (!offer || offer.type !== 'bonus') return 0
  return bonusFor({ buyQty: offer.buyQty, freeQty: offer.freeQty }, qty)
}

/** The price after an offer's discount, if it has one. */
export function offerPrice(offer, unitPrice) {
  const price = Number(unitPrice) || 0
  if (!offer) return price
  if (offer.type === 'discount-percent') return round2(price - (price * Number(offer.percent)) / 100)
  if (offer.type === 'discount-amount') return round2(Math.max(0, price - Number(offer.amount)))
  return price
}
