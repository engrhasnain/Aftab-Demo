import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from '../icons'

/**
 * A picker you can type into.
 *
 * A plain dropdown is fine for eight suppliers and unusable for three hundred
 * products, and scrolling a long native list is one of the harder things to ask
 * of someone who is not confident with a mouse. This shows the current choice on
 * a big button, and opens a panel with a search box at the top.
 *
 * options: [{ value, label, hint, disabled, disabledReason }]
 */
export default function ComboBox({
  id,
  value,
  onChange,
  options,
  placeholder = 'Choose…',
  searchPlaceholder = 'Type to search…',
  error,
  disabled,
  emptyText = 'Nothing matches that search.',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const selected = options.find((option) => option.value === value) || null

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        (option.hint || '').toLowerCase().includes(term),
    )
  }, [options, query])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus()
    if (!open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  useEffect(() => {
    const node = listRef.current?.querySelector('[data-active="true"]')
    if (node) node.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, filtered.length])

  function choose(option) {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => {
        if (!filtered.length) return 0
        let next = current
        for (let i = 0; i < filtered.length; i++) {
          next = (next + step + filtered.length) % filtered.length
          if (!filtered[next].disabled) break
        }
        return next
      })
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const option = filtered[activeIndex]
      if (option) choose(option)
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`field-input flex items-center justify-between gap-3 text-left ${
          error ? 'field-input-error' : ''
        } ${open ? 'border-brand-600 ring-4 ring-brand-500/20' : ''}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected ? selected.label : placeholder}
          {selected && selected.hint ? (
            <span className="ml-2 text-slate-500">{selected.hint}</span>
          ) : null}
        </span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-xl">
          <div className="relative border-b border-slate-200 p-2">
            <Search
              size={18}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border-2 border-slate-200 py-2.5 pl-10 pr-9 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <ul ref={listRef} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-5 text-center text-base text-slate-500">{emptyText}</li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value
                const isActive = index === activeIndex
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-active={isActive}
                      disabled={option.disabled}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(option)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left text-base transition ${
                        option.disabled
                          ? 'cursor-not-allowed text-slate-400'
                          : isActive
                            ? 'bg-brand-50 text-slate-900'
                            : 'text-slate-800'
                      }`}
                    >
                      <Check
                        size={18}
                        className={`mt-1 shrink-0 ${isSelected ? 'text-brand-600' : 'text-transparent'}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold leading-snug">{option.label}</span>
                        {option.hint ? (
                          <span className="block text-sm text-slate-500">{option.hint}</span>
                        ) : null}
                        {option.disabled && option.disabledReason ? (
                          <span className="block text-sm font-semibold text-red-700">
                            {option.disabledReason}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
