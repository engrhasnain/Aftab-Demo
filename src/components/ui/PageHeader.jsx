import { ArrowLeft } from '../icons'
import { Link, useLocation } from 'react-router-dom'
import GlobalSearch from '../GlobalSearch'
import { sectionTheme } from '../../utils/sectionTheme'

/**
 * The sticky bar at the top of every screen: page title on the left, one
 * search box that reaches the whole app, and the screen's primary action.
 */
export default function PageHeader({ title, subtitle, action, back, hideSearch = false }) {
  const theme = sectionTheme(useLocation().pathname)
  return (
    <header className={`sticky top-0 z-20 border-b border-slate-200 backdrop-blur ${theme.header}`}>
      <div className={`h-2 w-full ${theme.bar}`} aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="min-w-0 flex-1">
          {back ? (
            <Link
              to={back.to}
              className="mb-2 inline-flex items-center gap-1.5 rounded-lg text-base font-semibold text-brand-700 hover:text-brand-800 hover:underline"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              {back.label}
            </Link>
          ) : null}
          <h1 className={`truncate text-2xl font-extrabold tracking-tight sm:text-3xl ${theme.title}`}>
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-base text-slate-600">{subtitle}</p> : null}
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
          {hideSearch ? null : <GlobalSearch />}
          {action ? <div className="flex shrink-0 flex-wrap gap-3">{action}</div> : null}
        </div>
      </div>
    </header>
  )
}
