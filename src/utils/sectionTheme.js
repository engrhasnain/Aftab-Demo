/**
 * Each section of the system has its own colour, and each colour means
 * something. Two rules were followed when picking them:
 *
 *   1. No two sections next to each other in the menu share a colour family,
 *      so the eye can never confuse one for its neighbour.
 *   2. There is only ONE green in the whole app — Sales — because green already
 *      means "money coming in" inside the pages. The cash box is gold instead.
 *
 * The colour is not a stripe at the top. It carries through the page: the
 * background, the header, the heading text and every card heading, so a screen
 * is recognisable before a single word is read.
 *
 * Class names are written out in full because Tailwind only keeps the classes
 * it can actually see in the source.
 */

const THEMES = {
  dashboard: {
    label: 'Dashboard',
    meaning: 'The whole business at a glance',
    page: 'bg-slate-100', header: 'bg-slate-50', bar: 'bg-brand-600',
    title: 'text-brand-900', cardHead: 'bg-brand-50/70', cardTitle: 'text-brand-900',
    nav: 'bg-brand-600', chip: 'bg-brand-100 text-brand-800', swatch: 'bg-brand-600',
  },
  suppliers: {
    label: 'Suppliers',
    meaning: 'The companies we buy from',
    page: 'bg-teal-50', header: 'bg-teal-100/60', bar: 'bg-teal-600',
    title: 'text-teal-900', cardHead: 'bg-teal-50', cardTitle: 'text-teal-900',
    nav: 'bg-teal-600', chip: 'bg-teal-100 text-teal-800', swatch: 'bg-teal-600',
  },
  products: {
    label: 'Products',
    meaning: 'Everything we sell',
    page: 'bg-violet-50', header: 'bg-violet-100/60', bar: 'bg-violet-600',
    title: 'text-violet-900', cardHead: 'bg-violet-50', cardTitle: 'text-violet-900',
    nav: 'bg-violet-600', chip: 'bg-violet-100 text-violet-800', swatch: 'bg-violet-600',
  },
  customers: {
    label: 'Customers',
    meaning: 'The shops we sell to',
    page: 'bg-orange-50', header: 'bg-orange-100/60', bar: 'bg-orange-500',
    title: 'text-orange-900', cardHead: 'bg-orange-50', cardTitle: 'text-orange-900',
    nav: 'bg-orange-600', chip: 'bg-orange-100 text-orange-900', swatch: 'bg-orange-500',
  },
  purchases: {
    label: 'Purchases',
    meaning: 'Stock coming in',
    page: 'bg-sky-50', header: 'bg-sky-100/60', bar: 'bg-sky-600',
    title: 'text-sky-900', cardHead: 'bg-sky-50', cardTitle: 'text-sky-900',
    nav: 'bg-sky-600', chip: 'bg-sky-100 text-sky-800', swatch: 'bg-sky-600',
  },
  sales: {
    label: 'Sales',
    meaning: 'Goods going out, money coming in',
    page: 'bg-green-50', header: 'bg-green-100/60', bar: 'bg-green-600',
    title: 'text-green-900', cardHead: 'bg-green-50', cardTitle: 'text-green-900',
    nav: 'bg-green-600', chip: 'bg-green-100 text-green-800', swatch: 'bg-green-600',
  },
  stock: {
    label: 'Stock',
    meaning: 'What is on the shelf',
    page: 'bg-cyan-50', header: 'bg-cyan-100/60', bar: 'bg-cyan-600',
    title: 'text-cyan-900', cardHead: 'bg-cyan-50', cardTitle: 'text-cyan-900',
    nav: 'bg-cyan-600', chip: 'bg-cyan-100 text-cyan-800', swatch: 'bg-cyan-600',
  },
  returns: { label: 'Returns', meaning: 'Goods coming back, either way',
    page: 'bg-zinc-100', header: 'bg-zinc-200/70', bar: 'bg-zinc-600',
    title: 'text-zinc-900', cardHead: 'bg-zinc-100', cardTitle: 'text-zinc-900',
    nav: 'bg-zinc-600', chip: 'bg-zinc-200 text-zinc-800', swatch: 'bg-zinc-600' },
  investors: { label: 'Investors', meaning: 'Whose money is in the business',
    page: 'bg-emerald-50', header: 'bg-emerald-100/60', bar: 'bg-emerald-700',
    title: 'text-emerald-900', cardHead: 'bg-emerald-50', cardTitle: 'text-emerald-900',
    nav: 'bg-emerald-700', chip: 'bg-emerald-100 text-emerald-800', swatch: 'bg-emerald-700' },
  targets: { label: 'Targets', meaning: 'What we are aiming for',
    page: 'bg-blue-50', header: 'bg-blue-100/60', bar: 'bg-blue-600',
    title: 'text-blue-900', cardHead: 'bg-blue-50', cardTitle: 'text-blue-900',
    nav: 'bg-blue-600', chip: 'bg-blue-100 text-blue-800', swatch: 'bg-blue-600' },
  cash: {
    label: 'Cash ledger',
    meaning: 'The cash box — gold, like money',
    page: 'bg-amber-50', header: 'bg-amber-100/60', bar: 'bg-amber-500',
    title: 'text-amber-900', cardHead: 'bg-amber-50', cardTitle: 'text-amber-900',
    nav: 'bg-amber-600', chip: 'bg-amber-100 text-amber-900', swatch: 'bg-amber-500',
  },
  moneyOwed: {
    label: 'Money owed',
    meaning: 'Money not yet settled, either way',
    page: 'bg-rose-50', header: 'bg-rose-100/60', bar: 'bg-rose-600',
    title: 'text-rose-900', cardHead: 'bg-rose-50', cardTitle: 'text-rose-900',
    nav: 'bg-rose-600', chip: 'bg-rose-100 text-rose-800', swatch: 'bg-rose-600',
  },
  offers: {
    label: 'Offers',
    meaning: 'Schemes and discounts',
    page: 'bg-fuchsia-50', header: 'bg-fuchsia-100/60', bar: 'bg-fuchsia-600',
    title: 'text-fuchsia-900', cardHead: 'bg-fuchsia-50', cardTitle: 'text-fuchsia-900',
    nav: 'bg-fuchsia-600', chip: 'bg-fuchsia-100 text-fuchsia-800', swatch: 'bg-fuchsia-600',
  },
  reports: {
    label: 'Reports',
    meaning: 'How the business is doing',
    page: 'bg-indigo-50', header: 'bg-indigo-100/60', bar: 'bg-indigo-600',
    title: 'text-indigo-900', cardHead: 'bg-indigo-50', cardTitle: 'text-indigo-900',
    nav: 'bg-indigo-600', chip: 'bg-indigo-100 text-indigo-800', swatch: 'bg-indigo-600',
  },
  employees: {
    label: 'Employees',
    meaning: 'Our own team',
    page: 'bg-purple-50', header: 'bg-purple-100/60', bar: 'bg-purple-600',
    title: 'text-purple-900', cardHead: 'bg-purple-50', cardTitle: 'text-purple-900',
    nav: 'bg-purple-600', chip: 'bg-purple-100 text-purple-800', swatch: 'bg-purple-600',
  },
  compliance: {
    label: 'Compliance',
    meaning: 'Rules and safety — the one red section',
    page: 'bg-red-50', header: 'bg-red-100/60', bar: 'bg-red-600',
    title: 'text-red-900', cardHead: 'bg-red-50', cardTitle: 'text-red-900',
    nav: 'bg-red-700', chip: 'bg-red-100 text-red-800', swatch: 'bg-red-600',
  },
  openings: {
    label: 'Openings',
    meaning: 'The starting figures',
    page: 'bg-lime-50', header: 'bg-lime-100/60', bar: 'bg-lime-600',
    title: 'text-lime-900', cardHead: 'bg-lime-50', cardTitle: 'text-lime-900',
    nav: 'bg-lime-700', chip: 'bg-lime-100 text-lime-900', swatch: 'bg-lime-600',
  },
  settings: {
    label: 'Settings',
    meaning: 'How the system behaves',
    page: 'bg-slate-100', header: 'bg-slate-200/60', bar: 'bg-slate-600',
    title: 'text-slate-900', cardHead: 'bg-slate-100', cardTitle: 'text-slate-900',
    nav: 'bg-slate-600', chip: 'bg-slate-200 text-slate-800', swatch: 'bg-slate-600',
  },
}

