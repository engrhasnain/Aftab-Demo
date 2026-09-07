import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Info, Layers, Plus, Save, Trash2 } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import ComboBox from '../components/ui/ComboBox'
import EmptyState from '../components/ui/EmptyState'
import ErrorSummary from '../components/ui/ErrorSummary'
import UnsavedChangesGuard from '../components/ui/UnsavedChangesGuard'
import Badge from '../components/ui/Badge'
import { Field, FormActions, InlineNote, NumberInput, Select, DateInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import {
  activeOfferForProduct,
  availableBatchesForProduct,
  getBatch,
  getCustomer,
  getProduct,
  licenceStatus,
  planAllocation,
  productSellableQty,
} from '../utils/selectors'
import { calcLine, calcTotals, describeOffer, offerBonus, offerPrice } from '../utils/tax'
import { expiryStatus, formatDate, formatMoney, formatNumber, TODAY } from '../utils/format'

const emptyItem = (key) => ({
  key,
  productId: '',
  qty: '',
  bonusQty: '',
  unitPrice: '',
  mode: 'auto',
  stockBatchId: '',
})

export default function SaleNew() {
  const data = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const nextKey = useRef(2)
  const [customerId, setCustomerId] = useState('')
  const [saleDate, setSaleDate] = useState(TODAY)
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [items, setItems] = useState([emptyItem(1)])
  const [errors, setErrors] = useState({ customerId: null, saleDate: null, items: [{}] })
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)

  const customer = customerId ? getCustomer(data, customerId) : null
  const licence = customer ? licenceStatus(customer) : null
  // A shop whose drug licence has lapsed may not be supplied. How strict this
  // is — refuse outright, or warn and allow — is a setting, not a rule in code.
  const licenceBlocks = Boolean(
    licence && licence.state === 'expired' && data.settings.blockExpiredLicence,
  )

  const productOptions = useMemo(
    () =>
      data.products.map((product) => {
        const batches = availableBatchesForProduct(data, product.id)
        const sellable = batches.reduce((total, batch) => total + batch.qtyOnHand, 0)
        return {
          value: product.id,
          label: product.name,
          // The honest number: how much can actually go out, and across how
          // many batches, so a split is never a surprise.
          hint: sellable
            ? `${formatNumber(sellable)} ${product.unit}s in stock across ${batches.length} batch${
                batches.length === 1 ? '' : 'es'
              }`
            : undefined,
          disabled: sellable === 0,
          disabledReason: 'Out of stock',
        }
      }),
    [data],
  )

  const anythingInStock = productOptions.some((option) => !option.disabled)

  /**
   * Works out, for every line in order, which batches it will draw from —
   * oldest expiry first — while keeping track of what earlier lines already
   * claimed. This is what lets one line cover a quantity spread over several
   * batches instead of stopping at an error.
   */
  const allocations = useMemo(() => {
    const claimed = new Map()
    return items.map((item) => {
      if (!item.productId || !Number(item.qty)) return { lines: [], shortfall: 0 }
      /* eslint-disable-next-line no-unused-vars */

      const wanted = (Number(item.qty) || 0) + (Number(item.bonusQty) || 0)

      if (item.mode === 'manual') {
        const batch = getBatch(data, item.stockBatchId)
        if (!batch) return { lines: [], shortfall: Number(item.qty) }
        const free = batch.qtyOnHand - (claimed.get(batch.id) || 0)
        const take = Math.min(Math.max(free, 0), wanted)
        if (take > 0) claimed.set(batch.id, (claimed.get(batch.id) || 0) + take)
        return {
          lines: take
            ? [{ batchId: batch.id, batchNumber: batch.batchNumber, expiryDate: batch.expiryDate, qty: take }]
            : [],
          shortfall: wanted - take,
        }
      }

      const plan = planAllocation(data, item.productId, wanted, claimed)
      for (const line of plan.lines) {
        claimed.set(line.batchId, (claimed.get(line.batchId) || 0) + line.qty)
      }
      return plan
    })
  }, [data, items])

  /* Priced through the same engine the reducer uses, so what the user sees
     here is exactly what gets stored. */
  const pricedLines = items.map((item) => {
    const product = item.productId ? getProduct(data, item.productId) : null
    return calcLine(
      {
        qty: item.qty,
        bonusQty: item.bonusQty,
        unitPrice: item.unitPrice,
        mrp: product ? product.mrp : 0,
        taxable: product ? product.taxable : false,
        taxPercent: product ? product.salesTaxPercent : 0,
      },
      data.settings,
    )
  })
  const totals = calcTotals(pricedLines, {
    taxStatus: customer ? customer.taxStatus : 'filer',
    furtherTaxEnabled: data.settings.furtherTaxEnabled,
    furtherTaxPercent: data.settings.furtherTaxPercent,
  })
  const runningTotal = totals.grandTotal

  const dirty = !saved && (Boolean(customerId) || items.some((item) => item.productId || item.qty))

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }

        if (field === 'productId') {
          const product = value ? getProduct(data, value) : null
          // Whatever offer is running today sets the starting price.
          const offer = value ? activeOfferForProduct(data, value, saleDate) : null
          updated.unitPrice = product ? String(offerPrice(offer, product.tp)) : ''
          updated.qty = ''
          updated.bonusQty = ''
          updated.mode = 'auto'
          updated.stockBatchId = ''
        }
        // Free goods follow the running offer automatically, but the user can
        // still type over it — schemes get negotiated.
        if (field === 'qty') {
          const offer = updated.productId ? activeOfferForProduct(data, updated.productId, saleDate) : null
          if (offer && offer.type === 'bonus') {
            updated.bonusQty = String(offerBonus(offer, value))
          }
        }
        if (field === 'mode' && value === 'manual' && !updated.stockBatchId) {
          const batches = availableBatchesForProduct(data, updated.productId)
          updated.stockBatchId = batches.length ? batches[0].id : ''
        }
        return updated
      }),
    )
    setErrors((current) => ({
      ...current,
      items: current.items.map((entry, i) => (i === index ? {} : entry)),
    }))
  }

  function addItem() {
    setItems((current) => [...current, emptyItem(nextKey.current++)])
    setErrors((current) => ({ ...current, items: [...current.items, {}] }))
  }

  function removeItem(index) {
    setItems((current) => current.filter((_, i) => i !== index))
    setErrors((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }))
  }

  function itemProblems(item, index) {
    const entry = {}
    const allocation = allocations[index] || { lines: [], shortfall: 0 }
    if (!item.productId) entry.productId = 'Please choose a product.'

    const qty = Number(item.qty)
    if (String(item.qty).trim() === '') entry.qty = 'Please enter a quantity.'
    else if (!Number.isFinite(qty)) entry.qty = 'The quantity must be a number.'
    else if (!Number.isInteger(qty)) entry.qty = 'The quantity must be a whole number.'
    else if (qty <= 0) entry.qty = 'The quantity must be more than zero.'
    else if (allocation.shortfall > 0) {
      const short = allocation.shortfall
      entry.qty =
        item.mode === 'manual'
          ? `That batch is ${formatNumber(short)} short. Switch to letting the app choose, or lower the quantity.`
          : `There ${short === 1 ? 'is' : 'are'} only ${formatNumber(qty - short)} in stock in total — ${formatNumber(short)} short.`
    }

    const price = Number(item.unitPrice)
    if (String(item.unitPrice).trim() === '') entry.unitPrice = 'Please enter the unit price.'
    else if (!Number.isFinite(price) || price <= 0) entry.unitPrice = 'The unit price must be more than zero.'

    return entry
  }

  function validate() {
    const top = {}
    if (!customerId) top.customerId = 'Please choose the customer you sold to.'
    if (!saleDate) top.saleDate = 'Please choose the sale date.'
    const itemErrors = items.map((item, index) => itemProblems(item, index))
    setErrors({ ...top, items: itemErrors })
    const hasItemError = itemErrors.some((entry) => Object.keys(entry).length > 0)
    return Object.keys(top).length === 0 && items.length > 0 && !hasItemError
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (licenceBlocks) {
      showToast('Licence expired', {
        tone: 'info',
        message: `${customer.name} cannot be supplied until their drug sale licence is renewed.`,
      })
      return
    }
    if (!validate()) return

    // One form line can become several sale lines, one per batch it drew from.
    const saleItems = []
    items.forEach((item, index) => {
      // The allocation covers sold + free units; the free ones ride on the
      // first batch so the invoice still reads one line per batch.
      let bonusLeft = Number(item.bonusQty) || 0
      for (const line of allocations[index].lines) {
        const bonusHere = Math.min(bonusLeft, line.qty)
        bonusLeft -= bonusHere
        saleItems.push({
          productId: item.productId,
          stockBatchId: line.batchId,
          qty: line.qty - bonusHere,
          bonusQty: bonusHere,
          unitPrice: Number(item.unitPrice),
        })
      }
    })

    setSaved(true)
    data.recordSale({ customerId, saleDate, paymentStatus, items: saleItems })

    const units = saleItems.reduce((total, item) => total + item.qty, 0)
    showToast('Sale recorded', {
      message:
        paymentStatus === 'paid'
          ? `${units} units taken out of stock and ${formatMoney(runningTotal)} recorded as money received.`
          : `${units} units taken out of stock. Nothing was added to cash — this sale is on credit.`,
    })
    navigate('/sales')
  }

  const problems = []
  if (errors.customerId) problems.push({ id: 'customerId', message: `Customer — ${errors.customerId}` })
  if (errors.saleDate) problems.push({ id: 'saleDate', message: `Sale date — ${errors.saleDate}` })
  items.forEach((item, index) => {
    const entry = errors.items[index] || {}
    if (entry.productId) problems.push({ id: `product-${item.key}`, message: `Item ${index + 1}, Product — ${entry.productId}` })
    if (entry.qty) problems.push({ id: `qty-${item.key}`, message: `Item ${index + 1}, Quantity — ${entry.qty}` })
    if (entry.unitPrice) problems.push({ id: `price-${item.key}`, message: `Item ${index + 1}, Unit price — ${entry.unitPrice}` })
  })

  return (
    <>
      <UnsavedChangesGuard when={dirty} />
      <PageHeader
        title="Record sale"
        subtitle="Enter stock you have sold to a customer."
        back={{ to: '/sales', label: 'Back to sales' }}
      />

      <PageBody>
        <form onSubmit={handleSubmit} noValidate className="max-w-4xl space-y-6">
          <ErrorSummary problems={problems} />

          <Card>
            <CardHeader title="Step 1 — Who did you sell to?" />
            <CardBody className="space-y-6">
              <Field label="Customer" htmlFor="customerId" required error={errors.customerId}>
                <ComboBox
                  id="customerId"
                  value={customerId}
                  onChange={(value) => {
                    setCustomerId(value)
                    setErrors((current) => ({ ...current, customerId: null }))
                  }}
                  error={errors.customerId}
                  placeholder="Choose a customer…"
                  searchPlaceholder="Type a customer name…"
                  options={data.customers.map((customer) => ({
                    value: customer.id,
                    label: customer.name,
                    hint: customer.shortAddress,
                  }))}
                />
              </Field>

              {licence && licence.state !== 'none' ? (
                <div
                  className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 ${
                    licence.state === 'expired'
                      ? 'border-red-300 bg-red-50'
                      : licence.state === 'expiring'
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  {licence.state === 'valid' ? (
                    <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
                  ) : (
                    <AlertTriangle
                      size={22}
                      className={`mt-0.5 shrink-0 ${licence.state === 'expired' ? 'text-red-700' : 'text-amber-700'}`}
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-base font-bold ${
                        licence.state === 'expired'
                          ? 'text-red-900'
                          : licence.state === 'expiring'
                            ? 'text-amber-900'
                            : 'text-emerald-900'
                      }`}
                    >
                      {licence.label}
                    </p>
                    <p className="text-sm text-slate-700">
                      Licence {customer.licenceNumber} · expires {formatDate(customer.licenceExpiry)} ·{' '}
                      {customer.taxStatus === 'filer' ? 'Filer' : 'Non-filer'}
                      {customer.ntn ? ` · NTN ${customer.ntn}` : ''}
                    </p>
                    {licenceBlocks ? (
                      <p className="mt-1 text-sm font-bold text-red-800">
                        This sale cannot be saved until the licence is renewed. Settings can be changed to warn
                        instead of blocking.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <Field label="Sale date" htmlFor="saleDate" required error={errors.saleDate}>
                <DateInput
                  id="saleDate"
                  value={saleDate}
                  onChange={(event) => setSaleDate(event.target.value)}
                  error={errors.saleDate}
                />
              </Field>

              <Field
                label="Has the customer paid?"
                htmlFor="paymentStatus"
                hint="Choose “Not yet” if you have given them credit. It will show up under Money owed."
              >
                <Select
                  id="paymentStatus"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                >
                  <option value="paid">Yes — paid in full (money in)</option>
                  <option value="unpaid">Not yet — on credit (no money in)</option>
                </Select>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Step 2 — What did you sell?"
              subtitle="Choose a product and say how many. The app takes them from the batches expiring soonest."
            />

            {!anythingInStock ? (
              <EmptyState
                title="There is no stock to sell"
                message="Record a purchase first so there is something on the shelves."
                action={
                  <Button variant="secondary" size="lg" onClick={() => navigate('/purchases/new')}>
                    Record a purchase
                  </Button>
                }
              />
            ) : (
              <CardBody className="space-y-5">
                {items.map((item, index) => {
                  const live = submitted ? errors.items[index] || {} : {}
                  const preview = !submitted ? itemProblems(item, index) : {}
                  const itemError = { ...live, qty: live.qty || (item.qty ? preview.qty : undefined) }
                  const product = item.productId ? getProduct(data, item.productId) : null
                  const offer = item.productId ? activeOfferForProduct(data, item.productId, saleDate) : null
                  const batches = item.productId ? availableBatchesForProduct(data, item.productId) : []
                  const allocation = allocations[index] || { lines: [], shortfall: 0 }
                  const lineTotal = Number(item.qty) * Number(item.unitPrice)
                  const sellable = item.productId ? productSellableQty(data, item.productId) : 0

                  return (
                    <div key={item.key} className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-slate-900">Item {index + 1}</h3>
                        {items.length > 1 ? (
                          <Button variant="secondary" icon={Trash2} onClick={() => removeItem(index)}>
                            Remove
                          </Button>
                        ) : null}
                      </div>

                      <div className="space-y-5">
                        <Field label="Product" htmlFor={`product-${item.key}`} required error={itemError.productId}>
                          <ComboBox
                            id={`product-${item.key}`}
                            value={item.productId}
                            onChange={(value) => updateItem(index, 'productId', value)}
                            error={itemError.productId}
                            placeholder="Choose a product…"
                            searchPlaceholder="Type a product name…"
                            options={productOptions}
                          />
                        </Field>

                        {offer ? (
                          <p className="flex flex-wrap items-center gap-2 rounded-xl bg-pink-50 px-4 py-3 text-base font-semibold text-pink-900">
                            <Badge tone="blue">Offer</Badge>
                            {offer.name} — {describeOffer(offer)}
                          </p>
                        ) : null}

                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field
                            label="Quantity"
                            htmlFor={`qty-${item.key}`}
                            required
                            hint={
                              product
                                ? `${formatNumber(sellable)} ${product.unit}s available in total`
                                : 'Choose a product first'
                            }
                            error={itemError.qty}
                          >
                            <NumberInput
                              id={`qty-${item.key}`}
                              min="1"
                              step="1"
                              value={item.qty}
                              onChange={(event) => updateItem(index, 'qty', event.target.value)}
                              error={itemError.qty}
                              placeholder="0"
                              disabled={!item.productId}
                            />
                          </Field>

                          <Field
                            label="Free (bonus) units"
                            htmlFor={`bonus-${item.key}`}
                            hint={
                              offer && offer.type === 'bonus'
                                ? describeOffer(offer)
                                : 'No scheme on this product — you can still give free units.'
                            }
                          >
                            <NumberInput
                              id={`bonus-${item.key}`}
                              min="0"
                              step="1"
                              value={item.bonusQty}
                              onChange={(event) => updateItem(index, 'bonusQty', event.target.value)}
                              placeholder="0"
                              disabled={!item.productId}
                            />
                          </Field>

                          <Field
                            label="Unit price"
                            htmlFor={`price-${item.key}`}
                            required
                            hint="Starts at the trade price — change it if you agreed a different rate."
                            error={itemError.unitPrice}
                          >
                            <NumberInput
                              id={`price-${item.key}`}
                              min="0"
                              step="1"
                              value={item.unitPrice}
                              onChange={(event) => updateItem(index, 'unitPrice', event.target.value)}
                              error={itemError.unitPrice}
                              placeholder="0"
                              disabled={!item.productId}
                            />
                          </Field>
                        </div>

                        {item.productId ? (
                          <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <p className="flex items-center gap-2 text-base font-bold text-slate-800">
                                <Layers size={19} className="text-slate-400" aria-hidden="true" />
                                {item.mode === 'auto' ? 'Coming out of these batches' : 'Batch you chose'}
                              </p>
                              <button
                                type="button"
                                onClick={() => updateItem(index, 'mode', item.mode === 'auto' ? 'manual' : 'auto')}
                                className="rounded-lg text-base font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
                              >
                                {item.mode === 'auto' ? 'Choose the batch myself' : 'Let the app choose (oldest first)'}
                              </button>
                            </div>

                            {item.mode === 'manual' ? (
                              <Select
                                value={item.stockBatchId}
                                onChange={(event) => updateItem(index, 'stockBatchId', event.target.value)}
                                aria-label="Batch to sell from"
                              >
                                <option value="">Choose a batch…</option>
                                {batches.map((batch) => (
                                  <option key={batch.id} value={batch.id}>
                                    {batch.batchNumber} — expires {formatDate(batch.expiryDate)} — {batch.qtyOnHand}{' '}
                                    available
                                  </option>
                                ))}
                              </Select>
                            ) : null}

                            {allocation.lines.length ? (
                              <ul className="mt-3 space-y-2">
                                {allocation.lines.map((line) => {
                                  const status = expiryStatus(line.expiryDate)
                                  return (
                                    <li
                                      key={line.batchId}
                                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                                    >
                                      <span className="text-base font-semibold text-slate-800">
                                        {formatNumber(line.qty)} from batch {line.batchNumber}
                                      </span>
                                      <span className="flex items-center gap-2 text-sm text-slate-600">
                                        expires {formatDate(line.expiryDate)}
                                        {status.level !== 'ok' ? (
                                          <Badge tone={status.tone}>{status.label}</Badge>
                                        ) : null}
                                      </span>
                                    </li>
                                  )
                                })}
                              </ul>
                            ) : (
                              <p className="mt-1 text-base text-slate-500">
                                Enter a quantity and the batches will be worked out for you.
                              </p>
                            )}

                            {allocation.lines.length > 1 ? (
                              <p className="mt-3 text-sm font-semibold text-slate-600">
                                This quantity is more than one batch holds, so it has been split across{' '}
                                {allocation.lines.length} batches, oldest first.
                              </p>
                            ) : null}
                          </div>
                        ) : null}

                        <p className="text-base font-semibold text-slate-700">
                          Line total:{' '}
                          <span className="text-lg font-extrabold text-slate-900">
                            {formatMoney(Number.isFinite(lineTotal) ? lineTotal : 0)}
                          </span>
                        </p>
                      </div>
                    </div>
                  )
                })}

                <Button variant="secondary" size="lg" icon={Plus} onClick={addItem}>
                  Add another item
                </Button>
              </CardBody>
            )}
          </Card>

          <Card>
            <CardHeader title="Step 3 — Check and save" />
            <CardBody className="space-y-6">
              <div className="rounded-2xl bg-brand-50 px-6 py-5">
                <p className="text-base font-semibold text-brand-900">Total for this sale</p>
                <p className="text-sm text-brand-800">
                  {items.length} item{items.length === 1 ? '' : 's'} ·{' '}
                  {items.reduce((total, item) => total + (Number(item.qty) || 0), 0)} charged
                  {items.reduce((total, item) => total + (Number(item.bonusQty) || 0), 0) > 0
                    ? ` · ${items.reduce((total, item) => total + (Number(item.bonusQty) || 0), 0)} free`
                    : ''}
                </p>
                <dl className="mt-4 space-y-2">
                  <div className="flex justify-between gap-4 text-base">
                    <dt className="text-brand-900">Goods value</dt>
                    <dd className="font-semibold tabular-nums text-brand-900">{formatMoney(totals.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 text-base">
                    <dt className="text-brand-900">Sales tax</dt>
                    <dd className="font-semibold tabular-nums text-brand-900">{formatMoney(totals.taxTotal)}</dd>
                  </div>
                  {totals.furtherTax > 0 ? (
                    <div className="flex justify-between gap-4 text-base">
                      <dt className="text-brand-900">
                        Further tax at {totals.furtherTaxPercent}%
                        <span className="block text-sm text-brand-800">
                          charged because this customer is a non-filer
                        </span>
                      </dt>
                      <dd className="font-semibold tabular-nums text-brand-900">{formatMoney(totals.furtherTax)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4 border-t border-brand-200 pt-2">
                    <dt className="text-lg font-bold text-brand-900">Customer pays</dt>
                    <dd className="text-3xl font-extrabold tabular-nums text-brand-900">
                      {formatMoney(totals.grandTotal)}
                    </dd>
                  </div>
                </dl>
                {data.settings.taxMode === 'inclusive-mrp' && totals.taxTotal > 0 ? (
                  <p className="mt-2 text-sm font-semibold text-brand-800">
                    The tax shown is already inside what the customer pays.
                  </p>
                ) : null}
              </div>

              <InlineNote icon={Info}>This will update stock and cash automatically.</InlineNote>

              <FormActions>
                <Button type="submit" size="lg" icon={Save} disabled={!anythingInStock || licenceBlocks}>
                  Save sale
                </Button>
                <Button type="button" size="lg" variant="secondary" onClick={() => navigate('/sales')}>
                  Cancel
                </Button>
              </FormActions>
            </CardBody>
          </Card>
        </form>
      </PageBody>
    </>
  )
}
