import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Save } from './icons'

import Card, { CardBody, CardHeader } from './ui/Card'
import Button from './ui/Button'
import Badge from './ui/Badge'
import ErrorSummary from './ui/ErrorSummary'
import UnsavedChangesGuard from './ui/UnsavedChangesGuard'
import { ColourPicker } from './ui/ColourDot'
import { Field, FormActions, Select, TextInput, DateInput } from './ui/Field'
import { licenceStatus } from '../utils/selectors'

/**
 * Suppliers and customers share their contact fields, so one form covers both.
 * A customer carries more: the registered business title that goes on the
 * invoice, its tax status, and the drug sale licence that has to be in date
 * before medicines can legally be supplied.
 */
export default function PartyForm({ kind, backTo, onSave, initial }) {
  const navigate = useNavigate()
  const isEdit = Boolean(initial)
  const isCustomer = kind === 'customer'

  const [values, setValues] = useState({
    name: initial?.name || '',
    longAddress: initial?.longAddress || '',
    shortAddress: initial?.shortAddress || '',
    contactNumber: initial?.contactNumber || '',
    colour: initial?.colour || '#2A3785',
    businessTitle: initial?.businessTitle || '',
    taxStatus: initial?.taxStatus || 'non-filer',
    ntn: initial?.ntn || '',
    licenceNumber: initial?.licenceNumber || '',
    licenceExpiry: initial?.licenceExpiry || '',
  })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const dirty =
    !saved &&
    (isEdit
      ? Object.keys(values).some((key) => String(values[key] || '') !== String(initial[key] || ''))
      : Boolean(values.name.trim() || values.longAddress.trim() || values.contactNumber.trim()))

  const setField = (field) => (event) => {
    const value = event && event.target ? event.target.value : event
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  const LABELS = {
    name: 'Name',
    longAddress: 'Full address',
    shortAddress: 'Short address',
    contactNumber: 'Contact number',
    licenceExpiry: 'Licence expiry',
  }

  function validate() {
    const next = {}
    if (!values.name.trim()) next.name = `Please enter the ${kind}'s name.`
    if (!values.longAddress.trim()) next.longAddress = 'Please enter the full address.'
    if (!values.shortAddress.trim()) next.shortAddress = 'Please enter a short address, e.g. the area and city.'

    const phone = values.contactNumber.trim()
    if (!phone) next.contactNumber = 'Please enter a contact number.'
    else if (!/^[0-9+\-\s()]+$/.test(phone)) next.contactNumber = 'Use digits only, with - + ( ) or spaces if needed.'
    else if (phone.replace(/\D/g, '').length < 7) next.contactNumber = 'That number looks too short.'

    // A licence number without a date is a licence nobody can check.
    if (isCustomer && values.licenceNumber.trim() && !values.licenceExpiry)
      next.licenceExpiry = 'Please give the expiry date, otherwise the licence cannot be checked.'

    setErrors(next)
    return next
  }

  function handleSubmit(event) {
    event.preventDefault()
    const found = validate()
    if (Object.keys(found).length) return

    setSaved(true)
    const base = {
      name: values.name.trim(),
      longAddress: values.longAddress.trim(),
      shortAddress: values.shortAddress.trim(),
      contactNumber: values.contactNumber.trim(),
    }
    onSave(
      isCustomer
        ? {
            ...base,
            businessTitle: values.businessTitle.trim() || base.name,
            taxStatus: values.taxStatus,
            ntn: values.ntn.trim(),
            licenceNumber: values.licenceNumber.trim(),
            licenceExpiry: values.licenceExpiry || null,
          }
        : { ...base, colour: values.colour },
    )
  }

  const problems = Object.entries(errors)
    .filter(([, message]) => Boolean(message))
    .map(([field, message]) => ({ id: field, message: `${LABELS[field] || field} — ${message}` }))

  const preview = isCustomer && values.licenceExpiry ? licenceStatus({ licenceExpiry: values.licenceExpiry }) : null

  return (
    <>
      <UnsavedChangesGuard when={dirty} />

      <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-6">
        <ErrorSummary problems={problems} />

        <Card>
          <CardHeader
            title={isEdit ? `Edit ${kind} details` : `New ${kind} details`}
            subtitle="Fields marked with * are required."
          />
          <CardBody className="space-y-6">
            <Field label="Name" htmlFor="name" required error={errors.name}>
              <TextInput
                id="name"
                value={values.name}
                onChange={setField('name')}
                error={errors.name}
                placeholder={isCustomer ? 'e.g. Al-Barkat Traders' : 'e.g. Karachi Nutrition Imports (Pvt) Ltd'}
                autoComplete="off"
              />
            </Field>

            <Field
              label="Full address"
              htmlFor="longAddress"
              required
              hint="The complete address you would write on a delivery note."
              error={errors.longAddress}
            >
              <TextInput
                id="longAddress"
                value={values.longAddress}
                onChange={setField('longAddress')}
                error={errors.longAddress}
                autoComplete="off"
              />
            </Field>

            <Field
              label="Short address"
              htmlFor="shortAddress"
              required
              hint="A few words only — this is what shows in the list."
              error={errors.shortAddress}
            >
              <TextInput
                id="shortAddress"
                value={values.shortAddress}
                onChange={setField('shortAddress')}
                error={errors.shortAddress}
                placeholder="e.g. Korangi, Karachi"
                autoComplete="off"
              />
            </Field>

            <Field label="Contact number" htmlFor="contactNumber" required error={errors.contactNumber}>
              <TextInput
                id="contactNumber"
                value={values.contactNumber}
                onChange={setField('contactNumber')}
                error={errors.contactNumber}
                placeholder="e.g. 0300-1234567"
                inputMode="tel"
                autoComplete="off"
              />
            </Field>

            {!isCustomer ? (
              <Field label="Colour" htmlFor="colour" hint="A colour to recognise this supplier by in the lists.">
                <ColourPicker id="colour" value={values.colour} onChange={setField('colour')} />
              </Field>
            ) : null}
          </CardBody>
        </Card>

        {isCustomer ? (
          <>
            <Card>
              <CardHeader
                title="Business and tax"
                subtitle="What gets printed on the invoice."
              />
              <CardBody className="space-y-6">
                <Field
                  label="Registered business title"
                  htmlFor="businessTitle"
                  hint="The legal name on their paperwork, if it differs from the shop name."
                >
                  <TextInput
                    id="businessTitle"
                    value={values.businessTitle}
                    onChange={setField('businessTitle')}
                    placeholder="e.g. Al-Barkat Traders (Regd.)"
                    autoComplete="off"
                  />
                </Field>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field
                    label="Tax status"
                    htmlFor="taxStatus"
                    hint="Printed on every invoice to this customer."
                  >
                    <Select id="taxStatus" value={values.taxStatus} onChange={setField('taxStatus')}>
                      <option value="filer">Filer</option>
                      <option value="non-filer">Non-filer</option>
                    </Select>
                  </Field>

                  <Field label="NTN" htmlFor="ntn" hint="Optional — their tax number.">
                    <TextInput
                      id="ntn"
                      value={values.ntn}
                      onChange={setField('ntn')}
                      placeholder="e.g. 3520112-4"
                      autoComplete="off"
                    />
                  </Field>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Drug sale licence"
                subtitle="Leave empty for a shop that does not hold one, such as a general store."
              />
              <CardBody className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Licence number" htmlFor="licenceNumber">
                    <TextInput
                      id="licenceNumber"
                      value={values.licenceNumber}
                      onChange={setField('licenceNumber')}
                      placeholder="e.g. DSL-KHI-2019-4412"
                      autoComplete="off"
                    />
                  </Field>

                  <Field label="Licence expiry" htmlFor="licenceExpiry" error={errors.licenceExpiry}>
                    <DateInput
                      id="licenceExpiry"
                      value={values.licenceExpiry || ''}
                      onChange={setField('licenceExpiry')}
                      error={errors.licenceExpiry}
                    />
                  </Field>
                </div>

                {preview ? (
                  <p className="flex flex-wrap items-center gap-2 text-base">
                    <span className="font-semibold text-slate-700">Right now this would read as:</span>
                    <Badge tone={preview.tone}>{preview.label}</Badge>
                  </p>
                ) : null}

                {preview && preview.state === 'expired' ? (
                  <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-base font-semibold text-red-900">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                      With this date, the system will stop medicines being sold to this customer until the licence is
                      renewed. How strict that is can be changed under Settings.
                    </span>
                  </p>
                ) : null}
              </CardBody>
            </Card>
          </>
        ) : null}

        <FormActions>
          <Button type="submit" size="lg" icon={Save}>
            {isEdit ? 'Save changes' : `Save ${kind}`}
          </Button>
          <Button type="button" size="lg" variant="secondary" onClick={() => navigate(backTo)}>
            Cancel
          </Button>
        </FormActions>
      </form>
    </>
  )
}
