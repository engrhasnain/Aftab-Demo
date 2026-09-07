import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from './icons'
import { useData } from '../context/DataContext'
import { globalSearch } from '../utils/selectors'

const KIND_TONES = {
  Supplier: 'bg-brand-100 text-brand-800',
  Customer: 'bg-emerald-100 text-emerald-800',
  Product: 'bg-gold-100 text-gold-700',
  Batch: 'bg-slate-200 text-slate-700',
  Employee: 'bg-sky-100 text-sky-800',
}

/**
 * One box that looks everywhere.
 *
 * Without it you can only find something if you already know which screen it
 * lives on — so somebody holding a carton with a batch code on it, or a phone
 * number, has nowhere to start.
 */
export default function GlobalSearch() {
  const data = useData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const results = globalSearch(data, query)

  useEffect(() => {
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  function go(hit) {
    setQuery('')
    setOpen(false)
    navigate(hit.to)
  }

  return (
    <div className="relative w-full sm:w-72" ref={wrapRef}>
      <label htmlFor="global-search" className="sr-only">
        Search everything
      </label>
      <Search
        size={19}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        id="global-search"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
          if (event.key === 'Enter' && results.length) go(results[0])
        }}
        placeholder="Search anything…"
        className="w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-9 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('')
            setOpen(false)
          }}
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      ) : null}

      {open && query.trim().length >= 2 ? (
        <div className="absolute right-0 z-40 mt-2 w-full min-w-[20rem] overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-xl">
          {results.length === 0 ? (
            <p className="px-4 py-5 text-center text-base text-slate-500">
              Nothing found for “{query.trim()}”.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((hit) => (
                <li key={hit.kind + hit.id}>
                  <button
                    type="button"
                    onClick={() => go(hit)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-brand-50"
                  >
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        KIND_TONES[hit.kind] || KIND_TONES.Batch
                      }`}
                    >
                      {hit.kind}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-slate-900">{hit.label}</span>
                      {hit.hint ? <span className="block truncate text-sm text-slate-500">{hit.hint}</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
