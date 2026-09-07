import { useEffect } from 'react'
import { AlertTriangle } from '../icons'
import Button from './Button'

/**
 * A plain, wordy confirm step. Used before anything that moves money so the
 * user always gets a chance to read what is about to happen.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = 'Yes, continue',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-lg rounded-2xl bg-white p-7 shadow-xl"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle size={26} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-xl font-bold text-slate-900">
              {title}
            </h2>
            {message ? <p className="mt-2 text-base text-slate-700">{message}</p> : null}
            {detail ? (
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-base text-slate-700">{detail}</div>
            ) : null}
          </div>
        </div>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
