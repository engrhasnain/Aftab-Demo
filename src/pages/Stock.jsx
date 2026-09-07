import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, Info, Trash2, Warehouse } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import SearchInput from '../components/ui/SearchInput'
import ExpiryBadge from '../components/ui/ExpiryBadge'
import Badge from '../components/ui/Badge'
import Button, { LinkButton } from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Field, InlineNote, NumberInput, Select } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { expiredStockValue, stockRows, totalStockValue } from '../utils/selectors'
import { expiryStatus, formatMoney, formatNumber } from '../utils/format'

const SORTS = {
  expiryDate: (a, b) => (a.expiryDate < b.expiryDate ? -1 : a.expiryDate > b.expiryDate ? 1 : 0),
  productName: (a, b) => a.productName.localeCompare(b.productName),
  qtyOnHand: (a, b) => a.qtyOnHand - b.qtyOnHand,
}

const REASONS = ['Expired', 'Damaged', 'Lost or stolen', 'Counting correction', 'Returned to supplier']

function SortHeader({ label, field, sort, onSort, align }) {
  const active = sort.field === field
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-sm font-bold uppercase tracking-wide transition hover:text-brand-700 ${
        active ? 'text-brand-700' : 'text-slate-600'
      } ${align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      {label}
      {active ? (
        sort.direction === 'asc' ? (
          <ArrowUp size={15} aria-hidden="true" />
        ) : (
          <ArrowDown size={15} aria-hidden="true" />
        )
      ) : (
        <span className="text-slate-400" aria-hidden="true">
          ↕
        </span>
      )}
    </button>
  )
}

