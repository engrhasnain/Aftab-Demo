import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, CalendarRange, ChartColumn, Table2 } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import RankBars from '../components/ui/RankBars'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { Field, DateInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { buildReport, changeVs, periodPresets, previousPeriod } from '../utils/reports'
import { formatDate, formatMoney, formatMoneyShort, formatNumber, TODAY } from '../utils/format'

/* Chart colours were chosen by running the palette validator against a white
   surface, not by eye. The brand navy itself is too dark to use as a mark
   (it falls outside the lightness band), so marks use the brand-500 step.
   Money in / money out deliberately avoids the usual green-vs-red: that pair
   fails colour-blind separation (ΔE 5.6). Navy vs orange clears every check. */
const SERIES_IN = '#3B4CA4'
const SERIES_OUT = '#eb6834'

const axisTick = { fill: '#64748b', fontSize: 13 }

function MoneyTooltip({ active, payload, label, rows }) {
  if (!active || !payload || !payload.length) return null
  const bucket = rows.find((row) => row.label === label)
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-slate-500">
        {bucket && bucket.key.length === 10 ? formatDate(bucket.key) : label}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1 flex items-center gap-2 text-base font-bold text-slate-900">
          <span className="h-3 w-3 rounded-sm" style={{ background: entry.color }} aria-hidden="true" />
          {entry.name}: {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  )
}

/** A chart with an optional plain table underneath, for anyone who prefers numbers. */
function ChartCard({ title, subtitle, children, tableHead, tableRows }) {
  const [showTable, setShowTable] = useState(false)
  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          tableRows ? (
            <Button variant="secondary" icon={Table2} onClick={() => setShowTable((v) => !v)}>
              {showTable ? 'Hide the numbers' : 'Show the numbers'}
            </Button>
          ) : null
        }
      />
      <CardBody>{children}</CardBody>
      {showTable && tableRows ? (
        <div className="table-scroll border-t border-slate-200">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {tableHead.map((head) => (
                  <th
                    key={head}
                    className="px-5 py-3 text-sm font-bold uppercase tracking-wide text-slate-600 last:text-right"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row[0]} className="border-b border-slate-100 text-base">
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      className={`px-5 py-2.5 tabular-nums ${i === 0 ? 'font-semibold text-slate-800' : 'text-slate-700'} ${
                        i === row.length - 1 ? 'text-right' : ''
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  )
}

export default function Reports() {
  const data = useData()
  const presets = useMemo(() => periodPresets(), [])
  const [presetId, setPresetId] = useState('this-month')
  const [custom, setCustom] = useState({ from: presets[0].from, to: presets[0].to })

  const active = presetId === 'custom' ? custom : presets.find((p) => p.id === presetId) || presets[0]
  const valid = active.from && active.to && active.from <= active.to

  const report = useMemo(
    () => (valid ? buildReport(data, active.from, active.to) : null),
    [data, active.from, active.to, valid],
  )
  const comparison = useMemo(() => {
    if (!valid) return null
    const prev = previousPeriod(active.from, active.to)
    const prevReport = buildReport(data, prev.from, prev.to)
    return { prev, prevReport, sales: changeVs(report.salesTotal, prevReport.salesTotal) }
  }, [data, active.from, active.to, valid, report])

  function choosePreset(id) {
    setPresetId(id)
    if (id !== 'custom') {
      const preset = presets.find((p) => p.id === id)
      if (preset) setCustom({ from: preset.from, to: preset.to })
    }
  }

  const paisa = report && report.salesTotal ? Math.round(report.marginPercent) : 0

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Pick a period and see how the business did."
      />

      <PageBody>
        {/* ---------- period picker ---------- */}
        <Card>
          <CardHeader
            icon={CalendarRange}
            title="Which period?"
            subtitle="Choose one of these, or set your own dates below."
          />
          <CardBody className="space-y-5">
            <div className="flex flex-wrap gap-3">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  size="lg"
                  variant={presetId === preset.id ? 'primary' : 'secondary'}
                  onClick={() => choosePreset(preset.id)}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                size="lg"
                variant={presetId === 'custom' ? 'primary' : 'secondary'}
                onClick={() => choosePreset('custom')}
              >
                Choose my own dates
              </Button>
            </div>

            {presetId === 'custom' ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:max-w-xl">
                <Field label="From" htmlFor="from-date" required>
                  <DateInput
                    id="from-date"
                    value={custom.from}
                    max={TODAY}
                    onChange={(event) => setCustom((c) => ({ ...c, from: event.target.value }))}
                  />
                </Field>
                <Field
                  label="To"
                  htmlFor="to-date"
                  required
                  error={valid ? null : 'The end date must be on or after the start date.'}
                >
                  <DateInput
                    id="to-date"
                    value={custom.to}
                    max={TODAY}
                    onChange={(event) => setCustom((c) => ({ ...c, to: event.target.value }))}
                  />
                </Field>
              </div>
            ) : null}
          </CardBody>
        </Card>

        {!valid ? null : report.salesTotal === 0 && report.purchasesTotal === 0 ? (
          <Card>
            <EmptyState
              icon={ChartColumn}
              title={`Nothing happened in ${report.label}`}
              message="There were no sales and no purchases in this period. Try a different one."
              action={
                <Button size="lg" onClick={() => choosePreset('this-month')}>
                  Show this month instead
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {/* ---------- the plain-language answer ---------- */}
            <Card>
              <CardBody className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  {report.label} · in plain words
                </p>
                <p className="max-w-3xl text-xl leading-relaxed text-slate-800">
                  You sold <Strong>{formatMoney(report.salesTotal)}</Strong> worth of goods in{' '}
                  <Strong>{report.salesCount}</Strong> sale{report.salesCount === 1 ? '' : 's'} to{' '}
                  <Strong>{report.customerCount}</Strong> customer{report.customerCount === 1 ? '' : 's'}.
                  {report.salesTotal > 0 ? (
                    <>
                      {' '}
                      After what that stock cost you, you kept <Strong>{formatMoney(report.grossProfit)}</Strong> —
                      about <Strong>{paisa} paisa of every rupee</Strong>.
                    </>
                  ) : null}
                </p>
                <p className="max-w-3xl text-xl leading-relaxed text-slate-800">
                  <Strong>{formatMoney(report.moneyIn)}</Strong> came in and{' '}
                  <Strong>{formatMoney(report.moneyOut)}</Strong> went out, so your cash went{' '}
                  <Strong>{report.netCash >= 0 ? 'up' : 'down'} by {formatMoney(Math.abs(report.netCash))}</Strong>{' '}
                  over these {report.dayCount} days.
                </p>
                {comparison && comparison.sales && comparison.prevReport.salesTotal > 0 ? (
                  <p className="max-w-3xl text-lg text-slate-600">
                    That is{' '}
                    <span
                      className={`font-bold ${comparison.sales.percent >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
                    >
                      {comparison.sales.percent >= 0 ? 'up' : 'down'} {Math.abs(Math.round(comparison.sales.percent))}%
                    </span>{' '}
                    on the {report.dayCount} days before ({formatMoney(comparison.prevReport.salesTotal)}).
                  </p>
                ) : null}
                {report.busiestDay ? (
                  <p className="max-w-3xl text-lg text-slate-600">
                    Your best {report.grain === 'day' ? 'day' : 'month'} was{' '}
                    <span className="font-semibold text-slate-800">{report.busiestDay.label}</span> with{' '}
                    {formatMoney(report.busiestDay.sales)}.
                  </p>
                ) : null}
              </CardBody>
            </Card>

            {/* ---------- headline numbers ---------- */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="You sold"
                sublabel="Total value of goods sold"
                value={formatMoneyShort(report.salesTotal)}
                hint={`${formatMoney(report.salesTotal)} · ${formatNumber(report.unitsSold)} units`}
                icon={ArrowUpRight}
              />
              <StatCard
                label="That stock cost"
                sublabel="What you had paid for it"
                value={formatMoneyShort(report.costOfSales)}
                hint={formatMoney(report.costOfSales)}
                icon={ArrowDownRight}
              />
              <StatCard
                label="You kept"
                sublabel="Sales minus what the stock cost"
                value={formatMoneyShort(report.grossProfit)}
                hint={`${formatMoney(report.grossProfit)} · ${paisa} paisa per rupee`}
                icon={ChartColumn}
                accent={report.grossProfit < 0 ? 'critical' : 'good'}
              />
              <StatCard
                label="Cash moved"
                sublabel="Money in minus money out"
                value={formatMoneyShort(report.netCash)}
                hint={`In ${formatMoney(report.moneyIn)} · out ${formatMoney(report.moneyOut)}`}
                icon={report.netCash >= 0 ? ArrowUpRight : ArrowDownRight}
                accent={report.netCash < 0 ? 'warning' : 'none'}
              />
            </div>

            {/* ---------- sales over time (one series, so no legend) ---------- */}
            <ChartCard
              title="How much you sold"
              subtitle={`Value of goods sold each ${report.grain}, across ${report.label}.`}
              tableHead={[report.grain === 'day' ? 'Day' : 'Month', 'Sold']}
              tableRows={report.series.map((row) => [row.label, formatMoney(row.sales)])}
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.series} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={axisTick}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      interval={report.series.length > 16 ? Math.floor(report.series.length / 8) : 0}
                    />
                    <YAxis
                      tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                      tick={axisTick}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                    />
                    <Tooltip
                      content={<MoneyTooltip rows={report.series} />}
                      cursor={{ fill: 'rgba(59,76,164,0.08)' }}
                    />
                    <Bar dataKey="sales" name="Sold" fill={SERIES_IN} radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* ---------- money in vs out (two series, so legend is required) ---------- */}
            <ChartCard
              title="Money coming in and going out"
              subtitle="Taller blue than orange means you took in more than you paid out."
              tableHead={[report.grain === 'day' ? 'Day' : 'Month', 'Money in', 'Money out']}
              tableRows={report.series.map((row) => [row.label, formatMoney(row.moneyIn), formatMoney(row.moneyOut)])}
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={report.series}
                    margin={{ top: 8, right: 8, bottom: 4, left: 8 }}
                    barGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={axisTick}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      interval={report.series.length > 16 ? Math.floor(report.series.length / 8) : 0}
                    />
                    <YAxis
                      tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                      tick={axisTick}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                    />
                    <Tooltip content={<MoneyTooltip rows={report.series} />} cursor={{ fill: 'rgba(100,116,139,0.08)' }} />
                    <Legend
                      verticalAlign="top"
                      align="left"
                      height={36}
                      iconType="square"
                      wrapperStyle={{ fontSize: 15, fontWeight: 600, color: '#334155' }}
                    />
                    <Bar dataKey="moneyIn" name="Money in" fill={SERIES_IN} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="moneyOut" name="Money out" fill={SERIES_OUT} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* ---------- rankings ---------- */}
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader
                  title="Your best-selling products"
                  subtitle={`By value sold in ${report.label}. Click one to open it.`}
                />
                <RankBars
                  rows={report.topProducts.map((row) => ({
                    ...row,
                    detail: `${formatNumber(row.qty)} ${row.unit}s`,
                  }))}
                  emptyText="No products were sold in this period."
                />
              </Card>

              <Card>
                <CardHeader
                  title="Your biggest customers"
                  subtitle={`By value bought in ${report.label}. Click one to open them.`}
                />
                <RankBars
                  rows={report.topCustomers.map((row) => ({
                    ...row,
                    detail: `${row.orders} order${row.orders === 1 ? '' : 's'}`,
                  }))}
                  emptyText="No customers bought anything in this period."
                />
              </Card>
            </div>

            <Card>
              <CardHeader
                title="Who sold what"
                subtitle={`Invoices counted against the person who booked them, in ${report.label}. Click a name to open their page.`}
              />
              <RankBars
                rows={report.bySeller.map((row) => ({
                  ...row,
                  detail: `${row.orders} invoice${row.orders === 1 ? '' : 's'}`,
                }))}
                emptyText="Nothing was sold in this period."
              />
            </Card>

            <Card>
              <CardHeader
                title="Which kinds of product sold most"
                subtitle={`Sales split across your product groups in ${report.label}.`}
              />
              <RankBars rows={report.byGroup} emptyText="No sales in this period." />
            </Card>

            {/* ---------- the tax position ---------- */}
            <Card>
              <CardHeader
                title="Sales tax position"
                subtitle="Tax charged on sales, less tax paid to suppliers on stock."
              />
              <CardBody>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      Tax charged on sales
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                      {formatMoney(report.outputTax)}
                    </p>
                    <p className="text-sm text-slate-500">including any further tax</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      Tax paid on purchases
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                      {formatMoney(report.inputTax)}
                    </p>
                    <p className="text-sm text-slate-500">claimable against the above</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      {report.netTax >= 0 ? 'Payable to the tax office' : 'Claimable back'}
                    </p>
                    <p
                      className={`mt-1 text-2xl font-extrabold tabular-nums ${
                        report.netTax >= 0 ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatMoney(Math.abs(report.netTax))}
                    </p>
                    <p className="text-sm text-slate-500">for {report.label}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* ---------- what was bought in ---------- */}
            <Card>
              <CardHeader title="What you bought in" subtitle="Stock brought in from suppliers during this period." />
              <CardBody>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Purchases</p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                      {formatMoney(report.purchasesTotal)}
                    </p>
                    <p className="text-sm text-slate-500">
                      across {report.purchasesCount} purchase{report.purchasesCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Salaries paid</p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                      {formatMoney(report.salariesPaid)}
                    </p>
                    <p className="text-sm text-slate-500">in this period</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Days covered</p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">{report.dayCount}</p>
                    <p className="text-sm text-slate-500">
                      {formatDate(report.from)} to {formatDate(report.to)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </PageBody>
    </>
  )
}

function Strong({ children }) {
  return <span className="font-bold text-slate-900">{children}</span>
}
