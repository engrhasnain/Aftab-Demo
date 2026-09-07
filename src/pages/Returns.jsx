import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Info, Plus, Save } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Button, { LinkButton } from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ComboBox from '../components/ui/ComboBox'
import ErrorSummary from '../components/ui/ErrorSummary'
import { Field, FormActions, InlineNote, NumberInput, Select, DateInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { RETURN_REASONS } from '../data/seedData'
import {
  customerName,
  getBatch,
  getPurchase,
  getSale,
  productName,
  productUnit,
  salesNewestFirst,
  purchasesNewestFirst,
  supplierName,
} from '../utils/selectors'
import { formatDate, formatMoney, formatNumber, TODAY } from '../utils/format'

/**
 * Goods coming back.
 *
 * Expired stock going back to the principal and a shop refusing part of a
 * delivery are both everyday events in this trade, and neither is a mistake —
 * so neither is handled by cancelling the original document. A return is its
 * own record that moves stock and money the other way.
 */
export default function Returns() {
  const data = useData()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [side, setSide] = useState('sale')
  const [openForm, setOpenForm] = useState(false)
  const [docId, setDocId] = useState('')
  const [qtys, setQtys] = useState({})
  const [meta, setMeta] = useState({ date: TODAY, reason: RETURN_REASONS[0], settle: 'cash' })
  const [errors, setErrors] = useState([])

  const isSale = side === 'sale'
  const original = docId ? (isSale ? getSale(data, docId) : getPurchase(data, docId)) : null

  /* How much of each line has already come back, so nothing is returned twice. */
  const alreadyReturned = useMemo(() => {
    const map = new Map()
    const docs = isSale
      ? data.salesReturns.filter((r) => r.saleId === docId)
      : data.purchaseReturns.filter((r) => r.purchaseId === docId)
    for (const doc of docs) {
      for (const line of doc.items) {
        const key = isSale ? line.stockBatchId : `${line.productId}::${line.batchNumber}`
        map.set(key, (map.get(key) || 0) + line.qty)
      }
    }
    return map
  }, [data, docId, isSale])

  const lineKey = (item) => (isSale ? item.stockBatchId : `${item.productId}::${item.batchNumber}`)

  const maxFor = (item) => {
    const sent = item.qty + (item.bonusQty || 0)
    const back = alreadyReturned.get(lineKey(item)) || 0
    let cap = sent - back
    if (!isSale) {
      // We can only send back what is still physically on the shelf.
      const batch = data.stockBatches.find(
        (b) => b.productId === item.productId && b.batchNumber === item.batchNumber,
      )
      cap = Math.min(cap, batch ? batch.qtyOnHand : 0)
    }
    return Math.max(0, cap)
  }

  const rate = (item) => (item.unitPrice !== undefined ? item.unitPrice : item.unitCost)

  const runningTotal = original
    ? original.items.reduce((total, item) => {
        const qty = Number(qtys[lineKey(item)]) || 0
        return total + qty * rate(item)
      }, 0)
    : 0

  function reset() {
    setDocId('')
    setQtys({})
    setErrors([])
    setMeta({ date: TODAY, reason: RETURN_REASONS[0], settle: 'cash' })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const problems = []
    if (!original) problems.push({ id: 'ret-doc', message: 'Please choose the original document.' })

    const items = []
    if (original) {
      for (const item of original.items) {
        const key = lineKey(item)
        const qty = Math.floor(Number(qtys[key]) || 0)
        if (!qty) continue
        if (qty > maxFor(item)) {
          problems.push({
            id: `ret-${key}`,
            message: `${productName(data, item.productId)} — only ${maxFor(item)} can come back.`,
          })
          continue
        }
        items.push(
          isSale
            ? { productId: item.productId, stockBatchId: item.stockBatchId, qty }
            : { productId: item.productId, batchNumber: item.batchNumber, qty },
        )
      }
      if (!items.length && !problems.length)
        problems.push({ id: 'ret-doc', message: 'Enter a quantity against at least one line.' })
    }

    setErrors(problems)
    if (problems.length) return

    if (isSale) {
      data.recordSaleReturn({ saleId: original.id, items, ...meta })
      showToast('Sales return recorded', {
        message: `Stock is back on the shelf${meta.settle === 'cash' ? ' and the refund is in the cash ledger.' : ' as a credit note — no cash moved.'}`,
      })
    } else {
      data.recordPurchaseReturn({ purchaseId: original.id, items, ...meta })
      showToast('Purchase return recorded', {
        message: `Stock has gone back to the supplier${meta.settle === 'cash' ? ' and the refund is in the cash ledger.' : ' as a credit note — no cash moved.'}`,
      })
    }
    reset()
    setOpenForm(false)
  }

  const rows = isSale
    ? [...data.salesReturns].sort((a, b) => (a.date < b.date ? 1 : -1))
    : [...data.purchaseReturns].sort((a, b) => (a.date < b.date ? 1 : -1))

  const totalBack = rows.reduce((t, r) => t + r.totalAmount, 0)

  return (
    <>
      <PageHeader
        title="Returns"
        subtitle="Goods coming back — from customers, and back to suppliers."
        action={
          <Button
            size="lg"
            icon={Plus}
            onClick={() => {
              reset()
              setOpenForm((v) => !v)
            }}
          >
            {openForm ? 'Close the form' : isSale ? 'Record a sales return' : 'Record a purchase return'}
          </Button>
        }
      />

      <PageBody>
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            variant={isSale ? 'primary' : 'secondary'}
            onClick={() => {
              setSide('sale')
              reset()
            }}
          >
            Customer returns to us
          </Button>
          <Button
            size="lg"
            variant={!isSale ? 'primary' : 'secondary'}
            onClick={() => {
              setSide('purchase')
              reset()
            }}
          >
            We return to supplier
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              {isSale ? 'Sales returns' : 'Purchase returns'}
            </p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Value returned</p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">{formatMoney(totalBack)}</p>
          </div>
        </div>

        {openForm ? (
          <Card>
            <CardHeader
              title={isSale ? 'Record a sales return' : 'Record a purchase return'}
              subtitle={
                isSale
                  ? 'Pick the original sale, then say how many of each line have come back.'
                  : 'Pick the original purchase, then say how many of each line are going back.'
              }
            />
            <CardBody>
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <ErrorSummary problems={errors} />

                <Field label={isSale ? 'Which sale' : 'Which purchase'} htmlFor="ret-doc" required>
                  <ComboBox
                    id="ret-doc"
                    value={docId}
                    onChange={(value) => {
                      setDocId(value)
                      setQtys({})
                    }}
                    placeholder={isSale ? 'Choose the original sale…' : 'Choose the original purchase…'}
                    searchPlaceholder="Type a name…"
                    options={(isSale ? salesNewestFirst(data) : purchasesNewestFirst(data))
                      .filter((d) => d.status !== 'reversed')
                      .map((d) => ({
                        value: d.id,
                        label: isSale ? customerName(data, d.customerId) : supplierName(data, d.supplierId),
                        hint: `${formatDate(isSale ? d.saleDate : d.purchaseDate)} · ${formatMoney(d.totalAmount)}`,
                      }))}
                  />
                </Field>

                {original ? (
                  <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">
                    <p className="mb-4 text-base font-bold text-slate-900">How many are coming back?</p>
                    <div className="space-y-4">
                      {original.items.map((item) => {
                        const key = lineKey(item)
                        const cap = maxFor(item)
                        const batch = item.stockBatchId ? getBatch(data, item.stockBatchId) : null
                        return (
                          <div key={key} className="grid gap-3 sm:grid-cols-[1fr_10rem] sm:items-end">
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-slate-900">
                                {productName(data, item.productId)}
                              </p>
                              <p className="text-sm text-slate-600">
                                Batch {item.batchNumber || (batch ? batch.batchNumber : '—')} ·{' '}
                                {formatNumber(item.qty + (item.bonusQty || 0))}{' '}
                                {productUnit(data, item.productId)}s went out · at {formatMoney(rate(item))}
                              </p>
                            </div>
                            <Field label={`Return (max ${cap})`} htmlFor={`ret-${key}`}>
                              <NumberInput
                                id={`ret-${key}`}
                                min="0"
                                max={cap}
                                step="1"
                                value={qtys[key] || ''}
                                onChange={(event) =>
                                  setQtys((current) => ({ ...current, [key]: event.target.value }))
                                }
                                placeholder="0"
                                disabled={cap === 0}
                              />
                            </Field>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-6 sm:grid-cols-3">
                  <Field label="Date" htmlFor="ret-date" required>
                    <DateInput
                      id="ret-date"
                      value={meta.date}
                      onChange={(event) => setMeta((m) => ({ ...m, date: event.target.value }))}
                    />
                  </Field>
                  <Field label="Why is it coming back?" htmlFor="ret-reason" required>
                    <Select
                      id="ret-reason"
                      value={meta.reason}
                      onChange={(event) => setMeta((m) => ({ ...m, reason: event.target.value }))}
                    >
                      {RETURN_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="How is it settled?" htmlFor="ret-settle" required>
                    <Select
                      id="ret-settle"
                      value={meta.settle}
                      onChange={(event) => setMeta((m) => ({ ...m, settle: event.target.value }))}
                    >
                      <option value="cash">
                        {isSale ? 'Money refunded now' : 'Money received back now'}
                      </option>
                      <option value="credit">Credit note — no money moves</option>
                    </Select>
                  </Field>
                </div>

                {original ? (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-50 px-6 py-5">
                    <p className="text-base font-semibold text-brand-900">Value coming back</p>
                    <p className="text-3xl font-extrabold tabular-nums text-brand-900">{formatMoney(runningTotal)}</p>
                  </div>
                ) : null}

                <InlineNote icon={Info}>
                  {isSale
                    ? 'The goods go back on the shelf and, if you refund now, the money comes out of cash.'
                    : 'The goods leave the shelf and, if the supplier refunds now, the money comes back into cash.'}
                </InlineNote>

                <FormActions>
                  <Button type="submit" size="lg" icon={Save}>
                    Save return
                  </Button>
                  <Button type="button" size="lg" variant="secondary" onClick={() => setOpenForm(false)}>
                    Cancel
                  </Button>
                </FormActions>
              </form>
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardHeader
            icon={isSale ? ArrowUpRight : ArrowDownRight}
            title={isSale ? 'Returns from customers' : 'Returns to suppliers'}
            subtitle="Newest first."
          />
          <DataTable
            columns={[
              { key: 'code', header: 'No.', render: (row) => <span className="tabular-nums text-slate-500">{row.code}</span> },
              { key: 'date', header: 'Date', render: (row) => <span className="whitespace-nowrap">{formatDate(row.date)}</span> },
              {
                key: 'party',
                header: isSale ? 'Customer' : 'Supplier',
                render: (row) => (
                  <span className="font-semibold text-slate-900">
                    {isSale ? customerName(data, row.customerId) : supplierName(data, row.supplierId)}
                  </span>
                ),
              },
              { key: 'reason', header: 'Reason', render: (row) => <Badge tone="slate">{row.reason}</Badge> },
              {
                key: 'settle',
                header: 'Settled',
                render: (row) => (
                  <Badge tone={row.settle === 'cash' ? 'green' : 'amber'}>
                    {row.settle === 'cash' ? 'Money moved' : 'Credit note'}
                  </Badge>
                ),
              },
              {
                key: 'amount',
                header: 'Value',
                align: 'right',
                render: (row) => <span className="font-bold tabular-nums">{formatMoney(row.totalAmount)}</span>,
              },
              {
                key: 'print',
                header: 'Document',
                align: 'right',
                render: (row) => (
                  <LinkButton
                    to={`/print/${isSale ? 'sale-return' : 'purchase-return'}/${row.id}`}
                    variant="secondary"
                  >
                    Print
                  </LinkButton>
                ),
              },
            ]}
            rows={rows}
            onRowClick={(row) => navigate(isSale ? `/sales/${row.saleId}` : `/purchases/${row.purchaseId}`)}
            empty={{
              title: isSale ? 'No customer returns yet' : 'No returns to suppliers yet',
              message:
                'When goods come back, record them here so the stock and the money both move the right way.',
            }}
          />
        </Card>
      </PageBody>
    </>
  )
}
