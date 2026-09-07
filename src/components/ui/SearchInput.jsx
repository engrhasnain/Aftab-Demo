import { Search, X } from '../icons'

export default function SearchInput({ value, onChange, placeholder = 'Search…', label, id = 'search' }) {
  return (
    <div className="w-full sm:max-w-sm">
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-base font-semibold text-slate-800">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <Search
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="field-input pl-12 pr-11"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
