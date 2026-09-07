/**
 * Payroll maths — one place, so the seed data, the store and the screens can
 * never disagree about what a person is owed.
 *
 * A month's pay is built from three kinds of record:
 *
 *   adjustment — changes what is owed for the month. Positive for overtime or a
 *                bonus, negative for days not worked.
 *   advance    — money handed over before payday. It leaves the cash box on the
 *                day it is given and is taken back out of a later payment.
 *   salary     — a payment against the month's dues. `amount` is how much of
 *                those dues it clears; `advanceRecovered` is the part of that
 *                taken back against an outstanding advance instead of being
 *                handed over. Cash leaving = amount - advanceRecovered.
 *
 * Splitting "what it clears" from "what was handed over" is what lets an
 * advance be recovered without the month looking underpaid, and lets a month be
 * settled in instalments — which is how most of this trade actually runs.
 */

/* Deliberately no imports.
 *
 * The seed data works out its own cash entries from these functions while it is
 * still being built, and `format.js` reads the reference date back out of that
 * same seed file. Importing rounding from there would close that loop and leave
 * this module holding a half-built one. `tax.js` keeps its own `round2` for the
 * same reason. */
const roundMoney = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100

export const PAYROLL_KINDS = ['adjustment', 'advance', 'salary']

/** The month a date falls in, as the '2025-06' key payroll is filed under. */
export const monthOf = (iso) => String(iso).slice(0, 7)

/** How much cash actually leaves the box for one payroll record. */
export function cashOutForPayroll(record) {
  if (!record) return 0
  if (record.kind === 'advance') return roundMoney(record.amount)
  if (record.kind === 'salary') return roundMoney(record.amount - (record.advanceRecovered || 0))
  return 0
}

/**
 * What one person is owed for one month, and how much of it is settled.
 *
 * `base` is their salary as it stands today. Somebody who had already left
 * before the month began is owed nothing for it, which is what keeps a former
 * employee out of the wage bill without deleting them.
 */
export function payrollFor(employee, records, month) {
  const rows = (records || []).filter((r) => r.employeeId === employee.id && r.month === month)

  const left = employee.status === 'left' && employee.leftDate && employee.leftDate < month + '-01'
  const base = left ? 0 : roundMoney(employee.monthlySalary)

  const adjustments = roundMoney(
    rows.filter((r) => r.kind === 'adjustment').reduce((total, r) => total + r.amount, 0),
  )
  const settled = roundMoney(
    rows.filter((r) => r.kind === 'salary').reduce((total, r) => total + r.amount, 0),
  )
  const paidInCash = roundMoney(
    rows.filter((r) => r.kind === 'salary').reduce((total, r) => total + cashOutForPayroll(r), 0),
  )

  const gross = roundMoney(base + adjustments)
  const outstanding = roundMoney(gross - settled)

  return {
    month,
    base,
    adjustments,
    gross,
    settled,
    paidInCash,
    outstanding,
    /* Three states rather than paid/unpaid, because part payment is normal. */
    state: settled <= 0 ? 'unpaid' : outstanding > 0.005 ? 'part' : 'paid',
    rows,
  }
}

/**
 * Advances handed over but not yet taken back — across every month, because an
 * advance given in May is usually recovered from June.
 */
export function advanceOutstanding(employeeId, records) {
  const rows = (records || []).filter((r) => r.employeeId === employeeId)
  const given = rows.filter((r) => r.kind === 'advance').reduce((total, r) => total + r.amount, 0)
  const taken = rows.reduce((total, r) => total + (r.advanceRecovered || 0), 0)
  return roundMoney(given - taken)
}

/** Everyone still on the books. A person who has left is not a wage any more. */
export const activeEmployees = (employees) => (employees || []).filter((e) => e.status !== 'left')

/** The monthly wage bill — what the active team costs before any adjustment. */
export const wageBill = (employees) =>
  roundMoney(activeEmployees(employees).reduce((total, e) => total + e.monthlySalary, 0))

/**
 * Why a payment cannot go through, or null when it can.
 *
 * The screen already hides the button in most of these cases; this is the check
 * underneath it, so the rule holds even if the same person is opened twice or a
 * later version of this puts two clerks on the same screen.
 */
export function payrollProblem({ employee, records, month, kind, amount, advanceRecovered = 0 }) {
  if (!employee) return 'That employee no longer exists.'
  if (employee.status === 'left' && kind !== 'adjustment') {
    return `${employee.name} has left, so no further payment can be recorded.`
  }
  if (!(Number(amount) > 0) && kind !== 'adjustment') return 'Enter an amount greater than zero.'
  if (kind === 'adjustment' && !Number(amount)) return 'Enter an amount to add or take off.'

  if (kind === 'salary') {
    const { outstanding } = payrollFor(employee, records, month)
    if (outstanding <= 0) return `${employee.name} has already been paid in full for this month.`
    if (roundMoney(amount) > outstanding) {
      return `That is more than the ${outstanding.toLocaleString('en-IN')} still owed for this month.`
    }
    const held = advanceOutstanding(employee.id, records)
    if (roundMoney(advanceRecovered) > held) {
      return `Only ${held.toLocaleString('en-IN')} of advance is outstanding to take back.`
    }
    if (roundMoney(advanceRecovered) > roundMoney(amount)) {
      return 'The advance taken back cannot be more than the payment itself.'
    }
  }

  return null
}
