/**
 * The app's icon vocabulary — one file, one place to change.
 *
 * Every screen imports its icons from here rather than straight from the icon
 * package, so the whole set can be swapped without touching a single screen.
 * The names are the app's own words for things ("Truck", "Wallet"), not the
 * package's, which is what makes that swap possible.
 *
 * Drawn from Remix Icon, a designed set with matching line and solid weights.
 * Solid variants are used for the active item in the sidebar and nowhere else.
 */

export {
  /* ---- navigation ---- */
  RiDashboardLine as Dashboard,
  RiDashboardFill as DashboardSolid,
  RiTruckLine as Truck,
  RiTruckFill as TruckSolid,
  RiBox3Line as Package,
  RiBox3Fill as PackageSolid,
  RiStore2Line as Store,
  RiStore2Fill as StoreSolid,
  RiShoppingCart2Line as ShoppingCart,
  RiShoppingCart2Fill as ShoppingCartSolid,
  RiShoppingBag3Line as ShoppingBag,
  RiShoppingBag3Fill as ShoppingBagSolid,
  RiArchiveDrawerLine as Warehouse,
  RiArchiveDrawerFill as WarehouseSolid,
  RiWallet3Line as Wallet,
  RiWallet3Fill as WalletSolid,
  RiHandCoinLine as HandCoins,
  RiHandCoinFill as HandCoinsSolid,
  RiBarChartBoxLine as ChartColumn,
  RiBarChartBoxFill as ChartColumnSolid,
  RiTeamLine as Users,
  RiTeamFill as UsersSolid,
  RiInboxUnarchiveLine as Openings,
  RiInboxUnarchiveFill as OpeningsSolid,
  RiCoinsLine as Coins,
  RiCoinsFill as CoinsSolid,
  RiShieldCheckLine as Shield,
  RiShieldCheckFill as ShieldSolid,
  RiSettings3Line as Cog,
  RiSettings3Fill as CogSolid,
  RiPriceTag3Line as Offer,
  RiPriceTag3Fill as OfferSolid,
  RiArrowGoBackLine as Returns,
  RiArrowGoBackFill as ReturnsSolid,
  RiFundsLine as Investors,
  RiFundsFill as InvestorsSolid,
  RiFocus3Line as Target,
  RiFocus3Fill as TargetSolid,
  RiRefreshLine as Refresh,

  /* ---- actions ---- */
  RiAddLine as Plus,
  RiAddBoxLine as PackagePlus,
  RiSaveLine as Save,
  RiEditLine as Pencil,
  RiDeleteBinLine as Trash2,
  RiSearchLine as Search,
  RiFileSearchLine as SearchX,
  RiCloseLine as X,
  RiMenuLine as Menu,
  RiMenuFoldLine as PanelCollapse,
  RiMenuUnfoldLine as PanelExpand,
  RiTableLine as Table2,

  /* ---- direction & movement ---- */
  RiArrowLeftLine as ArrowLeft,
  RiArrowUpLine as ArrowUp,
  RiArrowDownLine as ArrowDown,
  RiArrowRightUpLine as ArrowUpRight,
  RiArrowRightDownLine as ArrowDownRight,
  RiArrowDownSLine as ChevronDown,
  RiArrowRightSLine as ChevronRight,

  /* ---- state & feedback ---- */
  RiCheckLine as Check,
  RiCheckboxCircleLine as CheckCircle2,
  RiCheckboxCircleFill as PackageCheck,
  RiErrorWarningLine as AlertCircle,
  RiAlertLine as AlertTriangle,
  RiForbid2Line as Ban,
  RiInformationLine as Info,
  RiThumbUpLine as PartyPopper,
  RiInboxLine as Inbox,

  /* ---- detail ---- */
  RiMapPinLine as MapPin,
  RiPhoneLine as Phone,
  RiStackLine as Layers,
  RiHistoryLine as History,
  RiCalendarLine as CalendarRange,
  RiCalendarCheckLine as CalendarClock,
} from 'react-icons/ri'

/* CircleAlert and CircleSlash were separate marks in the old set; they mean the
   same things here, so they alias onto the shared ones. */
export { RiErrorWarningLine as CircleAlert, RiForbid2Line as CircleSlash } from 'react-icons/ri'
