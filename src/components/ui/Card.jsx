import { useSectionThemeCtx } from '../SectionTheme'

export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  // Every card heading is tinted with the colour of the section it sits in, so
  // the colour runs through the page rather than sitting in a stripe on top.
  const theme = useSectionThemeCtx()
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 ${theme.cardHead}`}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${theme.bar}`}>
            <Icon size={22} aria-hidden="true" />
          </span>
        ) : null}
        <div>
          <h2 className={`text-xl font-bold ${theme.cardTitle}`}>{title}</h2>
          {subtitle ? <p className="mt-1 text-base text-slate-600">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>
}