export default function Stock() {
  const data = useData()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  // Soonest expiry first is the default because that is what needs attention.
  const [sort, setSort] = useState({ field: 'expiryDate', direction: 'asc' })
  const [writeOff, setWriteOff] = useState(null)
  const [writeOffQty, setWriteOffQty] = useState('')
  const [writeOffReason, setWriteOffReason] = useState(REASONS[0])

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = stockRows(data).filter(
      (row) => (term ? row.productName.toLowerCase().includes(term) || row.batchNumber.toLowerCase().includes(term) : true),
    )
    const compare = SORTS[sort.field] || SORTS.expiryDate
    const sorted = [...filtered].sort(compare)
    return sort.direction === 'asc' ? sorted : sorted.reverse()
  }, [data, search, sort])

  function toggleSort(field) {
    setSort((current) =>
      current.field === field
        ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    )
  }

  function openWriteOff(row) {
    setWriteOff(row)
    setWriteOffQty(String(row.qtyOnHand))
    setWriteOffReason(row.expired ? 'Expired' : REASONS[1])
  }

  function confirmWriteOff() {
    const row = writeOff
    const qty = Number(writeOffQty)
    setWriteOff(null)
    if (!row || !Number.isFinite(qty) || qty <= 0 || qty > row.qtyOnHand) return
    data.writeOffBatch({ batchId: row.id, qty, reason: writeOffReason })
    showToast('Stock written off', {
      message: `${formatNumber(qty)} ${row.unit}s removed from batch ${row.batchNumber} — ${writeOffReason.toLowerCase()}.`,
    })
  }

  const sellableValue = totalStockValue(data)
  const badValue = expiredStockValue(data)
  const urgentCount = rows.filter((row) => {
    const level = expiryStatus(row.expiryDate).level
    return row.qtyOnHand > 0 && (level === 'warning' || level === 'critical')
  }).length
  const expiredCount = rows.filter((row) => row.expired && row.qtyOnHand > 0).length

  const columns = [
    {
      key: 'productName',
      header: <SortHeader label="Product" field="productName" sort={sort} onSort={toggleSort} />,
      render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span>,
    },
    { key: 'groupName', header: 'Group', render: (row) => row.groupName },
    {
      key: 'batchNumber',
      header: 'Batch number',
      render: (row) => <span className="font-medium text-slate-800">{row.batchNumber}</span>,
    },
    {
      key: 'expiryDate',
      header: <SortHeader label="Expiry date" field="expiryDate" sort={sort} onSort={toggleSort} />,
      render: (row) => <ExpiryBadge date={row.expiryDate} />,
    },
    {
      key: 'qtyOnHand',
      header: <SortHeader label="Qty on hand" field="qtyOnHand" sort={sort} onSort={toggleSort} align="right" />,
      align: 'right',
      render: (row) => (
        <span className={`font-bold tabular-nums ${row.qtyOnHand === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
          {formatNumber(row.qtyOnHand)} <span className="font-normal text-slate-500">{row.unit}s</span>
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Value at cost',
      align: 'right',
      render: (row) =>
        row.expired && row.qtyOnHand > 0 ? (
          <Badge tone="red">Counted as nil</Badge>
        ) : (
          <span className="tabular-nums">{formatMoney(row.value)}</span>
        ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (row) =>
        row.qtyOnHand > 0 ? (
          <Button
            variant="secondary"
            icon={Trash2}
            onClick={(event) => {
              event.stopPropagation()
              openWriteOff(row)
            }}
          >
            Write off
          </Button>
        ) : (
          <span className="text-base text-slate-400">Empty</span>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Stock"
        subtitle="Everything on the shelves right now, batch by batch."
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-600">Batches on hand</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-600">Stock we can sell</p>
            <p className="text-sm text-slate-500">Expired stock is not counted</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{formatMoney(sellableValue)}</p>
          </div>
          <div
            className={`rounded-2xl border p-6 shadow-sm ${
              badValue ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-base font-semibold text-slate-600">Expired stock</p>
            <p className="text-sm text-slate-500">{expiredCount} batch{expiredCount === 1 ? '' : 'es'} to write off</p>
            <p className={`mt-2 text-3xl font-extrabold ${badValue ? 'text-red-800' : 'text-slate-900'}`}>
              {formatMoney(badValue)}
            </p>
          </div>
          <div
            className={`rounded-2xl border p-6 shadow-sm ${
              urgentCount ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-base font-semibold text-slate-600">Expiring within 30 days</p>
            <p className={`mt-2 text-3xl font-extrabold ${urgentCount ? 'text-amber-900' : 'text-slate-900'}`}>
              {urgentCount}
            </p>
          </div>
        </div>

        <Card>
          <CardBody className="border-b border-slate-200">
            <SearchInput
              id="stock-search"
              label="Search by product or batch number"
              value={search}
              onChange={setSearch}
              placeholder="e.g. Date Syrup, or BCW-2506…"
            />
          </CardBody>

          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(row) => navigate(`/products/${row.productId}`)}
            rowClassName={(row) => {
              if (row.qtyOnHand === 0) return 'opacity-60'
              const level = expiryStatus(row.expiryDate).level
              if (level === 'expired' || level === 'critical') return 'bg-red-50'
              if (level === 'warning') return 'bg-amber-50'
              return ''
            }}
            empty={
              search
                ? {
                    icon: Warehouse,
                    title: 'No stock matches that search',
                    message: `Nothing found for "${search}". Try a shorter piece of the product or batch name.`,
                  }
                : {
                    icon: Warehouse,
                    title: 'There is no stock yet',
                    message: 'Stock appears here as soon as you record a purchase.',
                    action: <LinkButton to="/purchases/new">Record purchase</LinkButton>,
                  }
            }
          />
        </Card>

        <InlineNote icon={Info}>
          Stock goes up when you record a purchase and down when you record a sale — the only thing you change by hand
          here is writing off stock that is expired, damaged or lost. Rows in amber expire within 30 days; rows in red
          within 7 days or already expired, and expired batches are valued at nothing.
        </InlineNote>
      </PageBody>

      <ConfirmDialog
        open={Boolean(writeOff)}
        title="Write this stock off?"
        message="The units are removed from stock. Cash is not affected — this records a loss of goods, not a payment."
        detail={
          writeOff ? (
            <div className="space-y-4 text-left">
              <p>
                <span className="font-bold">{writeOff.productName}</span>
                <br />
                Batch {writeOff.batchNumber} · {formatNumber(writeOff.qtyOnHand)} {writeOff.unit}s on hand
              </p>
              <Field label="How many to write off" htmlFor="writeoff-qty" required>
                <NumberInput
                  id="writeoff-qty"
                  min="1"
                  max={writeOff.qtyOnHand}
                  step="1"
                  value={writeOffQty}
                  onChange={(event) => setWriteOffQty(event.target.value)}
                />
              </Field>
              <Field label="Why" htmlFor="writeoff-reason" required>
                <Select
                  id="writeoff-reason"
                  value={writeOffReason}
                  onChange={(event) => setWriteOffReason(event.target.value)}
                >
                  {REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null
        }
        confirmLabel="Yes, write it off"
        cancelLabel="No, go back"
        onConfirm={confirmWriteOff}
        onCancel={() => setWriteOff(null)}
      />
    </>
  )
}
