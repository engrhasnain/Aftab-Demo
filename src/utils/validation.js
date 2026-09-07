/**
 * Plain-language validation helpers. Messages are written the way you would
 * say them out loud, not as field codes, because the people using this app are
 * not software people.
 */

/** Money / percentage style fields: must be a real number, never negative. */
export function numberError(value, label, { allowZero = false, max } = {}) {
  if (String(value).trim() === '') return `Please enter ${label}.`
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return `${label} must be a number.`
  if (parsed < 0) return `${label} cannot be a negative number.`
  if (!allowZero && parsed === 0) return `${label} must be more than zero.`
  if (max !== undefined && parsed > max) return `${label} cannot be more than ${max}.`
  return null
}

/** Quantity style fields: whole units only. */
export function quantityError(value, label = 'a quantity', { max, maxMessage } = {}) {
  if (String(value).trim() === '') return `Please enter ${label}.`
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return `${label} must be a number.`
  if (!Number.isInteger(parsed)) return `${label} must be a whole number.`
  if (parsed <= 0) return `${label} must be more than zero.`
  if (max !== undefined && parsed > max) return maxMessage || `Only ${max} available.`
  return null
}

/** Drops empty entries so `Object.keys(errors).length` is a real error count. */
export function compactErrors(candidate) {
  return Object.fromEntries(Object.entries(candidate).filter(([, message]) => Boolean(message)))
}
