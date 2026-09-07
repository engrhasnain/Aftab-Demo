import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Info, Plus, Save, Search } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ComboBox from '../components/ui/ComboBox'
import ColourDot from '../components/ui/ColourDot'
import ErrorSummary from '../components/ui/ErrorSummary'
import SearchInput from '../components/ui/SearchInput'
import { Field, FormActions, InlineNote, NumberInput, Select, TextInput, DateInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { getProduct, offersNewestFirst } from '../utils/selectors'
import { OFFER_TYPES, describeOffer, offerStatus } from '../utils/tax'
import { formatDate, formatMoney, TODAY } from '../utils/format'
import { compactErrors, numberError, quantityError } from '../utils/validation'

const BLANK = {
  name: '',
  productId: '',
  type: 'bonus',
  buyQty: '',
  freeQty: '',
  percent: '',
  amount: '',
  startDate: TODAY,
  endDate: '',
  note: '',
}

/**
 * Offers and schemes.
 *
 * These used to be a single field buried on each product, which meant an offer
 * could never start on a date, finish on its own, or be switched off without
 * editing the catalogue. They are records in their own right now, so a campaign
 * can be set up in advance and stopped without touching the product.
 */
export default function Offers() {
  const data = useData()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // offer id, 'new', or null
  const [values, setValues] = useState(BLANK)
  const [errors, setErrors] = useState({})

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return offersNewestFirst(data)
      .map((offer) => {
        const product = getProduct(data, offer.productId)
        return {
          ...offer,
          productName: product ? product.name : 'Unknown product',
          colour: product ? product.colour : null,
          unit: product ? product.unit : 'unit',
          status: offerStatus(offer, TODAY),
          summary: describeOffer(offer),
        }
      })
      .filter((offer) =>
        term ? [offer.name, offer.productName, offer.summary].some((f) => String(f).toLowerCase().includes(term)) : true,
      )
  }, [data, search])

  const running = rows.filter((r) => r.status.state === 'running')
  const upcoming = rows.filter((r) => r.status.state === 'upcoming')

  function startNew() {
    setValues(BLANK)
    setErrors({})
    setEditing('new')
  }

  function startEdit(offer) {
    setValues({
      name: offer.name,
      productId: offer.productId,
      type: offer.type,
      buyQty: offer.buyQty ? String(offer.buyQty) : '',
      freeQty: offer.freeQty ? String(offer.freeQty) : '',
      percent: offer.percent ? String(offer.percent) : '',
      amount: offer.amount ? String(offer.amount) : '',
      startDate: offer.startDate || '',
      endDate: offer.endDate || '',
      note: offer.note || '',
    })
    setErrors({})
    setEditing(offer.id)
  }

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const next = {
      name: values.name.trim() ? null : 'Please give the offer a name.',
      productId: values.productId ? null : 'Please choose which product the offer is on.',
    }
    if (values.type === 'bonus') {
      next.buyQty = quantityError(values.buyQty, 'the buy quantity')
      next.freeQty = quantityError(values.freeQty, 'the free quantity')
    }
    if (values.type === 'discount-percent') next.percent = numberError(values.percent, 'the percentage', { max: 100 })
    if (values.type === 'discount-amount') next.amount = numberError(values.amount, 'the amount off')
    if (values.startDate && values.endDate && values.endDate < values.startDate)
      next.endDate = 'The finish date must be on or after the start date.'

    const cleaned = compactErrors(next)
    setErrors(cleaned)
    if (Object.keys(cleaned).length) return

    const payload = { ...values, name: values.name.trim(), note: values.note.trim() }
    if (editing === 'new') {
      data.addOffer(payload)
      showToast('Offer created', { message: `${payload.name} is now on the offers list.` })
    } else {
      data.updateOffer({ id: editing, ...payload })
      showToast('Offer saved', { message: `${payload.name} has been updated.` })
    }
    setEditing(null)
  }

  function toggle(offer) {
    data.toggleOffer(offer.id)
    showToast(offer.active ? 'Offer switched off' : 'Offer switched on', {
      message: offer.active
        ? `${offer.name} will no longer be applied to new sales.`
        : `${offer.name} will be applied again where the dates allow.`,
    })
  }

  const problems = Object.entries(errors)
    .filter(([, m]) => Boolean(m))
    .map(([field, message]) => ({ id: `offer-${field}`, message }))

  const selectedProduct = values.productId ? getProduct(data, values.productId) : null

  return (
    <>
      <PageHeader
        title="Offers"
        subtitle="Free goods and discounts, with the dates they run between."
        action={
          <Button size="lg" icon={Plus} onClick={startNew}>
            Create offer
          </Button>
        }
      />

      <PageBody>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-xl border-l-4 border-l-emerald-600 border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Running now</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{running.length}</p>
            <p className="mt-1 text-sm text-slate-500">applied automatically on a sale</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Starting later</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{upcoming.length}</p>
            <p className="mt-1 text-sm text-slate-500">set up in advance</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">All offers</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{data.offers.length}</p>
            <p className="mt-1 text-sm text-slate-500">including finished ones, kept for the record</p>
          </div>
        </div>

        {editing ? (
          <Card className="max-w-3xl">
            <CardHeader
              title={editing === 'new' ? 'New offer' : 'Edit offer'}
              subtitle="An offer applies by itself on any sale of this product while it is running."
            />
            <CardBody>
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <ErrorSummary problems={problems} />

                <Field label="Offer name" htmlFor="offer-name" required error={errors.name}>
                  <TextInput
                    id="offer-name"
                    value={values.name}
                    onChange={(event) => setField('name', event.target.value)}
                    error={errors.name}
                    placeholder="e.g. Baby Puffs — buy 20 get 2"
                    autoComplete="off"
                  />
                </Field>

                <Field label="Which product" htmlFor="offer-product" required error={errors.productId}>
                  <ComboBox
                    id="offer-product"
                    value={values.productId}
                    onChange={(value) => setField('productId', value)}
                    error={errors.productId}
                    placeholder="Choose a product…"
                    searchPlaceholder="Type a product name or code…"
                    options={data.products.map((product) => ({
                      value: product.id,
                      label: product.name,
                      hint: `Code ${product.code} · ${product.unit} · TP ${formatMoney(product.tp)}`,
                    }))}
                  />
                </Field>

                <Field label="What kind of offer" htmlFor="offer-type" required>
                  <Select
                    id="offer-type"
                    value={values.type}
                    onChange={(event) => setField('type', event.target.value)}
                  >
                    {OFFER_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label} — {type.help}
                      </option>
                    ))}
                  </Select>
                </Field>

                {values.type === 'bonus' ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Buy this many" htmlFor="offer-buy" required error={errors.buyQty}>
                      <NumberInput
                        id="offer-buy"
                        min="1"
                        step="1"
                        value={values.buyQty}
                        onChange={(event) => setField('buyQty', event.target.value)}
                        error={errors.buyQty}
                        placeholder="e.g. 20"
                      />
                    </Field>
                    <Field label="Get this many free" htmlFor="offer-free" required error={errors.freeQty}>
                      <NumberInput
                        id="offer-free"
                        min="1"
                        step="1"
                        value={values.freeQty}
                        onChange={(event) => setField('freeQty', event.target.value)}
                        error={errors.freeQty}
                        placeholder="e.g. 2"
                      />
                    </Field>
                  </div>
                ) : null}

                {values.type === 'discount-percent' ? (
                  <Field label="Percentage off" htmlFor="offer-percent" required error={errors.percent}>
                    <NumberInput
                      id="offer-percent"
                      min="0"
                      max="100"
                      step="0.01"
                      value={values.percent}
                      onChange={(event) => setField('percent', event.target.value)}
                      error={errors.percent}
                      placeholder="e.g. 5"
                    />
                  </Field>
                ) : null}

                {values.type === 'discount-amount' ? (
                  <Field
                    label="Amount off each unit"
                    htmlFor="offer-amount"
                    required
                    hint={selectedProduct ? `Trade price is ${formatMoney(selectedProduct.tp)}` : undefined}
                    error={errors.amount}
                  >
                    <NumberInput
                      id="offer-amount"
                      min="0"
                      step="0.01"
                      value={values.amount}
                      onChange={(event) => setField('amount', event.target.value)}
                      error={errors.amount}
                      placeholder="e.g. 20.00"
                    />
                  </Field>
                ) : null}

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Starts on" htmlFor="offer-start" hint="Leave empty to start straight away.">
                    <DateInput
                      id="offer-start"
                      value={values.startDate}
                      onChange={(event) => setField('startDate', event.target.value)}
                    />
                  </Field>
                  <Field
                    label="Finishes on"
                    htmlFor="offer-end"
                    hint="Leave empty for an offer that runs until you stop it."
                    error={errors.endDate}
                  >
                    <DateInput
                      id="offer-end"
                      value={values.endDate}
                      onChange={(event) => setField('endDate', event.target.value)}
                      error={errors.endDate}
                    />
                  </Field>
                </div>

                <Field label="Note" htmlFor="offer-note" hint="Optional — why this offer exists.">
                  <TextInput
                    id="offer-note"
                    value={values.note}
                    onChange={(event) => setField('note', event.target.value)}
                    placeholder="e.g. Principal company scheme"
                    autoComplete="off"
                  />
                </Field>

                <InlineNote icon={Info}>
                  While an offer is running it is applied on its own when that product is sold — the free units are
                  worked out for you and come out of stock, and a discount drops the price. The user can still change
                  either one.
                </InlineNote>

                <FormActions>
                  <Button type="submit" size="lg" icon={Save}>
                    {editing === 'new' ? 'Create offer' : 'Save changes'}
                  </Button>
                  <Button type="button" size="lg" variant="secondary" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </FormActions>
              </form>
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardBody className="border-b border-slate-200">
            <SearchInput
              id="offer-search"
              label="Search by offer or product"
              value={search}
              onChange={setSearch}
              placeholder="e.g. puffs, or buy 10…"
            />
          </CardBody>

          <DataTable
            columns={[
              {
                key: 'code',
                header: 'Code',
                render: (row) => <span className="tabular-nums text-slate-500">{row.code}</span>,
              },
              {
                key: 'name',
                header: 'Offer',
                render: (row) => (
                  <span>
                    <span className="block font-semibold text-slate-900">{row.name}</span>
                    {row.note ? <span className="block text-sm text-slate-500">{row.note}</span> : null}
                  </span>
                ),
              },
              {
                key: 'product',
                header: 'Product',
                render: (row) => (
                  <span className="flex items-center gap-2">
                    <ColourDot colour={row.colour} />
                    {row.productName}
                  </span>
                ),
              },
              {
                key: 'what',
                header: 'What it gives',
                render: (row) => <Badge tone="blue">{row.summary}</Badge>,
              },
              {
                key: 'dates',
                header: 'Runs',
                render: (row) => (
                  <span className="whitespace-nowrap text-sm text-slate-600">
                    {row.startDate ? formatDate(row.startDate) : 'any time'}
                    {' → '}
                    {row.endDate ? formatDate(row.endDate) : 'until stopped'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <Badge tone={row.status.tone}>{row.status.label}</Badge>,
              },
              {
                key: 'action',
                header: 'Action',
                align: 'right',
                render: (row) => (
                  <span className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={(event) => {
                        event.stopPropagation()
                        startEdit(row)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={row.active ? 'secondary' : 'primary'}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggle(row)
                      }}
                    >
                      {row.active ? 'Switch off' : 'Switch on'}
                    </Button>
                  </span>
                ),
              },
            ]}
            rows={rows}
            rowClassName={(row) => (row.status.state === 'running' ? 'bg-emerald-50/60' : row.active ? '' : 'opacity-60')}
            onRowClick={(row) => navigate(`/products/${row.productId}`)}
            empty={{
              icon: search ? Search : CheckCircle2,
              title: search ? 'No offers match that search' : 'No offers yet',
              message: search ? 'Try a shorter word.' : 'Create an offer and it will apply itself on the sale screen.',
              action: search ? null : (
                <Button size="lg" icon={Plus} onClick={startNew}>
                  Create offer
                </Button>
              ),
            }}
          />
        </Card>

        <InlineNote icon={Info}>
          An offer with no finish date runs until somebody switches it off. Finished offers are kept rather than
          deleted, so an old invoice can still be explained.
        </InlineNote>
      </PageBody>
    </>
  )
}
