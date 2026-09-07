import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Info, Wallet } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Button, { LinkButton } from '../components/ui/Button'
import { Field, InlineNote, DateInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { cashLedgerRows, cashTotals } from '../utils/selectors'
import { formatDate, formatMoney } from '../utils/format'

const FILTERS = [
  { value: 'all', label: 'Everything' },
  { value: 'in', label: 'Cash in — money we received' },
  { value: 'out', label: 'Cash out — money we paid' },
]

/** Where a ledger row should take you when it is clicked. */
function destinationFor(entry) {
  if (entry.referenceType === 'purchase') return `/purchases/${entry.referenceId}`
  if (entry.referenceType === 'sale') return `/sales/${entry.referenceId}`
  if (entry.referenceType === 'salary') return '/employees'
  if (entry.referenceType === 'expense') return '/expenses'
  if (entry.referenceType === 'opening') return '/openings'
  if (entry.referenceType === 'investor') return '/investors'
  if (entry.referenceType === 'saleReturn' || entry.referenceType === 'purchaseReturn') return '/returns'
  return null
}

export default function CashLedger() {
  const data = useData()
  const navigate = useNavigate()
  const [direction, setDirection] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { moneyIn, moneyOut, balance } = cashTotals(data)

  const rows = useMemo(() => {
    return cashLedgerRows(data)
      .filter((entry) => (direction === 'all' ? true : entry.direction === direction))
      .filter((entry) => (fromDate ? entry.entryDate >= fromDate : true))
      .filter((entry) => (toDate ? entry.entryDate <= toDate : true))
  }, [data, direction, fromDate, toDate])

  const filtersActive = direction !== 'all' || Boolean(fromDate) || Boolean(toDate)
  const shownIn = rows.filter((row) => row.direction === 'in').reduce((total, row) => total + row.amount, 0)
  const shownOut = rows.filter((row) => row.direction === 'out').reduce((total, row) => total + row.amount, 0)

  function clearFilters() {
    setDirection('all')
    setFromDate('')
    setToDate('')
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => <span className="whitespace-nowrap font-semibold text-slate-900">{formatDate(row.entryDate)}</span>,
    },
    {
      key: 'direction',
      header: 'In or out',
      render: (row) =>
        row.direction === 'in' ? (
          <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-sm font-bold text-emerald-800">
            <ArrowUpRight size={16} aria-hidden="true" />
            Cash in
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-100 px-2.5 py-1 text-sm font-bold text-red-800">
            <ArrowDownRight size={16} aria-hidden="true" />
            Cash out
          </span>
        ),
    },
    { key: 'note', header: 'Reference', render: (row) => <span className="text-slate-800">{row.note}</span> },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className={`font-bold tabular-nums ${row.direction === 'in' ? 'text-emerald-700' : 'text-red-700'}`}>
          {row.direction === 'in' ? '+' : '−'}
          {formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance after',
      align: 'right',
      render: (row) => <span className="tabular-nums text-slate-700">{formatMoney(row.runningBalance)}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Cash ledger"
        subtitle="Every rupee that came in and every rupee that went out."
        action={
          <>
            <LinkButton to="/purchases/new" variant="secondary">
              Record purchase
            </LinkButton>
            <LinkButton to="/sales/new">Record sale</LinkButton>
          </>
        }
      />

      <PageBody>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 shadow-sm lg:col-span-1">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Wallet size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="text-base font-semibold text-brand-900">Cash in hand</p>
                <p className="text-sm text-brand-800">Money we received minus money we paid</p>
              </div>
            </div>
            <p className="mt-4 text-4xl font-extrabold tabular-nums text-brand-900">{formatMoney(balance)}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-600">Total cash in</p>
            <p className="text-sm text-slate-500">Money we received</p>
            <p className="mt-4 text-3xl font-extrabold tabular-nums text-emerald-700">+{formatMoney(moneyIn)}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-600">Total cash out</p>
            <p className="text-sm text-slate-500">Money we paid</p>
            <p className="mt-4 text-3xl font-extrabold tabular-nums text-red-700">−{formatMoney(moneyOut)}</p>
          </div>
        </div>

        <Card>
          <CardBody className="space-y-5 border-b border-slate-200">
            <div>
              <p className="mb-2 text-base font-semibold text-slate-800">Show</p>
              <div className="flex flex-wrap gap-3">
                {FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={direction === filter.value ? 'primary' : 'secondary'}
                    onClick={() => setDirection(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:max-w-xl">
              <Field label="From date" htmlFor="from-date" hint="Leave empty for no start date">
                <DateInput id="from-date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              </Field>
              <Field label="To date" htmlFor="to-date" hint="Leave empty for no end date">
                <DateInput id="to-date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
              </Field>
            </div>

            {filtersActive ? (
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-base text-slate-600">
                  Showing {rows.length} of {data.cashEntries.length} entries · in{' '}
                  <span className="font-semibold text-emerald-700">+{formatMoney(shownIn)}</span> · out{' '}
                  <span className="font-semibold text-red-700">−{formatMoney(shownOut)}</span>
                </p>
                <Button variant="subtle" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : null}
          </CardBody>

          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(row) => {
              const to = destinationFor(row)
              if (to) navigate(to)
            }}
            empty={
              filtersActive
                ? {
                    icon: Wallet,
                    title: 'No cash entries match these filters',
                    message: 'Try clearing the filters to see the whole ledger again.',
                    action: (
                      <Button variant="secondary" size="lg" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ),
                  }
                : {
                    icon: Wallet,
                    title: 'The cash ledger is empty',
                    message: 'Entries appear here automatically when you record a purchase, a sale or a salary payment.',
                    action: <LinkButton to="/sales/new">Record a sale</LinkButton>,
                  }
            }
          />
        </Card>

        <InlineNote icon={Info}>
          Entries are created for you. A paid purchase adds a “cash out” line, a paid sale adds a “cash in” line, and
          paying a salary adds a “cash out” line. Click any row to open what it came from.
        </InlineNote>
      </PageBody>
    </>
  )
}
