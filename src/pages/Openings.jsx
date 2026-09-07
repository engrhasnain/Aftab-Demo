import { useState } from 'react'
import { Info, Save, Warehouse } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import ComboBox from '../components/ui/ComboBox'
import DataTable from '../components/ui/DataTable'
import ExpiryField from '../components/ui/ExpiryField'
import BatchNumberField from '../components/ui/BatchNumberField'
import ColourDot from '../components/ui/ColourDot'
import { Field, FormActions, InlineNote, NumberInput, DateInput, TextInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { batchesForProduct, getProduct } from '../utils/selectors'
import { formatDate, formatMoney, formatNumber, TODAY } from '../utils/format'
import { compactErrors, numberError, quantityError } from '../utils/validation'

/**
 * What was already there on the day the system was switched on.
 *
 * Without this, "cash in hand" only means movement since the records began, and
 * the stock list only contains what has been bought through the system. Both
 * are wrong for a business that has been trading for years.
 */
export default function Openings() {
  const data = useData()
  const { showToast } = useToast()

  const [balance, setBalance] = useState({
    date: data.openingBalance.date,
    amount: String(data.openingBalance.amount),
    note: data.openingBalance.note,
  })

  const [stock, setStock] = useState({
    productId: '',
    batchNumber: '',
    expiryDate: '',
    qty: '',
    unitCost: '',
  })
  const [errors, setErrors] = useState({})

  const openingStockRows = data.adjustments
    .filter((a) => a.reason === 'Opening stock')
    .map((a) => ({ ...a, productName: (getProduct(data, a.productId) || {}).name || 'Unknown product' }))

  function saveBalance() {
    const amount = Number(balance.amount)
    if (!Number.isFinite(amount)) return
    data.setOpeningBalance({ date: balance.date, amount, note: balance.note })
    showToast('Opening balance saved', {
      message: `${formatMoney(amount)} recorded as the cash the business started with.`,
    })
  }

  function setStockField(field, value) {
    setStock((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  function saveStock(event) {
    event.preventDefault()
    const next = compactErrors({
      productId: stock.productId ? null : 'Please choose a product.',
      batchNumber: stock.batchNumber.trim() ? null : 'Please enter the batch number.',
      expiryDate: stock.expiryDate ? null : 'Please enter the expiry date.',
      qty: quantityError(stock.qty, 'a quantity'),
      unitCost: numberError(stock.unitCost, 'the cost per unit'),
    })
    setErrors(next)
    if (Object.keys(next).length) return

    const product = getProduct(data, stock.productId)
    data.addOpeningStock({
      productId: stock.productId,
      batchNumber: stock.batchNumber.trim(),
      expiryDate: stock.expiryDate,
      qty: Number(stock.qty),
      unitCost: Number(stock.unitCost),
      date: data.openingBalance.date,
    })
    showToast('Opening stock added', {
      message: `${formatNumber(Number(stock.qty))} ${product ? product.unit : 'unit'}s of ${
        product ? product.name : 'the product'
      } put on the shelf. No money was moved.`,
    })
    setStock({ productId: '', batchNumber: '', expiryDate: '', qty: '', unitCost: '' })
  }

  return (
    <>
      <PageHeader
        title="Openings"
        subtitle="The cash and the stock the business already had before this system started."
      />

      <PageBody>
        <Card className="max-w-3xl">
          <CardHeader
            title="Opening balance"
            subtitle="The money in the cash box on the day you started using the system."
          />
          <CardBody className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Started on" htmlFor="opening-date" required>
                <DateInput
                  id="opening-date"
                  value={balance.date}
                  max={TODAY}
                  onChange={(event) => setBalance((b) => ({ ...b, date: event.target.value }))}
                />
              </Field>
              <Field label="Amount in hand" htmlFor="opening-amount" required hint="Paisa allowed">
                <NumberInput
                  id="opening-amount"
                  step="0.01"
                  value={balance.amount}
                  onChange={(event) => setBalance((b) => ({ ...b, amount: event.target.value }))}
                />
              </Field>
            </div>

            <Field label="Note" htmlFor="opening-note" hint="What this money was, in your own words.">
              <TextInput
                id="opening-note"
                value={balance.note}
                onChange={(event) => setBalance((b) => ({ ...b, note: event.target.value }))}
              />
            </Field>

            <div className="rounded-2xl bg-brand-50 px-6 py-5">
              <p className="text-base font-semibold text-brand-900">This becomes the first line of the cash ledger</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-brand-900">
                {formatMoney(Number(balance.amount) || 0)}
              </p>
              <p className="mt-1 text-sm text-brand-800">dated {formatDate(balance.date)}</p>
            </div>

            <FormActions>
              <Button size="lg" icon={Save} onClick={saveBalance}>
                Save opening balance
              </Button>
            </FormActions>
          </CardBody>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader
            icon={Warehouse}
            title="Opening stock"
            subtitle="Goods already on the shelf that were never bought through this system."
          />
          <CardBody>
            <form onSubmit={saveStock} noValidate className="space-y-6">
              <Field label="Product" htmlFor="opening-product" required error={errors.productId}>
                <ComboBox
                  id="opening-product"
                  value={stock.productId}
                  onChange={(value) => setStockField('productId', value)}
                  error={errors.productId}
                  placeholder="Choose a product…"
                  searchPlaceholder="Type a product name or code…"
                  options={data.products.map((product) => ({
                    value: product.id,
                    label: product.name,
                    hint: `Code ${product.code} · ${product.unit}`,
                  }))}
                />
              </Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Quantity on the shelf" htmlFor="opening-qty" required error={errors.qty}>
                  <NumberInput
                    id="opening-qty"
                    min="1"
                    step="1"
                    value={stock.qty}
                    onChange={(event) => setStockField('qty', event.target.value)}
                    error={errors.qty}
                    placeholder="0"
                  />
                </Field>

                <Field
                  label="Cost per unit"
                  htmlFor="opening-cost"
                  required
                  hint="What it originally cost you — used to value the stock."
                  error={errors.unitCost}
                >
                  <NumberInput
                    id="opening-cost"
                    min="0"
                    step="0.01"
                    value={stock.unitCost}
                    onChange={(event) => setStockField('unitCost', event.target.value)}
                    error={errors.unitCost}
                    placeholder="0.00"
                  />
                </Field>
              </div>

              <Field label="Batch number" htmlFor="opening-batch" required error={errors.batchNumber}>
                <BatchNumberField
                  id="opening-batch"
                  value={stock.batchNumber}
                  onChange={(value) => setStockField('batchNumber', value)}
                  error={errors.batchNumber}
                  disabled={!stock.productId}
                  existingBatches={stock.productId ? batchesForProduct(data, stock.productId) : []}
                />
              </Field>

              <Field label="Expiry date" htmlFor="opening-expiry" required error={errors.expiryDate}>
                <ExpiryField
                  id="opening-expiry"
                  value={stock.expiryDate}
                  onChange={(value) => setStockField('expiryDate', value)}
                  from={data.openingBalance.date}
                  error={errors.expiryDate}
                />
              </Field>

              <InlineNote icon={Info}>
                Opening stock puts goods on the shelf without taking any money out — it was bought before this system
                existed, so it is not a purchase and it does not touch the cash ledger.
              </InlineNote>

              <FormActions>
                <Button type="submit" size="lg" icon={Save}>
                  Add opening stock
                </Button>
              </FormActions>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Opening stock already entered"
            subtitle="Everything put on the shelf as an opening figure."
          />
          <DataTable
            columns={[
              {
                key: 'product',
                header: 'Product',
                render: (row) => (
                  <span className="flex items-center gap-2 font-semibold text-slate-900">
                    <ColourDot colour={(getProduct(data, row.productId) || {}).colour} />
                    {row.productName}
                  </span>
                ),
              },
              { key: 'batch', header: 'Batch', render: (row) => row.batchNumber },
              {
                key: 'qty',
                header: 'Quantity',
                align: 'right',
                render: (row) => <span className="font-bold tabular-nums">{formatNumber(Math.abs(row.qty))}</span>,
              },
              { key: 'date', header: 'Dated', render: (row) => formatDate(row.date) },
            ]}
            rows={openingStockRows}
            rowKey={(row) => row.id}
            empty={{
              icon: Warehouse,
              title: 'No opening stock entered yet',
              message: 'Use the form above to put stock you already had onto the shelf.',
            }}
          />
        </Card>
      </PageBody>
    </>
  )
}
