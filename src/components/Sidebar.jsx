import { NavLink } from 'react-router-dom'
import {
  ChartColumn,
  ChartColumnSolid,
  Cog,
  CogSolid,
  Coins,
  CoinsSolid,
  Dashboard,
  DashboardSolid,
  HandCoins,
  HandCoinsSolid,
  Investors,
  InvestorsSolid,
  Offer,
  OfferSolid,
  Openings,
  OpeningsSolid,
  Package,
  PackageSolid,
  PanelCollapse,
  PanelExpand,
  Returns,
  ReturnsSolid,
  Shield,
  ShieldSolid,
  ShoppingBag,
  ShoppingBagSolid,
  ShoppingCart,
  ShoppingCartSolid,
  Store,
  StoreSolid,
  Target,
  TargetSolid,
  Truck,
  TruckSolid,
  Users,
  UsersSolid,
  Wallet,
  WalletSolid,
  Warehouse,
  WarehouseSolid,
  X,
} from './icons'
import logoLight from '../assets/raso-logo-light.png'
import markLight from '../assets/raso-mark-light.png'
import { formatDate, TODAY } from '../utils/format'
import { useT } from '../i18n'
import { themeForKey } from '../utils/sectionTheme'

/* Each item carries both weights: the outline when resting, the solid one for
   the page you are on. That makes the current page obvious at a glance rather
   than leaving the highlight to do all the work. */
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', labelKey: 'nav.dashboard', section: 'dashboard', icon: Dashboard, iconSolid: DashboardSolid, end: true },
  { to: '/suppliers', label: 'Suppliers', labelKey: 'nav.suppliers', section: 'suppliers', icon: Truck, iconSolid: TruckSolid },
  { to: '/products', label: 'Products', labelKey: 'nav.products', section: 'products', icon: Package, iconSolid: PackageSolid },
  { to: '/customers', label: 'Customers', labelKey: 'nav.customers', section: 'customers', icon: Store, iconSolid: StoreSolid },
  { to: '/purchases', label: 'Purchases', labelKey: 'nav.purchases', section: 'purchases', icon: ShoppingCart, iconSolid: ShoppingCartSolid },
  { to: '/sales', label: 'Sales', labelKey: 'nav.sales', section: 'sales', icon: ShoppingBag, iconSolid: ShoppingBagSolid },
  { to: '/returns', label: 'Returns', labelKey: 'nav.returns', section: 'returns', icon: Returns, iconSolid: ReturnsSolid },
  { to: '/stock', label: 'Stock', labelKey: 'nav.stock', section: 'stock', icon: Warehouse, iconSolid: WarehouseSolid },
  { to: '/cash', label: 'Cash ledger', labelKey: 'nav.cash', section: 'cash', icon: Wallet, iconSolid: WalletSolid },
  { to: '/money-owed', label: 'Money owed', labelKey: 'nav.moneyOwed', section: 'moneyOwed', icon: HandCoins, iconSolid: HandCoinsSolid },
  { to: '/expenses', label: 'Expenses', labelKey: 'nav.expenses', section: 'expenses', icon: Coins, iconSolid: CoinsSolid },
  { to: '/offers', label: 'Offers', labelKey: 'nav.offers', section: 'offers', icon: Offer, iconSolid: OfferSolid },
  { to: '/reports', label: 'Reports', labelKey: 'nav.reports', section: 'reports', icon: ChartColumn, iconSolid: ChartColumnSolid },
  { to: '/investors', label: 'Investors', labelKey: 'nav.investors', section: 'investors', icon: Investors, iconSolid: InvestorsSolid },
  { to: '/targets', label: 'Targets', labelKey: 'nav.targets', section: 'targets', icon: Target, iconSolid: TargetSolid },
  { to: '/employees', label: 'Employees', labelKey: 'nav.employees', section: 'employees', icon: Users, iconSolid: UsersSolid },
  { to: '/compliance', label: 'Compliance', labelKey: 'nav.compliance', section: 'compliance', icon: Shield, iconSolid: ShieldSolid },
  { to: '/openings', label: 'Openings', labelKey: 'nav.openings', section: 'openings', icon: Openings, iconSolid: OpeningsSolid },
  { to: '/settings', label: 'Settings', labelKey: 'nav.settings', section: 'settings', icon: Cog, iconSolid: CogSolid },
]

export default function Sidebar({ collapsed = false, onToggleCollapse, onNavigate, onClose }) {
  const { t } = useT()
  return (
    <div className="flex h-full flex-col bg-brand-900 text-brand-100">
      <div
        className={`flex items-center gap-3 border-b border-brand-800 py-6 ${
          collapsed ? 'flex-col px-3' : 'justify-between px-5'
        }`}
      >
        <img
          src={collapsed ? markLight : logoLight}
          alt="Raso Pakistan"
          className={collapsed ? 'h-9 w-9 object-contain' : 'h-12 w-auto'}
        />

        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? t('action.openMenu') : t('action.closeMenu')}
            title={collapsed ? t('action.openMenu') : t('action.closeMenu')}
            className="hidden rounded-lg p-2 text-brand-200 transition hover:bg-brand-800 hover:text-white lg:block"
          >
            {collapsed ? <PanelExpand size={22} /> : <PanelCollapse size={22} />}
          </button>
        ) : null}

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-200 hover:bg-brand-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        ) : null}
      </div>

      <nav
        className={`flex-1 space-y-1.5 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'}`}
        aria-label="Main"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? t(item.labelKey, item.label) : undefined}
            className={({ isActive }) =>
              [
                'group relative flex items-center rounded-xl text-base font-semibold transition',
                collapsed ? 'justify-center py-3.5' : 'gap-3.5 px-4 py-3.5',
                isActive
                  ? `${themeForKey(item.section).nav} text-white shadow-sm`
                  : 'text-brand-200 hover:bg-brand-800 hover:text-white',
              ].join(' ')
            }
          >
            {({ isActive }) => {
              const Icon = isActive ? item.iconSolid : item.icon
              return (
                <>
                  <Icon size={22} aria-hidden="true" />
                  {collapsed ? (
                    <span className="sr-only">{t(item.labelKey, item.label)}</span>
                  ) : (
                    <span className="truncate">{t(item.labelKey, item.label)}</span>
                  )}
                  {!collapsed && isActive ? (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
                  ) : null}

                  {/* While the menu is closed the name appears on hover, so a
                      rail of icons never becomes a guessing game. */}
                  {collapsed ? (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white shadow-lg group-hover:block group-focus-visible:block"
                    >
                      {t(item.labelKey, item.label)}
                    </span>
                  ) : null}
                </>
              )
            }}
          </NavLink>
        ))}
      </nav>

      {collapsed ? null : (
        <div className="border-t border-brand-800 px-5 py-5 text-sm text-brand-300">
          <p className="font-semibold text-brand-200">{t('shell.demoTitle')}</p>
          <p className="mt-1">{t('shell.asOf')} {formatDate(TODAY)}.</p>
          <p className="mt-1">{t('shell.resetNote')}</p>
        </div>
      )}
    </div>
  )
}
