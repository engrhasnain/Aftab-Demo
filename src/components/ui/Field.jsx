import { AlertCircle } from '../icons'

/**
 * Every field is a stacked label / control / hint / error block. Labels are
 * always visible above the control — never placeholder-only — and forms stay
 * single column so there is only ever one thing to fill in next.
 */

export function Field({ label, htmlFor, hint, error, required, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-base font-semibold text-slate-800">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      {hint ? <p className="mb-2 text-sm text-slate-500">{hint}</p> : null}
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-red-700">
          <AlertCircle size={16} aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextInput({ error, className = '', ...rest }) {
  return <input type="text" className={`field-input ${error ? 'field-input-error' : ''} ${className}`} {...rest} />
}

export function NumberInput({ error, className = '', ...rest }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      className={`field-input ${error ? 'field-input-error' : ''} ${className}`}
      {...rest}
    />
  )
}

export function DateInput({ error, className = '', ...rest }) {
  return <input type="date" className={`field-input ${error ? 'field-input-error' : ''} ${className}`} {...rest} />
}

export function Select({ error, className = '', children, ...rest }) {
  return (
    <select className={`field-input pr-10 ${error ? 'field-input-error' : ''} ${className}`} {...rest}>
      {children}
    </select>
  )
}

export function FormActions({ children }) {
  return <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">{children}</div>
}

export function InlineNote({ children, icon: Icon }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-base text-sky-900">
      {Icon ? <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" /> : null}
      <span>{children}</span>
    </p>
  )
}
