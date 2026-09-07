import { useEffect, useRef } from 'react'
import { AlertCircle } from '../icons'

/**
 * A list of everything that still needs fixing, at the TOP of the form.
 *
 * The forms in this app can run two or three screens long, so marking the bad
 * box in red is not enough — it is usually scrolled out of sight, and what the
 * user experiences is "I pressed Save and nothing happened". This panel appears
 * where they are looking, scrolls itself into view, and every line jumps to the
 * field it is about.
 *
 * problems: [{ id, message }] where id is the id of the field to jump to.
 */
export default function ErrorSummary({ problems }) {
  const ref = useRef(null)

  useEffect(() => {
    if (problems.length && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ref.current.focus()
    }
  }, [problems])

  if (!problems.length) return null

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded-2xl border-2 border-red-300 bg-red-50 p-5 outline-none"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={24} className="mt-0.5 shrink-0 text-red-700" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-red-900">
            {problems.length === 1
              ? 'One thing needs your attention'
              : `${problems.length} things need your attention`}
          </h2>
          <p className="mt-0.5 text-base text-red-800">
            Nothing has been saved yet. Click any line below to jump straight to it.
          </p>
          <ul className="mt-3 space-y-1.5">
            {problems.map((problem) => (
              <li key={problem.id}>
                <button
                  type="button"
                  onClick={() => focusField(problem.id)}
                  className="text-left text-base font-semibold text-red-800 underline decoration-red-400 underline-offset-2 hover:text-red-900 hover:decoration-red-700"
                >
                  {problem.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/** Scrolls a field into the middle of the screen and puts the cursor in it. */
export function focusField(id) {
  const node = document.getElementById(id)
  if (!node) return
  node.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => {
    try {
      node.focus({ preventScroll: true })
    } catch {
      node.focus()
    }
  }, 250)
}
