import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Plus, Save, Trash2 } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import ComboBox from '../components/ui/ComboBox'
import EmptyState from '../components/ui/EmptyState'
import ErrorSummary from '../components/ui/ErrorSummary'
import ExpiryField from '../components/ui/ExpiryField'
import BatchNumberField from '../components/ui/BatchNumberField'
import UnsavedChangesGuard from '../components/ui/UnsavedChangesGuard'
import { Field, FormActions, InlineNote, NumberInput, Select, DateInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { batchesForProduct, getProduct, productsForSupplier, supplierName } from '../utils/selectors'
import { formatMoney, TODAY } from '../utils/format'
import { compactErrors, numberError, quantityError } from '../utils/validation'

const emptyItem = (key) => ({
  key,
  productId: '',
  qty: '',
  batchNumber: '',
  expiryDate: '',
  unitCost: '',
})

const FIELD_LABELS = {
  productId: 'Product',
  qty: 'Quantity',
  unitCost: 'Unit cost',
  batchNumber: 'Batch number',
  expiryDate: 'Expiry date',
}

export default function PurchaseNew() {
  const data = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const nextKey = useRef(2)
  const [supplierId, setSupplierId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(TODAY)
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [items, setItems] = useState([emptyItem(1)])
  const [errors, setErrors] = useState({ supplierId: null, purchaseDate: null, items: [{}] })
  const [saved, setSaved] = useState(false)

  const supplierProducts = useMemo(
    () => (supplierId ? productsForSupplier(data, supplierId) : []),
    [data, supplierId],
  )

  const runningTotal = items.reduce((total, item) => {
    const line = Number(item.qty) * Number(item.unitCost)
    return total + (Number.isFinite(line) ? line : 0)
  }, 0)

  const dirty =
    !saved && (Boolean(supplierId) || items.some((item) => item.productId || item.qty || item.batchNumber))

  function handleSupplierChange(value) {
    const hadEntries = items.some((item) => item.productId || item.qty || item.batchNumber || item.unitCost)
    setSupplierId(value)
    // Products are listed per supplier. Clearing only the product would leave a
    // half-filled line behind, which reads as a glitch, so the lines are reset
    // in full and the user is told.
    setItems([emptyItem(nextKey.current++)])
    setErrors({ supplierId: null, purchaseDate: null, items: [{}] })
    if (hadEntries) {
      showToast('Items cleared', {
        tone: 'info',
        message: 'Each supplier has its own products, so the items were emptied when you changed supplier.',
      })
    }
  }

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }

        // Choosing a product suggests the cost we last paid for it, which the
        // user can type over.
        if (field === 'productId' && value && !item.unitCost) {
          const lastCost = lastKnownCost(data, value)
          if (lastCost) updated.unitCost = String(lastCost)
        }
        return updated
      }),
    )
    setErrors((current) => ({
      ...current,
      items: current.items.map((entry, i) => (i === index ? { ...entry, [field]: undefined } : entry)),
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

  function validate() {
    const top = {}
    if (!supplierId) top.supplierId = 'Please choose the supplier you bought from.'
    if (!purchaseDate) top.purchaseDate = 'Please choose the purchase date.'

    const itemErrors = items.map((item) => {
      const entry = {}
      if (!item.productId) entry.productId = 'Please choose a product.'
      entry.qty = quantityError(item.qty, 'a quantity')
      if (!item.batchNumber.trim()) entry.batchNumber = 'Please enter the batch number.'
      if (!item.expiryDate) entry.expiryDate = 'Please enter the expiry date.'
      else if (purchaseDate && item.expiryDate <= purchaseDate)
        entry.expiryDate = 'The expiry date must be after the purchase date.'
      entry.unitCost = numberError(item.unitCost, 'the unit cost')
      return compactErrors(entry)
    })

    setErrors({ ...top, items: itemErrors })
    const hasItemError = itemErrors.some((entry) => Object.keys(entry).length > 0)
    return { top, itemErrors, ok: Object.keys(top).length === 0 && items.length > 0 && !hasItemError }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = validate()
    if (!result.ok) return

    setSaved(true)
    data.recordPurchase({
      supplierId,
      purchaseDate,
      paymentStatus,
      items: items.map((item) => ({
        productId: item.productId,
        batchNumber: item.batchNumber.trim(),
        expiryDate: item.expiryDate,
        qty: Number(item.qty),
        unitCost: Number(item.unitCost),
      })),
    })

    const units = items.reduce((total, item) => total + Number(item.qty), 0)
    showToast('Purchase recorded', {
      message:
        paymentStatus === 'paid'
          ? `${units} units added to stock and ${formatMoney(runningTotal)} recorded as money paid.`
          : `${units} units added to stock. Nothing was taken from cash — this purchase is on credit.`,
    })
    navigate('/purchases')
  }

  /* Every outstanding problem, gathered for the panel at the top of the form. */
  const problems = []
  if (errors.supplierId) problems.push({ id: 'supplierId', message: `Supplier — ${errors.supplierId}` })
  if (errors.purchaseDate) problems.push({ id: 'purchaseDate', message: `Purchase date — ${errors.purchaseDate}` })
  items.forEach((item, index) => {
    const entry = errors.items[index] || {}
    Object.entries(entry).forEach(([field, message]) => {
      if (!message) return
      problems.push({
        id: `${fieldId(field)}-${item.key}`,
        message: `Item ${index + 1}, ${FIELD_LABELS[field]} — ${message}`,
      })
    })
  })

  return (
    <>
      <UnsavedChangesGuard when={dirty} />
      <PageHeader
        title="Record purchase"
        subtitle="Enter stock you have bought in from a supplier."
        back={{ to: '/purchases', label: 'Back to purchases' }}
      />

      <PageBody>
        <form onSubmit={handleSubmit} noValidate className="max-w-4xl space-y-6">
          <ErrorSummary problems={problems} />

          <Card>
            <CardHeader title="Step 1 — Who did you buy from?" />
            <CardBody className="space-y-6">
              <Field label="Supplier" htmlFor="supplierId" required error={errors.supplierId}>
                <ComboBox
                  id="supplierId"
                  value={supplierId}
                  onChange={handleSupplierChange}
                  error={errors.supplierId}
                  placeholder="Choose a supplier…"
                  searchPlaceholder="Type a supplier name…"
                  options={data.suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                    hint: supplier.shortAddress,
                  }))}
                />
              </Field>

              <Field label="Purchase date" htmlFor="purchaseDate" required error={errors.purchaseDate}>
                <DateInput
                  id="purchaseDate"
                  value={purchaseDate}
                  onChange={(event) => setPurchaseDate(event.target.value)}
                  error={errors.purchaseDate}
                />
              </Field>

              <Field
                label="Have you paid for this purchase?"
                htmlFor="paymentStatus"
                hint="Choose “Not yet” if the supplier is giving you credit. You can record the payment later from the purchase itself."
              >
                <Select
                  id="paymentStatus"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                >
                  <option value="paid">Yes — paid in full (money out)</option>
                  <option value="unpaid">Not yet — on credit (no money out)</option>
                </Select>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Step 2 — What did you buy?"
              subtitle={
                supplierId
                  ? `Choose from the products supplied by ${supplierName(data, supplierId)}.`
                  : 'Choose a supplier above first, then add the items you bought.'
              }
            />

            {supplierId && supplierProducts.length === 0 ? (
              <EmptyState
                title="This supplier has no products yet"
                message="Add a product for this supplier first, then come back and record the purchase."
                action={
                  <Button variant="secondary" size="lg" onClick={() => navigate('/products/new')}>
                    Add a product
                  </Button>
                }
              />
            ) : (
              <CardBody className="space-y-5">
                {items.map((item, index) => {
                  const itemError = errors.items[index] || {}
                  const product = item.productId ? getProduct(data, item.productId) : null
                  const lineTotal = Number(item.qty) * Number(item.unitCost)
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
                            disabled={!supplierId}
                            placeholder="Choose a product…"
                            searchPlaceholder="Type a product name…"
                            options={supplierProducts.map((option) => ({
                              value: option.id,
                              label: option.name,
                              hint: option.unitsPerCarton
                                ? `${option.unit} · ${option.unitsPerCarton} per carton`
                                : option.unit,
                            }))}
                          />
                        </Field>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field
                            label="Quantity"
                            htmlFor={`qty-${item.key}`}
                            required
                            hint={product ? `How many ${product.unit}s came in` : 'How many units came in'}
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
                            />
                            {product && product.unitsPerCarton && Number(item.qty) > 0 ? (
                              <p className="mt-1.5 text-sm text-slate-600">
                                That is {(Number(item.qty) / product.unitsPerCarton).toFixed(2).replace(/\.00$/, '')}{' '}
                                carton{Number(item.qty) === product.unitsPerCarton ? '' : 's'} of{' '}
                                {product.unitsPerCarton}.
                              </p>
                            ) : null}
                          </Field>

                          <Field
                            label="Unit cost"
                            htmlFor={`cost-${item.key}`}
                            required
                            hint={product ? `What you paid per ${product.unit}` : 'What you paid per unit'}
                            error={itemError.unitCost}
                          >
                            <NumberInput
                              id={`cost-${item.key}`}
                              min="0"
                              step="1"
                              value={item.unitCost}
                              onChange={(event) => updateItem(index, 'unitCost', event.target.value)}
                              error={itemError.unitCost}
                              placeholder="0"
                            />
                          </Field>
                        </div>

                        <Field
                          label="Batch number"
                          htmlFor={`batch-${item.key}`}
                          required
                          hint="Type an existing batch to add to it, or a new one to open a new batch."
                          error={itemError.batchNumber}
                        >
                          <BatchNumberField
                            id={`batch-${item.key}`}
                            value={item.batchNumber}
                            onChange={(value) => updateItem(index, 'batchNumber', value)}
                            error={itemError.batchNumber}
                            disabled={!item.productId}
                            existingBatches={item.productId ? batchesForProduct(data, item.productId) : []}
                          />
                        </Field>

                        <Field label="Expiry date" htmlFor={`expiry-${item.key}`} required error={itemError.expiryDate}>
                          <ExpiryField
                            id={`expiry-${item.key}`}
                            value={item.expiryDate}
                            onChange={(value) => updateItem(index, 'expiryDate', value)}
                            from={purchaseDate}
                            error={itemError.expiryDate}
                          />
                        </Field>

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

                <Button variant="secondary" size="lg" icon={Plus} onClick={addItem} disabled={!supplierId}>
                  Add another item
                </Button>
              </CardBody>
            )}
          </Card>

          <Card>
            <CardHeader title="Step 3 — Check and save" />
            <CardBody className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-50 px-6 py-5">
                <div>
                  <p className="text-base font-semibold text-brand-900">Total for this purchase</p>
                  <p className="text-sm text-brand-800">
                    {items.length} item{items.length === 1 ? '' : 's'} ·{' '}
                    {items.reduce((total, item) => total + (Number(item.qty) || 0), 0)} units
                  </p>
                </div>
                <p className="text-3xl font-extrabold tabular-nums text-brand-900">{formatMoney(runningTotal)}</p>
              </div>

              <InlineNote icon={Info}>This will update stock and cash automatically.</InlineNote>

              <FormActions>
                <Button type="submit" size="lg" icon={Save}>
                  Save purchase
                </Button>
                <Button type="button" size="lg" variant="secondary" onClick={() => navigate('/purchases')}>
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

/** Maps a validation key to the id actually used on the input. */
function fieldId(field) {
  if (field === 'productId') return 'product'
  if (field === 'unitCost') return 'cost'
  if (field === 'batchNumber') return 'batch'
  if (field === 'expiryDate') return 'expiry'
  return field
}

/** The unit cost from the most recent purchase of this product, if there is one. */
function lastKnownCost(data, productId) {
  let latestDate = ''
  let cost = null
  for (const purchase of data.purchases) {
    for (const item of purchase.items) {
      if (item.productId === productId && purchase.purchaseDate >= latestDate) {
        latestDate = purchase.purchaseDate
        cost = item.unitCost
      }
    }
  }
  return cost
}
