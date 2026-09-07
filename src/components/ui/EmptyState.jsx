import { Inbox } from '../icons'

/**
 * Never show a bare empty table — say what is missing and give the one button
 * that fixes it.
 */
export default function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={32} aria-hidden="true" />
      </span>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      {message ? <p className="mt-2 max-w-md text-base text-slate-600">{message}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
