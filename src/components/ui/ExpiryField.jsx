import { DateInput } from './Field'
import { addMonths, formatDate } from '../../utils/format'

const PRESETS = [
  { months: 6, label: '+6 months' },
  { months: 12, label: '+1 year' },
  { months: 24, label: '+2 years' },
]

/**
 * An expiry date with shortcuts.
 *
 * Typing dd/mm/yyyy or clicking a calendar eighteen months forward is one of the
 * most reliably failed interactions for people who are not confident with
 * computers, and this form asks for it on every single line. Stock expires a
 * round number of months out far more often than not, so the common cases get a
 * button.
 */
export default function ExpiryField({ id, value, onChange, from, error, disabled }) {
  const base = from || new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-2.5">
      <DateInput
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        disabled={disabled}
        min={base}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-500">Or set it quickly:</span>
        {PRESETS.map((preset) => {
          const target = addMonths(base, preset.months)
          const isActive = value === target
          return (
            <button
              key={preset.months}
              type="button"
              disabled={disabled}
              onClick={() => onChange(target)}
              className={`rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
      {value ? (
        <p className="text-sm font-medium text-slate-600">This batch expires on {formatDate(value)}.</p>
      ) : null}
    </div>
  )
}
