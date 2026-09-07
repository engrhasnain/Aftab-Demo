import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Info, Save } from '../components/icons'

import PageHeader from '../components/ui/PageHeader'
import { PageBody } from '../components/Layout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import ComboBox from '../components/ui/ComboBox'
import ErrorSummary from '../components/ui/ErrorSummary'
import UnsavedChangesGuard from '../components/ui/UnsavedChangesGuard'
import RecordNotFound from '../components/ui/RecordNotFound'
import Badge from '../components/ui/Badge'
import { ColourPicker } from '../components/ui/ColourDot'
import { Field, FormActions, InlineNote, NumberInput, Select, TextInput } from '../components/ui/Field'
import { useData } from '../context/DataContext'
import { useToast } from '../components/ToastProvider'
import { activeOfferForProduct, getProduct, groupsForSupplier } from '../utils/selectors'
import { describeOffer } from '../utils/tax'
import { compactErrors, numberError } from '../utils/validation'
import { formatMoney } from '../utils/format'

const NEW_GROUP = '__new__'
const UNIT_CHOICES = ['pack', 'tin', 'bottle', 'jar', 'box', 'strip', 'sachet', 'piece', 'bag', 'vial']

const LABELS = {
  name: 'Product name',
  supplierId: 'Supplier',
  groupId: 'Group',
  newGroupName: 'New group name',
  unit: 'Unit',
  unitsPerCarton: 'Units per carton',
  mrp: 'MRP',
  tp: 'TP',
  purchaseCost: 'Purchase cost',
  salesTaxPercent: 'Sales tax %',
}

