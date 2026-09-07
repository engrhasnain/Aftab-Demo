import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Info, X } from './icons'

/**
 * Nothing in this app changes silently. Every add / record / payment fires a
 * toast so the user can see that their click did something.
 */

const ToastContext = createContext(null)

const TONES = {
  success: { wrap: 'border-emerald-300 bg-emerald-50', icon: 'text-emerald-600', Icon: CheckCircle2 },
  info: { wrap: 'border-sky-300 bg-sky-50', icon: 'text-sky-600', Icon: Info },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (title, options = {}) => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, title, message: options.message, tone: options.tone || 'success' }])
      window.setTimeout(() => dismiss(id), options.duration || 5000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] || TONES.success
          const Icon = tone.Icon
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border-2 ${tone.wrap} p-4 shadow-lg`}
            >
              <Icon size={24} className={`mt-0.5 shrink-0 ${tone.icon}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-slate-900">{toast.title}</p>
                {toast.message ? <p className="mt-0.5 text-base text-slate-700">{toast.message}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-white/70 hover:text-slate-800"
                aria-label="Dismiss message"
              >
                <X size={18} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside a ToastProvider')
  return context
}
