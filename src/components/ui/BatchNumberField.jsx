import { CircleAlert, PackagePlus, PackageCheck } from '../icons'
import { TextInput } from './Field'
import { formatDate } from '../../utils/format'

/**
 * A batch number that tells you whether it already exists.
 *
 * Batch numbers are free text, so typing "BCW-2506" one day and "BCW 2506" the
 * next silently creates two batches of the same physical stock. That is
 * invisible until the numbers stop matching the warehouse. Here, existing
 * batches are offered as suggestions, and the field says out loud whether you
 * are adding to a batch or opening a new one.
 */
export default function BatchNumberField({ id, value, onChange, error, existingBatches, disabled }) {
  const typed = value.trim()
  const match = typed
    ? existingBatches.find((batch) => batch.batchNumber.toLowerCase() === typed.toLowerCase())
    : null

  // A near-miss: same characters ignoring spaces, dashes and case.
  const loose = (text) => text.toLowerCase().replace(/[\s-_]/g, '')
  const nearMiss =
    typed && !match ? existingBatches.find((batch) => loose(batch.batchNumber) === loose(typed)) : null

  const listId = `${id}-suggestions`

  return (
    <div className="space-y-2">
      <TextInput
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        placeholder="e.g. BCW-2506"
        autoComplete="off"
        list={existingBatches.length ? listId : undefined}
        disabled={disabled}
      />
      {existingBatches.length ? (
        <datalist id={listId}>
          {existingBatches.map((batch) => (
            <option key={batch.id} value={batch.batchNumber} />
          ))}
        </datalist>
      ) : null}

      {nearMiss ? (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Did you mean <b>{nearMiss.batchNumber}</b>? This spelling would open a separate batch.
          </span>
        </p>
      ) : match ? (
        <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
          <PackageCheck size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Adding to the existing batch — {match.qtyOnHand} on hand, expires {formatDate(match.expiryDate)}.
          </span>
        </p>
      ) : typed ? (
        <p className="flex items-start gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
          <PackagePlus size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>This will open a new batch.</span>
        </p>
      ) : null}
    </div>
  )
}