/** The order the colours are introduced, for the legend on Settings. */
export const SECTION_ORDER = [
  'dashboard', 'suppliers', 'products', 'customers', 'purchases', 'sales', 'stock',
  'cash', 'moneyOwed', 'offers', 'reports', 'employees', 'compliance', 'openings', 'settings',
]

/** Which section a path belongs to — detail and form pages inherit their list. */
export function sectionKeyFor(pathname = '/') {
  const path = pathname.toLowerCase()
  if (path === '/' || path.startsWith('/dashboard')) return 'dashboard'
  if (path.startsWith('/suppliers')) return 'suppliers'
  if (path.startsWith('/products')) return 'products'
  if (path.startsWith('/customers')) return 'customers'
  if (path.startsWith('/purchases')) return 'purchases'
  if (path.startsWith('/sales')) return 'sales'
  if (path.startsWith('/returns')) return 'returns'
  if (path.startsWith('/investors')) return 'investors'
  if (path.startsWith('/targets')) return 'targets'
  if (path.startsWith('/stock')) return 'stock'
  if (path.startsWith('/cash')) return 'cash'
  if (path.startsWith('/money-owed')) return 'moneyOwed'
  if (path.startsWith('/offers')) return 'offers'
  if (path.startsWith('/expenses')) return 'expenses'
  if (path.startsWith('/reports')) return 'reports'
  if (path.startsWith('/employees')) return 'employees'
  if (path.startsWith('/compliance')) return 'compliance'
  if (path.startsWith('/openings')) return 'openings'
  if (path.startsWith('/settings')) return 'settings'
  return 'dashboard'
}

/* Expenses shares the "money going out" idea with Purchases, but needs its own
   colour so the two are never mistaken for one another. */
THEMES.expenses = {
  label: 'Expenses',
  meaning: 'Money going out that is not stock',
  page: 'bg-stone-100', header: 'bg-stone-200/70', bar: 'bg-stone-600',
  title: 'text-stone-900', cardHead: 'bg-stone-100', cardTitle: 'text-stone-900',
  nav: 'bg-stone-600', chip: 'bg-stone-200 text-stone-800', swatch: 'bg-stone-600',
}
SECTION_ORDER.splice(SECTION_ORDER.indexOf('offers') + 1, 0, 'expenses')
SECTION_ORDER.splice(SECTION_ORDER.indexOf('stock'), 0, 'returns')
SECTION_ORDER.splice(SECTION_ORDER.indexOf('employees'), 0, 'investors', 'targets')

export const themeForKey = (key) => THEMES[key] || THEMES.dashboard
export const sectionTheme = (pathname) => themeForKey(sectionKeyFor(pathname))

export default THEMES
