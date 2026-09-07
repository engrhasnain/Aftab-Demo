import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Ban, HandCoins, Package, ShoppingBag, ShoppingCart, Wallet, Warehouse } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import { LinkButton } from '../components/ui/Button'
import { useData } from '../context/DataContext'
import {
  cashBalance,
  expiredStockValue,
  expiringSoonBatches,
  payables,
  receivables,
  recentActivity,
  salesLastSevenDays,
  sumAmount,
  totalStockValue,
} from '../utils/selectors'
import { formatDate, formatDayShort, formatMoney, formatMoneyShort, TODAY } from '../utils/format'
import { useT } from '../i18n'

const KIND_ICONS = {
  purchase: ShoppingCart,
  sale: ShoppingBag,
  salary: Wallet,
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-slate-500">{formatDate(label)}</p>
      <p className="mt-0.5 text-lg font-bold text-slate-900">{formatMoney(payload[0].value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const data = useData()
  const { t } = useT()

  const stockValue = totalStockValue(data)
  const badStock = expiredStockValue(data)
  const cash = cashBalance(data)
  const owedToUs = sumAmount(receivables(data))
  const weOwe = sumAmount(payables(data))
  const expiring = expiringSoonBatches(data, 30).filter((batch) => batch.qtyOnHand > 0)
  const chartData = salesLastSevenDays(data)
  const activity = recentActivity(data, 8)
  const weekTotal = chartData.reduce((total, day) => total + day.total, 0)

  return (
    <>
      <PageHeader
        title={t('nav.dashboard')}
        subtitle={`${t('dash.subtitle')} ${formatDate(TODAY)}.`}
        action={
          <>
            <LinkButton to="/purchases/new" variant="secondary" icon={ShoppingCart}>
              {t('action.recordPurchase')}
            </LinkButton>
            <LinkButton to="/sales/new" icon={ShoppingBag}>
              {t('action.recordSale')}
            </LinkButton>
          </>
        }
      />

      <PageBody>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label={t('dash.totalProducts')}
            sublabel={t('dash.totalProducts.sub')}
            value={data.products.length}
            hint={`${t('dash.across')} ${data.productGroups.length} ${t('dash.groups')}`}
            icon={Package}
            to="/products"
          />
          <StatCard
            label={t('dash.stockValue')}
            sublabel={t('dash.stockValue.sub')}
            value={formatMoneyShort(stockValue)}
            hint={
              badStock
                ? `${formatMoney(stockValue)} · ${formatMoney(badStock)} ${t('dash.expiredNotCounted')}`
                : formatMoney(stockValue)
            }
            icon={Warehouse}
            accent={badStock ? 'warning' : 'none'}
            to="/stock"
          />
          <StatCard
            label={t('dash.cashInHand')}
            sublabel={t('dash.cashInHand.sub')}
            value={formatMoneyShort(cash)}
            hint={formatMoney(cash)}
            icon={Wallet}
            accent={cash < 0 ? 'critical' : 'none'}
            to="/cash"
          />
          <StatCard
            label={t('dash.owedToUs')}
            sublabel={t('dash.owedToUs.sub')}
            value={formatMoneyShort(owedToUs)}
            hint={owedToUs ? formatMoney(owedToUs) : t('dash.allPaid')}
            icon={HandCoins}
            to="/money-owed"
          />
          <StatCard
            label={t('dash.weOwe')}
            sublabel={t('dash.weOwe.sub')}
            value={formatMoneyShort(weOwe)}
            hint={weOwe ? formatMoney(weOwe) : t('dash.nothingOutstanding')}
            icon={ArrowDownRight}
            accent={weOwe ? 'warning' : 'none'}
            to="/money-owed"
          />
          <StatCard
            label={t('dash.expiringSoon')}
            sublabel={t('dash.expiringSoon.sub')}
            value={expiring.length}
            hint={expiring.length ? t('dash.checkThese') : t('dash.nothingNeeds')}
            icon={AlertTriangle}
            accent={expiring.length ? 'warning' : 'none'}
            to="/stock"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader
              title={t('dash.salesWeek')}
              subtitle={`${t('dash.weekTotal')} ${formatMoney(weekTotal)} ${t('dash.weekEnding')} ${formatDate(TODAY)}.`}
            />
            <CardBody>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDayShort}
                      tick={{ fill: '#475569', fontSize: 14, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))}
                      tick={{ fill: '#64748b', fontSize: 13 }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,76,164,0.08)' }} />
                    <Bar dataKey="total" fill="#3B4CA4" radius={[8, 8, 0, 0]} maxBarSize={54} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader title={t('dash.recent')} subtitle={t('dash.recent.sub')} />
            {activity.length ? (
              <ul className="divide-y divide-slate-200">
                {activity.map((row) => {
                  const Icon = row.cancelled ? Ban : KIND_ICONS[row.kind] || ShoppingBag
                  return (
                    <li key={row.key}>
                      <Link
                        to={row.to}
                        className="flex items-center gap-4 px-6 py-4 transition hover:bg-brand-50/60"
                      >
                        <Icon
                          size={20}
                          className="mt-0.5 shrink-0 text-slate-400"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-base font-semibold ${
                              row.cancelled ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}
                          >
                            {row.title}
                          </span>
                          <span className="block text-sm text-slate-500">
                            {formatDate(row.date)} · {row.detail}
                          </span>
                        </span>
                        <span
                          className={`flex shrink-0 items-center gap-1 whitespace-nowrap text-base font-bold ${
                            row.cancelled
                              ? 'text-slate-400 line-through'
                              : row.direction === 'in'
                                ? 'text-emerald-700'
                                : 'text-red-700'
                          }`}
                        >
                          {row.direction === 'in' ? (
                            <ArrowUpRight size={18} aria-hidden="true" />
                          ) : (
                            <ArrowDownRight size={18} aria-hidden="true" />
                          )}
                          {formatMoney(row.amount)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState
                title={t('dash.nothingYet')}
                message={t('dash.nothingYet.sub')}
                action={<LinkButton to="/sales/new">{t('action.recordSale')}</LinkButton>}
              />
            )}
          </Card>
        </div>

        {expiring.length ? (
          <Card>
            <CardHeader
              icon={AlertTriangle}
              title={t('dash.useFirst')}
              subtitle={t('dash.useFirst.sub')}
              action={
                <LinkButton to="/stock" variant="secondary">
                  {t('action.openStock')}
                </LinkButton>
              }
            />
            <CardBody className="flex flex-wrap gap-3">
              {expiring.slice(0, 6).map((batch) => {
                const product = data.products.find((p) => p.id === batch.productId)
                return (
                  <Link
                    key={batch.id}
                    to={`/products/${batch.productId}`}
                    className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 transition hover:border-amber-300 hover:bg-amber-100"
                  >
                    <p className="text-base font-bold text-slate-900">{product ? product.name : 'Unknown product'}</p>
                    <p className="mt-0.5 text-sm font-semibold text-amber-900">
                      {t('dash.batch')} {batch.batchNumber} · {batch.qtyOnHand}{' '}
                      {product ? product.unit : 'unit'}s · {t('dash.expires')} {formatDate(batch.expiryDate)}
                    </p>
                  </Link>
                )
              })}
            </CardBody>
          </Card>
        ) : null}
      </PageBody>
    </>
  )
}