/** Handles both "add product" and "edit product". */
export default function ProductForm() {
  const { id } = useParams()
  const data = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const existing = id ? getProduct(data, id) : null

  const [values, setValues] = useState(() => ({
    name: existing?.name || '',
    supplierId: existing?.supplierId || '',
    groupId: existing?.groupId || '',
    newGroupName: '',
    unit: existing?.unit || 'pack',
    unitsPerCarton: existing?.unitsPerCarton ? String(existing.unitsPerCarton) : '',
    mrp: existing ? String(existing.mrp) : '',
    tp: existing ? String(existing.tp) : '',
    purchaseCost: existing ? String(existing.purchaseCost) : '',
    taxable: existing ? Boolean(existing.taxable) : true,
    salesTaxPercent: existing
      ? String(existing.salesTaxPercent)
      : String(data.settings.defaultTaxPercent ?? 0),
    colour: existing?.colour || '#2A3785',
    controlled: existing ? Boolean(existing.controlled) : false,
  }))
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const availableGroups = useMemo(
    () => (values.supplierId ? groupsForSupplier(data, values.supplierId) : []),
    [data, values.supplierId],
  )

  if (id && !existing) {
    return <RecordNotFound title="Product" backTo="/products" backLabel="Back to products" />
  }

  const dirty =
    !saved &&
    (existing
      ? values.name !== existing.name ||
        values.supplierId !== existing.supplierId ||
        values.groupId !== existing.groupId ||
        values.colour !== existing.colour ||
        values.taxable !== Boolean(existing.taxable) ||
        values.controlled !== Boolean(existing.controlled) ||
        Number(values.mrp) !== existing.mrp ||
        Number(values.tp) !== existing.tp ||
        Number(values.purchaseCost) !== existing.purchaseCost
      : Boolean(values.name.trim() || values.supplierId || values.mrp || values.tp || values.purchaseCost))

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  function handleSupplierChange(supplierId) {
    // Groups belong to a supplier, so changing the supplier clears the group.
    setValues((current) => ({ ...current, supplierId, groupId: '', newGroupName: '' }))
    setErrors((current) => ({ ...current, supplierId: undefined, groupId: undefined }))
  }

  function validate() {
    const next = {}
    if (!values.name.trim()) next.name = 'Please enter the product name.'
    if (!values.supplierId) next.supplierId = 'Please choose which supplier this product comes from.'

    if (!values.groupId) next.groupId = 'Please choose a group, or create a new one.'
    else if (values.groupId === NEW_GROUP && !values.newGroupName.trim())
      next.newGroupName = 'Please type a name for the new group.'

    if (!values.unit.trim()) next.unit = 'Please say what one of these is called.'
    if (String(values.unitsPerCarton).trim() !== '')
      next.unitsPerCarton = numberError(values.unitsPerCarton, 'the units per carton')

    next.mrp = numberError(values.mrp, 'the MRP')
    next.tp = numberError(values.tp, 'the TP')
    next.purchaseCost = numberError(values.purchaseCost, 'the purchase cost')

    if (values.taxable)
      next.salesTaxPercent = numberError(values.salesTaxPercent, 'the sales tax percentage', {
        allowZero: true,
        max: 100,
      })

    const cleaned = compactErrors(next)
    setErrors(cleaned)
    return cleaned
  }

  function handleSubmit(event) {
    event.preventDefault()
    const found = validate()
    if (Object.keys(found).length) return

    const usingNewGroup = values.groupId === NEW_GROUP
    const name = values.name.trim()
    const payload = {
      name,
      supplierId: values.supplierId,
      groupId: usingNewGroup ? null : values.groupId,
      newGroupName: usingNewGroup ? values.newGroupName.trim() : null,
      unit: values.unit.trim(),
      unitsPerCarton: values.unitsPerCarton,
      mrp: values.mrp,
      tp: values.tp,
      purchaseCost: values.purchaseCost,
      taxable: values.taxable,
      salesTaxPercent: values.taxable ? values.salesTaxPercent : 0,
      colour: values.colour,
      controlled: values.controlled,
    }

    setSaved(true)

    if (existing) {
      data.updateProduct({ id: existing.id, ...payload })
      showToast('Changes saved', { message: `${name} has been updated.` })
      navigate(`/products/${existing.id}`)
    } else {
      data.addProduct(payload)
      showToast('Product saved', {
        message: usingNewGroup
          ? `${name} has been added under the new group "${values.newGroupName.trim()}".`
          : `${name} has been added to your products.`,
      })
      navigate('/products')
    }
  }

  const problems = Object.entries(errors)
    .filter(([, message]) => Boolean(message))
    .map(([field, message]) => ({ id: field, message: `${LABELS[field] || field} — ${message}` }))

  const margin =
    Number(values.tp) > 0 && Number(values.purchaseCost) > 0
      ? Number(values.tp) - Number(values.purchaseCost)
      : null
  const offer = existing ? activeOfferForProduct(data, existing.id) : null

  return (
    <>
      <UnsavedChangesGuard when={dirty} />
      <PageHeader
        title={existing ? `Edit ${existing.name}` : 'Add product'}
        subtitle={
          existing
            ? `Product code ${existing.code} — correct any detail and save.`
            : 'Add an item you buy and sell, along with its prices.'
        }
        back={
          existing
            ? { to: `/products/${existing.id}`, label: 'Back to product' }
            : { to: '/products', label: 'Back to products' }
        }
      />

      <PageBody>
        <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-6">
          <ErrorSummary problems={problems} />

          <Card>
            <CardHeader
              title={existing ? 'Product details' : 'New product details'}
              subtitle="Fields marked with * are required."
            />
            <CardBody className="space-y-6">
              <Field label="Product name" htmlFor="name" required error={errors.name}>
                <TextInput
                  id="name"
                  value={values.name}
                  onChange={(event) => setField('name', event.target.value)}
                  error={errors.name}
                  placeholder="e.g. Raso Baby Cereal — Wheat & Milk 350g"
                  autoComplete="off"
                />
              </Field>

              <Field
                label="Supplier"
                htmlFor="supplierId"
                required
                hint="Who we buy this product from."
                error={errors.supplierId}
              >
                <ComboBox
                  id="supplierId"
                  value={values.supplierId}
                  onChange={handleSupplierChange}
                  error={errors.supplierId}
                  placeholder="Choose a supplier…"
                  searchPlaceholder="Type a supplier name or code…"
                  options={data.suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                    hint: `Code ${supplier.code} · ${supplier.shortAddress}`,
                  }))}
                />
              </Field>

              <Field
                label="Group"
                htmlFor="groupId"
                required
                hint={
                  values.supplierId
                    ? 'Pick one of this supplier’s groups, or create a new one.'
                    : 'Choose a supplier first — groups belong to a supplier.'
                }
                error={errors.groupId}
              >
                <Select
                  id="groupId"
                  value={values.groupId}
                  onChange={(event) => setField('groupId', event.target.value)}
                  error={errors.groupId}
                  disabled={!values.supplierId}
                >
                  <option value="">Choose a group…</option>
                  {availableGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                  <option value={NEW_GROUP}>+ Create a new group</option>
                </Select>
              </Field>

              {values.groupId === NEW_GROUP ? (
                <Field label="New group name" htmlFor="newGroupName" required error={errors.newGroupName}>
                  <TextInput
                    id="newGroupName"
                    value={values.newGroupName}
                    onChange={(event) => setField('newGroupName', event.target.value)}
                    error={errors.newGroupName}
                    placeholder="e.g. Baby Snacks"
                    autoComplete="off"
                  />
                </Field>
              ) : null}

              <Field
                label="Colour"
                htmlFor="colour"
                hint="A colour to recognise this product by in the lists."
              >
                <ColourPicker id="colour" value={values.colour} onChange={(c) => setField('colour', c)} />
              </Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Unit" htmlFor="unit" required hint="What one of these is called" error={errors.unit}>
                  <Select
                    id="unit"
                    value={values.unit}
                    onChange={(event) => setField('unit', event.target.value)}
                    error={errors.unit}
                  >
                    {UNIT_CHOICES.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Units per carton"
                  htmlFor="unitsPerCarton"
                  hint="Optional — how many come in one carton"
                  error={errors.unitsPerCarton}
                >
                  <NumberInput
                    id="unitsPerCarton"
                    min="0"
                    step="1"
                    value={values.unitsPerCarton}
                    onChange={(event) => setField('unitsPerCarton', event.target.value)}
                    error={errors.unitsPerCarton}
                    placeholder="e.g. 24"
                  />
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Prices" subtitle="Paisa are allowed — you can enter 689.50." />
            <CardBody className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <Field label="MRP" htmlFor="mrp" required hint="Printed retail price" error={errors.mrp}>
                  <NumberInput
                    id="mrp"
                    min="0"
                    step="0.01"
                    value={values.mrp}
                    onChange={(event) => setField('mrp', event.target.value)}
                    error={errors.mrp}
                    placeholder="0.00"
                  />
                </Field>

                <Field label="TP" htmlFor="tp" required hint="Trade price to shops" error={errors.tp}>
                  <NumberInput
                    id="tp"
                    min="0"
                    step="0.01"
                    value={values.tp}
                    onChange={(event) => setField('tp', event.target.value)}
                    error={errors.tp}
                    placeholder="0.00"
                  />
                </Field>

                <Field
                  label="Purchase cost"
                  htmlFor="purchaseCost"
                  required
                  hint="What we pay the supplier"
                  error={errors.purchaseCost}
                >
                  <NumberInput
                    id="purchaseCost"
                    min="0"
                    step="0.01"
                    value={values.purchaseCost}
                    onChange={(event) => setField('purchaseCost', event.target.value)}
                    error={errors.purchaseCost}
                    placeholder="0.00"
                  />
                </Field>
              </div>

              {margin !== null ? (
                <p className="text-base font-semibold text-slate-700">
                  Margin on trade price:{' '}
                  <span className={margin >= 0 ? 'text-emerald-700' : 'text-red-700'}>{formatMoney(margin)}</span> per{' '}
                  {values.unit}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Sales tax"
              subtitle="Some items in the same catalogue are taxed and some are not, so this is set per product."
            />
            <CardBody className="space-y-6">
              <Field label="Is this product taxed?" htmlFor="taxable">
                <Select
                  id="taxable"
                  value={values.taxable ? 'yes' : 'no'}
                  onChange={(event) => setField('taxable', event.target.value === 'yes')}
                >
                  <option value="yes">Yes — charge sales tax on this product</option>
                  <option value="no">No — this product is not taxed</option>
                </Select>
              </Field>

              {values.taxable ? (
                <Field
                  label="Sales tax %"
                  htmlFor="salesTaxPercent"
                  required
                  hint={`Leave as the standard rate, or set a different one for this product.`}
                  error={errors.salesTaxPercent}
                >
                  <NumberInput
                    id="salesTaxPercent"
                    min="0"
                    max="100"
                    step="0.01"
                    value={values.salesTaxPercent}
                    onChange={(event) => setField('salesTaxPercent', event.target.value)}
                    error={errors.salesTaxPercent}
                  />
                </Field>
              ) : null}

              <InlineNote icon={Info}>
                How the tax is worked out — on the MRP, inside the MRP, or on the rate charged — is set once for the
                whole business under Settings. It is not fixed in the system.
              </InlineNote>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Offers"
              subtitle="Free goods and discounts are set up on the Offers screen, so a scheme can start and finish on its own."
            />
            <CardBody className="space-y-4">
              {offer ? (
                <p className="flex flex-wrap items-center gap-2 rounded-xl bg-pink-50 px-4 py-3 text-base font-semibold text-pink-900">
                  <Badge tone="green">Running now</Badge>
                  {offer.name} — {describeOffer(offer)}
                </p>
              ) : (
                <p className="text-base text-slate-600">There is no offer running on this product today.</p>
              )}
              <Button type="button" variant="secondary" onClick={() => navigate('/offers')}>
                Manage offers
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Controlled medicine" subtitle="Restricted items are recorded in a separate register." />
            <CardBody className="space-y-5">
              <Field label="Is this a controlled medicine?" htmlFor="controlled">
                <Select
                  id="controlled"
                  value={values.controlled ? 'yes' : 'no'}
                  onChange={(event) => setField('controlled', event.target.value === 'yes')}
                >
                  <option value="no">No — an ordinary product</option>
                  <option value="yes">Yes — controlled, must appear in the register</option>
                </Select>
              </Field>

              {values.controlled ? (
                <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-base font-semibold text-red-900">
                  <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    Every movement of this product will be written into the controlled medicines register, and the
                    buyer’s licence will be checked before it can be supplied.
                  </span>
                </p>
              ) : null}
            </CardBody>
          </Card>

          <FormActions>
            <Button type="submit" size="lg" icon={Save}>
              {existing ? 'Save changes' : 'Save product'}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => navigate(existing ? `/products/${existing.id}` : '/products')}
            >
              Cancel
            </Button>
          </FormActions>
        </form>
      </PageBody>
    </>
  )
}
